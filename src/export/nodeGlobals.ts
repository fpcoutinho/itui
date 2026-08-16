/**
 * Os dois globais de Node que o conversor de DOCX exige do navegador.
 *
 * `@turbodocx/html-to-docx` é o fork de uma biblioteca escrita para Node: ela
 * monta o `word/document.xml` com `Buffer` e lê `global` ao empacotar o `.zip`.
 * No navegador nenhum dos dois existe, e a falha não é um erro de importação —
 * é `ReferenceError` no meio da geração, com o clique já dado e o arquivo pela
 * metade.
 *
 * `globalThis.global = globalThis` resolve o identificador nu `global`, porque
 * propriedade de `globalThis` **é** variável global. O `Buffer` vem do pacote
 * `buffer`, a mesma implementação que o `browserify` usa há uma década.
 *
 * Fica em módulo próprio, chamado de dentro do `import()` dinâmico do
 * `exportDocx`: poluir o escopo global no arranque da aplicação, para servir a
 * um clique que a maioria das sessões nunca dá, é o oposto do motivo de o
 * conversor ser carregado sob demanda.
 */

import { Buffer } from 'buffer'

interface NodeGlobals {
	global?: typeof globalThis
	Buffer?: typeof Buffer
}

export function installNodeGlobals(): void {
	const scope = globalThis as typeof globalThis & NodeGlobals

	scope.global ??= globalThis
	scope.Buffer ??= Buffer
}
