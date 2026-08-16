import {
	Table,
	TableCell,
	TableHeader,
	TableRow,
} from '@tiptap/extension-table'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useMemo, useRef, useState } from 'react'
import { UaAlert, UaButton } from 'sanhaua/react'
import { reportTexts } from '../../../content/report'
import { useDocumentAutosave } from '../../../hooks/useDocumentAutosave'
import { useExportSettings } from '../../../hooks/useExportSettings'
import { useReportGeneration } from '../../../hooks/useReportGeneration'
import { useReportImageUrls } from '../../../hooks/useReportImageUrls'
import { useSession } from '../../../hooks/useSession'
import type { ReportDetail } from '../../../services/types'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { FinalActions } from '../export/FinalActions'
import {
	ReportPrintCover,
	ReportPrintSignature,
} from '../export/ReportPrintSheet'
import { EditorToolbar } from './EditorToolbar'
import { ProseParagraph } from './extensions/ProseParagraph'
import { ReportImageNode } from './extensions/ReportImageNode'
import './ReportEditor.scss'

const { editor: texts, wizard } = reportTexts

interface ReportEditorProps {
	report: ReportDetail
	/** Resposta do `PATCH /document-content`: o laudo inteiro, já com o documento gravado. */
	onSaved: (report: ReportDetail) => void
	onPrevious: () => void
}

/** Documento vazio: o `document_content` nasce `{}`, nunca `null`. */
const isEmptyDocument = (document: object): boolean =>
	Object.keys(document).length === 0

/**
 * O editor do laudo.
 *
 * O conteúdo tem duas origens e nenhuma delas é este componente: o documento já
 * salvo em `document_content`, ou o `GET .../draft` disparado pelo botão de
 * gerar parecer. Aqui só se monta o editor e se ligam as três coisas que
 * acontecem em volta dele — salvamento automático, geração por IA e resolução
 * das imagens.
 */
export function ReportEditor({
	report,
	onSaved,
	onPrevious,
}: ReportEditorProps) {
	const {
		store: imageUrls,
		error: imagesError,
		refresh: refreshImages,
	} = useReportImageUrls(report.id)

	const { user } = useSession()

	/**
	 * Os campos de capa e assinatura. Ficam neste nível porque têm dois
	 * consumidores que não se enxergam: o formulário das ações finais, que os
	 * edita, e a capa impressa, que os exibe.
	 */
	const exportSettings = useExportSettings(report.id, {
		signerName: user?.fullName ?? '',
		signerTitle: user?.professionalTitle ?? '',
	})

	/**
	 * A região que vai para o papel: capa, documento e assinatura. A exportação
	 * espera as `<img>` **daqui** carregarem antes de abrir o diálogo de
	 * impressão.
	 */
	const printRootRef = useRef<HTMLDivElement>(null)

	const extensions = useMemo(
		() => [
			// A `0.30` do TipTap traz `Underline` e `Link` dentro do StarterKit —
			// instalá-los à parte registraria a mesma extensão duas vezes.
			StarterKit.configure({
				// O parágrafo do laudo carrega a marca da seção que o stream escreveu.
				paragraph: false,
				link: { openOnClick: false, autolink: true },
			}),
			ProseParagraph,
			// Sem estas quatro, **toda tabela do laudo vira parágrafo solto** — e o
			// laudo é quase todo tabela. O StarterKit não as traz.
			Table.configure({ resizable: false }),
			TableRow,
			TableHeader,
			TableCell,
			ReportImageNode.configure({ urls: imageUrls }),
		],
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

	return (
		<section className="report-editor">
			<header className="intro no-print">
				<h2 className="title">{texts.title}</h2>
				<p className="description">{texts.description}</p>
			</header>

			{imagesError ? (
				<UaAlert
					appearance="warning"
					className="no-print"
					description={imagesError}
				/>
			) : null}

			{generation.error ? (
				<UaAlert
					appearance="danger"
					className="no-print"
					description={`${texts.generationFailed} (${generation.error})`}
				/>
			) : null}

			{generation.warning ? (
				<UaAlert
					appearance="warning"
					className="no-print"
					description={generation.warning}
				/>
			) : null}

			{autosave.error ? (
				<UaAlert
					appearance="danger"
					className="no-print"
					description={autosave.error}
				/>
			) : null}

			<div className="controls no-print">
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
						<p className="empty no-print">{texts.empty}</p>
					) : null}

					{/* Capa, documento e assinatura na ordem em que saem no papel — é
					    a ordem do DOM que pagina, não uma montagem à parte. */}
					<div className="printable" ref={printRootRef}>
						<ReportPrintCover
							report={report}
							settings={exportSettings.settings}
						/>

						<EditorContent className="document" editor={editor} />

						<ReportPrintSignature settings={exportSettings.settings} />
					</div>
				</>
			) : null}

			<FinalActions
				editor={editor}
				onChange={exportSettings.update}
				printRootRef={printRootRef}
				refreshImages={refreshImages}
				report={report}
				settings={exportSettings.settings}
			/>

			<div className="actions no-print">
				<UaButton appearance="tertiary" onClick={onPrevious} type="button">
					{wizard.previous}
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
