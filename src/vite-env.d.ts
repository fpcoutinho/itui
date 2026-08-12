/// <reference types="vite/client" />

interface ImportMetaEnv {
	/** Origem do backend raijin, sem o `/api/v1`. Ver `.env.example`. */
	readonly VITE_API_BASE_URL: string
	/** Client ID do Google Identity Services. Não é segredo — vai no bundle por design. */
	readonly VITE_GOOGLE_CLIENT_ID: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
