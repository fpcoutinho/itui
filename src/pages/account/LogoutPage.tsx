import { useEffect } from 'react'
import { Navigate } from 'react-router'

// Logout é ação client-side (descartar o JWT), não uma página de conteúdo —
// diferente do legado, que fazia POST com CSRF token no servidor.
export function LogoutPage() {
	useEffect(() => {
		// TODO(Step 3): trocar pela chave real usada pelo services/auth.
		localStorage.removeItem('itui.auth.token')
	}, [])

	return <Navigate to="/" replace />
}
