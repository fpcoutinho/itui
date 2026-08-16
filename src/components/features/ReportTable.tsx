import { Link, useNavigate } from 'react-router'
import { type Column, type TableSort, UaBadge, UaTable } from 'sanhaua/react'
import { platformTexts, reportStatusLabels } from '../../content/platform'
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
	/**
	 * `key` é o nome do campo **no backend** — as colunas usam o vocabulário do
	 * `sort` da API, então o evento da tabela vai direto para a query, sem tradução
	 * no meio. Ver `ReportSortField` em `services/types.ts`.
	 */
	sort: TableSort
	onSortChange: (next: TableSort) => void
	emptyState: React.ReactNode
}

export function ReportTable({
	reports,
	sort,
	onSortChange,
	emptyState,
}: ReportTableProps) {
	const navigate = useNavigate()

	// A tabela não ordena nada: emite o evento e o backend devolve a página já
	// ordenada. Ordenar aqui classificaria só as linhas desta página.
	const columns: Column<ReportSummary>[] = [
		{
			key: 'location_code',
			header: platformTexts.table.locationCode,
			sortable: true,
			render: (report) => (
				<Link className="code" to={reportPath(report)}>
					{report.locationCode}
				</Link>
			),
		},
		{
			key: 'inspected_at',
			header: platformTexts.table.inspectedAt,
			sortable: true,
			render: (report) => formatDateTime(report.inspectedAt),
		},
		{
			key: 'status',
			header: platformTexts.table.status,
			sortable: true,
			render: (report) => (
				<UaBadge appearance={statusAppearance[report.status]}>
					{reportStatusLabels[report.status]}
				</UaBadge>
			),
		},
		{
			key: 'updated_at',
			header: platformTexts.table.updatedAt,
			sortable: true,
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
			onSortChange={onSortChange}
			rowBehavior="interactive"
			rowKey={(report) => report.id}
			rows={reports}
			sort={sort}
		/>
	)
}
