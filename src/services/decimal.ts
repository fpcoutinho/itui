/**
 * Decimais do backend são **string** (`"127.30"`) e continuam string em todo o
 * caminho de ida: `numeric` no Postgres e `rust_decimal::Decimal` no Rust
 * existem para não perder precisão, e passar por `parseFloat` antes de enviar
 * desfaria essa garantia no último metro.
 *
 * Este módulo é só a camada de **exibição**. Nada daqui pode alimentar o corpo
 * de uma requisição.
 */

/**
 * Formata um decimal do backend para exibição em pt-BR (`"127.30"` → `"127,30"`).
 *
 * A conversão para `number` acontece aqui e morre aqui.
 */
export function formatDecimal(
	value: string | null | undefined,
	options: { unit?: string; fractionDigits?: number } = {},
): string {
	if (value === null || value === undefined || value === '') {
		return '—'
	}

	const parsed = Number(value)

	if (Number.isNaN(parsed)) {
		// Decimal ilegível é dado corrompido, não caso de uso: mostrar o original
		// em vez de "NaN" mantém o valor auditável na tela.
		return value
	}

	const digits = options.fractionDigits ?? decimalPlaces(value)

	const formatted = parsed.toLocaleString('pt-BR', {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits,
	})

	return options.unit ? `${formatted} ${options.unit}` : formatted
}

/** Casas decimais que o backend enviou — preservá-las é preservar a precisão declarada. */
function decimalPlaces(value: string): number {
	const separator = value.indexOf('.')
	return separator === -1 ? 0 : value.length - separator - 1
}

/**
 * Normaliza o que o usuário digitou (`"12,40"`) para o formato do fio
 * (`"12.40"`), sem passar por `number`.
 *
 * Devolve `null` quando o texto não é um decimal válido — cabe a quem chama
 * decidir se isso é erro de formulário.
 */
export function toWireDecimal(input: string): string | null {
	const normalized = input.trim().replace(',', '.')

	if (!/^-?\d+(\.\d+)?$/.test(normalized)) {
		return null
	}

	return normalized
}
