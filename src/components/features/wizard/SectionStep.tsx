import type { ReactNode } from 'react'
import { UaAlert, UaButton } from 'sanhaua/react'
import { reportTexts } from '../../../content/report'
import type { Field } from '../../../domain/reportSchema'
import { useSectionForm } from '../../../hooks/useSectionForm'
import type { Report } from '../../../services/types'
import { SchemaField } from './SchemaField'
import './SectionStep.scss'

const { wizard } = reportTexts

export interface FieldGroup<K> {
	title?: string
	description?: ReactNode
	fields: readonly Field<K>[]
}

interface SectionStepProps<T extends object> {
	title: string
	description?: ReactNode
	/** Universo de validação: a seção só é submetida quando todos estão preenchidos. */
	fields: readonly Field<keyof T>[]
	/** Agrupamento de exibição. Ausente, os campos saem numa lista só. */
	groups?: readonly FieldGroup<keyof T>[]
	/** Seção já gravada, ou `null` se a etapa ainda não foi concluída. */
	initial: T | null
	submit: (section: T) => Promise<Report>
	onSaved: (report: Report) => void
	onAdvance: () => void
	onPrevious?: () => void
	/** Conteúdo acima dos campos (ex.: painel de espaço-reserva). */
	header?: ReactNode
	/** Texto normativo de apoio por campo — ver a Parte II da quantitativa. */
	support?: (field: Field<keyof T>) => ReactNode
}

/**
 * Uma etapa do wizard ligada a uma seção JSONB.
 *
 * As quatro seções tipadas usam este mesmo componente: o que muda entre elas é
 * o schema, não o comportamento. O `PATCH` só sai com a seção **completa** —
 * ver `useSectionForm`.
 */
export function SectionStep<T extends object>({
	title,
	description,
	fields,
	groups,
	initial,
	submit,
	onSaved,
	onAdvance,
	onPrevious,
	header,
	support,
}: SectionStepProps<T>) {
	const form = useSectionForm<T>({ fields, initial, submit, onSaved })

	const missing = new Set(form.missing)
	const displayGroups = groups ?? [{ fields }]

	async function handleSave() {
		if (await form.save()) {
			onAdvance()
		}
	}

	return (
		<section className="section-step">
			<header className="intro">
				<h2 className="title">{title}</h2>
				{description ? <p className="description">{description}</p> : null}
			</header>

			{header}

			{form.error ? (
				<UaAlert appearance="danger" description={form.error} />
			) : null}

			{form.showErrors && missing.size > 0 ? (
				<UaAlert
					appearance="warning"
					description={wizard.incomplete(missing.size)}
				/>
			) : null}

			<div className="groups">
				{displayGroups.map((group, index) => (
					<div className="group" key={group.title ?? `group-${String(index)}`}>
						{group.title ? (
							<h3 className="group-title">{group.title}</h3>
						) : null}
						{group.description ? (
							<p className="group-description">{group.description}</p>
						) : null}

						<div className="fields">
							{group.fields.map((field) => (
								<SchemaField
									error={
										form.showErrors && missing.has(field.key)
											? wizard.requiredField
											: null
									}
									field={field as Field<string>}
									key={String(field.key)}
									// A tipagem por campo vive no schema e em `Draft<T>`; aqui o
									// valor atravessa como `unknown` de propósito, para que este
									// componente continue sem saber nada dos ~90 campos. O cast é
									// o único ponto onde os dois lados se encontram.
									onChange={(value) =>
										form.setField(field.key, value as T[keyof T])
									}
									support={support?.(field)}
									value={form.draft[field.key]}
								/>
							))}
						</div>
					</div>
				))}
			</div>

			<div className="actions">
				{onPrevious ? (
					<UaButton appearance="tertiary" onClick={onPrevious} type="button">
						{wizard.previous}
					</UaButton>
				) : null}

				<UaButton
					disabled={form.isSubmitting}
					onClick={handleSave}
					type="button"
				>
					{form.isSubmitting ? wizard.saving : wizard.save}
				</UaButton>
			</div>
		</section>
	)
}
