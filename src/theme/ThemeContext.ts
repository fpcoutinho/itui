import { createContext } from 'react'
import type { ThemePreference } from '../services/types'

/** Tema em vigor na tela. Binário — `system` já foi resolvido aqui. */
export type Theme = 'light' | 'dark'

export interface ThemeContextValue {
	/** Tema em vigor: a escolha do usuário, ou a do sistema enquanto ela for `system`. */
	theme: Theme
	/**
	 * A escolha **persistida** (a mesma de `users.theme_preference`), que é
	 * ternária. Diferente de `theme`: com `system` numa máquina no escuro,
	 * `preference` é `'system'` e `theme` é `'dark'`.
	 */
	preference: ThemePreference
	/** `true` quando o tema está seguindo o `prefers-color-scheme` do sistema. */
	isFollowingSystem: boolean
	/**
	 * Troca a preferência. Aplica na hora e, se houver sessão, persiste no
	 * backend em segundo plano — a UI não espera a resposta.
	 */
	setPreference: (preference: ThemePreference) => void
	/** Alterna entre claro e escuro a partir do tema em vigor. Nunca resulta em `system`. */
	toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
