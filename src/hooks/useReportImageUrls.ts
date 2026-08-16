import { useEffect, useRef, useState } from 'react'
import { ImageUrlStore } from '../components/features/editor/imageUrls'
import { listImages } from '../services/images'
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

	return { store: storeRef.current, error }
}
