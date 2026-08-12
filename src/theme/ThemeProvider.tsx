import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react'
import { type Theme, ThemeContext } from './ThemeContext'

/** Mesma chave lida pelo script inline do index.html, que evita o flash de tema. */
const STORAGE_KEY = 'itui-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function readStoredTheme(): Theme | null {
	try {
		const stored = localStorage.getItem(STORAGE_KEY)
		return stored === 'light' || stored === 'dark' ? stored : null
	} catch {
		// Storage bloqueado (modo privativo, cookies de terceiros). O tema ainda
		// funciona na sessão; só não sobrevive ao reload.
		return null
	}
}

function readSystemTheme(): Theme {
	return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [chosenTheme, setChosenTheme] = useState<Theme | null>(readStoredTheme)
	const [systemTheme, setSystemTheme] = useState<Theme>(readSystemTheme)

	// Enquanto o usuário não escolher, o sistema manda — e continua mandando se
	// ele trocar o tema do SO com a aba aberta.
	useEffect(() => {
		const query = window.matchMedia(DARK_QUERY)

		function handleChange(event: MediaQueryListEvent) {
			setSystemTheme(event.matches ? 'dark' : 'light')
		}

		query.addEventListener('change', handleChange)
		return () => query.removeEventListener('change', handleChange)
	}, [])

	const theme = chosenTheme ?? systemTheme

	// A classe do <html> é o escopo de tema do Sanhauá: os dois temas já estão no
	// style.css, trocar a classe basta. Ver o script anti-FOUC do index.html, que
	// escreve no MESMO elemento.
	//
	// Precisa ser o mesmo elemento: o Sanhauá estiliza descendentes diretamente
	// (`.sanhaua.dark .ua-button`), então um `.sanhaua dark` no html com um
	// `.sanhaua light` no body faria as duas regras casarem, e a escura venceria
	// por vir depois no arquivo — os componentes do pacote ficariam escuros no
	// tema claro enquanto o resto da tela clareava.
	useEffect(() => {
		const root = document.documentElement
		root.classList.remove('light', 'dark')
		root.classList.add(theme)
	}, [theme])

	const toggleTheme = useCallback(() => {
		setChosenTheme((current) => {
			const next: Theme =
				(current ?? readSystemTheme()) === 'dark' ? 'light' : 'dark'

			try {
				localStorage.setItem(STORAGE_KEY, next)
			} catch {
				// Ver readStoredTheme: sem storage, a escolha vale só nesta sessão.
			}

			return next
		})
	}, [])

	const value = useMemo(
		() => ({ theme, isFollowingSystem: chosenTheme === null, toggleTheme }),
		[theme, chosenTheme, toggleTheme],
	)

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
