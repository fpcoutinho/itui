/**
 * Encaixe da prosa do `/generate` no documento do `/draft`.
 *
 * Duas regras governam este arquivo, e as duas vêm do contrato:
 *
 * 1. **Não tocar nas tabelas.** Elas vieram do `/draft` e são a fonte da
 *    verdade dos dados; o stream só acrescenta parágrafo, sempre no fim da
 *    seção a que pertence.
 * 2. **Um nó por seção, atualizado**, não um nó por token — senão o histórico
 *    de undo do TipTap vira um Ctrl+Z por pedaço de palavra.
 */

import type { Node as ProseMirrorNode } from '@tiptap/pm/model'
import type { Editor } from '@tiptap/react'
import {
	type DocumentSection,
	sectionFromHeading,
} from '../../../domain/reportDocument'

interface SectionRange {
	/** Posição logo depois do último nó da seção — onde a prosa entra. */
	end: number
	/** Parágrafo de prosa já existente, se o stream (ou uma geração anterior) o criou. */
	prose: { from: number; to: number } | null
}

/**
 * Delimita a seção pelo título canônico e localiza o parágrafo de prosa dela.
 *
 * A varredura é só no nível superior do documento: `##` do `/draft` vira `<h2>`
 * filho direto do `doc`, e uma seção termina onde começa o próximo título de
 * nível 1 ou 2 — ou no fim do documento.
 */
function findSection(
	doc: ProseMirrorNode,
	section: DocumentSection,
): SectionRange | null {
	let start: number | null = null
	let end: number | null = null
	let prose: SectionRange['prose'] = null

	doc.forEach((node, offset) => {
		if (end !== null) {
			return
		}

		const isSectionHeading =
			node.type.name === 'heading' && Number(node.attrs.level) <= 2

		if (isSectionHeading) {
			if (start !== null) {
				end = offset
				return
			}

			if (sectionFromHeading(node.textContent) === section) {
				start = offset
			}

			return
		}

		if (start !== null && node.attrs.aiSection === section) {
			// A prosa de uma seção pode ocupar vários parágrafos; eles são
			// contíguos, e o bloco inteiro é substituído de uma vez.
			prose = { from: prose?.from ?? offset, to: offset + node.nodeSize }
		}
	})

	if (start === null) {
		// Seção ausente do documento. Acontece se o `/draft` mudou de vocabulário
		// sem que este repositório acompanhasse — silêncio aqui seria pior que
		// prosa no lugar errado, então quem chama avisa.
		return null
	}

	return { end: end ?? doc.content.size, prose }
}

/**
 * Escreve (ou reescreve) a prosa acumulada da seção.
 *
 * `addToHistory: false` é intencional: o stream não é edição do usuário, e
 * empilhá-lo no histórico faria o primeiro Ctrl+Z depois da geração desfazer um
 * fragmento arbitrário do texto que a IA acabou de escrever. O documento inteiro
 * continua desfazível pelo passo que o criou.
 *
 * Devolve `false` quando a seção não existe no documento.
 */
export function writeSectionProse(
	editor: Editor,
	section: DocumentSection,
	text: string,
): boolean {
	const { state } = editor
	const range = findSection(state.doc, section)

	if (range === null) {
		return false
	}

	// O modelo separa parágrafos por linha em branco, como no resto do Markdown
	// que ele produz. Um parágrafo vazio no fim (texto ainda chegando) é
	// descartado em vez de virar nó.
	const paragraphs = text
		.split(/\n{2,}/)
		.map((piece) => piece.trim())
		.filter((piece) => piece.length > 0)
		.map((piece) =>
			state.schema.nodes.paragraph.create(
				{ aiSection: section },
				state.schema.text(piece),
			),
		)

	if (paragraphs.length === 0) {
		return true
	}

	const transaction =
		range.prose === null
			? state.tr.insert(range.end, paragraphs)
			: state.tr.replaceWith(range.prose.from, range.prose.to, paragraphs)

	editor.view.dispatch(transaction.setMeta('addToHistory', false))

	return true
}
