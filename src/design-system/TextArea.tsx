import { useId } from 'react'
import './TextArea.scss'

interface TextAreaProps {
	label: string
	value: string
	onChange: (value: string) => void
	name?: string
	placeholder?: string
	rows?: number
	hint?: string
	error?: string | null
	/** Esconde o rótulo visualmente sem tirá-lo do leitor de tela. */
	hideLabel?: boolean
}

/**
 * Campo de texto multilinha.
 *
 * Candidato ao Sanhauá pelo mesmo critério do `CheckboxGroup`: o pacote tem
 * `UaInputField` (linha única) e nada equivalente para texto longo, e este
 * componente não sabe nada do domínio. Repete o wiring de acessibilidade do
 * `UaInputField` — `aria-invalid`, `aria-describedby`, `role="alert"` — para
 * que os dois se comportem igual na mesma tela.
 */
export function TextArea({
	label,
	value,
	onChange,
	name,
	placeholder,
	rows = 3,
	hint,
	error,
	hideLabel,
}: TextAreaProps) {
	const id = useId()
	const messageId = `${id}-message`

	return (
		<div className={error ? 'text-area error' : 'text-area'}>
			<label
				className={hideLabel ? 'label visually-hidden' : 'label'}
				htmlFor={id}
			>
				{label}
			</label>

			<textarea
				aria-describedby={error || hint ? messageId : undefined}
				aria-invalid={error ? true : undefined}
				className="field"
				id={id}
				name={name}
				onChange={(event) => onChange(event.target.value)}
				placeholder={placeholder}
				rows={rows}
				value={value}
			/>

			{error ? (
				<p className="message" id={messageId} role="alert">
					{error}
				</p>
			) : hint ? (
				<p className="hint" id={messageId}>
					{hint}
				</p>
			) : null}
		</div>
	)
}
