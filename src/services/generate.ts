/**
 * `POST /reports/{id}/generate` — redação por IA, em SSE.
 *
 * Único cliente HTTP do repositório fora do `request()` de `http.ts`, e por um
 * motivo estrutural: `request()` lê a resposta inteira antes de devolver, e o
 * ponto aqui é justamente consumi-la enquanto ela chega.
 *
 * **Por que não `EventSource`**: a API nativa só faz `GET` (não há como mandar
 * `image_ids` no corpo) e não aceita header customizado (não há como mandar
 * `Authorization`). A saída comum — token na query string — está descartada:
 * query string vaza em log de servidor, de proxy e no histórico do navegador.
 *
 * **Por que `fetch` + `ReadableStream` e não `@microsoft/fetch-event-source`**:
 * a lib entrega reconexão automática, que aqui é um defeito e não um recurso —
 * retentar com o stream já aberto duplicaria o texto entregue ao editor, e o
 * próprio contrato diz que falha depois da abertura é terminal. Usá-la exigiria
 * desligar a reconexão com um `throw` no `onerror`; o protocolo cabe em 30
 * linhas e não paga uma dependência para depois ser neutralizada.
 */

import type { DocumentSection } from '../domain/reportDocument'
import {
	ApiError,
	apiUrl,
	getAuthHandlers,
	NetworkError,
	parseError,
} from './http'

/** Motivo do encerramento. `"length"` é redação **truncada**, não conclusão. */
export type FinishReason = 'stop' | 'length' | (string & {})

export interface GenerationHandlers {
	/** Um trecho de prosa da seção. Vem muitas vezes por seção. */
	onToken: (section: DocumentSection, text: string) => void
	/** Fim normal do stream. `totalTokens` é opcional — nem todo provedor reporta. */
	onDone: (finishReason: FinishReason, totalTokens?: number) => void
}

export interface GenerationOptions extends GenerationHandlers {
	/** Ausente = todas as imagens confirmadas do laudo. */
	imageIds?: string[]
	signal?: AbortSignal
}

interface ServerEvent {
	name: string
	data: string
}

/**
 * Um evento SSE termina em linha em branco; o que sobrar fica no buffer
 * esperando o próximo chunk, porque um chunk pode cortar um evento ao meio.
 *
 * `data:` pode aparecer em linhas múltiplas no protocolo — são concatenadas com
 * `\n`, e não a última vencendo a anterior.
 */
function parseEvent(raw: string): ServerEvent | null {
	let name = 'message'
	const dataLines: string[] = []

	for (const line of raw.split(/\r?\n/)) {
		if (line.startsWith(':')) {
			// Comentário/keep-alive do protocolo.
			continue
		}

		const separator = line.indexOf(':')
		const field = separator === -1 ? line : line.slice(0, separator)
		const value =
			separator === -1 ? '' : line.slice(separator + 1).replace(/^ /, '')

		if (field === 'event') {
			name = value
		} else if (field === 'data') {
			dataLines.push(value)
		}
	}

	return dataLines.length === 0 ? null : { name, data: dataLines.join('\n') }
}

async function openStream(
	reportId: string,
	imageIds: string[] | undefined,
	signal: AbortSignal | undefined,
	accessToken: string | null,
): Promise<Response> {
	const headers: Record<string, string> = {
		Accept: 'text/event-stream',
		'Content-Type': 'application/json',
	}

	if (accessToken !== null) {
		headers.Authorization = `Bearer ${accessToken}`
	}

	try {
		return await fetch(apiUrl(`/reports/${reportId}/generate`), {
			method: 'POST',
			headers,
			credentials: 'include',
			// `image_ids` já é o nome do fio: este corpo não passa pelo `toSnakeCase`
			// do `request()`, então é escrito na forma final.
			body: JSON.stringify(imageIds ? { image_ids: imageIds } : {}),
			signal,
		})
	} catch (cause) {
		if (cause instanceof DOMException && cause.name === 'AbortError') {
			throw cause
		}

		throw new NetworkError(cause)
	}
}

/**
 * Abre o stream e entrega os eventos até o `done`.
 *
 * Erros **antes** do primeiro byte (`401`, `404`, `422` de laudo vazio, `503`
 * de provedor fora do ar) ainda são resposta HTTP comum, com o envelope
 * `{ "error": ... }` de sempre — viram `ApiError`, igual ao resto da API.
 * Depois que o stream abriu, o status já foi enviado: falha vira `event: error`
 * e sobe como `ApiError` de status `0`, para que quem chama saiba que o
 * documento já pode ter recebido parte da prosa.
 */
export async function generateReport(
	reportId: string,
	{ imageIds, signal, onToken, onDone }: GenerationOptions,
): Promise<void> {
	const handlers = getAuthHandlers()

	let response = await openStream(
		reportId,
		imageIds,
		signal,
		handlers?.getAccessToken() ?? null,
	)

	// Mesma política do `request()`: um refresh, uma repetição. O stream ainda
	// não emitiu nada, então repetir aqui não duplica texto.
	if (response.status === 401 && handlers) {
		const renewed = await handlers.refresh()

		if (!renewed) {
			handlers.onSessionExpired()
			throw await parseError(response)
		}

		response = await openStream(
			reportId,
			imageIds,
			signal,
			handlers.getAccessToken(),
		)
	}

	if (!response.ok || response.body === null) {
		throw await parseError(response)
	}

	const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
	let buffer = ''

	try {
		while (true) {
			const { done, value } = await reader.read()

			if (done) {
				return
			}

			buffer += value

			let separator = buffer.search(/\r?\n\r?\n/)

			while (separator !== -1) {
				const match = buffer.slice(separator).match(/^\r?\n\r?\n/)
				const raw = buffer.slice(0, separator)
				buffer = buffer.slice(separator + (match?.[0].length ?? 2))

				const event = parseEvent(raw)

				if (event !== null) {
					const payload: unknown = JSON.parse(event.data)

					if (event.name === 'token') {
						const { section, text } = payload as {
							section: DocumentSection
							text: string
						}
						onToken(section, text)
					} else if (event.name === 'error') {
						const { error } = payload as { error: string }
						throw new ApiError(error, 0)
					} else if (event.name === 'done') {
						const { finish_reason, total_tokens } = payload as {
							finish_reason: FinishReason
							total_tokens?: number
						}
						onDone(finish_reason, total_tokens)
						return
					}
				}

				separator = buffer.search(/\r?\n\r?\n/)
			}
		}
	} finally {
		// Fecha a conexão em qualquer saída — inclusive `done` no meio do buffer,
		// cancelamento e exceção.
		await reader.cancel().catch(() => undefined)
	}
}
