import { useParams } from 'react-router'
import { UaAlert, UaSkeleton } from 'sanhaua/react'
import { InspectionWizard } from '../../components/features/wizard/InspectionWizard'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { PageHeader } from '../../components/ui/PageHeader'
import { platformTexts, reportStatusLabels } from '../../content/platform'
import { reportTexts } from '../../content/report'
import { useReport } from '../../hooks/useReport'

export function ReportDetailPage() {
	const { reportId } = useParams()
	const { report, isLoading, error, applyUpdate, refetch } = useReport(reportId)

	return (
		<>
			<PageHeader
				actions={
					<ButtonLink appearance="ghost" to="/plataforma/relatorios">
						{platformTexts.detail.back}
					</ButtonLink>
				}
				description={
					report === null
						? `${platformTexts.detail.identifier}: ${reportId}`
						: `${report.locationCode} · ${reportStatusLabels[report.status]}`
				}
				title={platformTexts.detail.title}
			/>

			{error ? <UaAlert appearance="danger" description={error} /> : null}

			{isLoading && report === null ? (
				<div className="route-loading">
					<UaSkeleton />
					<UaSkeleton />
					<UaSkeleton />
					<span className="visually-hidden">{reportTexts.loading}</span>
				</div>
			) : null}

			{report !== null ? (
				<InspectionWizard
					onRefetch={refetch}
					onUpdated={applyUpdate}
					report={report}
				/>
			) : null}
		</>
	)
}
