/**
 * O laudo como **documento**: conversão do Markdown do `/draft` para o HTML que
 * o TipTap sabe parsear, e o vocabulário de âncoras que o stream do `/generate`
 * usa para achar a seção certa.
 *
 * Sem React e sem ProseMirror de propósito: aqui só entra texto. A manipulação
 * da árvore do editor mora em `components/features/editor/sectionProse.ts`.
 */

import MarkdownIt from 'markdown-it'
import { reportTexts } from '../content/report'
import type { Report, ReportSection } from '../services/types'

/**
 * As seções que o stream do `/generate` conhece: as cinco do laudo mais
 * `images`, que é o apêndice e não é seção do domínio.
 */
export type DocumentSection = ReportSection | 'images'

/**
 * Títulos **canônicos** do `/draft` — a âncora que localiza cada seção no
 * documento.
 *
 * Não são os mesmos rótulos de `content/report.ts`: aqueles são de tela e podem
 * ser encurtados ("Avaliação das influências externas"); estes são verbatim de
 * `report-template.md` e mudam junto com o contrato da API, nunca sozinhos.
 * Encurtar um aqui quebraria o encaixe da prosa em silêncio.
 */
export const DOCUMENT_SECTION_HEADINGS: Record<DocumentSection, string> = {
	inspection_planning: 'Avaliação e planejamento da execução',
	external_influences:
		'Avaliação das influências externas da instalação elétrica',
	qualitative_assessment: 'Avaliação qualitativa da instalação elétrica',
	quantitative_assessment: 'Avaliação quantitativa da instalação',
	circuits: 'Circuitos',
	images: 'Imagens do Relatório',
}

/**
 * Comparação de título tolerante a espaço e caixa, e só a isso.
 *
 * O `##` do `/draft` vira o `textContent` de um `<h2>`, que pode chegar com
 * espaço duplicado ou quebra de linha. Acento **não** é normalizado: os títulos
 * saem do mesmo documento nos dois lados, e ignorar acento só esconderia uma
 * divergência real de contrato.
 */
export const normalizeHeading = (value: string): string =>
	value.replace(/\s+/g, ' ').trim().toLocaleLowerCase('pt-BR')

const HEADING_TO_SECTION = new Map<string, DocumentSection>(
	Object.entries(DOCUMENT_SECTION_HEADINGS).map(([section, heading]) => [
		normalizeHeading(heading),
		section as DocumentSection,
	]),
)

/** `null` quando o título não é de seção conhecida (subtítulo, bloco `###`). */
export const sectionFromHeading = (text: string): DocumentSection | null =>
	HEADING_TO_SECTION.get(normalizeHeading(text)) ?? null

/**
 * `html: true` é **obrigatório**, não preferência.
 *
 * Dois blocos do `/draft` saem como `<table>` HTML em vez de tabela GFM — a
 * avaliação qualitativa e a Parte II da quantitativa — porque têm cabeçalho de
 * dois níveis e o GFM não tem `colspan`. Sem esta opção, o `markdown-it`
 * **descarta os dois em silêncio**: o laudo abre no editor sem erro nenhum e
 * sem metade das respostas.
 *
 * O risco usual de `html: true` (HTML arbitrário de terceiro) não se aplica: a
 * fonte é o `/draft` do `raijin`, que escapa todo valor digitado pelo
 * engenheiro antes de montar o Markdown.
 */
const markdown = new MarkdownIt({
	html: true,
	linkify: true,
	breaks: false,
})

/** Markdown do `/draft` → HTML para `setContent` do editor. */
export const draftToHtml = (draft: string): string => markdown.render(draft)

// -- Cabeçalho de contexto das tabelas --------------------------------------

/**
 * Marca o invólucro do bloco de contexto no HTML — é por ela que o CSS, o
 * esquema do editor e o `.docx` o reconhecem. Mora aqui, e não na extensão do
 * TipTap, porque `domain/` não depende de `components/`.
 */
export const INSPECTION_CONTEXT_ATTRIBUTE = 'data-inspection-context'

/**
 * As tabelas que recebem o cabeçalho de contexto, por número ABNT.
 *
 * São as três do formulário legado que traziam data, local e responsáveis
 * repetidos no topo (`docs/report-template.md` §"Cabeçalho do laudo"): quem
 * recebe o laudo impresso costuma ler uma tabela isolada, fora do documento
 * inteiro, e sem esse bloco não há como saber de que inspeção ela é. As
 * tabelas 10 a 12 ficam de fora porque no legado também ficavam.
 */
const CONTEXT_TABLE_NUMBERS = new Set([7, 8, 9])

/**
 * `**Tabela 7. …**` vira `<p><strong>Tabela 7. …</strong></p>` — este é o
 * contrato com `raijin/src/document/template.rs::render_table`. Se a legenda
 * mudar de formato lá, o bloco de contexto simplesmente não é inserido aqui;
 * por isso o teste do lado do backend fixa a string da legenda.
 */
