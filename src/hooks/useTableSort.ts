import { useMemo, useState } from 'react'
import type { TableSort } from 'sanhaua/react'

interface UseTableSortResult<Row> {
	sort: TableSort
	setSort: (next: TableSort) => void
	sorted: Row[]
}

export function useTableSort<Row>(
	rows: Row[],
	initial: TableSort,
	value: (row: Row, key: string) => string | number,
): UseTableSortResult<Row> {
	const [sort, setSort] = useState<TableSort>(initial)

	const sorted = useMemo(() => {
		const factor = sort.direction === 'ascending' ? 1 : -1

		return [...rows].sort((a, b) => {
			const left = value(a, sort.key)
			const right = value(b, sort.key)

			if (typeof left === 'number' && typeof right === 'number') {
				return (left - right) * factor
			}

			return String(left).localeCompare(String(right), 'pt-BR') * factor
		})
	}, [rows, sort, value])

	return { sort, setSort, sorted }
}
