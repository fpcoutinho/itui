/**
 * O cabeçalho do documento exportado.
 *
 * Ele não vem pronto de lugar nenhum: é montado aqui, cruzando o que o
 * `GET /reports/{id}` traz da inspeção com o que o usuário digitou nos campos
 * locais de exportação.
 *
 * **Por que não vem do `/draft`**: o `raijin` omite `location_code` e
 * `responsible_parties` do modelo que alimenta o provedor de IA — um é o
 * endereço de uma edificação com vulnerabilidade elétrica documentada, o outro
 * são nomes de pessoas. Nenhum dos dois precisa sair do banco para um terceiro
 * escrever prosa. No documento entregue os dois são obrigatórios, e o frontend,
 * que já tem o laudo inteiro em mãos, é quem os posiciona.
 *
 * O modelo é uma lista de pares rotulados, e não HTML: o mesmo cabeçalho é
 * renderizado em React (para a impressão) e em string (para o `.docx`). Duas
 * montagens separadas divergiriam no primeiro campo novo.
 */

import { exportTexts } from '../content/export'
import type { Report } from '../services/types'
import type { ExportSettings } from './exportSettings'

export interface HeaderRow {
	label: string
	value: string
}

const { header: labels, cover } = exportTexts

/** `2026-08-16T14:30:00Z` → `16/08/2026 14:30`. */
export function formatInspectedAt(iso: string): string {
	const date = new Date(iso)

	if (Number.isNaN(date.getTime())) {
		return iso
	}

	return date.toLocaleString('pt-BR', {
		dateStyle: 'short',
		timeStyle: 'short',
	})
}

/**
 * `YYYY-MM-DD` de um `<input type="date">` → `16 de agosto de 2026`.
 *
 * A data é lida como **local**, não UTC: `new Date('2026-08-16')` é meia-noite
 * em UTC e, em qualquer fuso a oeste de Greenwich — o Brasil inteiro —, exibe o
 * dia anterior. Numa linha de assinatura isso é um erro com consequência.
 */
export function formatSignatureDate(value: string): string {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

	if (match === null) {
		return value
	}

	const date = new Date(
		Number(match[1]),
		Number(match[2]) - 1,
		Number(match[3]),
	)

	return date.toLocaleDateString('pt-BR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
	})
}

const formatTemperature = (celsius: number | null): string | null =>
	celsius === null ? null : `${celsius.toLocaleString('pt-BR')} °C`

/** Título da capa: o digitado, ou o nome normativo do documento. */
export const coverTitle = (settings: ExportSettings): string =>
	settings.documentTitle.trim() || cover.defaultTitle

/**
 * A capa, em texto.
 *
 * Mesmo motivo do `buildReportHeader`: a folha impressa é React e o `.docx` é
 * string, e as duas montagens divergiriam no primeiro campo novo. Campo não
 * preenchido vem como string vazia — aqui, ao contrário do cabeçalho de
 * identificação, o bloco **some**: capa com "Não informado" no lugar do
 * contratante é pior que capa sem a linha.
 */
export interface CoverContent {
	institutionName: string
	institutionSubtitle: string
	title: string
	standard: string
	/** `Relatório nº CCHLA-102` — o identificador pelo qual o laudo é citado. */
	reportNumber: string
	client: string
	location: string
	/** Só o ano: é o que a capa de laudo técnico carimba embaixo do assunto. */
	year: string
	artNote: string
}

export function buildCover(
	report: Report,
	settings: ExportSettings,
): CoverContent {
	const inspected = new Date(report.inspectedAt)

	return {
		institutionName: settings.institutionName.trim(),
		institutionSubtitle: settings.institutionSubtitle.trim(),
		title: coverTitle(settings),
		standard: cover.standard,
		reportNumber: `${cover.reportNumber} ${report.locationCode}`,
		client: settings.clientName.trim(),
		location: settings.coverLocation.trim(),
		year: Number.isNaN(inspected.getTime())
			? ''
			: String(inspected.getFullYear()),
		artNote: settings.artNote.trim(),
	}
}

/**
 * As linhas de identificação, na ordem em que aparecem no documento.
 *
 * Campo não preenchido **não some**: some o valor, e o rótulo continua lá com
 * "Não informado". Um laudo é documento de responsabilidade técnica, e uma
 * linha ausente é indistinguível de uma linha esquecida.
 */
export function buildReportHeader(
	report: Report,
	settings: ExportSettings,
): HeaderRow[] {
	const rows: [string, string | null][] = [
		[labels.inspectedAt, formatInspectedAt(report.inspectedAt)],
		[labels.location, report.locationCode],
		[labels.temperature, formatTemperature(report.ambientTemperatureC)],
		[labels.weather, report.weatherConditions],
		[labels.responsibleParties, report.responsibleParties.join(', ')],
		[labels.client, settings.clientName],
		[labels.art, settings.artNumber],
	]

	return rows.map(([label, value]) => ({
		label,
		value: value?.trim() ? value.trim() : labels.notInformed,
	}))
}

/**
 * Nome do arquivo baixado.
 *
 * `location_code` primeiro porque é como o engenheiro procura o laudo depois —
 * a pasta de downloads dele tem dezenas deles, e ordenar por nome tem que
 * agrupar por bloco.
 */
export function exportFileName(
	report: Report,
	settings: ExportSettings,
	extension: string,
): string {
	const inspected = report.inspectedAt.slice(0, 10)
	const slug = `${report.locationCode}-${inspected}-${coverTitle(settings)}`
		// NFD separa a letra do acento e `\p{M}` remove a marca — "inspeção" vira
		// "inspecao", e não "inspe-o", que é o que a faixa `[^a-zA-Z0-9]` sozinha
		// produziria.
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.replace(/[^a-zA-Z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.toLowerCase()
		.slice(0, 120)

	return `${slug || 'laudo'}.${extension}`
}
