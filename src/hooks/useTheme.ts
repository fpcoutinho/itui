import { useContext } from 'react'
import { ThemeContext, type ThemeContextValue } from '../theme/ThemeContext'

export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext)

	if (context === null) {
		throw new Error('useTheme precisa estar dentro de <ThemeProvider>.')
	}

	return context
}
