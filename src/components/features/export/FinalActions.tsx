import type { Editor } from '@tiptap/react'
import type { RefObject } from 'react'
import {
	UaAlert,
	UaButton,
	UaCard,
	UaInputField,
	UaTextarea,
} from 'sanhaua/react'
import { exportTexts } from '../../../content/export'
import type { ExportSettings } from '../../../domain/exportSettings'
import { useReportExport } from '../../../hooks/useReportExport'
import type { Report, ReportImage } from '../../../services/types'
import './FinalActions.scss'

const { fields, groups, hints, actions } = exportTexts

interface FinalActionsProps {
	report: Report
	settings: ExportSettings
	onChange: (field: keyof ExportSettings, value: string) => void
	editor: Editor | null
	/** Região impressa — a espera pelas imagens acontece dentro dela. */
	printRootRef: RefObject<HTMLElement | null>
	refreshImages: () => Promise<ReportImage[]>
}

/**
 * Ações finais: os campos que só existem no arquivo entregue, e os dois botões
 * que o produzem.
 *
 * Fica marcado com `.no-print` inteiro. É a peça de interface que **encosta** no
 * documento sem fazer parte dele: o que se digita aqui sai impresso (pela capa
 * e pela assinatura, que são componentes próprios), mas o formulário em si não
 * pode aparecer no papel.
 */
export function FinalActions({
	report,
	settings,
	onChange,
	editor,
	printRootRef,
	refreshImages,
}: FinalActionsProps) {
	const { phase, error, notice, exportPdf, exportDocx, dismiss } =
		useReportExport({ report, settings, editor, printRootRef, refreshImages })

	const isExporting = phase !== 'idle'

	const field = (name: keyof ExportSettings) => ({
		label: fields[name],
		value: settings[name],
		onChange: (event: { currentTarget: { value: string } }) =>
			onChange(name, event.currentTarget.value),
	})

	return (
		<section className="final-actions no-print">
			<header className="intro">
				<h2 className="title">{exportTexts.title}</h2>
				<p className="description">{exportTexts.description}</p>
			</header>

			<UaCard>
				<div className="settings">
					<fieldset className="group">
						<legend className="legend">{groups.cover}</legend>

						<div className="grid">
							<UaInputField {...field('institutionName')} />
							<UaInputField {...field('institutionSubtitle')} />
							<UaInputField
								{...field('documentTitle')}
								hint={hints.documentTitle}
							/>
							<UaInputField {...field('clientName')} />
							<UaInputField {...field('coverLocation')} />
						</div>
					</fieldset>

					<fieldset className="group">
						<legend className="legend">{groups.art}</legend>

						<div className="grid">
							<UaInputField {...field('artNumber')} hint={hints.artNumber} />
							<UaInputField {...field('artNote')} />
						</div>
					</fieldset>

					<fieldset className="group">
						<legend className="legend">{groups.signature}</legend>

						<UaTextarea
							{...field('closingRemarks')}
							hint={hints.closingRemarks}
							rows={4}
						/>

						<div className="grid">
							<UaInputField {...field('signerName')} />
							<UaInputField {...field('signerTitle')} />
							<UaInputField {...field('signerRegistration')} />
							<UaInputField {...field('signaturePlace')} />
							<UaInputField {...field('signatureDate')} type="date" />
						</div>
					</fieldset>
				</div>
			</UaCard>

			<p className="local-only">{exportTexts.localOnly}</p>

			{error ? <UaAlert appearance="danger" description={error} /> : null}

			{notice ? (
				<UaAlert appearance="informative" description={notice} />
			) : null}

			<div className="controls">
				<UaButton
					disabled={isExporting}
					leftIcon="print"
					onClick={exportPdf}
					type="button"
				>
					{phase === 'pdf' ? actions.preparingPdf : actions.pdf}
				</UaButton>

				<UaButton
					appearance="secondary"
					disabled={isExporting}
					leftIcon="description"
					onClick={exportDocx}
					type="button"
				>
					{phase === 'docx' ? actions.preparingDocx : actions.docx}
				</UaButton>

				{error || notice ? (
					<UaButton
						appearance="tertiary"
						onClick={dismiss}
						size="small"
						type="button"
					>
						{exportTexts.dismiss}
					</UaButton>
				) : null}
			</div>
		</section>
	)
}
