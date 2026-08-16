/**
 * O HTML que vira `.docx`.
 *
 * O conversor não recebe o DOM da tela: recebe uma string montada aqui, com a
 * capa, o cabeçalho de identificação, o documento do editor e a assinatura, na
 * ordem em que saem no arquivo. Duas diferenças em relação ao que se vê no
 * editor, e as duas são obrigatórias:
 *
 * - o marcador `image:<uuid>` vira a foto **em Base64** (ver `imageAssets.ts`);
 * - o achado fotográfico vira **tabela de duas colunas**, foto ao lado da
 *   legenda. No `.docx` não há grid de CSS, e tabela é a única construção que o
 *   Word entende como "estes dois blocos andam juntos".
 *
 * Nada disto volta para `document_content`: o documento salvo continua com o
 * marcador e com o parágrafo original.
 */

import { exportTexts } from '../content/export'
import type { ExportSettings } from '../domain/exportSettings'
import { imageIdFromMarker } from '../domain/reportDocument'
import {
	buildReportHeader,
	coverTitle,
	formatSignatureDate,
} from '../domain/reportHeader'
import type { Report } from '../services/types'
import type { EmbeddedImageSet } from './imageAssets'

/**
 * Largura da foto dentro da célula, em pixels.
 *
 * Mesmo valor da tela (`ReportDocument.scss`): a foto sai com largura fixa e
 * altura pelo aspecto, como no template legado. 200px ≈ 5,3 cm — cabe na coluna
 * de 40% da tabela do achado e deixa a legenda ao lado legível.
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
const paragraph = (value: string, className?: string): string =>
	value.trim() === ''
		? ''
		: `<p${className ? ` class="${className}"` : ''}>${escapeHtml(value.trim())}</p>`

// -- Documento do editor ----------------------------------------------------

/**
 * Substitui os marcadores pelas fotos e transforma cada achado em tabela.
 *
 * O parágrafo com **exatamente uma** imagem é o formato que o `/draft` emite
 * (marcador numa linha, legenda na seguinte, mesmo parágrafo). Qualquer outro
 * arranjo — imagem colada pelo usuário no meio de um texto, duas imagens no
 * mesmo parágrafo — passa direto, só com o `src` resolvido: reorganizar o que o
 * engenheiro montou à mão seria pior que preservá-lo.
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
		const figures = block.querySelectorAll('img')

		if (figures.length !== 1) {
			continue
		}

		const image = figures[0]
		image.remove()

		const table = parsed.createElement('table')
		const row = parsed.createElement('tr')
		const media = parsed.createElement('td')
		const caption = parsed.createElement('td')

		media.setAttribute('width', '40%')
		media.appendChild(image)

		caption.setAttribute('width', '60%')
		caption.innerHTML = `<p>${block.innerHTML}</p>`

		row.append(media, caption)
		table.appendChild(row)
		block.replaceWith(table)
	}

	return body.innerHTML
}

// -- Blocos montados no frontend --------------------------------------------

function coverHtml(report: Report, settings: ExportSettings): string {
	const rows = buildReportHeader(report, settings)
		.map(
			({ label, value }) =>
				`<tr><td width="35%"><strong>${escapeHtml(label)}</strong></td><td width="65%">${escapeHtml(value)}</td></tr>`,
		)
		.join('')

	return [
		paragraph(settings.institutionName),
		paragraph(settings.institutionSubtitle),
		`<h1>${escapeHtml(coverTitle(settings))}</h1>`,
		paragraph(exportTexts.cover.standard),
		paragraph(settings.coverLocation),
		`<h2>${escapeHtml(exportTexts.header.title)}</h2>`,
		`<table>${rows}</table>`,
		paragraph(settings.artNote),
	].join('')
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
		`<div style="page-break-before: always">${resolveDocumentHtml(editorHtml, images)}</div>`,
		signatureHtml(settings),
		'</body></html>',
	].join('')
}
