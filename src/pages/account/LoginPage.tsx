import { type FormEvent, useCallback, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { UaAlert, UaButton, UaInputField } from 'sanhaua/react'
import { GoogleSignInButton } from '../../components/features/GoogleSignInButton'
import { authTexts } from '../../content/auth'
import { useSession } from '../../hooks/useSession'
import { login } from '../../services/auth'
import { ApiError } from '../../services/http'
import { AccountLayout } from './AccountLayout'

export function LoginPage() {
	const { status, adoptSession } = useSession()
	const navigate = useNavigate()

	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [formError, setFormError] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const goToPlatform = useCallback(() => {
		void navigate('/plataforma', { replace: true })
	}, [navigate])

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setFormError(null)

		if (!email.trim()) {
			setFormError(authTexts.errors.emailRequired)
			return
		}

		if (!password) {
			setFormError(authTexts.errors.passwordRequired)
			return
		}

		setIsSubmitting(true)

		try {
			const session = await login(email.trim(), password)
			adoptSession(session)
			goToPlatform()
		} catch (cause) {
			// 401 é sempre a mesma mensagem, para e-mail inexistente e para senha
			// errada. O backend verifica um hash-isca quando o usuário não existe
			// para que o tempo de resposta não vire oráculo de enumeração — a UI não
			// pode desfazer isso ramificando o texto.
			if (cause instanceof ApiError && cause.status === 401) {
				setFormError(authTexts.errors.invalidCredentials)
			} else if (cause instanceof Error) {
				setFormError(cause.message)
			} else {
				setFormError(authTexts.errors.invalidCredentials)
			}
			setPassword('')
		} finally {
			setIsSubmitting(false)
		}
	}

	if (status === 'authenticated') {
		return <Navigate replace to="/plataforma" />
	}

	return (
		<AccountLayout
			title={authTexts.login.title}
			subtitle={authTexts.login.subtitle}
			footer={
				<>
					{authTexts.login.noAccount}{' '}
					<Link to="/conta/cadastro">{authTexts.login.signupLink}</Link>
				</>
			}
		>
			{formError ? (
				<UaAlert appearance="danger" description={formError} />
			) : null}

			<form className="auth-form" noValidate onSubmit={handleSubmit}>
				<UaInputField
					autoComplete="email"
					label={authTexts.login.email}
					name="email"
					onChange={(event) => setEmail(event.target.value)}
					required
					type="email"
					value={email}
					widthBehavior="full"
				/>

				<UaInputField
					autoComplete="current-password"
					label={authTexts.login.password}
					name="password"
					onChange={(event) => setPassword(event.target.value)}
					required
					type="password"
					value={password}
					widthBehavior="full"
				/>

				<div className="actions">
					<UaButton disabled={isSubmitting} type="submit" widthBehavior="full">
						{isSubmitting ? authTexts.login.submitting : authTexts.login.submit}
					</UaButton>
				</div>
			</form>

			<GoogleSignInButton
				onError={setFormError}
				onSuccess={goToPlatform}
				text="signin_with"
			/>
		</AccountLayout>
	)
}
