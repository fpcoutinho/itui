/**
 * Registro das URLs de leitura das imagens do laudo.
 *
 * Existe porque as duas pontas têm ritmos diferentes: o documento guarda
 * `image:<uuid>` para sempre, e a `view_url` que o `GET .../images` assina vence
 * em 5 minutos. O registro é o ponto onde o marcador vira URL — e é deliberadamente
 * **volátil**: nada aqui é persistido, e a árvore do TipTap nunca recebe a URL
 * resolvida.
 *
 * Não é estado do React: o node view do TipTap é DOM imperativo e precisa
 * atualizar o `src` da `<img>` sem passar por re-render.
 */

import type { ReportImage } from '../../../services/types'

export class ImageUrlStore {
	private urls = new Map<string, string>()
	private readonly listeners = new Set<() => void>()

	/** `null` = imagem desconhecida ou ainda `pending` (sem objeto no bucket). */
	resolve(imageId: string): string | null {
		return this.urls.get(imageId) ?? null
	}

	/** Substitui o registro inteiro pela listagem mais recente e avisa os node views. */
	replaceAll(images: ReportImage[]): void {
		this.urls = new Map(
			images
				.filter((image) => typeof image.viewUrl === 'string' && image.viewUrl)
				.map((image) => [image.id, image.viewUrl as string]),
		)

		for (const listener of this.listeners) {
			listener()
		}
	}

	subscribe(listener: () => void): () => void {
		this.listeners.add(listener)

		return () => {
			this.listeners.delete(listener)
		}
	}
}
