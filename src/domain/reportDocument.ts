/**
 * O laudo como **documento**: conversão do Markdown do `/draft` para o HTML que
 * o TipTap sabe parsear, e o vocabulário de âncoras que o stream do `/generate`
 * usa para achar a seção certa.
 *
 * Sem React e sem ProseMirror de propósito: aqui só entra texto. A manipulação
 * da árvore do editor mora em `components/features/editor/sectionProse.ts`.
 */

import MarkdownIt from 'markdown-it'
import type { ReportSection } from '../services/types'

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
