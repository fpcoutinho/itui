import {
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import { useSession } from '../hooks/useSession'
import type { ThemePreference } from '../services/types'
import { updateThemePreference } from '../services/user'
import { type Theme, ThemeContext } from './ThemeContext'

/** Mesma chave lida pelo script inline do index.html, que evita o flash de tema. */
const STORAGE_KEY = 'itui-theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

function readStoredPreference(): ThemePreference {
	try {
		const stored = localStorage.getItem(STORAGE_KEY)
		return stored === 'light' || stored === 'dark' || stored === 'system'
			? stored
			: 'system'
	} catch {
		// Storage bloqueado (modo privativo, cookies de terceiros). O tema ainda
		// funciona na sessão; só não sobrevive ao reload.
		return 'system'
	}
}

function storePreference(preference: ThemePreference): void {
	try {
		localStorage.setItem(STORAGE_KEY, preference)
	} catch {
		// Ver readStoredPreference: sem storage, a escolha vale só nesta sessão —
		// e, para quem está logado, o backend a devolve no próximo login.
	}
}

function readSystemTheme(): Theme {
	return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light'
}

/**
 * Precisa ficar **dentro** do `SessionProvider`: a preferência de tema é campo
 * do usuário, então quem entra na conta traz a escolha do servidor e quem
 * troca o tema logado a persiste de volta.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
	const { user, status, updateUser } = useSession()

	const [preference, setPreferenceState] =
		useState<ThemePreference>(readStoredPreference)
	const [systemTheme, setSystemTheme] = useState<Theme>(readSystemTheme)

	// Enquanto a preferência for `system`, o SO manda — e continua mandando se o
	// usuário trocar o tema do SO com a aba aberta.
	useEffect(() => {
		const query = window.matchMedia(DARK_QUERY)

		function handleChange(event: MediaQueryListEvent) {
			setSystemTheme(event.matches ? 'dark' : 'light')
		}

		query.addEventListener('change', handleChange)
		return () => query.removeEventListener('change', handleChange)
	}, [])

	const theme: Theme = preference === 'system' ? systemTheme : preference

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

	/**
	 * O login é a fonte da verdade e **sobrescreve** a escolha local.
	 *
	 * Só na entrada da conta, não a cada render: depois disso quem manda é o
	 * estado local, senão o `PATCH` em segundo plano e a resposta do servidor
	 * ficariam disputando o mesmo valor a cada renovação de sessão. O `ref`
	 * guarda de qual usuário já adotamos a preferência — trocar de conta na mesma
	 * aba conta como entrada nova.
	 */
	const adoptedForUserRef = useRef<string | null>(null)

	useEffect(() => {
		if (status !== 'authenticated' || user === null) {
			// Sessão encerrada: a próxima entrada precisa adotar de novo, inclusive
			// se for o mesmo usuário.
			adoptedForUserRef.current = null
			return
		}

		if (adoptedForUserRef.current === user.id) {
			return
		}

		adoptedForUserRef.current = user.id
		setPreferenceState(user.themePreference)
		storePreference(user.themePreference)
	}, [status, user])

	/**
	 * Aplica na hora e persiste em segundo plano.
	 *
	 * A ordem importa: a interface não pode esperar a rede para trocar de tema, e
	 * uma falha do `PATCH` não desfaz a troca — a escolha continua valendo nesta
	 * aba e no `localStorage`, que é de onde o próximo boot lê. O que se perde é
	 * o tema em outro dispositivo, e isso não justifica piscar a tela de volta.
	 */
	const setPreference = useCallback(
		(next: ThemePreference) => {
			setPreferenceState(next)
			storePreference(next)

			if (status !== 'authenticated') {
				// Anônimo não tem onde persistir — e o `PATCH` tomaria 401, disparando
				// o retry de refresh e derrubando a sessão inexistente para o login.
				return
			}

			updateThemePreference(next)
				.then(updateUser)
				.catch((error: unknown) => {
					console.error('[theme] falha ao persistir a preferência:', error)
				})
		},
		[status, updateUser],
	)

	const toggleTheme = useCallback(() => {
		// A partir do tema **em vigor**, não da preferência: com `system` no
		// escuro, o clique tem que acender, e não escurecer de novo.
		setPreference(theme === 'dark' ? 'light' : 'dark')
	}, [setPreference, theme])

	const value = useMemo(
		() => ({
			theme,
			preference,
			isFollowingSystem: preference === 'system',
			setPreference,
			toggleTheme,
		}),
		[theme, preference, setPreference, toggleTheme],
	)

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
