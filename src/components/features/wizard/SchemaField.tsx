import type { ReactNode } from 'react'
import {
	UaCheckbox,
	UaInputField,
	UaInputGroup,
	UaRadio,
	UaSelect,
	UaTextarea,
} from 'sanhaua/react'
import { reportTexts } from '../../../content/report'
import type { Field } from '../../../domain/reportSchema'
import type { BinaryAnswer, TernaryAnswer } from '../../../services/types'
import './SchemaField.scss'

const { answers, wizard } = reportTexts

/** Rótulo pt-BR de cada resposta. O valor gravado é sempre o slug em inglês. */
const ANSWER_OPTIONS = {
	ternary: [
		{ value: 'yes', label: answers.yes },
		{ value: 'no', label: answers.no },
		{ value: 'partial', label: answers.partial },
	],
	binary: [
		{ value: 'yes', label: answers.yes },
		{ value: 'no', label: answers.no },
	],
} as const

interface SchemaFieldProps {
	field: Field<string>
	value: unknown
	onChange: (value: unknown) => void
	/** `null` enquanto o usuário não tentou salvar a seção incompleta. */
	error: string | null
	/** Texto normativo de apoio (procedimento, critério de aceitação, cláusula). */
	support?: ReactNode
}

/**
 * Renderiza **um** descritor do schema.
 *
 * Nenhum nome de campo do laudo aparece aqui: o componente conhece os seis
 * tipos de campo, não os ~90 campos. Acrescentar um item à norma é acrescentar
 * uma linha ao schema, não um `case` a este arquivo.
 */
export function SchemaField({
	field,
	value,
	onChange,
	error,
	support,
}: SchemaFieldProps) {
	const name = String(field.key)

	return (
		<div className="schema-field">
			{renderControl()}
			{support ? <div className="support">{support}</div> : null}
		</div>
	)

	function renderControl() {
		switch (field.kind) {
			case 'boolean':
				return (
					<RadioAnswer
						error={error}
						label={field.label}
						name={name}
						onChange={(next) => onChange(next === 'yes')}
						options={ANSWER_OPTIONS.binary}
						value={
							typeof value === 'boolean' ? (value ? 'yes' : 'no') : undefined
						}
					/>
				)

			case 'single-choice':
				return (
					<UaSelect
						error={error}
						hint={field.nbrClause ? `NBR 5410 ${field.nbrClause}` : undefined}
						label={field.label}
						name={name}
						onChange={onChange}
						// O par valor/rótulo vem pronto do schema: nas influências
						// externas o que se grava é o código da classe, não o texto
						// exibido. Reconstruí-lo aqui devolveria o bug.
						options={[...field.options]}
						required
						value={typeof value === 'string' ? value : ''}
						widthBehavior="full"
					/>
				)

			case 'multi-choice':
				return (
					<MultiChoice
						error={error}
						legend={field.label}
						name={name}
						onChange={onChange}
						options={field.options}
						value={Array.isArray(value) ? (value as string[]) : []}
					/>
				)

			case 'ternary':
			case 'binary':
				return (
					<AnswerWithNotes
						answer={value as TernaryAnswer | BinaryAnswer | undefined}
						error={error}
						hint={
							field.kind === 'ternary' && field.nbrClause
								? `NBR 5410 ${field.nbrClause}`
								: undefined
						}
						label={field.label}
						name={name}
						onChange={onChange}
						options={ANSWER_OPTIONS[field.kind]}
					/>
				)

			case 'decimal':
				return (
					<UaInputField
						error={error}
						inputMode="decimal"
						label={field.label}
						name={name}
						onChange={(event) => onChange(event.target.value)}
						required
						suffix={field.unit}
						value={typeof value === 'string' ? value : ''}
						widthBehavior="full"
					/>
				)
		}
	}
}

interface RadioOption {
	value: string
	label: string
}

/**
 * Seleção múltipla.
 *
 * O `UaInputGroup` é só a cápsula (`fieldset`/`legend`) — mapear as opções e
 * calcular o array resultante é de quem usa: marca acrescenta, desmarca filtra.
 */
