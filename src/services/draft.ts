/**
 * `GET /reports/{id}/draft` — o modelo determinístico do laudo.
 *
 * É o **piso do sistema**: monta o documento inteiro (todas as tabelas, todos
 * os dados) sem depender de provedor de IA nenhum. A prosa do `/generate` é
 * acréscimo em cima disto, nunca substituição — ver `services/generate.ts`.
 */

import { request } from './http'

interface DraftResponse {
	/** Markdown, com um `##` por seção na ordem canônica. */
	text: string
}

/**
 * `imageIds` ausente = todas as imagens confirmadas com achado. Passar a lista
 * vazia **não** é o mesmo que omitir: seria pedir um documento sem imagem
 * nenhuma, e é por isso que ela é omitida da query quando vazia.
 */
export async function getReportDraft(
	reportId: string,
	imageIds?: string[],
	signal?: AbortSignal,
): Promise<string> {
	const { text } = await request<DraftResponse>(`/reports/${reportId}/draft`, {
		query: {
			image_ids:
				imageIds && imageIds.length > 0 ? imageIds.join(',') : undefined,
		},
		signal,
	})

	return text
}
