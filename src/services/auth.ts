import { request } from './http'
import type { Session } from './types'

/**
 * As cinco rotas de `/api/v1/auth`. São as únicas sem `Authorization: Bearer` —
 * daí o `authenticated: false` em todas.
 *
 * O refresh token nunca aparece no corpo: é um cookie `httpOnly` que o
 * JavaScript não lê nem precisa ler. O que o `fetch` precisa é de
 * `credentials: 'include'`, já embutido no cliente HTTP.
 */

/**
 * `full_name` é opcional no contrato: em branco grava `NULL` e não é erro. Sai
 * daqui já como `null` em vez de `undefined` — `JSON.stringify` apagaria a
 * chave, e o backend não distingue os dois casos no cadastro, mas mandar o
 * campo explicitamente mantém o corpo igual ao documentado.
 */
export function register(
	email: string,
	password: string,
	fullName: string | null = null,
): Promise<Session> {
	return request<Session>('/auth/register', {
		method: 'POST',
		body: { email, password, fullName },
		authenticated: false,
	})
}

export function login(email: string, password: string): Promise<Session> {
	return request<Session>('/auth/login', {
		method: 'POST',
		body: { email, password },
		authenticated: false,
	})
}

/**
 * Login com Google.
 *
 * O `itui` fala direto com o Google (Identity Services), obtém um **ID Token** e
 * só então o manda para cá. Não há authorization-code flow nem redirect.
 */
export function loginWithGoogle(idToken: string): Promise<Session> {
	return request<Session>('/auth/google', {
		method: 'POST',
		body: { idToken },
		authenticated: false,
	})
}

/**
 * Renova a sessão. **Sem corpo** — o cookie é a credencial.
 *
 * Cada uso rotaciona o refresh token. `401` aqui significa sessão encerrada, e é
 * um resultado esperado: cookie ausente (usuário nunca logou), token expirado,
 * ou cadeia revogada por takeover de conta via Google.
 */
export function refreshSession(): Promise<Session> {
	return request<Session>('/auth/refresh', {
		method: 'POST',
		authenticated: false,
	})
}

/**
 * Encerra a sessão **no servidor**.
 *
 * Não é ação client-side: o refresh token é um cookie `httpOnly`, então o JS não
 * consegue lê-lo nem apagá-lo. Sem esta chamada a sessão de 30 dias continua
 * viva no servidor com a UI parecendo deslogada.
 *
 * Idempotente: responde `204` tenha ou não encontrado a sessão — senão o logout
 * viraria um oráculo de "esse token existe".
 */
export function logout(): Promise<void> {
	return request<void>('/auth/logout', {
		method: 'POST',
		authenticated: false,
	})
}
