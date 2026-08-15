import { UaButtonIcon } from 'sanhaua/react'
import { themeTexts } from '../../content/theme'
import { useTheme } from '../../hooks/useTheme'

export function ThemeToggle() {
	const { theme, toggleTheme } = useTheme()

	const isDark = theme === 'dark'

	return (
		<UaButtonIcon
			appearance="ghost"
			borderStyle="round"
			icon={isDark ? 'light_mode' : 'dark_mode'}
			label={isDark ? themeTexts.switchToLight : themeTexts.switchToDark}
			onClick={toggleTheme}
		/>
	)
}
