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
 * O que o formulário produz. `undefined` aqui é "o formulário não tocou neste
 * campo" e `null` é "limpe este campo" — e é justamente essa distinção que o
 * adaptador abaixo desfaz de propósito.
 */
export interface ProfileFormValues {
	fullName?: string | null
	professionalTitle?: string | null
	avatarUrl?: string | null
	themePreference?: ThemePreference
}

/** O corpo que de fato vai no fio, já sem `undefined` nos campos limpáveis. */
interface UpdateProfileBody {
	fullName: string | null
	professionalTitle: string | null
	avatarUrl: string | null
	themePreference?: ThemePreference
}

/**
 * Campo de texto do formulário → valor do PATCH.
 *
 * O backend distingue três casos com `Option<Option<String>>`: ausente (não
 * mexe), `null` (limpa) e string (grava). O formulário só tem dois — o input
 * está vazio ou tem texto — e `JSON.stringify` **apaga** chaves `undefined`,
 * então um campo esvaziado na tela sairia como "não mexa" e o valor antigo
 * voltaria no próximo GET, sem erro nenhum para dar pista. Daí a conversão
 * explícita: `undefined`, `null` e string em branco viram todos `null`.
 *
 * O efeito colateral é que este cliente sempre manda os três campos limpáveis,
 * ou seja, o PATCH aqui é um "substitua o perfil", não um "mexa só no que
 * mandei". É o que o formulário de perfil quer, porque ele edita todos eles de
 * uma vez. Quem precisar de um patch parcial de verdade — o toggle de tema, por
 * exemplo — usa `updateThemePreference` abaixo.
 */
function clearable(value: string | null | undefined): string | null {
	if (value === undefined || value === null) {
		return null
	}

	const trimmed = value.trim()
	// String em branco é `422 "Informe um nome válido."` no backend: o jeito de
	// limpar é `null`, e é isso que o campo vazio significa na tela.
	return trimmed === '' ? null : trimmed
}

/** `GET /user/profile`. */
export function getProfile(): Promise<User> {
	return request<User>('/user/profile')
}

/** `PATCH /user/profile` com o perfil inteiro, `undefined` já normalizado. */
export function updateProfile(values: ProfileFormValues): Promise<User> {
	const body: UpdateProfileBody = {
		fullName: clearable(values.fullName),
		professionalTitle: clearable(values.professionalTitle),
		avatarUrl: clearable(values.avatarUrl),
	}

	// `theme_preference` **não** aceita `null` no backend ("siga o sistema" é
	// `"system"`), então é o único que sai do corpo quando não foi informado.
	if (values.themePreference !== undefined) {
		body.themePreference = values.themePreference
	}

	return request<User>('/user/profile', { method: 'PATCH', body })
}

/**
 * `PATCH /user/profile` mexendo **só** no tema.
 *
 * Separado de `updateProfile` porque o toggle não conhece nome nem título, e
 * mandar o corpo inteiro a partir dele apagaria os dois.
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
