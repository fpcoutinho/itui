/**
 * Parágrafo com um atributo a mais: de qual seção do `/generate` aquela prosa
 * veio.
 *
 * É o que permite ao stream **atualizar o mesmo nó** a cada trecho em vez de
 * criar um nó por token — que tornaria o Ctrl+Z inutilizável (um undo por
 * pedaço de palavra) — sem precisar guardar posição de documento em ref e
 * mapeá-la por cima de cada edição do usuário.
 *
 * O atributo sobrevive ao salvamento: `attrs` está em `OPAQUE_KEYS` de
 * `services/case.ts`, então atravessa a borda da API sem conversão de
 * nomenclatura. Retomar um laudo salvo e gerar de novo reaproveita o parágrafo
 * existente em vez de empilhar um segundo.
 */

import Paragraph from '@tiptap/extension-paragraph'
import type { DocumentSection } from '../../../../domain/reportDocument'

/** No HTML exportado, o atributo vira `data-ai-section`. */
export const AI_SECTION_ATTRIBUTE = 'data-ai-section'

export const ProseParagraph = Paragraph.extend({
	addAttributes() {
		return {
			...this.parent?.(),
			aiSection: {
				default: null as DocumentSection | null,
				parseHTML: (element: HTMLElement) =>
					element.getAttribute(AI_SECTION_ATTRIBUTE),
				renderHTML: (attributes: Record<string, unknown>) =>
					attributes.aiSection
						? { [AI_SECTION_ATTRIBUTE]: String(attributes.aiSection) }
						: {},
			},
		}
	},
})
