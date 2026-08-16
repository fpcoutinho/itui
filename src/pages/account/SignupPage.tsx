import { type FormEvent, useCallback, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { UaAlert, UaButton, UaInputField } from 'sanhaua/react'
import { GoogleSignInButton } from '../../components/features/GoogleSignInButton'
import { authTexts, MIN_PASSWORD_LENGTH } from '../../content/auth'
import { useSession } from '../../hooks/useSession'
import { register } from '../../services/auth'
import { ApiError } from '../../services/http'
import { AccountLayout } from './AccountLayout'

export function SignupPage() {
	const { status, adoptSession } = useSession()
	const navigate = useNavigate()

	const [fullName, setFullName] = useState('')
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

		if (password.length < MIN_PASSWORD_LENGTH) {
			setFormError(authTexts.errors.passwordTooShort)
			return
		}

		setIsSubmitting(true)

		try {
			// Campo opcional: em branco vai como `null`, e não como string vazia —
			// gravar `""` deixaria o perfil com um nome que a tela não sabe exibir.
			const trimmedName = fullName.trim()
			const session = await register(
				email.trim(),
				password,
				trimmedName === '' ? null : trimmedName,
			)
			adoptSession(session)
			goToPlatform()
		} catch (cause) {
			// Aqui, ao contrário do login, o backend **distingue** os casos e manda a
			// mensagem pronta: "E-mail já cadastrado." ou "Esta conta usa login pelo
			// Google. Entre com o Google." Exibir verbatim, sem reescrever.
			setFormError(
				cause instanceof ApiError || cause instanceof Error
					? cause.message
					: authTexts.google.loadFailed,
			)
		} finally {
			setIsSubmitting(false)
		}
	}

	if (status === 'authenticated') {
		return <Navigate replace to="/plataforma" />
	}

	return (
		<AccountLayout
			footer={
				<>
					{authTexts.signup.hasAccount}{' '}
					<Link to="/conta/login">{authTexts.signup.loginLink}</Link>
				</>
			}
			title={authTexts.signup.title}
		>
			{formError ? (
				<UaAlert appearance="danger" description={formError} />
			) : null}

			<form className="auth-form" noValidate onSubmit={handleSubmit}>
				<UaInputField
					autoComplete="name"
					hint={authTexts.signup.fullNameHint}
					label={authTexts.signup.fullName}
					name="fullName"
					onChange={(event) => setFullName(event.target.value)}
					type="text"
					value={fullName}
					widthBehavior="full"
				/>

				<UaInputField
					autoComplete="email"
					label={authTexts.signup.email}
					name="email"
					onChange={(event) => setEmail(event.target.value)}
					required
					type="email"
					value={email}
					widthBehavior="full"
				/>

				<UaInputField
					autoComplete="new-password"
					hint={authTexts.signup.passwordHint}
					label={authTexts.signup.password}
					minLength={MIN_PASSWORD_LENGTH}
					name="password"
					onChange={(event) => setPassword(event.target.value)}
					required
					type="password"
					value={password}
					widthBehavior="full"
				/>

				<div className="actions">
					<UaButton disabled={isSubmitting} type="submit" widthBehavior="full">
						{isSubmitting
							? authTexts.signup.submitting
							: authTexts.signup.submit}
					</UaButton>
				</div>
			</form>

			<GoogleSignInButton
				onError={setFormError}
				onSuccess={goToPlatform}
				text="signup_with"
			/>
		</AccountLayout>
	)
}
