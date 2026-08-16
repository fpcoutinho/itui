/**
 * Os cinco `PATCH` de seção.
 *
 * Cada rota recebe a **seção inteira e a substitui** — não é merge parcial. A
 * seção é a unidade de validação do backend: mandar campo solto grava (ou tenta
 * gravar) uma seção incompleta, que nenhum consumidor do laudo sabe interpretar.
 * Por isso as funções abaixo recebem a seção completa e tipada, nunca um
 * `Partial<>`.
 */

import { request } from './http'
import type {
	ExternalInfluences,
	InspectionPlanning,
	QualitativeAssessment,
	QuantitativeAssessment,
	ReportDetail,
	TipTapDocument,
} from './types'

const patchSection = <T>(
	reportId: string,
	path: string,
	section: T,
): Promise<ReportDetail> =>
	request<ReportDetail>(`/reports/${reportId}/${path}`, {
		method: 'PATCH',
		body: section,
	})

export const updateInspectionPlanning = (
	reportId: string,
	section: InspectionPlanning,
): Promise<ReportDetail> =>
	patchSection(reportId, 'inspection-planning', section)

export const updateExternalInfluences = (
	reportId: string,
	section: ExternalInfluences,
): Promise<ReportDetail> =>
	patchSection(reportId, 'external-influences', section)

export const updateQualitativeAssessment = (
	reportId: string,
	section: QualitativeAssessment,
): Promise<ReportDetail> =>
	patchSection(reportId, 'qualitative-assessment', section)

export const updateQuantitativeAssessment = (
	reportId: string,
	section: QuantitativeAssessment,
): Promise<ReportDetail> =>
	patchSection(reportId, 'quantitative-assessment', section)

/**
 * Única seção que nasce `{}` em vez de `null`.
 *
 * O corpo é a árvore do TipTap, cujas chaves são vocabulário do editor e não do
 * domínio. As chaves estruturais (`type`, `content`, `marks`, `text`) são
 * palavras únicas e atravessam a conversão de `case.ts` sem alteração, e o
 * conteúdo de `attrs` — onde moram os nomes compostos (`textAlign`, `colspan`)
 * — está em `OPAQUE_KEYS`, então também passa intacto.
 */
export const updateDocumentContent = (
	reportId: string,
	documentContent: TipTapDocument,
): Promise<ReportDetail> =>
	request<ReportDetail>(`/reports/${reportId}/document-content`, {
		method: 'PATCH',
		body: documentContent,
	})
