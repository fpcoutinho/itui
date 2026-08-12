import { createContext } from 'react'
import type { Session, User } from '../services/types'

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous'

export interface SessionContextValue {
	/**
	 * `loading` cobre o bootstrap: enquanto ele não termina não dá para saber se
	 * há sessão, e redirecionar nesse intervalo derrubaria quem está logado.
	 */
	status: SessionStatus
	user: User | null
	/** Adota a sessão devolvida por `register`, `login` ou `google`. */
	adoptSession: (session: Session) => void
	/** `POST /auth/logout` + limpeza local. Idempotente e tolerante a falha de rede. */
	signOut: () => Promise<void>
}

export const SessionContext = createContext<SessionContextValue | null>(null)
