import { useCallback, useState } from 'react'
import { type CreateReportInput, createReport } from '../services/reports'
import type { CreatedReport } from '../services/types'
import { describeError } from './useReports'

interface UseCreateReportResult {
	create: (input: CreateReportInput) => Promise<CreatedReport | null>
	isSubmitting: boolean
	error: string | null
	/** Última criação bem-sucedida — é onde vive o aviso de auto-preenchimento. */
	created: CreatedReport | null
	reset: () => void
}

export function useCreateReport(): UseCreateReportResult {
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [created, setCreated] = useState<CreatedReport | null>(null)

	const create = useCallback(async (input: CreateReportInput) => {
		setIsSubmitting(true)
		setError(null)

		try {
			const report = await createReport(input)
			setCreated(report)
			return report
		} catch (cause) {
			setError(describeError(cause))
			return null
		} finally {
			setIsSubmitting(false)
		}
	}, [])

	const reset = useCallback(() => {
		setCreated(null)
		setError(null)
	}, [])

	return { create, isSubmitting, error, created, reset }
}
