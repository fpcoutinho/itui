import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, NetworkError } from '../services/http'
import { type ListReportsParams, listReports } from '../services/reports'
import type { ReportPage, ReportSummary } from '../services/types'

/** Default do backend para `limit`. Explicitado aqui para a paginação da UI. */
export const REPORTS_PAGE_SIZE = 20

interface UseReportsResult {
	reports: ReportSummary[]
	/** 1-based. `0` enquanto a primeira resposta não chegou. */
	page: number
	totalItems: number
	totalPages: number
	isLoading: boolean
	error: string | null
	/** Revalida a lista — usar depois de criar ou apagar um laudo. */
	refetch: () => void
}

const EMPTY_PAGE: ReportPage = {
	items: [],
	page: 0,
	pageSize: REPORTS_PAGE_SIZE,
	totalItems: 0,
	totalPages: 0,
}

/**
 * Lista os laudos do usuário.
 *
 * Sem biblioteca de cache: no volume atual (uma listagem e um wizard) o custo de
 * uma dependência a mais não se paga.
 */
export function useReports(params: ListReportsParams = {}): UseReportsResult {
	const [page, setPage] = useState<ReportPage>(EMPTY_PAGE)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const { status, locationPrefix, search, sort, order, limit, offset } = params

	// Uma busca em voo por vez: trocar de filtro (ou revalidar) cancela a
	// anterior, senão uma resposta lenta pode chegar depois e sobrescrever a nova.
	const controllerRef = useRef<AbortController | null>(null)

	const load = useCallback(() => {
		controllerRef.current?.abort()

		const controller = new AbortController()
		controllerRef.current = controller

		setIsLoading(true)
		setError(null)

		listReports(
			{ status, locationPrefix, search, sort, order, limit, offset },
			controller.signal,
		)
			.then((result) => {
				setPage(result)
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
	}, [status, locationPrefix, search, sort, order, limit, offset])

	useEffect(() => {
		load()

		return () => {
			controllerRef.current?.abort()
		}
	}, [load])

	return {
		reports: page.items,
		page: page.page,
		totalItems: page.totalItems,
		totalPages: page.totalPages,
		isLoading,
		error,
		refetch: load,
	}
}

/** `ApiError.message` já vem em pt-BR e exibível — ver `parseError` em `http.ts`. */
export function describeError(cause: unknown): string {
	if (cause instanceof ApiError || cause instanceof NetworkError) {
		return cause.message
	}

	console.error('[api] erro inesperado:', cause)
	return 'Algo deu errado. Tente novamente.'
}
