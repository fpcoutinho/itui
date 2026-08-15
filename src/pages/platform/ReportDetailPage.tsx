import { useParams } from 'react-router'
import { UaAlert } from 'sanhaua/react'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { PageHeader } from '../../components/ui/PageHeader'
import { platformTexts } from '../../content/platform'

export function ReportDetailPage() {
	const { reportId } = useParams()

	return (
		<>
			<PageHeader
				actions={
					<ButtonLink appearance="ghost" to="/plataforma/relatorios">
						{platformTexts.detail.back}
					</ButtonLink>
				}
				description={`${platformTexts.detail.identifier}: ${reportId}`}
				title={platformTexts.detail.title}
			/>

			<UaAlert
				appearance="informative"
				description={platformTexts.detail.underConstruction}
			/>
		</>
	)
}
