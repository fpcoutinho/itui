import type { ReactNode } from 'react'
import { Navigate } from 'react-router'
import { UaSkeleton } from 'sanhaua/react'
import { useSession } from '../hooks/useSession'

/**
 * Porta das rotas privadas.
 *
 * O estado `loading` existe por causa do bootstrap: o access token vive só em
 * memória e morre no reload, então logo após o carregamento a aplicação ainda
 * não sabe se há sessão. Redirecionar nesse intervalo jogaria fora do sistema
 * exatamente quem está logado.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
	const { status } = useSession()

	if (status === 'loading') {
		return (
			<main aria-busy="true" className="route-loading">
				<span className="visually-hidden">Carregando…</span>
				<UaSkeleton height="40px" width="60%" />
				<UaSkeleton height="200px" width="100%" />
			</main>
		)
	}

	if (status === 'anonymous') {
		return <Navigate replace to="/conta/login" />
	}

	return <>{children}</>
}
