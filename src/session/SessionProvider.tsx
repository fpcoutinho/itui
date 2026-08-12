import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { logout as logoutRequest, refreshSession } from '../services/auth'
import { ApiError, type AuthHandlers, setAuthHandlers } from '../services/http'
import type { Session, User } from '../services/types'
import { SessionContext, type SessionStatus } from './SessionContext'

/**
 * Renovar um pouco antes do vencimento, para que uma requisição em voo não
 * cruze a virada. O access token vale 900 s; 60 s de margem é folga suficiente
 * sem multiplicar chamadas de refresh.
 */
const REFRESH_MARGIN_SECONDS = 60
const MIN_REFRESH_DELAY_SECONDS = 10

export function SessionProvider({ children }: { children: ReactNode }) {
	const [status, setStatus] = useState<SessionStatus>('loading')
	const [user, setUser] = useState<User | null>(null)

	/**
	 * O access token vive aqui e **só** aqui: um `useRef`, em memória.
	 *
	 * Nunca `localStorage` nem `sessionStorage`. O refresh token já está
	 * protegido de XSS por ser `httpOnly`; jogar o access token no storage
	 * devolveria metade dessa superfície de ataque. Um `useRef` também evita que
	 * ele apareça num dump serializado de estado do React DevTools.
	 */
	const accessTokenRef = useRef<string | null>(null)
	const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	/** Refresh em andamento, compartilhado: N requisições em 401 disparam um só. */
	const refreshPromiseRef = useRef<Promise<boolean> | null>(null)

	const clearSession = useCallback(() => {
		accessTokenRef.current = null
		if (refreshTimerRef.current !== null) {
			clearTimeout(refreshTimerRef.current)
			refreshTimerRef.current = null
		}
		setUser(null)
		setStatus('anonymous')
	}, [])

	/**
	 * Renovação agendada a partir de `expires_in`, que vem em segundos no corpo
	 * da resposta. **Não decodificar o JWT no navegador** — o contrato entrega o
	 * número justamente para isso.
	 */
	const scheduleRefresh = useCallback((expiresIn: number) => {
		if (refreshTimerRef.current !== null) {
			clearTimeout(refreshTimerRef.current)
		}

		const delay = Math.max(
			expiresIn - REFRESH_MARGIN_SECONDS,
			MIN_REFRESH_DELAY_SECONDS,
		)

		refreshTimerRef.current = setTimeout(() => {
			void refreshRef.current()
		}, delay * 1000)
	}, [])

	const adoptSession = useCallback(
		(session: Session) => {
			accessTokenRef.current = session.accessToken
			setUser(session.user)
			setStatus('authenticated')
			scheduleRefresh(session.expiresIn)
		},
		[scheduleRefresh],
	)

	const refresh = useCallback((): Promise<boolean> => {
		if (refreshPromiseRef.current === null) {
			refreshPromiseRef.current = refreshSession()
				.then((session) => {
					adoptSession(session)
					return true
				})
				.catch((error: unknown) => {
					if (error instanceof ApiError && error.status === 401) {
						// Sessão encerrada. Isso é um resultado esperado, não um bug:
						// cookie ausente (ninguém logou ainda), token vencido, ou cadeia
						// revogada por takeover de conta via Google. Não logar como falha.
						clearSession()
						return false
					}
					// Rede fora, CORS, 5xx: não sabemos que a sessão morreu, então não a
					// derrubamos — o erro sobe para quem chamou.
					throw error
				})
				.finally(() => {
					refreshPromiseRef.current = null
				})
		}

		return refreshPromiseRef.current
	}, [adoptSession, clearSession])

	// O timer agendado numa renovação anterior precisa enxergar o `refresh` mais
	// recente sem que a identidade dele reagende tudo.
	const refreshRef = useRef(refresh)
	refreshRef.current = refresh

	const clearSessionRef = useRef(clearSession)
	clearSessionRef.current = clearSession

	/**
	 * Registra a ponte com o cliente HTTP.
	 *
	 * É feito na renderização, e não num efeito, porque efeito de pai roda
	 * *depois* do efeito dos filhos — uma requisição disparada na montagem de um
	 * filho sairia sem `Authorization`.
	 *
	 * E é **reafirmado a cada renderização**, não só quando o ref está vazio: no
	 * StrictMode o provider monta, desmonta e remonta, e o cleanup do desmonte
	 * zera o registro. Registrando uma vez só, a remontagem passaria batida (o
	 * ref já não estaria nulo) e todas as chamadas sairiam sem token e sem retry
	 * de 401. A atribuição é idempotente — o objeto é o mesmo e lê sempre os refs
	 * atuais.
	 */
	const handlersRef = useRef<AuthHandlers | null>(null)
	if (handlersRef.current === null) {
		handlersRef.current = {
			getAccessToken: () => accessTokenRef.current,
			refresh: () => refreshRef.current(),
			onSessionExpired: () => clearSessionRef.current(),
		}
	}
	setAuthHandlers(handlersRef.current)

	/**
	 * Bootstrap: o token em memória morre no reload, então a única forma de
	 * restaurar a sessão é apresentar o cookie de refresh uma vez na montagem.
	 *
	 * `401` aqui é o caminho normal de quem não está logado — vira `anonymous` em
	 * silêncio, sem toast e sem log de erro.
	 */
	useEffect(() => {
		let active = true

		refreshSession()
			.then((session) => {
				if (active) {
					adoptSession(session)
				}
			})
			.catch((error: unknown) => {
				if (!active) {
					return
				}
				if (!(error instanceof ApiError && error.status === 401)) {
					console.error('[session] falha ao restaurar a sessão:', error)
				}
				clearSession()
			})

		return () => {
			active = false
		}
	}, [adoptSession, clearSession])

	// Limpeza do timer no desmonte do provider.
	useEffect(
		() => () => {
			if (refreshTimerRef.current !== null) {
				clearTimeout(refreshTimerRef.current)
			}
			setAuthHandlers(null)
		},
		[],
	)

	const signOut = useCallback(async () => {
		try {
			await logoutRequest()
		} catch (error) {
			// A rota é idempotente e a limpeza local não depende dela: falha de rede
			// não pode prender o usuário numa sessão que ele mandou encerrar.
			console.error('[session] logout no servidor falhou:', error)
		} finally {
			clearSession()
		}
	}, [clearSession])

	return (
		<SessionContext.Provider value={{ status, user, adoptSession, signOut }}>
			{children}
		</SessionContext.Provider>
	)
}
