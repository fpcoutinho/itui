/**
 * Circuitos do quadro de distribuição (§5 Parte III).
 *
 * Sem limite de quantidade: o teto de 13 do legado era restrição das linhas
 * fixas do `template.docx`, não do domínio.
 */

import { request } from './http'
import type { Circuit, Decimal } from './types'

export interface CircuitInput {
	circuitModel: string
	phase: string
	breaker: string
	/** Único campo opcional. `null` explícito limpa o valor num `PATCH`. */
	description?: string | null
	conductor: string
	/** Decimal em string (`"12.40"`) — nunca `number`. */
	current: Decimal
}

export const listCircuits = (
	reportId: string,
	signal?: AbortSignal,
): Promise<Circuit[]> =>
	request<Circuit[]>(`/reports/${reportId}/circuits`, { signal })

export const createCircuit = (
	reportId: string,
	input: CircuitInput,
): Promise<Circuit> =>
	request<Circuit>(`/reports/${reportId}/circuits`, {
		method: 'POST',
		body: input,
	})

/**
 * Campo ausente fica inalterado. Só `description` aceita `null` explícito para
 * limpar — os obrigatórios não voltam a ficar vazios.
 */
export const updateCircuit = (
	reportId: string,
	circuitId: string,
	changes: Partial<CircuitInput>,
): Promise<Circuit> =>
	request<Circuit>(`/reports/${reportId}/circuits/${circuitId}`, {
		method: 'PATCH',
		body: changes,
	})

export const deleteCircuit = (
	reportId: string,
	circuitId: string,
): Promise<void> =>
	request<void>(`/reports/${reportId}/circuits/${circuitId}`, {
		method: 'DELETE',
	})
