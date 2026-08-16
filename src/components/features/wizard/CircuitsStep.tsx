import { type FormEvent, useState } from 'react'
import {
	type Column,
	UaAlert,
	UaButton,
	UaButtonIcon,
	UaInputField,
	UaTable,
} from 'sanhaua/react'
import { circuitLabels, reportTexts } from '../../../content/report'
import { useCircuits } from '../../../hooks/useCircuits'
import type { CircuitInput } from '../../../services/circuits'
import { formatDecimal, toWireDecimal } from '../../../services/decimal'
import type { Circuit, ReportDetail } from '../../../services/types'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { SpareCircuitsPanel } from './SpareCircuitsPanel'
import './CircuitsStep.scss'

const { circuits: texts, wizard } = reportTexts

type CircuitFormState = Record<keyof CircuitInput, string>

const EMPTY_FORM: CircuitFormState = {
	circuitModel: '',
	phase: '',
	breaker: '',
	description: '',
	conductor: '',
	current: '',
}

/** Só `description` é opcional — os demais são `NOT NULL` no banco. */
const REQUIRED_FIELDS = [
	'circuitModel',
	'phase',
	'breaker',
	'conductor',
	'current',
] as const

interface CircuitsStepProps {
	report: ReportDetail
	onChanged: () => void
	onAdvance: () => void
	onPrevious: () => void
}

/**
 * §5 Parte III — CRUD de circuitos, **sem teto de quantidade**.
 *
 * O limite de 13 do legado era restrição das linhas fixas do `template.docx`,
 * não do domínio: do 14º circuito em diante os dados eram descartados em
 * silêncio no documento final.
 */
