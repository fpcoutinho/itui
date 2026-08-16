import { useCallback, useEffect, useState } from 'react'
import {
	type CircuitInput,
	createCircuit,
	deleteCircuit,
	updateCircuit,
} from '../services/circuits'
import type { Circuit } from '../services/types'
import { describeError } from './useReports'

interface UseCircuitsResult {
	circuits: Circuit[]
	isSubmitting: boolean
	error: string | null
	create: (input: CircuitInput) => Promise<boolean>
	update: (
		circuitId: string,
		changes: Partial<CircuitInput>,
	) => Promise<boolean>
	remove: (circuitId: string) => Promise<boolean>
}

interface UseCircuitsOptions {
	reportId: string
	/** Circuitos que vieram embutidos em `GET /reports/{id}` — sem round-trip extra. */
	initial: Circuit[]
	/**
	 * Chamado após qualquer mutação bem-sucedida.
	 *
	 * As rotas de circuito devolvem o `Circuit`, não o laudo — e `spare_circuits`
	 * é derivado da **quantidade** de circuitos. Sem revalidar o laudo, o espaço
	 * de reserva exigido continuaria mostrando o número de antes.
	 */
	onChanged: () => void
}

/** CRUD de circuitos, sem teto de quantidade (§5 Parte III). */
export function useCircuits({
	reportId,
	initial,
	onChanged,
}: UseCircuitsOptions): UseCircuitsResult {
	const [circuits, setCircuits] = useState<Circuit[]>(initial)
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		setCircuits(initial)
	}, [initial])

	const run = useCallback(
		async (action: () => Promise<void>) => {
			setIsSubmitting(true)
			setError(null)

			try {
				await action()
				onChanged()
				return true
			} catch (cause) {
				setError(describeError(cause))
				return false
			} finally {
				setIsSubmitting(false)
			}
		},
		[onChanged],
	)

	const create = useCallback(
		(input: CircuitInput) =>
			run(async () => {
				const circuit = await createCircuit(reportId, input)
				setCircuits((current) => [...current, circuit])
			}),
		[reportId, run],
	)

	const update = useCallback(
		(circuitId: string, changes: Partial<CircuitInput>) =>
			run(async () => {
				const circuit = await updateCircuit(reportId, circuitId, changes)
				setCircuits((current) =>
					current.map((item) => (item.id === circuitId ? circuit : item)),
				)
			}),
		[reportId, run],
	)

	const remove = useCallback(
		(circuitId: string) =>
			run(async () => {
				await deleteCircuit(reportId, circuitId)
				setCircuits((current) =>
					current.filter((item) => item.id !== circuitId),
				)
			}),
		[reportId, run],
	)

	return { circuits, isSubmitting, error, create, update, remove }
}
