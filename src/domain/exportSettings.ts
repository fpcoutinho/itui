/**
 * Os campos de capa, cabeçalho institucional, ART e assinatura.
 *
 * Nada aqui é campo do laudo. O `raijin` não conhece nenhum deles e não vai
 * conhecer: o `Report` modela a **inspeção**, e capa, papel timbrado e linha de
 * assinatura são apresentação do arquivo entregue — mudam por cliente, por
 * contrato e por gosto, e persisti-los no schema significaria versionar
 * decisão de diagramação junto com dado normativo.
 *
 * A consequência prática é que estes valores **só existem no navegador que os
 * digitou** (ver `useExportSettings`). Trocar de máquina os perde, e a UI diz
 * isso ao usuário em vez de fingir sincronia.
 *
 * Sem React e sem `localStorage` aqui: este arquivo é só a forma do dado e a
 * normalização de quem chega de fora.
 */

export interface ExportSettings {
	/** Cabeçalho institucional — repetido em toda página do documento. */
	institutionName: string
	institutionSubtitle: string

	/** Capa. */
	documentTitle: string
	clientName: string
	coverLocation: string

	/** Anotação de Responsabilidade Técnica. */
	artNumber: string
	artNote: string

	/** Fecho do documento. */
	closingRemarks: string
	signerName: string
	signerTitle: string
	signerRegistration: string
	signaturePlace: string
	/** `YYYY-MM-DD` — valor cru de um `<input type="date">`, formatado só ao exibir. */
	signatureDate: string
}

export const EMPTY_EXPORT_SETTINGS: ExportSettings = {
	institutionName: '',
	institutionSubtitle: '',
	documentTitle: '',
	clientName: '',
	coverLocation: '',
	artNumber: '',
	artNote: '',
	closingRemarks: '',
	signerName: '',
	signerTitle: '',
	signerRegistration: '',
	signaturePlace: '',
	signatureDate: '',
}

export const EXPORT_SETTINGS_FIELDS = Object.keys(
	EMPTY_EXPORT_SETTINGS,
) as (keyof ExportSettings)[]

/**
 * Aceita qualquer coisa e devolve `ExportSettings`.
 *
 * O que entra aqui vem de `JSON.parse` de um `localStorage` que pode ter sido
 * gravado por uma versão anterior do app — campo a mais, campo a menos, ou
 * lixo. Copiar chave por chave é o que garante que um valor não-string nunca
 * chegue a um `value` de input controlado.
 */
export function normalizeExportSettings(input: unknown): ExportSettings {
	if (input === null || typeof input !== 'object') {
		return { ...EMPTY_EXPORT_SETTINGS }
	}

	const source = input as Record<string, unknown>
	const settings = { ...EMPTY_EXPORT_SETTINGS }

	for (const field of EXPORT_SETTINGS_FIELDS) {
		const value = source[field]

		if (typeof value === 'string') {
			settings[field] = value
		}
	}

	return settings
}

export const isBlankExportSettings = (settings: ExportSettings): boolean =>
	EXPORT_SETTINGS_FIELDS.every((field) => settings[field].trim() === '')
