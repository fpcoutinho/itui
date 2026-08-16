/**
 * O HTML que vira `.docx`.
 *
 * O conversor não recebe o DOM da tela: recebe uma string montada aqui, com a
 * capa, o cabeçalho de identificação, o documento do editor e a assinatura, na
 * ordem em que saem no arquivo. Duas diferenças em relação ao que se vê no
 * editor, e as duas são obrigatórias:
 *
 * - o marcador `image:<uuid>` vira a foto **em Base64** (ver `imageAssets.ts`);
 * - o grupo de fotos de uma figura vira **uma linha de tabela**, uma célula por
 *   foto. No `.docx` não há grid de CSS, e tabela é a única construção que o
 *   Word entende como "estas fotos ficam lado a lado". A legenda ABNT vem no
 *   parágrafo seguinte, como na tela.
 *
 * Nada disto volta para `document_content`: o documento salvo continua com o
 * marcador e com o parágrafo original.
 */

import { exportTexts } from '../content/export'
import type { ExportSettings } from '../domain/exportSettings'
import { imageIdFromMarker } from '../domain/reportDocument'
import {
	buildCover,
	buildReportHeader,
	formatSignatureDate,
} from '../domain/reportHeader'
import type { Report } from '../services/types'
import type { EmbeddedImageSet } from './imageAssets'

/**
 * Largura da foto dentro da célula, em pixels.
 *
 * Mesmo valor da tela (`ReportDocument.scss`): a foto sai com largura fixa e
 * altura pelo aspecto, como no template legado. 200px ≈ 5,3 cm — duas ou três
 * cabem lado a lado na largura útil de uma folha A4 com margem de 16 mm.
 */
const FIGURE_WIDTH_PX = 200

const HTML_ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
}

/**
 * Escapa o que o usuário digitou nos campos locais.
 *
 * O corpo do documento vem do editor e já é HTML confiável, mas capa, ART e
 * assinatura são texto cru de `<input>`: um `&` num nome de empresa basta para
 * produzir HTML inválido e derrubar o conversor no meio da geração.
 */
