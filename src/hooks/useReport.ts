import { useCallback, useEffect, useRef, useState } from 'react'
import { getReport } from '../services/reports'
import type { ReportDetail } from '../services/types'
import { describeError } from './useReports'

interface UseReportResult {
	report: ReportDetail | null
	isLoading: boolean
	error: string | null
	/**
	 * Substitui o laudo em memória pela resposta de um `PATCH`.
	 *
	 * Toda rota de seção devolve o `ReportDetail` inteiro, já com `spare_circuits`
	 * recalculado — aproveitar isso poupa um `GET` por etapa do wizard e evita a
	 * janela em que a tela mostra o estado anterior.
	 */
	applyUpdate: (report: ReportDetail) => void
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

	return { report, isLoading, error, applyUpdate: setReport, refetch: load }
}
