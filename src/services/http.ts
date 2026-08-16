import { toCamelCase, toSnakeCase } from './case'

/**
 * Base da API.
 *
 * Vazio (o padrão em dev) produz `/api/v1`, um caminho **relativo**: as chamadas
 * saem para a própria origem do front e o `server.proxy` do Vite as encaminha ao
 * raijin. Sem CORS, e o cookie de refresh é first-party.
 *
 * Preenchido (`https://api.exemplo.com`) volta ao modo cross-origin, que é o de
 * produção. Serve para reproduzir localmente o caminho real da sessão — inclusive
 * o comportamento de cookie de terceiros, que o proxy esconde.
 */
const API_BASE = `${import.meta.env.VITE_API_BASE_URL || ''}/api/v1`

/**
 * Erro de API já traduzido para algo exibível.
 *
 * `message` está sempre em pt-BR e pode ir direto para a tela. `rawBody` é para
 * depuração e **nunca** deve ser exibido — ver `parseError` abaixo.
 */
export class ApiError extends Error {
	readonly status: number
	readonly rawBody: string

	constructor(message: string, status: number, rawBody = '') {
		super(message)
		this.name = 'ApiError'
		this.status = status
		this.rawBody = rawBody
	}
}

/** Falha de rede, DNS, CORS ou certificado — a requisição nem chegou ao backend. */
export class NetworkError extends Error {
	constructor(cause: unknown) {
		super('Não foi possível falar com o servidor. Verifique sua conexão.')
		this.name = 'NetworkError'
		this.cause = cause
	}
}

/**
 * Mensagens do próprio frontend, usadas **só** quando a resposta não traz o
 * envelope `{ "error": "..." }`.
 */
const FALLBACK_MESSAGES: Record<number, string> = {
	400: 'Requisição inválida.',
	401: 'Sua sessão expirou. Entre novamente.',
	// O backend responde 404 tanto para "não existe" quanto para "não é seu", de
	// propósito: distinguir confirmaria a existência de um recurso alheio. A UI
	// tem uma mensagem só, pelo mesmo motivo.
	404: 'Não encontrado. O item não existe ou não está disponível para você.',
	409: 'Conflito com o estado atual do recurso.',
	422: 'Não foi possível processar os dados enviados.',
	429: 'Muitas tentativas em pouco tempo. Aguarde alguns instantes e tente de novo.',
	500: 'Erro no servidor. Tente novamente em instantes.',
	503: 'Serviço temporariamente indisponível. Tente novamente em instantes.',
}

const DEFAULT_MESSAGE = 'Algo deu errado. Tente novamente.'

/**
 * Lê o erro sem assumir que o corpo é JSON.
 *
 * Existem dois `422` diferentes no raijin. O **semântico** (regra de negócio)
 * sai do handler com o envelope e mensagem em pt-BR pronta para exibir. O
 * **estrutural** (JSON malformado, campo ausente, tipo errado) é rejeitado pelo
 * extractor `Json` do axum antes do handler e volta como texto puro em inglês.
 * Por isso: tentar o envelope, e cair para mensagem própria quando não houver.
 * O texto do axum vai para o console — é bug de frontend, não entrada de
 * usuário — e nunca para a tela.
 */
export async function parseError(response: Response): Promise<ApiError> {
	const rawBody = await response.text().catch(() => '')

	let message: string | undefined

	if (rawBody) {
		try {
			const parsed: unknown = JSON.parse(rawBody)
			if (
				typeof parsed === 'object' &&
				parsed !== null &&
				typeof (parsed as { error?: unknown }).error === 'string'
			) {
				message = (parsed as { error: string }).error
			}
		} catch {
			// Corpo não-JSON: é o texto do extractor do axum.
		}

		if (message === undefined) {
			console.error(
				`[api] resposta ${response.status} sem envelope de erro em ${response.url}:`,
				rawBody,
			)
		}
	}

	return new ApiError(
		message ?? FALLBACK_MESSAGES[response.status] ?? DEFAULT_MESSAGE,
		response.status,
		rawBody,
	)
}

// -- Ponte com a sessão -----------------------------------------------------

/**
 * O provider de sessão registra estes callbacks no boot.
 *
 * É uma injeção, e não um import de `session/`, para não criar ciclo: o
 * provider já importa `services/auth.ts`, que importa este módulo.
 */
