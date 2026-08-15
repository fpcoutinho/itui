import { type FormEvent, useState } from 'react'
import { UaAlert, UaButton, UaInputField } from 'sanhaua/react'
import { platformTexts } from '../../content/platform'
import { useCreateReport } from '../../hooks/useCreateReport'
import { LOCATION_CODE_PATTERN } from '../../services/reports'
import type { CreatedReport } from '../../services/types'
import './CreateReportForm.scss'

interface CreateReportFormProps {
	onCreated: (report: CreatedReport) => void
	onCancel: () => void
}

/** Campos de identidade do laudo (§1). As seções são preenchidas depois, no wizard. */
export function CreateReportForm({
	onCreated,
	onCancel,
}: CreateReportFormProps) {
	const { create, isSubmitting, error } = useCreateReport()

	const [locationCode, setLocationCode] = useState('')
	const [inspectedAt, setInspectedAt] = useState('')
	const [ambientTemperature, setAmbientTemperature] = useState('')
	const [weatherConditions, setWeatherConditions] = useState('')
	const [responsibleParties, setResponsibleParties] = useState('')
	const [fieldError, setFieldError] = useState<string | null>(null)

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		setFieldError(null)

		const code = locationCode.trim().toUpperCase()

		// Validar aqui poupa um round-trip óbvio. A regra de verdade continua sendo
		// a do backend, e o 422 dele é o que vai à tela se passar daqui.
		if (!LOCATION_CODE_PATTERN.test(code)) {
			setFieldError(platformTexts.form.locationCodeInvalid)
			return
		}

		if (!inspectedAt) {
			setFieldError(platformTexts.form.inspectedAtRequired)
			return
		}

		const temperature = ambientTemperature.trim()

		const report = await create({
			locationCode: code,
			// `datetime-local` entrega hora local sem fuso; o contrato pede ISO-8601
			// em UTC.
			inspectedAt: new Date(inspectedAt).toISOString(),
			ambientTemperatureC: temperature === '' ? null : Number(temperature),
			weatherConditions: weatherConditions.trim() || null,
			responsibleParties: responsibleParties
				.split(',')
				.map((name) => name.trim())
				.filter(Boolean),
		})

		if (report) {
			onCreated(report)
		}
	}

	return (
		<div className="create-report-wrapper">
			{(fieldError ?? error) ? (
				<UaAlert appearance="danger" description={fieldError ?? error} />
			) : null}

			<form className="create-report" noValidate onSubmit={handleSubmit}>
				<div className="grid">
					<UaInputField
						autoComplete="off"
						hint={platformTexts.form.locationCodeHint}
						label={platformTexts.form.locationCode}
						name="locationCode"
						onChange={(event) =>
							setLocationCode(event.target.value.toUpperCase())
						}
						placeholder="CCHLA-102"
						required
						value={locationCode}
						widthBehavior="full"
					/>

					<UaInputField
						label={platformTexts.form.inspectedAt}
						name="inspectedAt"
						onChange={(event) => setInspectedAt(event.target.value)}
						required
						type="datetime-local"
						value={inspectedAt}
						widthBehavior="full"
					/>

					<UaInputField
						inputMode="numeric"
						label={platformTexts.form.ambientTemperature}
						name="ambientTemperatureC"
						onChange={(event) => setAmbientTemperature(event.target.value)}
						type="number"
						value={ambientTemperature}
						widthBehavior="full"
					/>

					<UaInputField
						label={platformTexts.form.weatherConditions}
						name="weatherConditions"
						onChange={(event) => setWeatherConditions(event.target.value)}
						placeholder={platformTexts.form.weatherConditionsPlaceholder}
						value={weatherConditions}
						widthBehavior="full"
					/>
				</div>

				<UaInputField
					hint={platformTexts.form.responsiblePartiesHint}
					label={platformTexts.form.responsibleParties}
					name="responsibleParties"
					onChange={(event) => setResponsibleParties(event.target.value)}
					value={responsibleParties}
					widthBehavior="full"
				/>

				<div className="actions">
					<UaButton appearance="tertiary" onClick={onCancel} type="button">
						{platformTexts.cancel}
					</UaButton>
					<UaButton disabled={isSubmitting} type="submit">
						{isSubmitting
							? platformTexts.form.submitting
							: platformTexts.form.submit}
					</UaButton>
				</div>
			</form>
		</div>
	)
}
