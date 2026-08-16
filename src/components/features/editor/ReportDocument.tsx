import { type Editor, EditorContent } from '@tiptap/react'
import './ReportDocument.scss'

interface ReportDocumentProps {
	editor: Editor
}

/**
 * O corpo do laudo — a única tipografia do documento em si.
 *
 * Existe como componente (e não como bloco dentro do `ReportEditor`) porque o
 * mesmo documento é renderizado em duas etapas: a de edição e a de exportação,
 * que o monta em modo somente leitura para que o PDF tenha o que imprimir. O
 * estilo tem de ser um só — o papel não pode sair com uma tabela diferente da
 * que foi revisada na tela.
 */
export function ReportDocument({ editor }: ReportDocumentProps) {
	return <EditorContent className="report-document" editor={editor} />
}
