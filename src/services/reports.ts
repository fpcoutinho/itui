import { request } from './http'
import type {
	CreatedReport,
	ReportDetail,
	ReportPage,
	ReportSortField,
	ReportStatus,
	SortOrder,
} from './types'

/**
 * `location_code` segue o padrão `BLOCO-SALA` (`CCHLA-102`, `CI-T02`).
 *
 * Validar aqui evita um round-trip óbvio, mas **não** substitui o `422` do
 * backend: a regra de verdade é dele, e a mensagem dele é a que vai à tela.
 */
export const LOCATION_CODE_PATTERN = /^[A-Z]{2,}-[A-Z]{0,}[0-9]{2,}$/

export interface ListReportsParams {
	status?: ReportStatus
	/** Filtra pelo bloco: `CCHLA` casa `CCHLA-102` e `CCHLA-205`. */
	locationPrefix?: string
	/** Busca livre: trecho do código do local ou de um responsável. */
	search?: string
	/** Backend ordena; `updated_at` + `desc` é o default de lá. */
	sort?: ReportSortField
	order?: SortOrder
	/** 1..100. O backend usa 20 quando ausente. */
	limit?: number
	offset?: number
}

/**
 * Lista os laudos do usuário autenticado.
 *
 * Filtro, busca e ordenação são **do backend**: a resposta é uma página, e
 * ordenar em memória classificaria só as linhas dela. Os itens vêm **sem as
 * seções JSONB** — para as seções, buscar o laudo individual.
 */
export function listReports(
	params: ListReportsParams = {},
	signal?: AbortSignal,
): Promise<ReportPage> {
	return request<ReportPage>('/reports', {
		query: {
			status: params.status,
			location_prefix: params.locationPrefix,
			search: params.search,
			sort: params.sort,
			order: params.order,
			limit: params.limit,
			offset: params.offset,
		},
		signal,
	})
}

export interface CreateReportInput {
	locationCode: string
	/** ISO-8601 em UTC. */
	inspectedAt: string
	ambientTemperatureC?: number | null
	weatherConditions?: string | null
	responsibleParties?: string[]
}

/**
 * Cria o laudo com os campos de identidade (§1). As seções nascem vazias.
 *
 * A resposta pode vir com `planningAutofilled: true`, quando o autor já tem um
 * laudo no mesmo bloco com planejamento preenchido e a seção inteira foi
 * copiada do mais recente. Quem chama **precisa** avisar o usuário — ver
 * `CreatedReport` em `types.ts`.
 */
export function createReport(input: CreateReportInput): Promise<CreatedReport> {
	return request<CreatedReport>('/reports', { method: 'POST', body: input })
}

/** Laudo completo, com as seções e os circuitos embutidos. Imagens não vêm junto. */
export function getReport(
	reportId: string,
	signal?: AbortSignal,
): Promise<ReportDetail> {
	return request<ReportDetail>(`/reports/${reportId}`, { signal })
}

/**
 * Edita os campos de identidade e o `status`.
 *
 * Campo ausente fica inalterado; `null` explícito limpa o valor (só nos
 * opcionais).
 */
export function updateReport(
	reportId: string,
	changes: Partial<CreateReportInput> & { status?: ReportStatus },
): Promise<ReportDetail> {
	return request<ReportDetail>(`/reports/${reportId}`, {
		method: 'PATCH',
		body: changes,
	})
}

export function deleteReport(reportId: string): Promise<void> {
	return request<void>(`/reports/${reportId}`, { method: 'DELETE' })
}
