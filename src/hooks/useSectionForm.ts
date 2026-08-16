import { useCallback, useEffect, useState } from 'react'
import { type Draft, type Field, missingFields } from '../domain/reportSchema'
import { toWireDecimal } from '../services/decimal'
import type { ReportDetail } from '../services/types'
import { describeError } from './useReports'

interface UseSectionFormOptions<T extends object> {
	fields: readonly Field<keyof T>[]
	/** Seção já gravada, ou `null` quando a etapa ainda não foi concluída. */
	initial: T | null
	/** O `PATCH` da seção. Substitui a seção inteira — ver `services/sections.ts`. */
	submit: (section: T) => Promise<ReportDetail>
	onSaved: (report: ReportDetail) => void
}

interface UseSectionFormResult<T extends object> {
	draft: Draft<T>
	setField: <K extends keyof T>(key: K, value: T[K]) => void
	/** Chaves ainda vazias, na ordem do schema. */
	missing: (keyof T)[]
	/** `true` depois de uma tentativa de salvar com a seção incompleta. */
	showErrors: boolean
	isDirty: boolean
	isSubmitting: boolean
	error: string | null
	/** `true` se a seção foi enviada; `false` se faltava campo (e marca os erros). */
	save: () => Promise<boolean>
}

/**
 * Estado de uma etapa do wizard.
 *
 * Só submete quando a seção está **completa**: o `PATCH` substitui a seção
 * inteira, e o backend valida a seção como unidade. Mandar o que já foi
 * preenchido "para não perder" gravaria uma seção que nenhum consumidor do
 * laudo sabe ler — é justamente o que a regra de substituição integral impede.
 */
export function useSectionForm<T extends object>({
	fields,
	initial,
	submit,
	onSaved,
}: UseSectionFormOptions<T>): UseSectionFormResult<T> {
	const [draft, setDraft] = useState<Draft<T>>(() => initial ?? {})
	const [isDirty, setIsDirty] = useState(false)
	const [showErrors, setShowErrors] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// Recarregar o laudo (ou concluir outra etapa) traz a seção do servidor: o
	// rascunho local volta a espelhá-la, exceto se o usuário já digitou algo —
	// nesse caso descartar seria perder trabalho.
	useEffect(() => {
		if (!isDirty) {
			setDraft(initial ?? {})
		}
	}, [initial, isDirty])

	const setField = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
		setIsDirty(true)
		setDraft((current) => ({ ...current, [key]: value }))
	}, [])

	const missing = missingFields(fields, draft)

	const save = useCallback(async () => {
		const pending = missingFields(fields, draft)

		if (pending.length > 0) {
			setShowErrors(true)
			return false
		}

		setIsSubmitting(true)
		setError(null)

		try {
			const report = await submit(serialize(fields, draft))
			setIsDirty(false)
			setShowErrors(false)
			onSaved(report)
			return true
		} catch (cause) {
			setError(describeError(cause))
			return false
		} finally {
			setIsSubmitting(false)
		}
	}, [draft, fields, onSaved, submit])

	return {
		draft,
		setField,
		missing,
		showErrors,
		isDirty,
		isSubmitting,
		error,
		save,
	}
}

/**
 * Rascunho → corpo do `PATCH`.
 *
 * O único ajuste é o decimal: o campo guarda o que foi digitado (`"12,40"`) e o
 * fio exige ponto (`"12.40"`). A conversão é textual, sem passar por `number` —
 * `numeric` no Postgres e `Decimal` no Rust existem para não perder precisão, e
 * um `parseFloat` aqui desfaria a garantia no último metro.
 */
function serialize<T extends object>(
	fields: readonly Field<keyof T>[],
	draft: Draft<T>,
): T {
	const body = { ...draft } as Record<string, unknown>

	for (const field of fields) {
		if (field.kind !== 'decimal') {
			continue
		}

		const typed = draft[field.key]

		if (typeof typed === 'string') {
			// `isFieldFilled` já garantiu o formato; o `?? typed` é só para não
			// silenciar um valor caso as duas regras divirjam no futuro.
			body[field.key as string] = toWireDecimal(typed) ?? typed
		}
	}

	return body as T
}
