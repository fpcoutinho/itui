/**
 * O bloco de contexto que o formulário legado trazia no alto de cada tabela:
 * data, hora, local, condições climáticas e responsáveis.
 *
 * **Por que é um nó do esquema e não quatro parágrafos soltos**: o TipTap
 * descarta o que não conhece. Um `<div class="…">` com os parágrafos dentro
 * volta do editor como parágrafos sem invólucro e sem classe, e aí não há como
 * distingui-los de prosa — nem para estilar, nem para o `.docx`. Nó registrado
 * atravessa `setContent` → `document_content` → `getHTML()` inteiro.
 *
 * O conteúdo é `block+` de propósito: as linhas continuam sendo parágrafos
 * comuns, editáveis, e o engenheiro pode corrigir um responsável que faltou
 * sem sair do editor. O bloco só garante que elas andam juntas.
 */

import { mergeAttributes, Node } from '@tiptap/core'
import { INSPECTION_CONTEXT_ATTRIBUTE } from '../../../../domain/reportDocument'

export const InspectionContext = Node.create({
	name: 'inspectionContext',
	group: 'block',
	content: 'block+',
	defining: true,

	parseHTML() {
		return [{ tag: `div[${INSPECTION_CONTEXT_ATTRIBUTE}]` }]
	},

	renderHTML({ HTMLAttributes }) {
		return [
			'div',
			mergeAttributes(HTMLAttributes, {
				[INSPECTION_CONTEXT_ATTRIBUTE]: '',
				class: 'inspection-context',
			}),
			0,
		]
	},
})