export function CircuitsStep({
	report,
	onChanged,
	onAdvance,
	onPrevious,
}: CircuitsStepProps) {
	const { circuits, isSubmitting, error, create, update, remove } = useCircuits(
		{
			reportId: report.id,
			initial: report.circuits,
			onChanged,
		},
	)

	const [form, setForm] = useState<CircuitFormState>(EMPTY_FORM)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [formError, setFormError] = useState<string | null>(null)
	/** Circuito aguardando confirmação de remoção; `null` fecha o diálogo. */
	const [circuitToRemove, setCircuitToRemove] = useState<Circuit | null>(null)

	function startEdit(circuit: Circuit) {
		setEditingId(circuit.id)
		setFormError(null)
		setForm({
			circuitModel: circuit.circuitModel,
			phase: circuit.phase,
			breaker: circuit.breaker,
			description: circuit.description ?? '',
			conductor: circuit.conductor,
			// O decimal do backend já vem no formato do fio; exibi-lo em pt-BR aqui
			// só obrigaria a converter de volta na submissão.
			current: circuit.current,
		})
	}

	function resetForm() {
		setEditingId(null)
		setFormError(null)
		setForm(EMPTY_FORM)
	}

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()

		const missing = REQUIRED_FIELDS.filter((key) => form[key].trim() === '')

		if (missing.length > 0) {
			setFormError(wizard.incomplete(missing.length))
			return
		}

		const current = toWireDecimal(form.current)

		if (current === null) {
			setFormError(wizard.invalidDecimal)
			return
		}

		const input: CircuitInput = {
			circuitModel: form.circuitModel.trim(),
			phase: form.phase.trim(),
			breaker: form.breaker.trim(),
			// `null` explícito limpa a descrição num PATCH; string vazia não é o
			// mesmo que "sem descrição" para o backend.
			description: form.description.trim() || null,
			conductor: form.conductor.trim(),
			current,
		}

		const saved =
			editingId === null ? await create(input) : await update(editingId, input)

		if (saved) {
			resetForm()
		}
	}

	const columns: Column<Circuit>[] = [
		{
			key: 'circuitModel',
			header: circuitLabels.circuitModel,
			render: (circuit) => circuit.circuitModel,
		},
		{ key: 'phase', header: circuitLabels.phase, render: (c) => c.phase },
		{ key: 'breaker', header: circuitLabels.breaker, render: (c) => c.breaker },
		{
			key: 'conductor',
			header: circuitLabels.conductor,
			render: (circuit) => circuit.conductor,
		},
		{
			key: 'current',
			header: circuitLabels.current,
			render: (circuit) => formatDecimal(circuit.current, { unit: 'A' }),
		},
		{
			key: 'description',
			header: circuitLabels.description,
			render: (circuit) => circuit.description ?? '—',
		},
		{
			key: 'actions',
			header: texts.actions,
			render: (circuit) => (
				<div className="row-actions">
					<UaButtonIcon
						icon="edit"
						label={`${texts.edit} ${circuit.circuitModel}`}
						onClick={() => startEdit(circuit)}
						size="small"
					/>
					<UaButtonIcon
						appearance="danger"
						icon="delete"
						label={`${texts.remove} ${circuit.circuitModel}`}
						onClick={() => setCircuitToRemove(circuit)}
						size="small"
					/>
				</div>
			),
		},
	]

	return (
		<section className="circuits-step">
			<header className="intro">
				<h2 className="title">{texts.title}</h2>
				<p className="description">{texts.description}</p>
			</header>

			<SpareCircuitsPanel
				declared={report.qualitativeAssessment?.spareCircuitCapacity ?? null}
				spareCircuits={report.spareCircuits}
			/>

			{error ? <UaAlert appearance="danger" description={error} /> : null}
			{formError ? (
				<UaAlert appearance="warning" description={formError} />
			) : null}

			<form className="circuit-form" noValidate onSubmit={handleSubmit}>
				<div className="grid">
					<UaInputField
						label={circuitLabels.circuitModel}
						name="circuitModel"
						onChange={(event) =>
							setForm({ ...form, circuitModel: event.target.value })
						}
						placeholder="C1"
						required
						value={form.circuitModel}
						widthBehavior="full"
					/>
					<UaInputField
						label={circuitLabels.phase}
						name="phase"
						onChange={(event) =>
							setForm({ ...form, phase: event.target.value })
						}
						placeholder="A"
						required
						value={form.phase}
						widthBehavior="full"
					/>
					<UaInputField
						label={circuitLabels.breaker}
						name="breaker"
						onChange={(event) =>
							setForm({ ...form, breaker: event.target.value })
						}
						placeholder="Disjuntor 20A curva C"
						required
						value={form.breaker}
						widthBehavior="full"
					/>
					<UaInputField
						label={circuitLabels.conductor}
						name="conductor"
						onChange={(event) =>
							setForm({ ...form, conductor: event.target.value })
						}
						placeholder="2,5 mm²"
						required
						value={form.conductor}
						widthBehavior="full"
					/>
					<UaInputField
						inputMode="decimal"
						label={circuitLabels.current}
						name="current"
						onChange={(event) =>
							setForm({ ...form, current: event.target.value })
						}
						placeholder="12,40"
						required
						value={form.current}
						widthBehavior="full"
					/>
					<UaInputField
						label={circuitLabels.description}
						name="description"
						onChange={(event) =>
							setForm({ ...form, description: event.target.value })
						}
						value={form.description}
						widthBehavior="full"
					/>
				</div>

				<div className="form-actions">
					{editingId === null ? null : (
						<UaButton appearance="tertiary" onClick={resetForm} type="button">
							{texts.cancel}
						</UaButton>
					)}
					<UaButton disabled={isSubmitting} type="submit">
						{editingId === null ? texts.add : texts.save}
					</UaButton>
				</div>
			</form>

			<UaTable
				caption={texts.caption}
				columns={columns}
				emptyState={texts.empty}
				rowKey={(circuit) => circuit.id}
				rows={circuits}
			/>

			<div className="actions">
				<UaButton appearance="tertiary" onClick={onPrevious} type="button">
					{wizard.previous}
				</UaButton>
				<UaButton onClick={onAdvance} type="button">
					{wizard.next}
				</UaButton>
			</div>

			<ConfirmDialog
				appearance="danger"
				confirmLabel={texts.remove}
				description={
					circuitToRemove === null
						? ''
						: texts.confirmRemove(circuitToRemove.circuitModel)
				}
				isOpen={circuitToRemove !== null}
				onClose={() => setCircuitToRemove(null)}
				onConfirm={() => {
					if (circuitToRemove !== null) {
						void remove(circuitToRemove.id)
					}
					setCircuitToRemove(null)
				}}
				title={texts.remove}
			/>
		</section>
	)
}
