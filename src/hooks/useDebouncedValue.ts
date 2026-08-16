import { useEffect, useState } from 'react'

/**
 * Atrasa a propagação de `value` até `delay` ms sem mudança. Serve pra campo de
 * busca: o input continua respondendo a cada tecla, mas quem dispara requisição
 * só vê o valor depois que o usuário parou de digitar.
 */
export function useDebouncedValue<T>(value: T, delay = 1000): T {
	const [debounced, setDebounced] = useState(value)

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay)
		return () => clearTimeout(timer)
	}, [value, delay])

	return debounced
}
