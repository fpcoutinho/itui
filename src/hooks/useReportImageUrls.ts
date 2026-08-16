import { useCallback, useEffect, useRef, useState } from 'react'
import { ImageUrlStore } from '../components/features/editor/imageUrls'
import { listImages } from '../services/images'
import type { ReportImage } from '../services/types'
import { describeError } from './useReports'

/**
 * A `view_url` vence em 5 minutos. Renovar aos 4 dá margem para a requisição
 * ir e voltar antes de a URL exibida na tela apodrecer — e uma tela de editor
 * fica aberta por muito mais que isso.
 */
const REFRESH_INTERVAL_MS = 4 * 60 * 1000

interface UseReportImageUrlsResult {
	/** Identidade estável: é passada ao node view do TipTap na criação do editor. */
	store: ImageUrlStore
	error: string | null
	/**
	 * Renova agora e devolve a listagem.
	 *
	 * Existe para a exportação: ela precisa das URLs **frescas** (as `<img>` da
	 * tela repintadas para o PDF, os bytes baixados para o `.docx`) e não pode
	 * depender de onde o intervalo de 4 minutos estava. Diferente do ciclo
	 * automático, a falha aqui sobe para quem chamou — exportar sem foto é erro
	 * a mostrar, não estado a tolerar.
	 */
	refresh: () => Promise<ReportImage[]>
}

/**
 * Mantém o registro de URLs de leitura vivo enquanto o editor estiver aberto.
 *
 * As URLs não entram no estado do React de propósito: nada aqui é renderizado,
 * e um `useState` com a lista só convidaria a guardá-la em algum lugar mais
 * duradouro. O store é volátil por construção.
 */
export function useReportImageUrls(reportId: string): UseReportImageUrlsResult {
	const storeRef = useRef<ImageUrlStore | null>(null)
	storeRef.current ??= new ImageUrlStore()

	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		const store = storeRef.current as ImageUrlStore
		const controller = new AbortController()

		const load = () => {
			listImages(reportId, controller.signal)
				.then((images) => {
					store.replaceAll(images)
					setError(null)
				})
				.catch((cause: unknown) => {
					if (!controller.signal.aborted) {
						setError(describeError(cause))
					}
				})
		}

		load()
		const timer = setInterval(load, REFRESH_INTERVAL_MS)

		return () => {
			controller.abort()
			clearInterval(timer)
		}
	}, [reportId])

	const refresh = useCallback(async () => {
		const images = await listImages(reportId)

		;(storeRef.current as ImageUrlStore).replaceAll(images)
		setError(null)

		return images
	}, [reportId])

	return { store: storeRef.current, error, refresh }
}
