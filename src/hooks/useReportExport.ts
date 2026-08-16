import type { Editor } from '@tiptap/react'
import { type RefObject, useCallback, useState } from 'react'
import { exportTexts } from '../content/export'
import type { ExportSettings } from '../domain/exportSettings'
import { exportFileName } from '../domain/reportHeader'
import { exportReportToPdf } from '../export/exportPdf'
import type { Report, ReportImage } from '../services/types'
import { describeError } from './useReports'

/** `idle` fora de exportação; nos outros dois, os dois botões ficam travados. */
export type ExportPhase = 'idle' | 'pdf' | 'docx'

interface UseReportExportInput {
	report: Report
	settings: ExportSettings
	editor: Editor | null
	/** Região que vai para o papel — usada para esperar as imagens carregarem. */
	printRootRef: RefObject<HTMLElement | null>
	/**
	 * Rebusca a listagem de imagens e repinta os node views do editor.
	 *
	 * Chamada **em toda exportação**, mesmo que a listagem tenha chegado há
	 * pouco: a `view_url` vence em 5 minutos e o editor fica aberto por horas.
	 * Exportar com URL vencida produz PDF com moldura vazia e `.docx` sem foto —
	 * as duas falhas silenciosas que esta chamada elimina.
	 */
	refreshImages: () => Promise<ReportImage[]>
}

/**
 * Aviso de sucesso (ou de sucesso parcial, quando faltou foto).
 *
 * `sticky` separa o aviso que some sozinho daquele que precisa ficar: o do PDF
 * é instrução para usar dentro do diálogo de impressão, que é modal do
 * navegador — um temporizador de 5 segundos correria atrás dele e a instrução
 * teria sumido quando o usuário voltasse para a página.
 */
export interface ExportNotice {
	title: string
	message: string
	sticky: boolean
}

interface UseReportExportResult {
	phase: ExportPhase
	error: string | null
	notice: ExportNotice | null
	exportPdf: () => void
	exportDocx: () => void
	dismiss: () => void
}

/**
 * Orquestra as duas exportações.
 *
 * Só uma por vez, e não por limitação técnica: as duas mexem no mesmo
 * documento e nas mesmas URLs assinadas, e um `.docx` gerado enquanto o
 * diálogo de impressão está aberto é um arquivo que ninguém pediu.
 */
export function useReportExport({
	report,
	settings,
	editor,
	printRootRef,
	refreshImages,
}: UseReportExportInput): UseReportExportResult {
	const [phase, setPhase] = useState<ExportPhase>('idle')
	const [error, setError] = useState<string | null>(null)
	const [notice, setNotice] = useState<ExportNotice | null>(null)

	const dismiss = useCallback(() => {
		setError(null)
		setNotice(null)
	}, [])

	/** Guarda comum: exportar documento vazio produz um laudo de capa e assinatura. */
	const begin = useCallback(
		(next: ExportPhase): boolean => {
			if (phase !== 'idle') {
				return false
			}

			setError(null)
			setNotice(null)

			if (editor === null || editor.isEmpty) {
				setError(exportTexts.errors.emptyDocument)
				return false
			}

			setPhase(next)
			return true
		},
		[editor, phase],
	)

	const exportPdf = useCallback(() => {
		if (!begin('pdf')) {
			return
		}

		const run = async () => {
			// A listagem nova entra no `ImageUrlStore`, que repinta cada node view —
			// só então as `<img>` da tela apontam para URLs que ainda valem.
			await refreshImages()

			await exportReportToPdf({
				root: printRootRef.current,
				fileName: exportFileName(report, settings, 'pdf').replace(/\.pdf$/, ''),
			})
		}

		run()
			.then(() => setNotice({ ...exportTexts.status.printReady, sticky: true }))
			.catch((cause: unknown) => {
				console.error('[export] impressão falhou:', cause)
				setError(`${exportTexts.errors.printFailed} ${describeError(cause)}`)
			})
			.finally(() => setPhase('idle'))
	}, [begin, printRootRef, refreshImages, report, settings])

	const exportDocx = useCallback(() => {
		if (!begin('docx')) {
			return
		}

		const run = async () => {
			// O conversor de DOCX (com XML builder, parser de HTML e utilitários
			// juntos) é maior que o resto da aplicação somada, e só existe para este
			// clique. Carregado aqui, ele não pesa no primeiro acesso de quem só vai
			// preencher o formulário — e nem no de quem exporta em PDF.
			const [{ exportReportToDocx }, images] = await Promise.all([
				import('../export/exportDocx'),
				refreshImages(),
			])

			return exportReportToDocx({
				report,
				settings,
				// `getHTML()` serializa o documento **salvo**, com `image:<uuid>` no
				// `src` — o node view resolve a URL só na tela, e é isso que impede
				// uma URL vencida de entrar no arquivo exportado.
				editorHtml: (editor as Editor).getHTML(),
				images,
			})
		}

		run()
			.then(({ missingImages }) => {
				setNotice({
					title: exportTexts.status.docxReady.title,
					message:
						missingImages === 0
							? exportTexts.status.docxReady.message
							: exportTexts.errors.missingImages(missingImages),
					sticky: missingImages > 0,
				})
			})
			.catch((cause: unknown) => {
				console.error('[export] geração do .docx falhou:', cause)
				setError(`${exportTexts.errors.docxFailed} ${describeError(cause)}`)
			})
			.finally(() => setPhase('idle'))
	}, [begin, editor, refreshImages, report, settings])

	return { phase, error, notice, exportPdf, exportDocx, dismiss }
}
