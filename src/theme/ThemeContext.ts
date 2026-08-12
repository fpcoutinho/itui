import { createContext } from 'react'

export type Theme = 'light' | 'dark'

export interface ThemeContextValue {
	/** Tema em vigor: a escolha do usuário, ou a do sistema enquanto não houver escolha. */
	theme: Theme
	/** `true` quando o tema está seguindo o `prefers-color-scheme` do sistema. */
	isFollowingSystem: boolean
	toggleTheme: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
