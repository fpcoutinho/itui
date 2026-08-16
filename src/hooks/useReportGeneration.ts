import type { Editor } from '@tiptap/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { writeSectionProse } from '../components/features/editor/sectionProse'
import { reportTexts } from '../content/report'
import {
	type DocumentSection,
	draftToHtml,
	withInspectionContext,
} from '../domain/reportDocument'
import { getReportDraft } from '../services/draft'
import { generateReport } from '../services/generate'
import type { Report } from '../services/types'
import { describeError } from './useReports'

/**
 * Os trechos chegam em rajada; escrever a cada um deixaria o editor
 * reprocessando o documento dezenas de vezes por segundo sem que o olho
 * distinguisse. 120 ms mantém a sensação de texto sendo escrito e agrupa os
 * trechos de uma mesma palavra.
 */
const FLUSH_INTERVAL_MS = 120

export type GenerationPhase = 'idle' | 'drafting' | 'streaming' | 'finished'

interface UseReportGenerationResult {
	phase: GenerationPhase
	/** Falha que impediu ou interrompeu a geração. O documento permanece íntegro. */
	error: string | null
	/** Aviso não fatal — hoje, redação truncada por teto de tokens. */
	warning: string | null
	start: () => void
	cancel: () => void
}

const { editor: texts } = reportTexts

/**
 * O botão de gerar parecer dispara **duas** chamadas, nesta ordem.
 *
 * 1. `GET .../draft` — determinístico, responde na hora, sem provedor externo.
 *    Carrega o documento inteiro no editor: todas as tabelas, todos os dados.
 * 2. `POST .../generate` — abre o SSE e acrescenta a prosa de cada seção.
 *
 * Nada é substituído no fim. Se a IA cair no meio, o engenheiro fica com o
 * laudo determinístico íntegro — perdeu a redação, não o trabalho. É a regra de
 * que o `/draft` é o piso do sistema, tornada concreta na interface.
 */
export function useReportGeneration(
	editor: Editor | null,
	/**
	 * O laudo inteiro, e não só o `id`: o cabeçalho de contexto das tabelas
	 * precisa de `location_code` e `responsible_parties`, que o `/draft` omite
	 * por privacidade e só existem aqui.
	 */
	report: Report,
): UseReportGenerationResult {
	const reportId = report.id
	const [phase, setPhase] = useState<GenerationPhase>('idle')
	const [error, setError] = useState<string | null>(null)
	const [warning, setWarning] = useState<string | null>(null)

	const controllerRef = useRef<AbortController | null>(null)
	/** Prosa acumulada por seção — o nó do documento é reescrito a partir daqui. */
	const proseRef = useRef(new Map<DocumentSection, string>())
	const dirtyRef = useRef(new Set<DocumentSection>())
	const flushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

	const editorRef = useRef(editor)
	editorRef.current = editor

	const flush = useCallback(() => {
		const target = editorRef.current

		if (target === null || target.isDestroyed || dirtyRef.current.size === 0) {
			return
		}

		for (const section of dirtyRef.current) {
			writeSectionProse(target, section, proseRef.current.get(section) ?? '')
		}

		dirtyRef.current.clear()
	}, [])

	const stopFlushing = useCallback(() => {
		if (flushTimerRef.current !== null) {
			clearInterval(flushTimerRef.current)
			flushTimerRef.current = null
		}

		flush()
	}, [flush])

	const cancel = useCallback(() => {
		controllerRef.current?.abort()
		controllerRef.current = null
		stopFlushing()
		setPhase('idle')
	}, [stopFlushing])

	const start = useCallback(() => {
		const target = editorRef.current

		if (target === null) {
			return
		}

		controllerRef.current?.abort()
		const controller = new AbortController()
		controllerRef.current = controller

		proseRef.current.clear()
		dirtyRef.current.clear()
		setError(null)
		setWarning(null)
		setPhase('drafting')

		const run = async () => {
			// Etapa 1: o documento determinístico. Só depois de ele estar no editor é
			// que o stream tem onde encaixar prosa.
			const draft = await getReportDraft(reportId, undefined, controller.signal)

			if (controller.signal.aborted || target.isDestroyed) {
				return
			}

			target.commands.setContent(
				withInspectionContext(draftToHtml(draft), report),
			)
			setPhase('streaming')

			flushTimerRef.current = setInterval(flush, FLUSH_INTERVAL_MS)

			// Etapa 2: a prosa. Uma falha daqui para a frente não desfaz nada do que
			// a etapa 1 já entregou.
			await generateReport(reportId, {
				signal: controller.signal,
				onToken: (section, text) => {
					proseRef.current.set(
						section,
						(proseRef.current.get(section) ?? '') + text,
					)
					dirtyRef.current.add(section)
				},
				onDone: (finishReason) => {
					// `length` = teto de tokens de saída atingido: a última seção chegou
					// incompleta e as seguintes não chegaram. Apresentar isso como
					// pronto seria entregar um laudo cortado no meio sem avisar.
					if (finishReason === 'length') {
						setWarning(texts.truncated)
					}
				},
			})
		}

		run()
			.then(() => {
				if (!controller.signal.aborted) {
					setPhase('finished')
				}
			})
			.catch((cause: unknown) => {
				if (controller.signal.aborted) {
					return
				}

				setError(describeError(cause))
				// `finished` e não `idle`: o documento do `/draft` continua no editor e
				// é trabalho aproveitável, ainda que sem a redação.
				setPhase('finished')
			})
			.finally(stopFlushing)
	}, [flush, report, reportId, stopFlushing])

	useEffect(
		() => () => {
			controllerRef.current?.abort()

			if (flushTimerRef.current !== null) {
				clearInterval(flushTimerRef.current)
			}
		},
		[],
	)

	return { phase, error, warning, start, cancel }
}
