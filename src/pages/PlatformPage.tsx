import { useState } from 'react'
import { Link } from 'react-router'
import {
	type Column,
	UaAlert,
	UaButton,
	UaSkeleton,
	UaTable,
} from 'sanhaua/react'
import { CreateReportForm } from '../components/features/CreateReportForm'
import { PageHeader } from '../components/ui/PageHeader'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { platformTexts, reportStatusLabels } from '../content/platform'
import { useReports } from '../hooks/useReports'
import { useSession } from '../hooks/useSession'
import type {
	CreatedReport,
	ReportStatus,
	ReportSummary,
} from '../services/types'
import './PlatformPage.scss'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
	dateStyle: 'short',
	timeStyle: 'short',
})

const formatDateTime = (iso: string) => dateFormatter.format(new Date(iso))

const columns: Column<ReportSummary>[] = [
	{
		key: 'locationCode',
		header: platformTexts.table.locationCode,
		render: (report) => <span className="code">{report.locationCode}</span>,
	},
	{
		key: 'inspectedAt',
		header: platformTexts.table.inspectedAt,
		render: (report) => formatDateTime(report.inspectedAt),
	},
	{
		key: 'status',
		header: platformTexts.table.status,
		render: (report) => (
			<span className={`status ${report.status}`}>
				{reportStatusLabels[report.status]}
			</span>
		),
	},
	{
		key: 'updatedAt',
		header: platformTexts.table.updatedAt,
		render: (report) => formatDateTime(report.updatedAt),
	},
]

export function PlatformPage() {
	const { user } = useSession()

	const [status, setStatus] = useState<ReportStatus | ''>('')
	const [locationPrefix, setLocationPrefix] = useState('')
	const [isFormOpen, setIsFormOpen] = useState(false)
	const [autofilled, setAutofilled] = useState<CreatedReport | null>(null)

	const { reports, isLoading, error, refetch } = useReports({
		status: status || undefined,
		locationPrefix: locationPrefix.trim() || undefined,
	})

	const hasFilters = status !== '' || locationPrefix.trim() !== ''

	function handleCreated(report: CreatedReport) {
		setIsFormOpen(false)
		// Nunca preenchimento silencioso: o aviso só some quando o usuário o
		// dispensa. Ver `platformTexts.autofill`.
		setAutofilled(report.planningAutofilled ? report : null)
		refetch()
	}

	return (
		<main className="platform">
			<PageHeader
				actions={
					<>
						<ThemeToggle />
						{isFormOpen ? null : (
							<UaButton leftIcon="add" onClick={() => setIsFormOpen(true)}>
								{platformTexts.newReport}
							</UaButton>
						)}
					</>
				}
				description={platformTexts.description}
				title={platformTexts.title}
			/>

			<div className="account">
				<span className="email">{user?.email}</span>
				<Link className="logout" to="/conta/logout">
					Sair
				</Link>
			</div>

			{autofilled ? (
				<UaAlert
					actionLabel={platformTexts.autofill.dismiss}
					appearance="warning"
					description={platformTexts.autofill.description}
					onActionClick={() => setAutofilled(null)}
					title={platformTexts.autofill.title}
				/>
			) : null}

			{isFormOpen ? (
				<CreateReportForm
					onCancel={() => setIsFormOpen(false)}
					onCreated={handleCreated}
				/>
			) : null}

			<fieldset className="filters">
				<legend className="visually-hidden">
					{platformTexts.filters.legend}
				</legend>

				<label className="filter">
					<span className="label">{platformTexts.filters.status}</span>
					<select
						className="select"
						onChange={(event) =>
							setStatus(event.target.value as ReportStatus | '')
						}
						value={status}
					>
						<option value="">{platformTexts.filters.anyStatus}</option>
						{Object.entries(reportStatusLabels).map(([value, label]) => (
							<option key={value} value={value}>
								{label}
							</option>
						))}
					</select>
				</label>

				<label className="filter">
					<span className="label">{platformTexts.filters.locationPrefix}</span>
					<input
						className="input"
						onChange={(event) =>
							setLocationPrefix(event.target.value.toUpperCase())
						}
						placeholder={platformTexts.filters.locationPrefixPlaceholder}
						value={locationPrefix}
					/>
				</label>

				{hasFilters ? (
					<UaButton
						appearance="ghost"
						onClick={() => {
							setStatus('')
							setLocationPrefix('')
						}}
						size="small"
						type="button"
					>
						{platformTexts.filters.clear}
					</UaButton>
				) : null}
			</fieldset>

			{error ? <UaAlert appearance="danger" description={error} /> : null}

			{isLoading ? (
				<div aria-busy="true" className="loading">
					<span className="visually-hidden">Carregando laudos…</span>
					<UaSkeleton height="56px" width="100%" />
					<UaSkeleton height="56px" width="100%" />
					<UaSkeleton height="56px" width="100%" />
				</div>
			) : (
				<UaTable
					caption={platformTexts.table.caption}
					columns={columns}
					emptyState={
						<div className="empty">
							<h2 className="title">{platformTexts.empty.title}</h2>
							<p className="description">
								{hasFilters
									? platformTexts.empty.filtered
									: platformTexts.empty.description}
							</p>
						</div>
					}
					rowKey={(report) => report.id}
					rows={reports}
				/>
			)}
		</main>
	)
}
