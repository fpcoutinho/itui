import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
	plugins: [react()],
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
				additionalData: `@import "sanhaua/system/themes/main/design-tokens/design-tokens";\n`,
			},
		},
	},
})
