/**
 * A imagem do achado fotográfico.
 *
 * O `src` armazenado no documento é **sempre** o marcador `image:<uuid>` do
 * `/draft`, nunca uma URL. A URL de leitura é assinada e vence em 5 minutos, e
 * o documento editado é persistido em `document_content`: uma URL embutida
 * apodreceria dentro do laudo salvo, e o laudo é justamente o que se abre meses
 * depois.
 *
 * A resolução acontece no node view — camada de exibição, que o `getJSON()` não
 * enxerga. É o que garante, por construção e não por disciplina, que a URL
 * resolvida não volte para o documento.
 */

import Image from '@tiptap/extension-image'
import { imageIdFromMarker } from '../../../../domain/reportDocument'
import type { ImageUrlStore } from '../imageUrls'

export interface ReportImageOptions {
	/** Ausente enquanto a listagem de imagens não chegou. */
	urls: ImageUrlStore | null
}

/** Enquanto a URL não resolve, um pixel transparente segura o layout sem 404 no console. */
const TRANSPARENT_PIXEL =
	'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

export const ReportImageNode = Image.extend<ReportImageOptions>({
	name: 'image',

	addOptions() {
		return {
			...this.parent?.(),
			// Inline: o achado vem como duas linhas do mesmo parágrafo (marcador da
			// imagem e legenda). Como bloco, a imagem seria içada para fora e a
			// legenda ficaria órfã do próprio achado.
			inline: true,
			allowBase64: false,
			urls: null,
		}
	},

	addNodeView() {
		return ({ node, HTMLAttributes }) => {
			const dom = document.createElement('img')

			for (const [attribute, value] of Object.entries(HTMLAttributes)) {
				if (value !== null && value !== undefined && attribute !== 'src') {
					dom.setAttribute(attribute, String(value))
				}
			}

			dom.className = 'report-image'

			let current = node

			const paint = () => {
				const src =
					typeof current.attrs.src === 'string' ? current.attrs.src : ''
				const imageId = imageIdFromMarker(src)

				dom.alt = typeof current.attrs.alt === 'string' ? current.attrs.alt : ''

				if (imageId === null) {
					// `src` que não é marcador: imagem colada de fora. Passa direto — não
					// é papel deste node view reescrever o que o usuário inseriu.
					dom.src = src
					delete dom.dataset.imageId
					delete dom.dataset.pending
					return
				}

				const url = this.options.urls?.resolve(imageId) ?? null
				dom.src = url ?? TRANSPARENT_PIXEL
				dom.dataset.imageId = imageId
				dom.dataset.pending = url === null ? 'true' : 'false'
			}

			paint()

			const unsubscribe = this.options.urls?.subscribe(paint)

			return {
				dom,
				update(updated) {
					if (updated.type.name !== 'image') {
						return false
					}

					current = updated
					paint()

					return true
				},
				destroy() {
					unsubscribe?.()
				},
			}
		}
	},
})
