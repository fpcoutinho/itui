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
	/**
	 * Adota a sessão devolvida por `register`, `login`, `google` — e também pela
	 * troca de senha, que reemite o par de tokens.
	 */
	adoptSession: (session: Session) => void
	/**
	 * Substitui o usuário em memória pelo que uma rota de perfil devolveu.
	 *
	 * O `user` da sessão e o de `/user/profile` são o mesmo objeto do backend, e
	 * só há uma cópia dele no app: sem isso, editar o perfil deixaria a tela
	 * mostrando o usuário de antes até o próximo refresh agendado.
	 */
	updateUser: (user: User) => void
	/** `POST /auth/logout` + limpeza local. Idempotente e tolerante a falha de rede. */
	signOut: () => Promise<void>
}

export const SessionContext = createContext<SessionContextValue | null>(null)
