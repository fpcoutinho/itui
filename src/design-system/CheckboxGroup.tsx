import type { ReactNode } from 'react'
import './CheckboxGroup.scss'

export interface CheckboxOption {
	value: string
	label: string
}

interface CheckboxGroupProps {
	/** Vira o `name` de cada `<input>` e a base dos `id`. */
	name: string
	legend: ReactNode
	options: readonly CheckboxOption[]
	value: readonly string[]
	onChange: (next: string[]) => void
	hint?: ReactNode
	error?: string | null
	required?: boolean
}

/**
 * Grupo de seleção múltipla.
 *
 * Está aqui, e não em `components/`, porque não sabe nada de laudo, de sessão
 * nem de API — é candidato a subir para o Sanhauá, que hoje tem `UaInputRadio`
 * mas nenhum equivalente de checkbox. Ver `docs/design-system-candidates.md`.
 *
 * `fieldset`/`legend` de verdade: é o que faz o leitor de tela anunciar a
 * pergunta antes de cada opção. Uma `<div>` com `<p>` acima leria as oito
 * opções sem dizer a que pergunta pertencem.
 */
export function CheckboxGroup({
	name,
	legend,
	options,
	value,
	onChange,
	hint,
	error,
	required,
}: CheckboxGroupProps) {
	const errorId = `${name}-error`
	const hintId = `${name}-hint`

	const toggle = (option: string, checked: boolean) => {
		onChange(
			checked
				? [...value, option]
				: value.filter((selected) => selected !== option),
		)
	}

	return (
		<fieldset
			aria-describedby={error ? errorId : hint ? hintId : undefined}
			aria-invalid={error ? true : undefined}
			className={error ? 'checkbox-group error' : 'checkbox-group'}
		>
			<legend className="legend">
				{legend}
				{required ? <span aria-hidden="true"> *</span> : null}
			</legend>

			<div className="options">
				{options.map((option) => {
					const id = `${name}-${option.value}`

					return (
						<label className="option" htmlFor={id} key={option.value}>
							<input
								checked={value.includes(option.value)}
								id={id}
								name={name}
								onChange={(event) => toggle(option.value, event.target.checked)}
								type="checkbox"
							/>
							<span className="text">{option.label}</span>
						</label>
					)
				})}
			</div>

			{error ? (
				<p className="message" id={errorId} role="alert">
					{error}
				</p>
			) : hint ? (
				<p className="hint" id={hintId}>
					{hint}
				</p>
			) : null}
		</fieldset>
	)
}