export const escapeHtml = (value: string): string =>
	value.replace(/[&<>"]/g, (character) => HTML_ESCAPES[character])

/** Bloco só existe se tiver conteúdo — capa em branco é pior que capa ausente. */
const paragraph = (value: string, style?: string): string =>
	value.trim() === ''
		? ''
		: `<p${style ? ` style="${style}"` : ''}>${escapeHtml(value.trim())}</p>`

/**
 * Largura total da folha, no par que o conversor entende.
 *
 * O `.docx` não herda nada do CSS da tela: sem isto o Word dimensiona a tabela
 * pelo conteúdo e a grade do laudo sai encolhida no canto esquerdo da página. O
 * atributo `width` é o que o conversor lê; o `style` acompanha para o caso de a
 * string ser aberta como HTML.
 */
const FULL_WIDTH = 'width="100%" style="width:100%"'

/**
 * A folha do Word não centraliza nada verticalmente e não tem `flex`: o vazio
 * de uma capa se escreve em parágrafos vazios, um a um.
 */
const spacer = (count: number): string => '<p>&#160;</p>'.repeat(count)

const CENTER = 'text-align:center'

// -- Documento do editor ----------------------------------------------------

/**
 * Substitui os marcadores pelas fotos e dispõe cada grupo de figuras em tabela.
 */
export function resolveDocumentHtml(
	editorHtml: string,
	images: EmbeddedImageSet,
): string {
	const parsed = new DOMParser().parseFromString(
		`<!doctype html><body>${editorHtml}</body>`,
		'text/html',
	)
	const body = parsed.body

	for (const element of Array.from(body.querySelectorAll('img'))) {
		const imageId = imageIdFromMarker(element.getAttribute('src'))

		if (imageId === null) {
			continue
		}

		const embedded = images.byImageId.get(imageId)

		if (embedded === undefined) {
			// A foto não pôde ser baixada. A legenda fica: ela é a informação
			// técnica do achado, e veio do `/draft`, não da imagem.
			element.remove()
			continue
		}

		const width = Math.min(FIGURE_WIDTH_PX, embedded.width)

		element.setAttribute('src', embedded.dataUri)
		element.setAttribute('width', String(width))
		element.setAttribute(
			'height',
			String(Math.round((embedded.height * width) / embedded.width)),
		)
	}

	for (const block of Array.from(body.querySelectorAll('p'))) {
		const figures = Array.from(block.querySelectorAll('img'))

		// Só o parágrafo que o `/draft` emite como grupo de figuras: nada além
		// das imagens. Um parágrafo em que o engenheiro colou uma foto no meio de
		// uma frase passa direto, com o `src` resolvido — reorganizar o que ele
		// montou à mão seria pior que preservá-lo.
		if (figures.length === 0 || block.textContent?.trim() !== '') {
			continue
		}

		// No `.docx` não há grade de CSS, e tabela é a única construção que o Word
		// entende como "estas fotos ficam lado a lado". Uma célula por imagem, de
		// largura igual — a legenda numerada vem no parágrafo seguinte, que o
		// `/draft` já emite separado (ver `template.rs::render_figure`).
		const table = parsed.createElement('table')
		const row = parsed.createElement('tr')
		const width = `${Math.floor(100 / figures.length)}%`

		for (const image of figures) {
			const cell = parsed.createElement('td')

			cell.setAttribute('width', width)
			cell.appendChild(image)
			row.appendChild(cell)
		}

		table.appendChild(row)
		block.replaceWith(table)
	}

	// As tabelas do editor chegam com as larguras em pixel que o TipTap grava no
	// `<col>`, medidas na largura da tela. No Word isso sai como uma grade
	// encolhida no canto da folha: as larguras gravadas vão embora e a tabela
	// ocupa a página inteira, com as colunas divididas pelo conteúdo.
	for (const table of Array.from(body.querySelectorAll('table'))) {
		table.setAttribute('width', '100%')
		table.setAttribute('style', 'width:100%')

		for (const col of Array.from(table.querySelectorAll('col'))) {
			col.removeAttribute('width')
			col.removeAttribute('style')
		}
	}

	return body.innerHTML
}

// -- Blocos montados no frontend --------------------------------------------

/**
 * A capa: mesmo desenho da folha impressa (ver `ReportPrintSheet`), escrito com
 * o que o Word tem. O bloco de identificação **não** está aqui — ele abre o
 * documento, na folha seguinte, e é o que antes fazia a capa parecer uma página
 * de formulário.
 */
function coverHtml(report: Report, settings: ExportSettings): string {
	const content = buildCover(report, settings)

	return [
		paragraph(content.institutionName, `${CENTER};font-weight:bold`),
		paragraph(content.institutionSubtitle, CENTER),
		spacer(6),
		`<h1 style="${CENTER}">${escapeHtml(content.title.toUpperCase())}</h1>`,
		paragraph(content.standard, CENTER),
		spacer(2),
		paragraph(content.reportNumber.toUpperCase(), `${CENTER};font-weight:bold`),
		spacer(6),
		paragraph(content.client, `${CENTER};font-weight:bold`),
		paragraph(content.location, CENTER),
		spacer(2),
		paragraph(content.year, `${CENTER};font-weight:bold`),
		spacer(6),
		paragraph(content.artNote, CENTER),
	].join('')
}

/** O cabeçalho de identificação, primeiro bloco do documento. */
function headerHtml(report: Report, settings: ExportSettings): string {
	const rows = buildReportHeader(report, settings)
		.map(
			({ label, value }) =>
				`<tr><td width="35%"><strong>${escapeHtml(label)}</strong></td><td width="65%">${escapeHtml(value)}</td></tr>`,
		)
		.join('')

	return `<h2>${escapeHtml(exportTexts.header.title)}</h2><table ${FULL_WIDTH}>${rows}</table>`
}

function signatureHtml(settings: ExportSettings): string {
	const place = [settings.signaturePlace, settings.signatureDate].filter(
		(value) => value.trim() !== '',
	)

	return [
		`<h2>${escapeHtml(exportTexts.signature.title)}</h2>`,
		paragraph(settings.closingRemarks),
		place.length === 0
			? ''
			: paragraph(
					[settings.signaturePlace, formatSignatureDate(settings.signatureDate)]
						.filter((value) => value.trim() !== '')
						.join(', '),
				),
		'<p>&#160;</p>',
		'<p>___________________________________________</p>',
		paragraph(settings.signerName || exportTexts.signature.line),
		paragraph(settings.signerTitle),
		paragraph(settings.signerRegistration),
	].join('')
}

/** Cabeçalho de página do `.docx` — repetido em todas as folhas. */
export function documentHeaderHtml(settings: ExportSettings): string | null {
	const lines = [settings.institutionName, settings.institutionSubtitle]
		.map((value) => paragraph(value))
		.filter((line) => line !== '')

	return lines.length === 0 ? null : lines.join('')
}

/** Rodapé de página — o `location_code` identifica a folha solta que se soltou do grampo. */
export function documentFooterHtml(
	report: Report,
	settings: ExportSettings,
): string {
	const parts = [report.locationCode]

	if (settings.artNumber.trim() !== '') {
		parts.push(`${exportTexts.header.art} ${settings.artNumber.trim()}`)
	}

	return paragraph(parts.join(' · '))
}

interface BuildExportHtmlInput {
	report: Report
	settings: ExportSettings
	/** `editor.getHTML()` — com os marcadores ainda por resolver. */
	editorHtml: string
	images: EmbeddedImageSet
}

/** Capa, documento e assinatura, na ordem do arquivo entregue. */
export function buildExportHtml({
	report,
	settings,
	editorHtml,
	images,
}: BuildExportHtmlInput): string {
	return [
		'<!doctype html><html><head><meta charset="utf-8" /></head><body>',
		coverHtml(report, settings),
		// A capa fica sozinha na primeira folha; o laudo começa na seguinte.
		`<div style="page-break-before: always">${headerHtml(report, settings)}${resolveDocumentHtml(editorHtml, images)}</div>`,
		signatureHtml(settings),
		'</body></html>',
	].join('')
}