function MultiChoice({
	name,
	legend,
	options,
	value,
	onChange,
	error,
}: {
	name: string
	legend: ReactNode
	options: readonly RadioOption[]
	value: readonly string[]
	onChange: (next: string[]) => void
	error: string | null
}) {
	return (
		<UaInputGroup error={error} legend={legend} required>
			{options.map((option) => (
				<UaCheckbox
					checked={value.includes(option.value)}
					id={`${name}-${option.value}`}
					key={option.value}
					label={option.label}
					name={name}
					onChange={(event) =>
						onChange(
							event.target.checked
								? [...value, option.value]
								: value.filter((selected) => selected !== option.value),
						)
					}
					value={option.value}
				/>
			))}
		</UaInputGroup>
	)
}

/**
 * Grupo de rádio com `fieldset`/`legend`.
 *
 * O `UaRadio` do Sanhauá é o controle individual — o agrupamento
 * semântico (a pergunta que o leitor de tela anuncia antes das opções) é de
 * quem usa.
 */
function RadioAnswer({
	name,
	label,
	options,
	value,
	onChange,
	error,
	hint,
}: {
	name: string
	label: ReactNode
	options: readonly RadioOption[]
	value: string | undefined
	onChange: (value: string) => void
	error: string | null
	hint?: string
}) {
	const messageId = `${name}-message`

	return (
		<fieldset
			aria-describedby={error || hint ? messageId : undefined}
			className="radio-answer"
		>
			<legend className="legend">{label}</legend>

			<div className="options">
				{options.map((option) => (
					<UaRadio
						checked={value === option.value}
						id={`${name}-${option.value}`}
						key={option.value}
						label={option.label}
						name={name}
						onChange={() => onChange(option.value)}
						value={option.value}
					/>
				))}
			</div>

			{error ? (
				<p className="message" id={messageId} role="alert">
					{error}
				</p>
			) : hint ? (
				<p className="hint" id={messageId}>
					{hint}
				</p>
			) : null}
		</fieldset>
	)
}

/**
 * O par resposta+observação da §4 e da §5 Parte II.
 *
 * A observação é opcional; o obrigatório é a resposta. As duas viajam juntas no
 * mesmo objeto (`{ answer, notes }`) — o legado guardava `"Sim: observação"`
 * numa string só e quebrava a exportação inteira quando o `": "` não existia.
 */
function AnswerWithNotes({
	name,
	label,
	options,
	answer,
	onChange,
	error,
	hint,
}: {
	name: string
	label: string
	options: readonly RadioOption[]
	answer: TernaryAnswer | BinaryAnswer | undefined
	onChange: (value: TernaryAnswer | BinaryAnswer) => void
	error: string | null
	hint?: string
}) {
	const notes = answer?.notes ?? ''

	return (
		<div className="answer-with-notes">
			<RadioAnswer
				error={error}
				hint={hint}
				label={label}
				name={name}
				onChange={(next) =>
					onChange({
						answer: next,
						notes,
					} as TernaryAnswer | BinaryAnswer)
				}
				options={options}
				value={answer?.answer}
			/>

			<UaTextarea
				aria-label={`${answers.notes} — ${label}`}
				name={`${name}-notes`}
				// Observação digitada antes da resposta **não** escolhe uma resposta:
				// o objeto sai com `answer` ainda indefinido e a validação continua
				// apontando o item como pendente. Assumir "Não" aqui responderia uma
				// pergunta normativa no lugar do engenheiro.
				onChange={(event) =>
					onChange({
						answer: answer?.answer,
						notes: event.target.value,
					} as unknown as TernaryAnswer | BinaryAnswer)
				}
				placeholder={answers.notesPlaceholder}
				rows={2}
				value={notes}
			/>
		</div>
	)
}

/** Mensagem exibida no campo faltante depois de uma tentativa de salvar. */
export const requiredFieldMessage = wizard.requiredField
