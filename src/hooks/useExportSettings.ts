import { useCallback, useState } from 'react'
import {
	EMPTY_EXPORT_SETTINGS,
	type ExportSettings,
	normalizeExportSettings,
} from '../domain/exportSettings'

/**
 * Duas chaves, e as duas são deliberadas.
 *
 * A do laudo guarda o que é daquele laudo (contratante, edificação). A de
 * "último uso" guarda o mesmo objeto sem vínculo, e é dela que um laudo novo
 * nasce preenchido: papel timbrado, nome e registro do responsável são os
 * mesmos em todos os laudos do mesmo engenheiro, e redigitá-los a cada
 * exportação seria o tipo de atrito que faz o campo ser abandonado.
 */
const REPORT_KEY_PREFIX = 'itui:export-settings:'
const LAST_USED_KEY = 'itui:export-settings:last'

/**
 * `localStorage` lança em mais situação do que parece — modo privado do Safari,
 * cota estourada, storage bloqueado por política do navegador. Nenhuma delas
 * pode derrubar a tela de exportação: o pior aceitável é o campo não persistir.
 */
function readStored(key: string): unknown {
	try {
		const raw = window.localStorage.getItem(key)

		return raw === null ? null : JSON.parse(raw)
	} catch (cause) {
		console.warn('[export] não foi possível ler as preferências locais:', cause)
		return null
	}
}

function writeStored(key: string, value: ExportSettings): void {
	try {
		window.localStorage.setItem(key, JSON.stringify(value))
	} catch (cause) {
		console.warn(
			'[export] não foi possível gravar as preferências locais:',
			cause,
		)
	}
}

interface UseExportSettingsResult {
	settings: ExportSettings
	update: (field: keyof ExportSettings, value: string) => void
	/** Limpa os campos deste laudo. O "último uso" fica de pé — é o padrão da próxima vez. */
	clear: () => void
}

/**
 * Os campos temporários da exportação, presos ao navegador.
 *
 * Não há chamada de API nenhuma aqui, e é o ponto: estes campos são
 * estritamente desacoplados do `raijin` (ver `domain/exportSettings.ts`). Um
 * `PATCH` escondido neste hook seria a porta de entrada para o schema do laudo
 * ganhar campo de diagramação.
 *
 * `seed` cobre o primeiro uso: nome e título profissional do usuário logado já
 * estão no perfil, e chegar com eles preenchidos é diferente de chegar com um
 * formulário em branco. Ele é lido **uma vez**, na montagem — o valor salvo
 * sempre vence, senão editar um campo para vazio o veria voltar sozinho.
 */
export function useExportSettings(
	reportId: string,
	seed: Partial<ExportSettings> = {},
): UseExportSettingsResult {
	const reportKey = `${REPORT_KEY_PREFIX}${reportId}`

	const [settings, setSettings] = useState<ExportSettings>(() => {
		const stored = readStored(reportKey)

		if (stored !== null) {
			return normalizeExportSettings(stored)
		}

		// O seed só preenche buraco: o último uso foi digitado pelo usuário e vence
		// o perfil, que é só um palpite razoável.
		const base = normalizeExportSettings(readStored(LAST_USED_KEY))

		for (const [field, value] of Object.entries(seed)) {
			const key = field as keyof ExportSettings

			if (typeof value === 'string' && value !== '' && base[key] === '') {
				base[key] = value
			}
		}

		return base
	})

	const update = useCallback(
		(field: keyof ExportSettings, value: string) => {
			setSettings((current) => {
				const next = { ...current, [field]: value }

				writeStored(reportKey, next)
				writeStored(LAST_USED_KEY, next)

				return next
			})
		},
		[reportKey],
	)

	const clear = useCallback(() => {
		setSettings({ ...EMPTY_EXPORT_SETTINGS })
		writeStored(reportKey, { ...EMPTY_EXPORT_SETTINGS })
	}, [reportKey])

	return { settings, update, clear }
}
