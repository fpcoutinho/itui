import { exportTexts } from '../../../content/export'
import type { ExportSettings } from '../../../domain/exportSettings'
import {
	buildCover,
	buildReportHeader,
	formatSignatureDate,
} from '../../../domain/reportHeader'
import type { Report } from '../../../services/types'
import './ReportPrintSheet.scss'

const { header, signature } = exportTexts

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
	const content = buildCover(report, settings)

	return (
		<>
			<section aria-hidden="true" className="report-print-cover print-only">
				<div className="letterhead">
					{content.institutionName === '' ? null : (
						<p className="name">{content.institutionName}</p>
					)}
					{content.institutionSubtitle === '' ? null : (
						<p className="subtitle">{content.institutionSubtitle}</p>
					)}
				</div>

				<div className="identity">
					<h1 className="title">{content.title}</h1>
					<p className="standard">{content.standard}</p>
					<p className="number">{content.reportNumber}</p>
				</div>

				<div className="subject">
					{content.client === '' ? null : (
						<p className="client">{content.client}</p>
					)}
					{content.location === '' ? null : (
						<p className="place">{content.location}</p>
					)}
					{content.year === '' ? null : <p className="year">{content.year}</p>}
				</div>

				{content.artNote === '' ? null : (
					<p className="note">{content.artNote}</p>
				)}
			</section>

			{/* Fora da capa: a grade de identificação abre o documento, na folha
			    seguinte. Empilhada na capa ela ocupava o miolo da primeira folha e
			    era o que fazia a capa parecer uma página de formulário. */}
			<section aria-hidden="true" className="report-print-header print-only">
				<h2 className="caption">{header.title}</h2>

				<dl className="summary">
					{rows.map((row) => (
						<div className="row" key={row.label}>
							<dt className="term">{row.label}</dt>
							<dd className="value">{row.value}</dd>
						</div>
					))}
				</dl>
			</section>
		</>
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
