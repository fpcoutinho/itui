import { useEffect, useRef, useState } from 'react'
import { Navigate } from 'react-router'
import { authTexts } from '../../content/auth'
import { useSession } from '../../hooks/useSession'

/**
 * Logout **não é ação client-side.**
 *
 * O refresh token é um cookie `httpOnly`: o JavaScript não consegue lê-lo nem
 * apagá-lo. Sem o `POST /api/v1/auth/logout` a sessão de 30 dias continua viva
 * no servidor, com a interface apenas *parecendo* deslogada.
 *
 * A rota é idempotente (`204` sempre) e a limpeza local não depende dela, então
 * falha de rede não prende o usuário numa sessão que ele mandou encerrar.
 */
export function LogoutPage() {
	const { signOut } = useSession()
	const [isDone, setIsDone] = useState(false)

	// StrictMode monta o efeito duas vezes em dev; o guarda evita um segundo
	// POST desnecessário.
	const startedRef = useRef(false)

	useEffect(() => {
		if (startedRef.current) {
			return
		}
		startedRef.current = true

		void signOut().finally(() => {
			setIsDone(true)
		})
	}, [signOut])

	if (isDone) {
		return <Navigate replace to="/" />
	}

	return (
		<main aria-busy="true" className="route-loading">
			<h1>{authTexts.logout.title}</h1>
			<p>{authTexts.logout.description}</p>
		</main>
	)
}
