import { useCallback, useEffect, useRef, useState } from 'react'
import { authTexts } from '../../content/auth'
import { useGoogleIdentity } from '../../hooks/useGoogleIdentity'
import { useSession } from '../../hooks/useSession'
import { loginWithGoogle } from '../../services/auth'
import { ApiError } from '../../services/http'
import { GoogleMark } from './GoogleMark'
import './GoogleSignInButton.scss'

interface GoogleSignInButtonProps {
	text?: 'signin_with' | 'signup_with' | 'continue_with'
	/** Recebe a mensagem já pronta para exibir. */
	onError: (message: string) => void
	onSuccess: () => void
}

/**
 * Botão de login com Google.
 *
 * O `itui` fala direto com o Google, recebe um **ID Token** e o entrega ao
 * `POST /auth/google`, que valida a assinatura contra o JWKS público. Login
 * Google e e-mail/senha convergem para o mesmo usuário quando o e-mail bate.
 *
 * **Por que a sobreposição**: `renderButton` é o único caminho do GIS que
 * devolve um ID Token a partir de um clique, e o widget é desenhado pelo
 * Google — não aceita CSS nosso, e nos temas escuros ele põe o logo num tile
 * branco. Então o widget continua sendo quem recebe o clique e o foco, só que
 * transparente, e o visual abaixo é nosso. Ver `GoogleSignInButton.scss`.
 */
export function GoogleSignInButton({
	text = 'continue_with',
	onError,
	onSuccess,
}: GoogleSignInButtonProps) {
	const { adoptSession } = useSession()

	// O widget do Google só aceita largura em pixels. Medir o contêiner (que é
	// `width: 100%`) e repassar o número é o que dá largura fluida a ele.
	//
	// Não há laço de realimentação: a largura do contêiner vem do formulário, não
	// do widget, então re-renderizar o widget não dispara nova medição.
	const wrapperRef = useRef<HTMLDivElement | null>(null)
	const [width, setWidth] = useState(0)

	useEffect(() => {
		const wrapper = wrapperRef.current
		if (!wrapper) {
			return
		}

		const observer = new ResizeObserver(([entry]) => {
			// Arredondar evita re-renderizar o widget a cada fração de pixel
			// durante uma animação de layout ou o arrasto da janela.
			setWidth(Math.round(entry.contentRect.width))
		})

		observer.observe(wrapper)
		return () => observer.disconnect()
	}, [])

	const handleCredential = useCallback(
		(idToken: string) => {
			loginWithGoogle(idToken)
				.then((session) => {
					adoptSession(session)
					onSuccess()
				})
				.catch((cause: unknown) => {
					// 503 é o serviço de chaves do Google fora do ar, não credencial
					// ruim: a mensagem precisa convidar à retentativa.
					if (cause instanceof ApiError && cause.status === 503) {
						onError(authTexts.google.serviceUnavailable)
						return
					}

					onError(
						cause instanceof ApiError
							? cause.message
							: authTexts.google.loadFailed,
					)
				})
		},
		[adoptSession, onError, onSuccess],
	)

	const { buttonRef, isConfigured, error } = useGoogleIdentity({
		onCredential: handleCredential,
		text,
		width,
	})

	if (!isConfigured) {
		return <p className="auth-form__hint">{authTexts.google.unavailable}</p>
	}

	return (
		<>
			<div className="auth-divider">{authTexts.google.divider}</div>

			<div className="google-button" ref={wrapperRef}>
				{/* Só aparência: `aria-hidden` porque quem é anunciado e focado é o
				    botão real do Google, e `pointer-events: none` no SCSS para que o
				    clique atravesse até ele. */}
				<span aria-hidden="true" className="google-button__face">
					<GoogleMark />
					<span className="google-button__label">
						{authTexts.google.buttonLabel}
					</span>
				</span>

				<div className="google-button__widget" ref={buttonRef} />
			</div>

			{error ? <p className="auth-form__hint">{error}</p> : null}
		</>
	)
}
