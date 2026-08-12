import { useEffect, useRef, useState } from 'react'

/**
 * Google Identity Services.
 *
 * O `itui` fala **direto com o Google**: carrega o GIS, recebe um ID Token e só
 * então o manda para `POST /api/v1/auth/google`, que verifica a assinatura
 * contra o JWKS público. Não há authorization-code flow nem redirect — decisão
 * fechada.
 *
 * O `VITE_GOOGLE_CLIENT_ID` não é segredo: vai no bundle por design. Precisa
 * ser idêntico ao `GOOGLE_CLIENT_ID` do raijin, que o usa como audience na
 * validação do ID Token. Divergente = `401` em todo login com Google.
 */

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

/** Fixo no bundle: `import.meta.env` é substituído em tempo de build. */
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const IS_CONFIGURED = Boolean(CLIENT_ID)

interface GoogleCredentialResponse {
	credential: string
}

interface GoogleIdentityApi {
	accounts: {
		id: {
			initialize: (config: {
				client_id: string
				callback: (response: GoogleCredentialResponse) => void
			}) => void
			renderButton: (
				parent: HTMLElement,
				options: Record<string, unknown>,
			) => void
		}
	}
}

declare global {
	interface Window {
		google?: GoogleIdentityApi
	}
}

/** Uma tag por documento, compartilhada entre login e cadastro. */
function loadScript(): Promise<void> {
	const existing = document.querySelector<HTMLScriptElement>(
		`script[src="${GSI_SCRIPT_SRC}"]`,
	)

	if (existing) {
		return existing.dataset.loaded === 'true'
			? Promise.resolve()
			: new Promise((resolve, reject) => {
					existing.addEventListener('load', () => resolve())
					existing.addEventListener('error', () =>
						reject(new Error('Falha ao carregar o Google Identity Services.')),
					)
				})
	}

	return new Promise((resolve, reject) => {
		const script = document.createElement('script')
		script.src = GSI_SCRIPT_SRC
		script.async = true
		script.defer = true
		script.addEventListener('load', () => {
			script.dataset.loaded = 'true'
			resolve()
		})
		script.addEventListener('error', () =>
			reject(new Error('Falha ao carregar o Google Identity Services.')),
		)
		document.head.appendChild(script)
	})
}

interface UseGoogleIdentityOptions {
	/** Recebe o ID Token. Quem chama o manda para `/auth/google`. */
	onCredential: (idToken: string) => void
	/** Texto do botão renderizado pelo Google. */
	text?: 'signin_with' | 'signup_with' | 'continue_with'
	/**
	 * Tema do botão. O widget é desenhado pelo Google e não aceita CSS nosso —
	 * acompanhar o tema da aplicação por aqui é a única forma de ele não ficar
	 * um retângulo branco no meio da tela escura.
	 */
	theme?: 'outline' | 'filled_blue' | 'filled_black'
	/**
	 * Largura em pixels. O `renderButton` não aceita porcentagem, então quem
	 * quiser largura fluida precisa medir o contêiner e passar o número aqui.
	 * O Google limita a 400px. Enquanto for `0`, o botão não é renderizado —
	 * é o estado anterior à primeira medição.
	 */
	width?: number
}

/** Teto imposto pelo próprio GIS: valores maiores são ignorados por ele. */
const MAX_WIDTH = 400

interface UseGoogleIdentityResult {
	/** Anexar a um `<div>` — o Google renderiza o botão dentro dele. */
	buttonRef: React.RefObject<HTMLDivElement | null>
	isReady: boolean
	/** `false` quando `VITE_GOOGLE_CLIENT_ID` não está configurado. */
	isConfigured: boolean
	error: string | null
}

export function useGoogleIdentity({
	onCredential,
	text = 'continue_with',
	theme = 'outline',
	width = 0,
}: UseGoogleIdentityOptions): UseGoogleIdentityResult {
	const buttonRef = useRef<HTMLDivElement | null>(null)
	const [isReady, setIsReady] = useState(false)
	const [error, setError] = useState<string | null>(null)

	// O callback do GIS é registrado uma vez; o ref mantém a versão atual sem
	// reinicializar o widget a cada renderização.
	const onCredentialRef = useRef(onCredential)
	onCredentialRef.current = onCredential

	useEffect(() => {
		// Sem medida ainda: renderizar com largura 0 produziria um widget inútil
		// que precisaria ser descartado no próximo efeito.
		if (!IS_CONFIGURED || width <= 0) {
			return
		}

		let active = true

		loadScript()
			.then(() => {
				const container = buttonRef.current
				if (!active || !window.google || !container) {
					return
				}

				window.google.accounts.id.initialize({
					client_id: CLIENT_ID,
					callback: (response) => onCredentialRef.current(response.credential),
				})

				// `renderButton` anexa um novo widget em vez de substituir o anterior:
				// sem limpar, trocar de tema deixaria dois botões empilhados.
				container.replaceChildren()

				window.google.accounts.id.renderButton(container, {
					type: 'standard',
					theme,
					size: 'large',
					text,
					shape: 'rectangular',
					locale: 'pt-BR',
					width: Math.min(width, MAX_WIDTH),
				})

				setIsReady(true)
			})
			.catch((cause: unknown) => {
				if (!active) {
					return
				}
				console.error('[google] ', cause)
				setError('Não foi possível carregar o login do Google.')
			})

		return () => {
			active = false
		}
	}, [text, theme, width])

	return { buttonRef, isReady, isConfigured: IS_CONFIGURED, error }
}
