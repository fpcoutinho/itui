import {
	Table,
	TableCell,
	TableHeader,
	TableRow,
} from '@tiptap/extension-table'
import StarterKit from '@tiptap/starter-kit'
import { InspectionContext } from './extensions/InspectionContext'
import { ProseParagraph } from './extensions/ProseParagraph'
import { ReportImageNode } from './extensions/ReportImageNode'
import type { ImageUrlStore } from './imageUrls'

/**
 * O esquema do documento do laudo.
 *
 * Duas telas montam um editor sobre ele: a etapa do documento, onde se escreve,
 * e a etapa de exportação, que monta um editor **não editável** só para ter o
 * documento no DOM (o PDF imprime a página) e em HTML (o `.docx` parte de
 * `getHTML()`). Se as duas divergissem no esquema, o arquivo exportado deixaria
 * de ser o documento revisado — uma tabela vira parágrafo solto e ninguém vê
 * até abrir o `.docx`.
 */
export function reportEditorExtensions(urls: ImageUrlStore | null) {
	return [
		// A `0.30` do TipTap traz `Underline` e `Link` dentro do StarterKit —
		// instalá-los à parte registraria a mesma extensão duas vezes.
		StarterKit.configure({
			// O parágrafo do laudo carrega a marca da seção que o stream escreveu.
			paragraph: false,
			link: { openOnClick: false, autolink: true },
		}),
		ProseParagraph,
		// O cabeçalho de contexto das Tabelas 7, 8 e 9. Sem ele registrado, o
		// invólucro se perde no `setContent` e as quatro linhas viram prosa solta.
		InspectionContext,
		// Sem estas quatro, **toda tabela do laudo vira parágrafo solto** — e o
		// laudo é quase todo tabela. O StarterKit não as traz.
		Table.configure({ resizable: false }),
		TableRow,
		TableHeader,
		TableCell,
		ReportImageNode.configure({ urls }),
	]
}

/** Documento vazio: o `document_content` nasce `{}`, nunca `null`. */
export const isEmptyDocument = (document: object): boolean =>
	Object.keys(document).length === 0
