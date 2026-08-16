import { exportTexts } from '../../../content/export'
import type { ExportSettings } from '../../../domain/exportSettings'
import {
	buildReportHeader,
	coverTitle,
	formatSignatureDate,
} from '../../../domain/reportHeader'
import type { Report } from '../../../services/types'
import './ReportPrintSheet.scss'

const { cover, header, signature } = exportTexts

interface ReportPrintCoverProps {
	report: Report
	settings: ExportSettings
}

/**
 * A capa e o cabeçalho de identificação — **só no papel**.
 *
 * Ficam no DOM o tempo todo, escondidos por `.print-only`, em vez de serem
 * montados no clique de exportar. `window.print()` é síncrono: o que não
 * estiver no documento no instante da chamada não entra no PDF, e um componente
 * inserido no mesmo clique dependeria de o React ter pintado antes — corrida
 * que às vezes se ganha, o que é a pior forma de bug.
 *
 * `aria-hidden` porque é duplicata de apresentação: os mesmos dados já estão na
 * tela, no cabeçalho da página e no formulário de exportação, e um leitor de
 * tela não deve lê-los duas vezes.
 */
export function ReportPrintCover({ report, settings }: ReportPrintCoverProps) {
	const rows = buildReportHeader(report, settings)

	return (
		<section aria-hidden="true" className="report-print-cover print-only">
			<div className="letterhead">
				{settings.institutionName.trim() === '' ? null : (
					<p className="name">{settings.institutionName}</p>
				)}
				{settings.institutionSubtitle.trim() === '' ? null : (
					<p className="subtitle">{settings.institutionSubtitle}</p>
				)}
			</div>

			<div className="identity">
				<h1 className="title">{coverTitle(settings)}</h1>
				<p className="standard">{cover.standard}</p>
				{settings.coverLocation.trim() === '' ? null : (
					<p className="place">{settings.coverLocation}</p>
				)}
			</div>

			<p className="caption">{header.title}</p>

			<dl className="summary">
				{rows.map((row) => (
					<div className="row" key={row.label}>
						<dt className="term">{row.label}</dt>
						<dd className="value">{row.value}</dd>
					</div>
				))}
			</dl>

			{settings.artNote.trim() === '' ? null : (
				<p className="note">{settings.artNote}</p>
			)}
		</section>
	)
}

interface ReportPrintSignatureProps {
	settings: ExportSettings
}

/** O fecho: parecer, local, data e a linha assinada. Também só no papel. */
export function ReportPrintSignature({ settings }: ReportPrintSignatureProps) {
	const place = [
		settings.signaturePlace,
		formatSignatureDate(settings.signatureDate),
	]
		.filter((value) => value.trim() !== '')
		.join(', ')

	return (
		<section aria-hidden="true" className="report-print-signature print-only">
			<h2 className="title">{signature.title}</h2>

			{settings.closingRemarks.trim() === '' ? null : (
				<p className="remarks">{settings.closingRemarks}</p>
			)}

			{place === '' ? null : <p className="place">{place}</p>}

			<div className="signature">
				<p className="line">{settings.signerName || signature.line}</p>
				{settings.signerTitle.trim() === '' ? null : (
					<p className="detail">{settings.signerTitle}</p>
				)}
				{settings.signerRegistration.trim() === '' ? null : (
					<p className="detail">{settings.signerRegistration}</p>
				)}
			</div>
		</section>
	)
}
