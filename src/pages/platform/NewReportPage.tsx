import { useNavigate } from 'react-router'
import { CreateReportForm } from '../../components/features/CreateReportForm'
import { PageHeader } from '../../components/ui/PageHeader'
import { platformTexts } from '../../content/platform'
import type { CreatedReport } from '../../services/types'

export function NewReportPage() {
	const navigate = useNavigate()

	function handleCreated(report: CreatedReport) {
		navigate('/plataforma/relatorios', {
			state: { autofilled: report.planningAutofilled ? report : null },
		})
	}

	return (
		<>
			<PageHeader title={platformTexts.form.title} />

			<CreateReportForm
				onCancel={() => navigate('/plataforma/relatorios')}
				onCreated={handleCreated}
			/>
		</>
	)
}