export interface AuthHandlers {
	/** Access token atual, mantido só em memória pelo provider. */
	getAccessToken: () => string | null
	/**
	 * Renova a sessão. Deve devolver uma promessa **compartilhada** entre
	 * chamadas concorrentes, para que N requisições que tomem 401 ao mesmo tempo
	 * disparem um refresh só. `false` = sessão morta.
	 */
	refresh: () => Promise<boolean>
	/** Refresh falhou: limpar estado e mandar o usuário para o login. */
	onSessionExpired: () => void
}

let authHandlers: AuthHandlers | null = null

export function setAuthHandlers(handlers: AuthHandlers | null): void {
	authHandlers = handlers
}

/**
 * A mesma ponte, para o **único** consumidor que não passa por `request()`: o
 * SSE do `/generate`, que precisa da resposta em streaming e por isso monta o
 * `fetch` por conta própria (ver `services/generate.ts`).
 *
 * Não é porta de entrada para outros clientes HTTP paralelos — quem faz
 * requisição comum usa `request()`, que já trata token, 401 e conversão de
 * borda.
 */
export const getAuthHandlers = (): AuthHandlers | null => authHandlers

// -- Requisição -------------------------------------------------------------

export interface RequestOptions {
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
	/** Convertido para `snake_case` e serializado como JSON. */
	body?: unknown
	/** Valores `undefined` e `null` são omitidos da query string. */
	query?: Record<string, string | number | boolean | undefined | null>
	/**
	 * `false` nas rotas `/auth/*`: elas não levam Bearer e não participam do
	 * retry de 401 (o refresh é justamente uma delas).
	 */
	authenticated?: boolean
	signal?: AbortSignal
}

/** URL absoluta de uma rota da API, respeitando o modo proxy/cross-origin. */
export const apiUrl = (path: string): string => buildUrl(path, undefined)

function buildUrl(path: string, query: RequestOptions['query']): string {
	// A base pode ser relativa (modo proxy); `window.location.origin` é ignorado
	// quando `API_BASE` já é absoluta.
	const url = new URL(`${API_BASE}${path}`, window.location.origin)

	for (const [key, value] of Object.entries(query ?? {})) {
		if (value !== undefined && value !== null) {
			url.searchParams.set(key, String(value))
		}
	}

	return url.toString()
}

async function send(path: string, options: RequestOptions): Promise<Response> {
	const { method = 'GET', body, query, authenticated = true, signal } = options

	const headers: Record<string, string> = { Accept: 'application/json' }

	if (body !== undefined) {
		headers['Content-Type'] = 'application/json'
	}

	if (authenticated) {
		const token = authHandlers?.getAccessToken()
		if (token) {
			headers.Authorization = `Bearer ${token}`
		}
	}

	try {
		return await fetch(buildUrl(path, query), {
			method,
			headers,
			// O cookie de refresh tem Path=/api/v1/auth, então na prática só as
			// rotas de auth o enviam. Manter uniforme evita a classe de bug em que
			// alguém esquece o flag ao escrever a próxima rota de auth.
			credentials: 'include',
			body: body === undefined ? undefined : JSON.stringify(toSnakeCase(body)),
			signal,
		})
	} catch (cause) {
		if (cause instanceof DOMException && cause.name === 'AbortError') {
			throw cause
		}
		throw new NetworkError(cause)
	}
}

/**
 * Faz a requisição, converte a nomenclatura na borda e trata 401 renovando a
 * sessão **uma vez**.
 */
export async function request<T>(
	path: string,
	options: RequestOptions = {},
): Promise<T> {
	let response = await send(path, options)

	// As rotas /auth/* não participam do retry: o refresh é justamente uma delas.
	const handlers = (options.authenticated ?? true) ? authHandlers : null

	if (response.status === 401 && handlers !== null) {
		const renewed = await handlers.refresh()

		if (!renewed) {
			// Refresh também deu 401: sessão encerrada. Isso é esperado, não é bug —
			// um takeover de conta via Google revoga toda a cadeia de refresh tokens
			// do usuário, então uma sessão aberta em outro dispositivo morre sozinha.
			handlers.onSessionExpired()
			throw await parseError(response)
		}

		response = await send(path, options)
	}

	if (!response.ok) {
		throw await parseError(response)
	}

	if (response.status === 204) {
		return undefined as T
	}

	const text = await response.text()

	if (!text) {
		return undefined as T
	}

	return toCamelCase<T>(JSON.parse(text))
}
