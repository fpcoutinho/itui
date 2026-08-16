import { useState } from 'react'
import { useLocation } from 'react-router'
import {
	type TableSort,
	UaAlert,
	UaInputField,
	UaPagination,
	UaSelect,
	UaSkeleton,
} from 'sanhaua/react'
import { ReportTable } from '../../components/features/ReportTable'
import { PageHeader } from '../../components/ui/PageHeader'
import { platformTexts, reportStatusLabels } from '../../content/platform'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { REPORTS_PAGE_SIZE, useReports } from '../../hooks/useReports'
import type {
	CreatedReport,
	ReportSortField,
	ReportStatus,
} from '../../services/types'
import './ReportsPage.scss'

const statusOptions = Object.entries(reportStatusLabels).map(
	([value, label]) => ({ value, label }),
)

/** Mesmo default do backend. Explicitado para a tabela nascer marcada nele. */
const DEFAULT_SORT: TableSort = { key: 'updated_at', direction: 'descending' }

export function ReportsPage() {
	const location = useLocation()
	const created = (location.state as { autofilled?: CreatedReport } | null)
		?.autofilled

	const [status, setStatus] = useState<ReportStatus | ''>('')
	const [search, setSearch] = useState('')
	const [sort, setSort] = useState<TableSort>(DEFAULT_SORT)
	const [offset, setOffset] = useState(0)
	const [autofilled, setAutofilled] = useState<CreatedReport | null>(
		created ?? null,
	)

	// O input responde a cada tecla; o GET só sai depois que o usuário parou.
	const debouncedSearch = useDebouncedValue(search.trim())

	const { reports, page, totalItems, totalPages, isLoading, error } =
		useReports({
			status: status || undefined,
			search: debouncedSearch || undefined,
			sort: sort.key as ReportSortField,
			order: sort.direction === 'ascending' ? 'asc' : 'desc',
			limit: REPORTS_PAGE_SIZE,
			offset,
		})

	const hasFilters = status !== '' || debouncedSearch !== ''

	// Filtro novo, ordem nova: a página 3 do recorte anterior não quer dizer nada
	// no recorte novo, e pode nem existir.
	function fromFirstPage(apply: () => void) {
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
					onChange={(value) =>
						fromFirstPage(() => setStatus(value as ReportStatus | ''))
					}
					options={statusOptions}
					placeholder={platformTexts.filters.anyStatus}
					size="small"
					value={status}
				/>

				<UaInputField
					aria-label={platformTexts.filters.search}
					icon="search"
					onChange={(event) =>
						fromFirstPage(() => setSearch(event.target.value))
					}
					placeholder={platformTexts.filters.searchPlaceholder}
					size="small"
					type="search"
					value={search}
				/>
			</div>

			{error ? <UaAlert appearance="danger" description={error} /> : null}

			{isLoading ? (
				<div aria-busy="true" className="report-loading">
					<span className="visually-hidden">{platformTexts.loading}</span>
					<UaSkeleton height="56px" width="100%" />
					<UaSkeleton height="56px" width="100%" />
					<UaSkeleton height="56px" width="100%" />
				</div>
			) : (
				<>
					<ReportTable
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
						onSortChange={(next) => fromFirstPage(() => setSort(next))}
						reports={reports}
						sort={sort}
					/>

					{totalPages > 1 ? (
						<UaPagination
							label={platformTexts.pagination.label}
							nextLabel={platformTexts.pagination.next}
							onPageChange={(next) => setOffset((next - 1) * REPORTS_PAGE_SIZE)}
							page={page}
							pageSize={REPORTS_PAGE_SIZE}
							previousLabel={platformTexts.pagination.previous}
							summary={platformTexts.pagination.range}
							total={totalItems}
						/>
					) : null}
				</>
			)}
		</>
	)
}
