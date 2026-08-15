import { useCallback } from 'react'
import { Link, useNavigate } from 'react-router'
import { type Column, type TableSort, UaBadge, UaTable } from 'sanhaua/react'
import { platformTexts, reportStatusLabels } from '../../content/platform'
import { useTableSort } from '../../hooks/useTableSort'
import type { ReportStatus, ReportSummary } from '../../services/types'
import './ReportTable.scss'

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
	dateStyle: 'short',
	timeStyle: 'short',
})

const formatDateTime = (iso: string) => dateFormatter.format(new Date(iso))

const statusAppearance: Record<
	ReportStatus,
	'neutral' | 'informative' | 'success'
> = {
	draft: 'neutral',
	in_review: 'informative',
	approved: 'success',
	archived: 'neutral',
}

const reportPath = (report: ReportSummary) =>
	`/plataforma/relatorios/${report.id}`

interface ReportTableProps {
	reports: ReportSummary[]
	canSort: boolean
	emptyState: React.ReactNode
}

export function ReportTable({ reports, canSort, emptyState }: ReportTableProps) {
	const navigate = useNavigate()

	const valueOf = useCallback((report: ReportSummary, key: string) => {
		if (key === 'locationCode') {
			return report.locationCode
		}

		return key === 'inspectedAt' ? report.inspectedAt : report.updatedAt
	}, [])

	const { sort, setSort, sorted } = useTableSort<ReportSummary>(
		reports,
		{ key: 'updatedAt', direction: 'descending' },
		valueOf,
	)

	const columns: Column<ReportSummary>[] = [
		{
			key: 'locationCode',
			header: platformTexts.table.locationCode,
			sortable: canSort,
			render: (report) => (
				<Link className="code" to={reportPath(report)}>
					{report.locationCode}
				</Link>
			),
		},
		{
			key: 'inspectedAt',
			header: platformTexts.table.inspectedAt,
			sortable: canSort,
			render: (report) => formatDateTime(report.inspectedAt),
		},
		{
			key: 'status',
			header: platformTexts.table.status,
			render: (report) => (
				<UaBadge appearance={statusAppearance[report.status]}>
					{reportStatusLabels[report.status]}
				</UaBadge>
			),
		},
		{
			key: 'updatedAt',
			header: platformTexts.table.updatedAt,
			sortable: canSort,
			render: (report) => formatDateTime(report.updatedAt),
		},
	]

	return (
		<UaTable
			caption={platformTexts.table.caption}
			className="report-table"
			columns={columns}
			emptyState={emptyState}
			onRowClick={(report) => navigate(reportPath(report))}
			onSortChange={canSort ? (next: TableSort) => setSort(next) : undefined}
			rowBehavior="interactive"
			rowKey={(report) => report.id}
			rows={sorted}
			sort={canSort ? sort : null}
		/>
	)
}
