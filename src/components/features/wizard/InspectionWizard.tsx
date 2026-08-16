import { useCallback } from 'react'
import { reportTexts, sectionTitles } from '../../../content/report'
import { testProcedure } from '../../../domain/nbr'
import {
	externalInfluenceFields,
	type Field,
	inspectionPlanningFields,
	measurementFields,
	qualitativeAssessmentFields,
	quantitativeAssessmentFields,
	testFields,
} from '../../../domain/reportSchema'
import { useInspectionWizard } from '../../../hooks/useInspectionWizard'
import {
	updateExternalInfluences,
	updateInspectionPlanning,
	updateQualitativeAssessment,
	updateQuantitativeAssessment,
} from '../../../services/sections'
import type {
	ExternalInfluences,
	InspectionPlanning,
	QualitativeAssessment,
	QuantitativeAssessment,
	Report,
	ReportDetail,
} from '../../../services/types'
import { ReportEditor } from '../editor/ReportEditor'
import { ExportStep } from '../export/ExportStep'
import { CircuitsStep } from './CircuitsStep'
import { ImagesStep } from './ImagesStep'
import { SectionStep } from './SectionStep'
import { SpareCircuitsPanel } from './SpareCircuitsPanel'
import { WizardSteps } from './WizardSteps'
import './InspectionWizard.scss'

const { wizard, quantitative } = reportTexts

interface InspectionWizardProps {
	report: ReportDetail
	/**
	 * Resposta de um `PATCH` de seção — `Report`, sem circuitos: quem recebe
	 * mescla no laudo em memória em vez de substituí-lo (ver `useReport`).
	 */
	onUpdated: (report: Report) => void
	/** Revalidação completa — usada após mutação de circuito, que não devolve o laudo. */
	onRefetch: () => void
}

/**
 * Wizard de inspeção.
 *
 * Orquestra apenas: a máquina de estados está em `useInspectionWizard`, o
 * estado de formulário em `useSectionForm`, e o que cada seção contém está no
 * schema. Nenhum nome de campo do laudo aparece neste arquivo.
 */
export function InspectionWizard({
	report,
	onUpdated,
	onRefetch,
}: InspectionWizardProps) {
	const { steps, current, currentIndex, isFirst, goTo, next, previous } =
		useInspectionWizard(report)

	const advance = useCallback(() => next(), [next])
	const goBack = isFirst ? undefined : previous

	/**
	 * O procedimento do ensaio 7.3.5 depende do esquema de aterramento declarado
	 * na §4 — que pode ainda não ter sido preenchido, já que a navegação é livre.
	 */
	const earthingSystemType = report.qualitativeAssessment?.earthingSystemType

	const testSupport = (field: Field<keyof QuantitativeAssessment>) => {
		if (field.kind !== 'binary') {
			return null
		}

		const procedure = testProcedure(field.testKey, earthingSystemType)

		return (
			<>
				<span className="term">{`${quantitative.clause} ${field.nbrClause}`}</span>
				<span className="value">
					<strong>{`${quantitative.procedure}: `}</strong>
					{procedure ?? quantitative.missingEarthingSystem}
				</span>
				<span className="value">
					<strong>{`${quantitative.acceptance}: `}</strong>
					{field.acceptance}
				</span>
			</>
		)
	}

	return (
		<div className="inspection-wizard">
			<WizardSteps current={current} onSelect={goTo} steps={steps} />

			<p className="position no-print">
				{wizard.stepPosition(currentIndex + 1, steps.length)}
			</p>

			{current === 'inspection_planning' ? (
				<SectionStep<InspectionPlanning>
					fields={inspectionPlanningFields}
					initial={report.inspectionPlanning}
					onAdvance={advance}
					onPrevious={goBack}
					onSaved={onUpdated}
					submit={(section) => updateInspectionPlanning(report.id, section)}
					title={sectionTitles.inspection_planning}
				/>
			) : null}

			{current === 'external_influences' ? (
				<SectionStep<ExternalInfluences>
					fields={externalInfluenceFields}
					initial={report.externalInfluences}
					onAdvance={advance}
					onPrevious={goBack}
					onSaved={onUpdated}
					submit={(section) => updateExternalInfluences(report.id, section)}
					title={sectionTitles.external_influences}
				/>
			) : null}

			{current === 'qualitative_assessment' ? (
				<SectionStep<QualitativeAssessment>
					fields={qualitativeAssessmentFields}
					header={
						<SpareCircuitsPanel
							declared={
								report.qualitativeAssessment?.spareCircuitCapacity ?? null
							}
							spareCircuits={report.spareCircuits}
						/>
					}
					initial={report.qualitativeAssessment}
					onAdvance={advance}
					onPrevious={goBack}
					onSaved={onUpdated}
					submit={(section) => updateQualitativeAssessment(report.id, section)}
					title={sectionTitles.qualitative_assessment}
				/>
			) : null}

			{current === 'quantitative_assessment' ? (
				<SectionStep<QuantitativeAssessment>
					fields={quantitativeAssessmentFields}
					groups={[
						{ title: quantitative.partOne, fields: measurementFields },
						{ title: quantitative.partTwo, fields: testFields },
					]}
					initial={report.quantitativeAssessment}
					onAdvance={advance}
					onPrevious={goBack}
					onSaved={onUpdated}
					submit={(section) => updateQuantitativeAssessment(report.id, section)}
					support={testSupport}
					title={sectionTitles.quantitative_assessment}
				/>
			) : null}

			{current === 'circuits' ? (
				<CircuitsStep
					onAdvance={advance}
					onChanged={onRefetch}
					onPrevious={previous}
					report={report}
				/>
			) : null}

			{current === 'images' ? (
				<ImagesStep
					onAdvance={advance}
					onPrevious={previous}
					reportId={report.id}
				/>
			) : null}

			{current === 'document' ? (
				<ReportEditor
					onAdvance={advance}
					onPrevious={previous}
					onSaved={onUpdated}
					report={report}
				/>
			) : null}

			{current === 'export' ? (
				<ExportStep onPrevious={previous} report={report} />
			) : null}
		</div>
	)
}
