import { useEditor } from '@tiptap/react'
import { useMemo, useState } from 'react'
import { UaAlert, UaButton } from 'sanhaua/react'
import { reportTexts } from '../../../content/report'
import { useDocumentAutosave } from '../../../hooks/useDocumentAutosave'
import { useReportGeneration } from '../../../hooks/useReportGeneration'
import { useReportImageUrls } from '../../../hooks/useReportImageUrls'
import type { Report, ReportDetail } from '../../../services/types'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { EditorToolbar } from './EditorToolbar'
import { ReportDocument } from './ReportDocument'
import {
	isEmptyDocument,
	reportEditorExtensions,
} from './reportEditorExtensions'
import './ReportEditor.scss'

const { editor: texts, wizard } = reportTexts

interface ReportEditorProps {
	report: ReportDetail
	/** Resposta do `PATCH /document-content`: o `Report` já com o documento gravado. */
	onSaved: (report: Report) => void
	onAdvance: () => void
	onPrevious: () => void
}

/**
 * O editor do laudo.
 *
 * O conteúdo tem duas origens e nenhuma delas é este componente: o documento já
 * salvo em `document_content`, ou o `GET .../draft` disparado pelo botão de
 * gerar parecer. Aqui só se monta o editor e se ligam as três coisas que
 * acontecem em volta dele — salvamento automático, geração por IA e resolução
 * das imagens.
 *
 * Capa, assinatura e os botões de exportar **não** moram aqui: são a etapa
 * seguinte (`ExportStep`). Esta tela é só o texto.
 */
export function ReportEditor({
	report,
	onSaved,
	onAdvance,
	onPrevious,
}: ReportEditorProps) {
	const { store: imageUrls, error: imagesError } = useReportImageUrls(report.id)

	const extensions = useMemo(
		() => reportEditorExtensions(imageUrls),
		[imageUrls],
	)

	const editor = useEditor(
		{
			extensions,
			// A árvore salva é carregada como está; o documento vazio abre o editor em
			// branco, com o aviso para gerar o parecer.
			content: isEmptyDocument(report.documentContent)
				? ''
				: report.documentContent,
			editorProps: {
				attributes: {
					class: 'surface',
					role: 'textbox',
					'aria-multiline': 'true',
				},
			},
		},
		[extensions],
	)

	const autosave = useDocumentAutosave(editor, report.id, onSaved)
	const generation = useReportGeneration(editor, report.id)

	const isGenerating =
		generation.phase === 'drafting' || generation.phase === 'streaming'

	const hasContent = editor !== null && !editor.isEmpty

	const [isConfirmingRegenerate, setIsConfirmingRegenerate] = useState(false)

	const handleGenerate = () => {
		// Gerar remonta o documento a partir das seções: o que estiver escrito no
		// editor é substituído. Quem já editou precisa confirmar.
		if (hasContent) {
			setIsConfirmingRegenerate(true)
			return
		}

		generation.start()
	}

	// `no-print` no bloco inteiro: o que vai ao papel é montado na etapa de
	// exportação, e imprimir daqui só produziria a barra de ferramentas em A4.
	return (
		<section className="report-editor no-print">
			<header className="intro">
				<h2 className="title">{texts.title}</h2>
				<p className="description">{texts.description}</p>
			</header>

			{imagesError ? (
				<UaAlert appearance="warning" description={imagesError} />
			) : null}

			{generation.error ? (
				<UaAlert
					appearance="danger"
					description={`${texts.generationFailed} (${generation.error})`}
				/>
			) : null}

			{generation.warning ? (
				<UaAlert appearance="warning" description={generation.warning} />
			) : null}

			{autosave.error ? (
				<UaAlert appearance="danger" description={autosave.error} />
			) : null}

			<div className="controls">
				{isGenerating ? (
					<UaButton
						appearance="tertiary"
						leftIcon="stop_circle"
						onClick={generation.cancel}
						type="button"
					>
						{texts.cancel}
					</UaButton>
				) : (
					<UaButton onClick={handleGenerate} type="button">
						{hasContent ? texts.regenerate : texts.generate}
					</UaButton>
				)}

				<span aria-live="polite" className="status">
					{generation.phase === 'drafting' ? texts.drafting : null}
					{generation.phase === 'streaming' ? texts.streaming : null}
					{isGenerating ? null : texts.saveStatus[autosave.status]}
				</span>

				{autosave.status === 'pending' || autosave.status === 'error' ? (
					<UaButton
						appearance="tertiary"
						onClick={autosave.saveNow}
						size="small"
						type="button"
					>
						{texts.saveNow}
					</UaButton>
				) : null}
			</div>

			{editor !== null ? (
				<>
					<EditorToolbar disabled={isGenerating} editor={editor} />

					{!hasContent && !isGenerating ? (
						<p className="empty">{texts.empty}</p>
					) : null}

					<ReportDocument editor={editor} />
				</>
			) : null}

			<div className="actions">
				<UaButton appearance="tertiary" onClick={onPrevious} type="button">
					{wizard.previous}
				</UaButton>

				<UaButton disabled={!hasContent} onClick={onAdvance} type="button">
					{texts.toExport}
				</UaButton>
			</div>

			<ConfirmDialog
				appearance="danger"
				confirmLabel={texts.regenerate}
				description={texts.confirmRegenerate}
				isOpen={isConfirmingRegenerate}
				onClose={() => setIsConfirmingRegenerate(false)}
				onConfirm={() => {
					setIsConfirmingRegenerate(false)
					generation.start()
				}}
				title={texts.regenerate}
			/>
		</section>
	)
}
