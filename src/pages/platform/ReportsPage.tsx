import { useState } from 'react'
import { useLocation } from 'react-router'
import {
	UaAlert,
	UaInputField,
	UaPagination,
	UaSelect,
	UaSkeleton,
} from 'sanhaua/react'
import { ReportTable } from '../../components/features/ReportTable'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { PageHeader } from '../../components/ui/PageHeader'
import { platformTexts, reportStatusLabels } from '../../content/platform'
import { useReports } from '../../hooks/useReports'
import type { CreatedReport, ReportStatus } from '../../services/types'
import './ReportsPage.scss'

const PAGE_SIZE = 100

const statusOptions = Object.entries(reportStatusLabels).map(
	([value, label]) => ({ value, label }),
)

export function ReportsPage() {
	const location = useLocation()
	const created = (location.state as { autofilled?: CreatedReport } | null)
		?.autofilled

	const [status, setStatus] = useState<ReportStatus | ''>('')
	const [locationPrefix, setLocationPrefix] = useState('')
	const [offset, setOffset] = useState(0)
	const [autofilled, setAutofilled] = useState<CreatedReport | null>(
		created ?? null,
	)

	const { reports, isLoading, error } = useReports({
		status: status || undefined,
		locationPrefix: locationPrefix.trim() || undefined,
		limit: PAGE_SIZE,
		offset,
	})

	const hasFilters = status !== '' || locationPrefix.trim() !== ''
	const isPaginated = offset > 0 || reports.length === PAGE_SIZE

	function changeFilter(apply: () => void) {
		apply()
		setOffset(0)
	}

	return (
		<>
			<PageHeader
				description={platformTexts.description}
				title={platformTexts.title}
			/>

			{autofilled ? (
				<UaAlert
					actionLabel={platformTexts.autofill.dismiss}
					appearance="warning"
					description={platformTexts.autofill.description}
					onActionClick={() => setAutofilled(null)}
					title={platformTexts.autofill.title}
				/>
			) : null}

			<div className="report-filters">
				<UaSelect
					aria-label={platformTexts.filters.status}
					icon="filter_list"
					onChange={(event) =>
						changeFilter(() => setStatus(event.target.value as ReportStatus | ''))
					}
					options={statusOptions}
					placeholder={platformTexts.filters.anyStatus}
					size="small"
					value={status}
				/>

				<UaInputField
					aria-label={platformTexts.filters.locationPrefix}
					icon="search"
					onChange={(event) =>
						changeFilter(() =>
							setLocationPrefix(event.target.value.toUpperCase()),
						)
					}
					placeholder={platformTexts.filters.locationPrefixPlaceholder}
					size="small"
					value={locationPrefix}
				/>
			</div>

			{error ? <UaAlert appearance="danger" description={error} /> : null}

			{isLoading ? (
				<div aria-busy="true" className="report-loading">
					<span className="visually-hidden">Carregando laudos…</span>
					<UaSkeleton height="56px" width="100%" />
					<UaSkeleton height="56px" width="100%" />
					<UaSkeleton height="56px" width="100%" />
				</div>
			) : (
				<>
					<ReportTable
						canSort={!isPaginated}
						emptyState={
							<div className="report-empty">
								<h2 className="title">{platformTexts.empty.title}</h2>
								<p className="description">
									{hasFilters
										? platformTexts.empty.filtered
										: platformTexts.empty.description}
								</p>
							</div>
						}
						reports={reports}
					/>

					{isPaginated ? (
						<>
							<UaPagination
								count={reports.length}
								label={platformTexts.pagination.label}
								nextLabel={platformTexts.pagination.next}
								onPageChange={(next) => setOffset((next - 1) * PAGE_SIZE)}
								page={offset / PAGE_SIZE + 1}
								pageSize={PAGE_SIZE}
								previousLabel={platformTexts.pagination.previous}
								summary={platformTexts.pagination.range}
							/>
							<p className="report-sort-hint">
								{platformTexts.sort.paginatedHint}
							</p>
						</>
					) : null}
				</>
			)}
		</>
	)
}
