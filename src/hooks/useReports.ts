import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, NetworkError } from '../services/http'
import { type ListReportsParams, listReports } from '../services/reports'
import type { ReportSummary } from '../services/types'

/** Default do backend para `limit`. Explicitado aqui para a paginação da UI. */
export const REPORTS_PAGE_SIZE = 20

interface UseReportsResult {
	reports: ReportSummary[]
	isLoading: boolean
	error: string | null
	/** Revalida a lista — usar depois de criar ou apagar um laudo. */
	refetch: () => void
}

/**
 * Lista os laudos do usuário.
 *
 * Sem biblioteca de cache: no volume atual (uma listagem e um wizard) o custo de
 * uma dependência a mais não se paga.
 */
export function useReports(params: ListReportsParams = {}): UseReportsResult {
	const [reports, setReports] = useState<ReportSummary[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const { status, locationPrefix, limit, offset } = params

	// Uma busca em voo por vez: trocar de filtro (ou revalidar) cancela a
	// anterior, senão uma resposta lenta pode chegar depois e sobrescrever a nova.
	const controllerRef = useRef<AbortController | null>(null)

	const load = useCallback(() => {
		controllerRef.current?.abort()

		const controller = new AbortController()
		controllerRef.current = controller

		setIsLoading(true)
		setError(null)

		listReports({ status, locationPrefix, limit, offset }, controller.signal)
			.then((result) => {
				setReports(result)
				setIsLoading(false)
			})
			.catch((cause: unknown) => {
				// Cancelamento por troca de filtro ou desmonte não é erro.
				if (controller.signal.aborted) {
					return
				}

				setError(describeError(cause))
				setIsLoading(false)
			})
	}, [status, locationPrefix, limit, offset])

	useEffect(() => {
		load()

		return () => {
			controllerRef.current?.abort()
		}
	}, [load])

	return { reports, isLoading, error, refetch: load }
}

/** `ApiError.message` já vem em pt-BR e exibível — ver `parseError` em `http.ts`. */
export function describeError(cause: unknown): string {
	if (cause instanceof ApiError || cause instanceof NetworkError) {
		return cause.message
	}

	console.error('[api] erro inesperado:', cause)
	return 'Algo deu errado. Tente novamente.'
}