const CAPTION_PATTERN = /^Tabela\s+(\d+)\./

const escapeText = (value: string): string =>
	value.replace(/[&<>]/g, (character) =>
		character === '&' ? '&amp;' : character === '<' ? '&lt;' : '&gt;',
	)

/**
 * Separador entre dois pares rótulo/valor na mesma linha ("Data da inspeção: …
 * Hora da inspeção: …").
 *
 * Espaços inquebráveis, e **não** um `<span>` com largura no CSS: o bloco
 * atravessa o esquema do TipTap, que descarta todo elemento que não conhece —
 * um `<span class="gap">` some no `setContent` e os dois pares chegam colados
 * ("16/08/2026Hora da inspeção:"). Texto sobrevive; elemento sem nó, não.
 */
const PAIR_GAP = '    '

const line = (parts: [string, string][]): string =>
	`<p>${parts
		.map(([label, value]) => `<strong>${label}:</strong> ${escapeText(value)}`)
		.join(PAIR_GAP)}</p>`

/**
 * Data e hora separadas, como no formulário: `inspectedAt` é um instante só,
 * mas o cabeçalho legado tem dois campos e o engenheiro procura por eles.
 */
function inspectionMoment(iso: string): { date: string; time: string } {
	const moment = new Date(iso)

	if (Number.isNaN(moment.getTime())) {
		return { date: iso, time: '' }
	}

	return {
		date: moment.toLocaleDateString('pt-BR'),
		time: moment.toLocaleTimeString('pt-BR', {
			hour: '2-digit',
			minute: '2-digit',
		}),
	}
}

/**
 * O bloco de contexto de uma inspeção, em HTML.
 *
 * Montado aqui e não no `/draft` porque `location_code` e `responsible_parties`
 * são omitidos do modelo que o `raijin` gera — endereço de edificação com
 * vulnerabilidade documentada e nome de pessoa não saem do banco para alimentar
 * provedor de IA. O frontend já tem o laudo inteiro e é quem os posiciona; é a
 * mesma razão de `domain/reportHeader.ts` existir.
 */
export function inspectionContextHtml(report: Report): string {
	const { context } = reportTexts.document
	const { date, time } = inspectionMoment(report.inspectedAt)
	const temperature =
		report.ambientTemperatureC === null
			? context.notInformed
			: `${report.ambientTemperatureC.toLocaleString('pt-BR')} °C`

	return [
		`<div ${INSPECTION_CONTEXT_ATTRIBUTE}="" class="inspection-context">`,
		line([
			[context.date, date],
			[context.time, time === '' ? context.notInformed : `${time} h`],
		]),
		line([[context.location, report.locationCode]]),
		line([
			[context.temperature, temperature],
			[context.weather, report.weatherConditions || context.notInformed],
		]),
		line([
			[
				context.responsibleParties,
				report.responsibleParties.join(', ') || context.notInformed,
			],
		]),
		'</div>',
	].join('')
}

/**
 * Insere o bloco de contexto logo abaixo da legenda das Tabelas 7, 8 e 9.
 *
 * Opera no DOM já parseado, e não por regex sobre a string: a legenda é um
 * parágrafo inteiro e o que interessa é o **nó** seguinte ao qual pendurar o
 * bloco. Tabela cuja legenda não casar com o padrão passa intacta — o
 * documento sai sem o cabeçalho, nunca corrompido.
 */
export function withInspectionContext(html: string, report: Report): string {
	const parsed = new DOMParser().parseFromString(
		`<!doctype html><body>${html}</body>`,
		'text/html',
	)

	const block = parsed.createElement('template')
	block.innerHTML = inspectionContextHtml(report)

	for (const caption of Array.from(
		parsed.body.querySelectorAll('p > strong'),
	)) {
		const number = CAPTION_PATTERN.exec(caption.textContent ?? '')?.[1]

		if (number === undefined || !CONTEXT_TABLE_NUMBERS.has(Number(number))) {
			continue
		}

		caption.parentElement?.after(block.content.cloneNode(true))
	}

	return parsed.body.innerHTML
}

// -- Achado fotográfico -----------------------------------------------------

const IMAGE_SCHEME = 'image:'

/** `image:<uuid>` — o `src` que o `/draft` emite no lugar da URL assinada. */
export const imageMarker = (imageId: string): string =>
	`${IMAGE_SCHEME}${imageId}`

/**
 * Extrai o `image_id` do marcador. `null` para qualquer outro `src`.
 *
 * O documento editado é persistido em `document_content`, e a URL de leitura
 * vence em 5 minutos — por isso o que fica gravado é sempre o marcador, e a
 * resolução acontece na renderização e na exportação.
 */
export function imageIdFromMarker(
	src: string | null | undefined,
): string | null {
	if (typeof src !== 'string' || !src.startsWith(IMAGE_SCHEME)) {
		return null
	}

	const imageId = src.slice(IMAGE_SCHEME.length)

	return imageId.length > 0 ? imageId : null
}
