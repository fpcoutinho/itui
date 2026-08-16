import type { Editor } from '@tiptap/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { updateDocumentContent } from '../services/sections'
import type { Report, TipTapDocument } from '../services/types'
import { describeError } from './useReports'

/**
 * Sem salvamento automático o engenheiro perde a edição ao recarregar — e o
 * editor é a tela onde ele passa mais tempo por laudo.
 *
 * 1,5 s é o intervalo escolhido: longo o bastante para não mandar um `PATCH`
 * por palavra digitada, curto o bastante para que um fechamento acidental de
 * aba custe uma frase, não um parágrafo. Durante o streaming da IA cada trecho
 * também conta como mudança, e o debounce faz o efeito desejado — um único
 * `PATCH` depois que o stream sossega, em vez de um por evento.
 */
const AUTOSAVE_DELAY_MS = 1500

export type AutosaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

interface UseDocumentAutosaveResult {
	status: AutosaveStatus
	error: string | null
	/** Grava agora, sem esperar o debounce. */
	saveNow: () => void
}

export function useDocumentAutosave(
	editor: Editor | null,
	reportId: string,
	onSaved?: (report: Report) => void,
): UseDocumentAutosaveResult {
	const [status, setStatus] = useState<AutosaveStatus>('idle')
	const [error, setError] = useState<string | null>(null)

	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	/** Documento em voo e documento pendente: uma gravação por vez, sem perder a última. */
	const inFlightRef = useRef(false)
	const pendingRef = useRef<TipTapDocument | null>(null)

	const onSavedRef = useRef(onSaved)
	onSavedRef.current = onSaved

	const flush = useCallback(() => {
		const document = pendingRef.current

		if (document === null || inFlightRef.current) {
			return
		}

		pendingRef.current = null
		inFlightRef.current = true
		setStatus('saving')

		updateDocumentContent(reportId, document)
			.then((report) => {
				setError(null)
				onSavedRef.current?.(report)
				// Uma edição que chegou durante a gravação não pode ficar para trás:
				// ela virou `pendingRef` de novo e é gravada logo em seguida.
				setStatus(pendingRef.current === null ? 'saved' : 'pending')
			})
			.catch((cause: unknown) => {
				// O documento perdido volta para a fila: a próxima tentativa (ou a
				// próxima tecla) leva a versão mais recente, nunca uma anterior.
				pendingRef.current ??= document
				setError(describeError(cause))
				setStatus('error')
			})
			.finally(() => {
				inFlightRef.current = false

				if (pendingRef.current !== null) {
					timerRef.current = setTimeout(flush, AUTOSAVE_DELAY_MS)
				}
			})
	}, [reportId])

	const schedule = useCallback(
		(document: TipTapDocument) => {
			pendingRef.current = document
			setStatus('pending')

			if (timerRef.current !== null) {
				clearTimeout(timerRef.current)
			}

			timerRef.current = setTimeout(flush, AUTOSAVE_DELAY_MS)
		},
		[flush],
	)

	useEffect(() => {
		if (editor === null) {
			return
		}

		const handleUpdate = () => schedule(editor.getJSON() as TipTapDocument)

		editor.on('update', handleUpdate)

		return () => {
			editor.off('update', handleUpdate)

			if (timerRef.current !== null) {
				clearTimeout(timerRef.current)
			}

			// Sair da tela com edição pendente ainda grava: a requisição sobrevive
			// à desmontagem do componente, e o pior caso é um `PATCH` cujo resultado
			// ninguém lê.
			flush()
		}
	}, [editor, flush, schedule])

	const saveNow = useCallback(() => {
		if (timerRef.current !== null) {
			clearTimeout(timerRef.current)
		}

		flush()
	}, [flush])

	return { status, error, saveNow }
}
