import { useEditor } from '@tiptap/react'
import { useEffect, useMemo, useRef } from 'react'
import { UaAlert, UaButton } from 'sanhaua/react'
import { reportTexts } from '../../../content/report'
import { useExportSettings } from '../../../hooks/useExportSettings'
import { useReportImageUrls } from '../../../hooks/useReportImageUrls'
import { useSession } from '../../../hooks/useSession'
import type { ReportDetail } from '../../../services/types'
import { ReportDocument } from '../editor/ReportDocument'
import {
	isEmptyDocument,
	reportEditorExtensions,
} from '../editor/reportEditorExtensions'
import { FinalActions } from './FinalActions'
import { ReportPrintCover, ReportPrintSignature } from './ReportPrintSheet'
import './ExportStep.scss'

const { wizard } = reportTexts

interface ExportStepProps {
	report: ReportDetail
	onPrevious: () => void
}

/**
 * A última etapa: o laudo virando arquivo.
 *
 * Ela existe separada da etapa do documento por duas razões que se somam. A
 * primeira é de tela — capa, ART, assinatura e os dois botões empilhados abaixo
 * do editor faziam uma página longa demais, com o formulário de diagramação
 * escondido embaixo do laudo inteiro. A segunda é conceitual: aqui não se edita
 * o laudo, decide-se como ele sai.
 *
 * O documento é montado de novo, em modo somente leitura, a partir do que já
 * está salvo em `document_content`. Os dois caminhos de exportação precisam
 * dele: o PDF imprime o DOM desta página, e o `.docx` parte do `getHTML()`
 * deste editor.
 */
export function ExportStep({ report, onPrevious }: ExportStepProps) {
	const {
		store: imageUrls,
		error: imagesError,
		refresh: refreshImages,
	} = useReportImageUrls(report.id)

	const { user } = useSession()

	/**
	 * Os campos de capa e assinatura. Ficam neste nível porque têm dois
	 * consumidores que não se enxergam: o formulário, que os edita, e a folha
	 * impressa, que os exibe.
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
		() => reportEditorExtensions(imageUrls),
		[imageUrls],
	)

	const editor = useEditor(
		{
			extensions,
			editable: false,
			content: isEmptyDocument(report.documentContent)
				? ''
				: report.documentContent,
			editorProps: { attributes: { class: 'surface' } },
		},
		[extensions],
	)

	/**
	 * O último salvamento automático da etapa anterior é disparado na
	 * desmontagem dela — ou seja, depois que esta etapa já montou. O laudo chega
	 * atualizado um instante mais tarde, e sem esta sincronia o arquivo exportado
	 * sairia com a versão anterior do texto, em silêncio.
	 */
	useEffect(() => {
		if (editor === null || editor.isDestroyed) {
			return
		}

		editor.commands.setContent(
			isEmptyDocument(report.documentContent) ? '' : report.documentContent,
		)
	}, [editor, report.documentContent])

	return (
		<section className="export-step">
			{imagesError ? (
				<UaAlert
					appearance="warning"
					className="no-print"
					description={imagesError}
				/>
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

			{/*
			  A folha impressa fica fora da tela em vez de `display: none`: uma
			  `<img>` dentro de um bloco não renderizado nunca chega a carregar, e a
			  exportação em PDF espera justamente o `load` de cada foto antes de
			  chamar `window.print()`. Escondida assim ela existe, mede e baixa.
			*/}
			<div className="print-sheet" ref={printRootRef}>
				<ReportPrintCover report={report} settings={exportSettings.settings} />

				{editor !== null ? <ReportDocument editor={editor} /> : null}

				<ReportPrintSignature settings={exportSettings.settings} />
			</div>
		</section>
	)
}
