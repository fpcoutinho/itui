import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
	// Prefixo vazio: `loadEnv` devolve todas as variáveis, inclusive as sem
	// `VITE_`. Isso vive só aqui, no processo Node do Vite — o que chega ao
	// bundle continua sendo exclusivamente o que tem prefixo `VITE_`.
	const env = loadEnv(mode, process.cwd(), '')
	const raijinOrigin = env.RAIJIN_ORIGIN || 'http://localhost:3000'

	// A API é servida pela mesma origem do front em dev. Duas consequências, e as
	// duas são o motivo de existir este proxy:
	//
	// 1. Não há CORS nenhum — nem preflight, nem CORS_ALLOWED_ORIGINS para manter
	//    em sincronia com o .env do raijin.
	// 2. O cookie de refresh é first-party, então não depende de SameSite=None nem
	//    de o navegador aceitar cookie de terceiro.
	//
	// Em produção quem faz este papel é o comportamento `/api/*` da distribuição
	// CloudFront (ver README). O proxy é estritamente de desenvolvimento: `vite
	// build` ignora `server` e `preview`, então não há como ele vazar para o
	// artefato publicado.
	//
	// O caminho é preservado de propósito: o cookie tem `Path=/api/v1/auth`, e
	// qualquer `rewrite` que tire o `/api` faria o navegador gravar o cookie e
	// nunca mais enviá-lo — o refresh passaria a dar 401 para sempre, sem pista.
	const apiProxy = {
		'/api': {
			target: raijinOrigin,
			changeOrigin: true,
		},
	}

	return {
		plugins: [react()],
		server: {
			port: 5173,
			strictPort: true,
			proxy: apiProxy,
		},
		// `vite preview` não herda `server.proxy` — é uma chave própria. Sem isto,
		// rodar o build de produção localmente ficaria sem API, e o sintoma seria
		// idêntico ao de backend fora do ar.
		preview: {
			port: 4173,
			proxy: apiProxy,
		},
		resolve: {
			alias: {
				// Replica o alias interno que o pacote sanhaua usa nos próprios
				// arquivos .scss (system/themes/system.scss importa via "@theme/...").
				// Sem isso, importar system.scss de dentro de node_modules quebra.
				'@theme': fileURLToPath(
					new URL('./node_modules/sanhaua/system/themes/main', import.meta.url),
				),
			},
		},
		css: {
			preprocessorOptions: {
				scss: {
					// Tokens do Sanhauá injetados globalmente: nenhum .scss de
					// componente precisa importar os tokens manualmente.
					//
					// O `@use "sass:map"` vem primeiro e é o que destrava a camada de
					// responsividade inteira: `_media-queries.scss` chama `map.get` sem
					// declarar `@use "sass:map"` no próprio arquivo, então só compila se
					// o namespace já estiver no escopo de quem importa. Com ele aqui,
					// os mixins `breakpoint-min`/`breakpoint-max`/`breakpoint-between`
					// ficam disponíveis e a media query não precisa mais ser escrita à mão.
					additionalData: [
						'@use "sass:map";',
						'@import "sanhaua/system/themes/main/design-tokens/design-tokens";',
						'@import "sanhaua/system/themes/main/responsiveness/responsiveness";',
						'',
					].join('\n'),
					// O Sanhauá é todo @import; sem silenciar, todo build vira um muro
					// de aviso de depreciação. `global-builtin` não está mais na lista:
					// com o `@use "sass:map"` acima, os .scss deste projeto escrevem
					// `map.get` (como o próprio Sanhauá faz) em vez do legado `map-get`.
					silenceDeprecations: ['import'],
				},
			},
		},
	}
})
