import { useCallback, useEffect, useRef, useState } from 'react'
import { getReport } from '../services/reports'
import type { Report, ReportDetail } from '../services/types'
import { describeError } from './useReports'

interface UseReportResult {
	report: ReportDetail | null
	isLoading: boolean
	error: string | null
	/**
	 * Aplica a resposta de um `PATCH` **por cima** do laudo em memória.
	 *
	 * As rotas de `PATCH` devolvem `Report`, não `ReportDetail`: `circuits` e
	 * `spare_circuits` são montados só pelo `GET /reports/{id}`. Substituir o
	 * objeto inteiro apagava os dois, e a primeira leitura de `report.circuits`
	 * — o `stepStatus` do wizard, em pleno render — derrubava a árvore do React
	 * inteira, deixando a tela em branco até o F5.
	 *
	 * Mesclar é correto porque nenhuma dessas rotas mexe em circuito: quem mexe
	 * é `useCircuits`, e ele dispara `refetch`.
	 */
	applyUpdate: (report: Report) => void
	refetch: () => void
}

/** Laudo completo: seções e circuitos embutidos. Imagens vêm de rota própria. */
export function useReport(reportId: string | undefined): UseReportResult {
	const [report, setReport] = useState<ReportDetail | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const controllerRef = useRef<AbortController | null>(null)

	const load = useCallback(() => {
		if (reportId === undefined) {
			return
		}

		controllerRef.current?.abort()

		const controller = new AbortController()
		controllerRef.current = controller

		setIsLoading(true)
		setError(null)

		getReport(reportId, controller.signal)
			.then((result) => {
				setReport(result)
				setIsLoading(false)
			})
			.catch((cause: unknown) => {
				if (controller.signal.aborted) {
					return
				}

				setError(describeError(cause))
				setIsLoading(false)
			})
	}, [reportId])

	useEffect(() => {
		load()

		return () => {
			controllerRef.current?.abort()
		}
	}, [load])

	const applyUpdate = useCallback((updated: Report) => {
		setReport((current) =>
			current === null ? null : { ...current, ...updated },
		)
	}, [])

	return { report, isLoading, error, applyUpdate, refetch: load }
}
