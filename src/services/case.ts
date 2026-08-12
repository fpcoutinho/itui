/**
 * Conversão de nomenclatura entre o fio (`snake_case`, como o raijin serializa)
 * e a aplicação (`camelCase`).
 *
 * Isto roda em um lugar só: dentro do `request()` de `http.ts`. Nenhum outro
 * módulo converte nada — é o que mantém a borda sendo de fato uma borda.
 */

/**
 * Chaves cujo **valor** atravessa a conversão intacto.
 *
 * `document_content` é a árvore livre do editor TipTap. As chaves lá dentro são
 * vocabulário do TipTap (`textAlign`, `colspan`, `tightList`), não do nosso
 * domínio: converter na ida gravaria um documento que o TipTap não sabe ler, e
 * converter na volta corromperia o que já está gravado. O mesmo vale para
 * qualquer `attrs` de nó.
 */
const OPAQUE_KEYS = new Set(['document_content', 'documentContent', 'attrs'])

const snakeToCamel = (key: string): string =>
	key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase())

const camelToSnake = (key: string): string =>
	key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)

type Plain = Record<string, unknown>

const isPlainObject = (value: unknown): value is Plain =>
	typeof value === 'object' &&
	value !== null &&
	(Object.getPrototypeOf(value) === Object.prototype ||
		Object.getPrototypeOf(value) === null)

function convert(value: unknown, transform: (key: string) => string): unknown {
	if (Array.isArray(value)) {
		return value.map((item) => convert(item, transform))
	}

	if (!isPlainObject(value)) {
		// Strings (inclusive os decimais), números, booleanos, null, Date, File —
		// tudo passa direto.
		return value
	}

	const result: Plain = {}

	for (const [key, entry] of Object.entries(value)) {
		result[transform(key)] = OPAQUE_KEYS.has(key)
			? entry
			: convert(entry, transform)
	}

	return result
}

/** Corpo recebido do backend → forma consumida pela aplicação. */
export const toCamelCase = <T>(value: unknown): T =>
	convert(value, snakeToCamel) as T

/** Corpo montado pela aplicação → forma enviada ao backend. */
export const toSnakeCase = (value: unknown): unknown =>
	convert(value, camelToSnake)
