import { UaButton } from 'sanhaua/react'
import { themeTexts } from '../../content/theme'
import { useTheme } from '../../hooks/useTheme'
import './ThemeToggle.scss'

/**
 * Alterna claro/escuro. O ícone mostra o tema de destino (sol quando está
 * escuro), que é a convenção que os usuários leem como "clique para ir para lá".
 */
export function ThemeToggle() {
	const { theme, toggleTheme } = useTheme()

	const isDark = theme === 'dark'
	const label = isDark ? themeTexts.switchToLight : themeTexts.switchToDark

	return (
		<UaButton
			appearance="ghost"
			aria-label={label}
			className="theme-toggle"
			leftIcon={isDark ? 'light_mode' : 'dark_mode'}
			onClick={toggleTheme}
			title={label}
		>
			{null}
		</UaButton>
	)
}
