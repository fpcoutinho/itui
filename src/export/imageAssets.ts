/**
 * As fotos do laudo, prontas para sair num arquivo.
 *
 * Os dois caminhos de exportação precisam de coisas diferentes da mesma foto:
 *
 * - **PDF** imprime o DOM vivo, então basta garantir que toda `<img>` da região
 *   impressa terminou de carregar antes de `window.print()` — o navegador não
 *   espera imagem pendente, e a página sai com buraco branco no lugar do
 *   achado.
 * - **DOCX** é um arquivo que viaja: nele a URL assinada não serve para nada.
 *   Ela vence em 5 minutos e o bucket é privado, então o que vai embutido é o
 *   byte da imagem, em Base64.
 *
 * Em nenhum dos dois a `view_url` é persistida — ela é buscada, consumida e
 * descartada dentro da mesma exportação.
 */

import type { ReportImage } from '../services/types'

/**
 * Foto de celular chega com 3–4 mil pixels de largura. Num documento A4 com
 * margem de 2 cm, nada disso é visível — e em Base64 cada foto inflaria o
 * `.docx` em vários megabytes, que é justamente o arquivo que o engenheiro vai
 * mandar por e-mail. 1200px cobre a largura da página com folga para o zoom.
 */
const MAX_EMBEDDED_WIDTH = 1200

/** JPEG, e não PNG: fotografia é conteúdo contínuo, onde o PNG só custa tamanho. */
const EMBEDDED_TYPE = 'image/jpeg'
const EMBEDDED_QUALITY = 0.82

/** Imagem pronta para virar `<img>` no HTML que alimenta o conversor de DOCX. */
export interface EmbeddedImage {
	dataUri: string
	/** Dimensões **após** a redução. O conversor precisa delas para dimensionar o quadro no Word. */
	width: number
	height: number
}

export interface EmbeddedImageSet {
	byImageId: Map<string, EmbeddedImage>
	/** `image_id` das fotos que não puderam ser incorporadas — vira aviso na tela. */
	failed: string[]
}

/**
 * Baixa a foto e a rasteriza no tamanho de documento.
 *
 * `credentials: 'omit'` é obrigatório: a URL já é a credencial (está assinada),
 * e mandar cookie ou `Authorization` para o bucket é vazamento sem ganho — em
 * alguns provedores é inclusive `403`, porque a assinatura não cobre o header.
 *
 * O `fetch` aqui depende de **CORS no bucket**: um `<img src>` não precisa de
 * permissão para exibir, mas ler os bytes em JS precisa. Sem `GET` liberado
 * para a origem do app, esta é a chamada que falha — e o sintoma é a foto sair
 * só como legenda no `.docx`, com o PDF continuando perfeito.
 */
async function embedImage(
	url: string,
	signal?: AbortSignal,
): Promise<EmbeddedImage> {
	const response = await fetch(url, {
		credentials: 'omit',
		mode: 'cors',
		signal,
	})

	if (!response.ok) {
		throw new Error(`bucket respondeu ${response.status}`)
	}

	const blob = await response.blob()
	// Rasterizar também normaliza o formato: WEBP e HEIC são aceitos no upload,
	// e nenhum dos dois é seguro dentro de um `.docx` — o Word abre o arquivo e
	// mostra um quadro vazio, sem erro nenhum.
	const bitmap = await createImageBitmap(blob)

	try {
		const scale = Math.min(1, MAX_EMBEDDED_WIDTH / bitmap.width)
		const width = Math.max(1, Math.round(bitmap.width * scale))
		const height = Math.max(1, Math.round(bitmap.height * scale))

		const canvas = document.createElement('canvas')
		canvas.width = width
		canvas.height = height

		const context = canvas.getContext('2d')

		if (context === null) {
			throw new Error('contexto 2d indisponível')
		}

		context.drawImage(bitmap, 0, 0, width, height)

		return {
			dataUri: canvas.toDataURL(EMBEDDED_TYPE, EMBEDDED_QUALITY),
			width,
			height,
		}
	} finally {
		bitmap.close()
	}
}

/**
 * Resolve a listagem inteira em paralelo.
 *
 * Falha de uma foto não derruba a exportação: o documento sai com as outras e
 * a legenda da que faltou continua lá. Entregar um `.docx` com uma foto a menos
 * e um aviso explícito é melhor que não entregar documento nenhum — e a
 * legenda, que é a informação técnica, vem do `/draft` e não depende da imagem.
 */
export async function embedReportImages(
	images: ReportImage[],
	signal?: AbortSignal,
): Promise<EmbeddedImageSet> {
	const byImageId = new Map<string, EmbeddedImage>()
	const failed: string[] = []

	await Promise.all(
		images.map(async (image) => {
			if (typeof image.viewUrl !== 'string' || image.viewUrl === '') {
				failed.push(image.id)
				return
			}

			try {
				byImageId.set(image.id, await embedImage(image.viewUrl, signal))
			} catch (cause) {
				console.error('[export] falha ao incorporar imagem', image.id, cause)
				failed.push(image.id)
			}
		}),
	)

	return { byImageId, failed }
}

/**
 * Espera toda `<img>` da região terminar de carregar.
 *
 * `window.print()` é síncrono e não espera rede: o que estiver pendente sai em
 * branco no PDF, definitivamente. Como a `<img>` do achado só recebe `src` de
 * verdade quando a URL assinada chega, esta espera é o que separa um laudo com
 * fotos de um laudo com molduras vazias.
 *
 * O `timeoutMs` existe porque a alternativa a esperar para sempre é pior:
 * imprimir sem uma foto é ruim, travar o botão de exportar é inaceitável.
 */
export function waitForImages(root: HTMLElement, timeoutMs = 15000) {
	const pending = Array.from(root.querySelectorAll('img')).map((image) => {
		if (image.complete && image.naturalWidth > 0) {
			return Promise.resolve()
		}

		return new Promise<void>((resolve) => {
			// `error` resolve igual: imagem quebrada já está no seu estado final, e
			// não há o que esperar dela.
			image.addEventListener('load', () => resolve(), { once: true })
			image.addEventListener('error', () => resolve(), { once: true })
		})
	})

	const deadline = new Promise<void>((resolve) => {
		setTimeout(resolve, timeoutMs)
	})

	return Promise.race([Promise.all(pending).then(() => undefined), deadline])
}
