import { useCallback, useState } from 'react'
import type { ProfileFormValues } from '../services/user'
import { updatePassword, updateProfile } from '../services/user'
import { describeError } from './useReports'
import { useSession } from './useSession'

interface UseProfileResult {
	/** Salva nome e título. `true` = deu certo, e a sessão já foi atualizada. */
	saveProfile: (values: ProfileFormValues) => Promise<boolean>
	/** Troca a senha e adota a sessão nova que a rota devolve. */
	savePassword: (
		currentPassword: string,
		newPassword: string,
	) => Promise<boolean>
	isSavingProfile: boolean
	isSavingPassword: boolean
	profileError: string | null
	passwordError: string | null
}

/**
 * As duas escritas de perfil, com o estado de envio de cada uma separado — as
 * seções da tela são independentes e um erro de senha não pode aparecer sobre o
 * formulário de nome.
 *
 * O usuário devolvido **não** fica aqui: vai para o `SessionProvider`, que já é
 * o dono do `user` no app. Guardar uma segunda cópia criaria a chance de as duas
 * divergirem.
 */
export function useProfile(): UseProfileResult {
	const { adoptSession, updateUser } = useSession()

	const [isSavingProfile, setIsSavingProfile] = useState(false)
	const [isSavingPassword, setIsSavingPassword] = useState(false)
	const [profileError, setProfileError] = useState<string | null>(null)
	const [passwordError, setPasswordError] = useState<string | null>(null)

	const saveProfile = useCallback(
		async (values: ProfileFormValues) => {
			setIsSavingProfile(true)
			setProfileError(null)

			try {
				updateUser(await updateProfile(values))
				return true
			} catch (cause) {
				setProfileError(describeError(cause))
				return false
			} finally {
				setIsSavingProfile(false)
			}
		},
		[updateUser],
	)

	const savePassword = useCallback(
		async (currentPassword: string, newPassword: string) => {
			setIsSavingPassword(true)
			setPasswordError(null)

			try {
				// A resposta é uma sessão nova, não um usuário: a troca de senha revoga
				// todos os refresh tokens, inclusive o desta aba. Sem adotar, o próximo
				// refresh agendado cairia em 401 e derrubaria quem acabou de trocar.
				adoptSession(await updatePassword(currentPassword, newPassword))
				return true
			} catch (cause) {
				setPasswordError(describeError(cause))
				return false
			} finally {
				setIsSavingPassword(false)
			}
		},
		[adoptSession],
	)

	return {
		saveProfile,
		savePassword,
		isSavingProfile,
		isSavingPassword,
		profileError,
		passwordError,
	}
}
