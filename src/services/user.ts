import { request } from './http'
import type { Session, ThemePreference, User } from './types'

/**
 * Perfil do usuário: `/user/profile` e `/user/password`.
 *
 * São rotas autenticadas comuns (Bearer), ao contrário das de `/auth`. O objeto
 * devolvido é o **mesmo** `user` que aparece na resposta de sessão — por isso o
 * chamador deve empurrá-lo de volta para o `SessionProvider` (`updateUser`) em
 * vez de guardar uma segunda cópia do usuário em estado local.
 */

/**
 * O que o formulário produz. `undefined` (ou chave ausente) é "o formulário não
 * tocou neste campo" e `null` — como a string em branco — é "limpe este campo".
 * A distinção é a mesma do backend, e chega inteira até o corpo do PATCH.
 */
export interface ProfileFormValues {
	fullName?: string | null
	professionalTitle?: string | null
	avatarUrl?: string | null
	themePreference?: ThemePreference
}

/** O corpo que de fato vai no fio: só os campos que o chamador informou. */
interface UpdateProfileBody {
	fullName?: string | null
	professionalTitle?: string | null
	avatarUrl?: string | null
	themePreference?: ThemePreference
}

/**
 * Campo de texto do formulário → valor do PATCH.
 *
 * O backend distingue três casos com `Option<Option<String>>`: ausente (não
 * mexe), `null` (limpa) e string (grava). Os três são preservados aqui, e é o
 * que faz este PATCH ser um PATCH: `undefined` sai do corpo, e só o que o
 * formulário editou viaja.
 *
 * A ponte com a tela é o chamador: um input esvaziado tem que virar `null`
 * explícito, não `undefined` — daí a string em branco também virar `null`, já
 * que o backend responde `422 "Informe um nome válido."` a string vazia. Quem
 * não passar a chave não mexe no campo.
 */
function clearable(value: string | null): string | null {
	if (value === null) {
		return null
	}

	const trimmed = value.trim()
	return trimmed === '' ? null : trimmed
}

/** `GET /user/profile`. */
export function getProfile(): Promise<User> {
	return request<User>('/user/profile')
}

/** `PATCH /user/profile` com os campos informados — os demais ficam intactos. */
export function updateProfile(values: ProfileFormValues): Promise<User> {
	const body: UpdateProfileBody = {}

	if (values.fullName !== undefined) {
		body.fullName = clearable(values.fullName)
	}

	if (values.professionalTitle !== undefined) {
		body.professionalTitle = clearable(values.professionalTitle)
	}

	if (values.avatarUrl !== undefined) {
		body.avatarUrl = clearable(values.avatarUrl)
	}

	// `theme_preference` **não** aceita `null` no backend ("siga o sistema" é
	// `"system"`), então nunca passa pelo `clearable`.
	if (values.themePreference !== undefined) {
		body.themePreference = values.themePreference
	}

	return request<User>('/user/profile', { method: 'PATCH', body })
}

/**
 * `PATCH /user/profile` mexendo **só** no tema.
 *
 * Equivale a `updateProfile({ themePreference })` — existe como nome próprio
 * porque o toggle não é formulário de perfil e não deve carregar o tipo dele.
 */
export function updateThemePreference(
	themePreference: ThemePreference,
): Promise<User> {
	return request<User>('/user/profile', {
		method: 'PATCH',
		body: { themePreference },
	})
}

/**
 * `PATCH /user/password`.
 *
 * Devolve uma **sessão nova**, não um usuário: trocar a senha revoga todos os
 * refresh tokens, inclusive o de quem trocou, e o backend reemite o par no
 * mesmo response. O chamador tem que passar o retorno para `adoptSession`, ou o
 * access token em memória fica órfão e a sessão morre no próximo refresh.
 *
 * O cookie novo vem com `Path=/api/v1/auth` explícito (ver `api-contract.md`),
 * apesar de a requisição sair de `/api/v1/user/password`; o `credentials:
 * 'include'` que o faz ser gravado já é padrão em `http.ts`.
 */
export function updatePassword(
	currentPassword: string,
	newPassword: string,
): Promise<Session> {
	return request<Session>('/user/password', {
		method: 'PATCH',
		body: { currentPassword, newPassword },
	})
}
