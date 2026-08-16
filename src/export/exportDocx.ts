/**
 * Exportação `.docx`, inteira no navegador.
 *
 * O `raijin` não participa: não há endpoint de exportação, não há fila, não há
 * arquivo temporário em bucket nenhum. O laudo já está todo no cliente (o
 * documento no editor, as fotos atrás de URL assinada), e converter ali mesmo
 * elimina uma rota, um custo por execução e uma cópia do laudo fora do banco.
 *
 * A biblioteca é o fork mantido do `html-to-docx`, escolhido por um requisito
 * concreto: **`colspan`**. A avaliação qualitativa e a Parte II da quantitativa
 * têm cabeçalho de dois níveis — é por isso que o `/draft` emite esses dois
 * blocos em HTML e não em Markdown GFM (ver `api-contract.md`). Um conversor
 * que ignorasse `colspan` desmontaria justamente as duas tabelas que o backend
 * teve o trabalho de preservar.
 */

import HTMLtoDOCX from '@turbodocx/html-to-docx'
import { saveAs } from 'file-saver'
import type { ExportSettings } from '../domain/exportSettings'
import { exportFileName } from '../domain/reportHeader'
import type { Report, ReportImage } from '../services/types'
import {
	buildExportHtml,
	documentFooterHtml,
	documentHeaderHtml,
} from './exportHtml'
import { embedReportImages } from './imageAssets'
import { installNodeGlobals } from './nodeGlobals'

const DOCX_MIME =
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/** A4 e margens em TWIP (1/1440 de polegada) — a unidade do OOXML. */
const TWIP_PER_CM = 567

const A4 = { width: 11906, height: 16838 }

const documentOptions = {
	orientation: 'portrait',
	pageSize: A4,
	margins: {
		top: 2 * TWIP_PER_CM,
		right: 2 * TWIP_PER_CM,
		bottom: 2 * TWIP_PER_CM,
		left: 2 * TWIP_PER_CM,
		header: TWIP_PER_CM,
		footer: TWIP_PER_CM,
	},
	font: 'Arial',
	/** Meio-ponto: 22 = 11pt. */
	fontSize: 22,
	table: {
		// O equivalente OOXML do `break-inside: avoid` do CSS de impressão: a linha
		// da tabela não se parte entre duas folhas. Numa tabela de inspeção isso
		// separaria a pergunta da resposta.
		row: { cantSplit: true },
		borderOptions: { size: 1, stroke: 'single', color: '999999' },
	},
	footer: true,
	pageNumber: true,
	lang: 'pt-BR',
} as const

interface ExportDocxInput {
	report: Report
	settings: ExportSettings
	/** `editor.getHTML()` — o documento como está na tela, marcadores inclusos. */
	editorHtml: string
	/** Listagem recém-buscada: a `view_url` de cada uma vale 5 minutos. */
	images: ReportImage[]
	signal?: AbortSignal
}

export interface DocxExportResult {
	fileName: string
	/** Fotos que não puderam ser incorporadas; o documento saiu sem elas. */
	missingImages: number
}

export async function exportReportToDocx({
	report,
	settings,
	editorHtml,
	images,
	signal,
}: ExportDocxInput): Promise<DocxExportResult> {
	installNodeGlobals()

	const embedded = await embedReportImages(images, signal)

	const html = buildExportHtml({
		report,
		settings,
		editorHtml,
		images: embedded,
	})
	const header = documentHeaderHtml(settings)

	const file = await HTMLtoDOCX(
		html,
		header,
		{ ...documentOptions, header: header !== null, title: report.locationCode },
		documentFooterHtml(report, settings),
	)

	// A build de navegador devolve `Blob`; a de Node devolve `Buffer`. O tipo
	// publicado cobre as duas, então a normalização acontece aqui em vez de num
	// `as` que mentiria em um dos dois ambientes.
	const blob =
		file instanceof Blob
			? file
			: new Blob([file as ArrayBuffer], { type: DOCX_MIME })

	const fileName = exportFileName(report, settings, 'docx')

	saveAs(blob, fileName)

	return { fileName, missingImages: embedded.failed.length }
}
