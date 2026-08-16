import { useCallback, useEffect, useRef, useState } from 'react'
import {
	type CreateImageInput,
	confirmImageWithRetry,
	createImage,
	listImages,
	uploadImageToBucket,
} from '../services/images'
import type { ReportImage } from '../services/types'
import { describeError } from './useReports'

/**
 * Etapa em que o envio está. São as três chamadas do fluxo, e o usuário precisa
 * distingui-las: falha no `PUT` é problema de rede ou de URL vencida (15 min),
 * falha no `confirm` é o objeto ainda não visível no bucket.
 */
export type UploadStage =
	| 'creating'
	| 'uploading'
	| 'confirming'
	| 'done'
	| 'error'

export interface UploadTask {
	/** Identidade local: existe antes de o backend emitir o `image_id`. */
	id: string
	fileName: string
	stage: UploadStage
	/** 0..1 — só o `PUT` reporta progresso real. */
	progress: number
	error: string | null
}

interface UseReportImagesResult {
	images: ReportImage[]
	uploads: UploadTask[]
	isLoading: boolean
	error: string | null
	upload: (file: File, input: Omit<CreateImageInput, 'contentType'>) => void
	/** Reinicia o envio desde o `POST`: a URL pré-assinada pode ter vencido. */
	retry: (taskId: string) => void
	dismiss: (taskId: string) => void
	/** Recarrega a lista — as `view_url` vencem em 5 minutos. */
	refresh: () => void
}

export function useReportImages(reportId: string): UseReportImagesResult {
	const [images, setImages] = useState<ReportImage[]>([])
	const [uploads, setUploads] = useState<UploadTask[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	/**
	 * O `File` e os metadados ficam fora do estado do React: são o insumo da
	 * retentativa, não algo que a tela renderize, e um `File` no estado só
	 * convidaria a serializá-lo junto com o resto.
	 */
	const pendingRef = useRef(
		new Map<string, { file: File; input: CreateImageInput }>(),
	)

	const refresh = useCallback(() => {
		setIsLoading(true)

		listImages(reportId)
			.then((result) => {
				setImages(result)
				setError(null)
			})
			.catch((cause: unknown) => setError(describeError(cause)))
			.finally(() => setIsLoading(false))
	}, [reportId])

	useEffect(refresh, [refresh])

	const patchTask = useCallback(
		(taskId: string, patch: Partial<UploadTask>) => {
			setUploads((current) =>
				current.map((task) =>
					task.id === taskId ? { ...task, ...patch } : task,
				),
			)
		},
		[],
	)

	/**
	 * As três etapas, sempre do começo.
	 *
	 * Retentar a partir do `PUT` exigiria confiar numa `upload_url` guardada, que
	 * vale 15 minutos e some junto com a linha `pending` se o backend a
	 * reciclar. Refazer o `POST` custa uma requisição barata e é o caminho que
	 * sempre funciona.
	 */
	const run = useCallback(
		async (taskId: string) => {
			const pending = pendingRef.current.get(taskId)

			if (pending === undefined) {
				return
			}

			try {
				patchTask(taskId, { stage: 'creating', progress: 0, error: null })
				const ticket = await createImage(reportId, pending.input)

				patchTask(taskId, { stage: 'uploading' })
				await uploadImageToBucket(ticket, pending.file, {
					onProgress: (ratio) => patchTask(taskId, { progress: ratio }),
				})

				patchTask(taskId, { stage: 'confirming', progress: 1 })
				const image = await confirmImageWithRetry(reportId, ticket.imageId)

				setImages((current) => [
					...current.filter((item) => item.id !== image.id),
					image,
				])
				patchTask(taskId, { stage: 'done' })
				pendingRef.current.delete(taskId)
			} catch (cause) {
				patchTask(taskId, { stage: 'error', error: describeError(cause) })
			}
		},
		[patchTask, reportId],
	)

	const upload = useCallback(
		(file: File, input: Omit<CreateImageInput, 'contentType'>) => {
			const taskId = crypto.randomUUID()

			// `contentType` sai do próprio arquivo e é o mesmo valor que a assinatura
			// vai cobrir — o backend devolve `required_content_type` e o `PUT` usa
			// aquele, não este, justamente para não haver duas fontes.
			pendingRef.current.set(taskId, {
				file,
				input: { ...input, contentType: file.type },
			})

			setUploads((current) => [
				...current,
				{
					id: taskId,
					fileName: file.name,
					stage: 'creating',
					progress: 0,
					error: null,
				},
			])

			void run(taskId)
		},
		[run],
	)

	const retry = useCallback((taskId: string) => void run(taskId), [run])

	const dismiss = useCallback((taskId: string) => {
		pendingRef.current.delete(taskId)
		setUploads((current) => current.filter((task) => task.id !== taskId))
	}, [])

	return {
		images,
		uploads,
		isLoading,
		error,
		upload,
		retry,
		dismiss,
		refresh,
	}
}
