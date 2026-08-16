/**
 * Imagens do laudo — fluxo de duas etapas com URL pré-assinada.
 *
 * O arquivo **não** passa pelo `raijin`: o navegador pede uma URL de escrita,
 * faz `PUT` direto no bucket e só então avisa o backend. Nenhum SDK de storage
 * entra no frontend, o que mantém o `itui` portável entre provedores.
 */

import { ApiError, NetworkError, request } from './http'
import type { FindingCategory, ReportImage, ReportSection } from './types'

/** Formatos aceitos pelo backend; qualquer outro é `422`. */
export const ACCEPTED_IMAGE_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'image/heic',
] as const

export const isAcceptedImageType = (contentType: string): boolean =>
	(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(contentType)

export interface CreateImageInput {
	contentType: string
	/**
	 * Slug de `docs/findings-taxonomy.md` — que não conformidade a foto mostra.
	 * Eixo **independente** de `reportSection`: uma foto pode ter os dois, só um,
	 * ou nenhum.
	 */
	findingCategory?: FindingCategory | null
	/** Seção que a foto ilustra. Ausente = foto geral, cai no apêndice do documento. */
	reportSection?: ReportSection | null
	caption?: string | null
}

/** Resposta do `POST /images`: três campos, e só eles. */
export interface ImageUploadTicket {
	imageId: string
	/** Vale 15 minutos. */
	uploadUrl: string
	/** O `PUT` precisa mandar exatamente este `Content-Type` — a assinatura o cobre. */
	requiredContentType: string
}

export const createImage = (
	reportId: string,
	input: CreateImageInput,
): Promise<ImageUploadTicket> =>
	request<ImageUploadTicket>(`/reports/${reportId}/images`, {
		method: 'POST',
		body: input,
	})

/**
 * Confirma o upload contra o bucket. **Sem corpo** — o `image_id` vai na URL, e
 * o `storage_path` nunca sai do cliente: o servidor não confia em referência de
 * objeto vinda de fora, faz `HEAD` no bucket e grava o que leu de lá.
 *
 * É idempotente: confirmar de novo devolve o mesmo objeto com uma `view_url`
 * nova.
 */
export const confirmImage = (
	reportId: string,
	imageId: string,
): Promise<ReportImage> =>
	request<ReportImage>(`/reports/${reportId}/images/${imageId}/confirm`, {
		method: 'POST',
	})

/** Cada item traz `view_url`, `null` enquanto `pending`. A URL vence em 5 minutos. */
export const listImages = (
	reportId: string,
	signal?: AbortSignal,
): Promise<ReportImage[]> =>
	request<ReportImage[]>(`/reports/${reportId}/images`, { signal })

/**
 * `PUT` do arquivo direto no bucket.
 *
 * Fora do `request()` de propósito: o destino é outro host, não leva
 * `Authorization` nem cookie (`credentials: 'omit'` — mandar credencial para um
 * bucket assinado é vazamento sem ganho), e a resposta não é o envelope de erro
 * do `raijin`.
 *
 * `XMLHttpRequest` em vez de `fetch` porque é a única API que reporta progresso
 * de **upload** no navegador; `fetch` com `ReadableStream` de request ainda não
 * é opção interoperável.
 */
export function uploadImageToBucket(
	ticket: ImageUploadTicket,
	file: File,
	options: { onProgress?: (ratio: number) => void; signal?: AbortSignal } = {},
): Promise<void> {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest()

		xhr.open('PUT', ticket.uploadUrl, true)
		// Divergir aqui resulta em 403 do storage: a assinatura cobre este header.
		xhr.setRequestHeader('Content-Type', ticket.requiredContentType)

		xhr.upload.addEventListener('progress', (event) => {
			if (event.lengthComputable) {
				options.onProgress?.(event.loaded / event.total)
			}
		})

		xhr.addEventListener('load', () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				options.onProgress?.(1)
				resolve()
				return
			}

			// O corpo aqui é XML de erro do S3, não o envelope do raijin — não vai
			// para a tela. 403 quase sempre é `Content-Type` divergente ou URL
			// vencida (15 min); os dois se resolvem repetindo o fluxo desde o POST.
			console.error(
				'[upload] bucket recusou o PUT:',
				xhr.status,
				xhr.responseText,
			)
			reject(
				new ApiError(
					'Não foi possível enviar a imagem para o armazenamento. Tente novamente.',
					xhr.status,
					xhr.responseText,
				),
			)
		})

		xhr.addEventListener('error', () => reject(new NetworkError('upload')))
		xhr.addEventListener('abort', () =>
			reject(new DOMException('Upload cancelado.', 'AbortError')),
		)

		options.signal?.addEventListener('abort', () => xhr.abort(), { once: true })

		xhr.send(file)
	})
}

/**
 * Confirma com retentativa curta.
 *
 * O `422` de confirmação significa "o objeto ainda não chegou ao bucket" — o
 * `PUT` do navegador terminou do lado de cá, mas a consistência do storage
 * ainda não o expôs ao `HEAD` do backend. É caso de esperar, não de erro final;
 * qualquer outro status sobe na hora.
 */
export async function confirmImageWithRetry(
	reportId: string,
	imageId: string,
	attempts = 3,
	delayMs = 1200,
): Promise<ReportImage> {
	for (let attempt = 1; ; attempt += 1) {
		try {
			return await confirmImage(reportId, imageId)
		} catch (cause) {
			const isPending = cause instanceof ApiError && cause.status === 422

			if (!isPending || attempt >= attempts) {
				throw cause
			}

			await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
		}
	}
}
