/**
 * Schema declarativo das seções do laudo.
 *
 * O legado declarava cada campo em três lugares (model, form, template) e o
 * documento gerado dependia de os três concordarem. Aqui existe **uma** lista
 * por seção: ela define o que é renderizado, o que é validado e o que entra no
 * corpo do `PATCH`. Componente de formulário não conhece campo nenhum — recebe
 * descritor.
 *
 * Rótulo e opção normativa não são redigitados: vêm de `nbr-5410-choices.json`
 * e `nbr-5410-tests.json` (via `nbr.ts`) ou de `content/report.ts`, que
 * transcreve o `domain-glossary.md`.
 */

import {
	inspectionPlanningLabels,
	measurementLabels,
	qualitativeLabels,
	testLabels,
} from '../content/report'
import type {
	BinaryAnswer,
	ExternalInfluences,
	InspectionPlanning,
	QualitativeAssessment,
	QuantitativeAssessment,
	TernaryAnswer,
} from '../services/types'
import {
	externalInfluenceChoice,
	externalInfluenceKeys,
	planningChoice,
	qualitativeChoice,
	qualitativeClause,
	testClause,
} from './nbr'

// -- Descritores -------------------------------------------------------------

interface FieldBase<K> {
	key: K
	label: string
}

export interface BooleanField<K> extends FieldBase<K> {
	kind: 'boolean'
}

export interface SingleChoiceField<K> extends FieldBase<K> {
	kind: 'single-choice'
	options: readonly string[]
	/** Cláusula NBR exibida junto do campo, quando a fonte a traz. */
	nbrClause?: string | null
}

export interface MultiChoiceField<K> extends FieldBase<K> {
	kind: 'multi-choice'
	options: readonly string[]
}

export interface TernaryField<K> extends FieldBase<K> {
	kind: 'ternary'
	nbrClause: string | null
}

export interface BinaryField<K> extends FieldBase<K> {
	kind: 'binary'
	nbrClause: string
	acceptance: string
	/**
	 * Chave do ensaio em `nbr-5410-tests.json`, em `snake_case`. O procedimento é
	 * resolvido na renderização porque um deles (7.3.5) depende do esquema de
	 * aterramento declarado em outra seção.
	 */
	testKey: string
}

export interface DecimalField<K> extends FieldBase<K> {
	kind: 'decimal'
	unit: string
}

export type Field<K> =
	| BooleanField<K>
	| SingleChoiceField<K>
	| MultiChoiceField<K>
	| TernaryField<K>
	| BinaryField<K>
	| DecimalField<K>

/** Estado de trabalho do formulário: a seção ainda incompleta. */
export type Draft<T> = { [K in keyof T]?: T[K] }

// -- §2 Planejamento e segurança ---------------------------------------------

type PlanningKey = keyof InspectionPlanning

const booleanPlanningField = (
	key: keyof typeof inspectionPlanningLabels,
): BooleanField<PlanningKey> => ({
	kind: 'boolean',
	key,
	label: inspectionPlanningLabels[key],
})

const choicePlanningField = (
	key: PlanningKey,
	source: string,
): SingleChoiceField<PlanningKey> | MultiChoiceField<PlanningKey> => {
	const entry = planningChoice(source)

	return entry.multiple
		? { kind: 'multi-choice', key, label: entry.label, options: entry.options }
		: { kind: 'single-choice', key, label: entry.label, options: entry.options }
}

/** Ordem do `domain-glossary.md` §2 — é a ordem em que a equipe preenche em campo. */
export const inspectionPlanningFields: readonly Field<PlanningKey>[] = [
	choicePlanningField(
		'professionalQualification',
		'professional_qualification',
	),
	booleanPlanningField('teamFitForWork'),
	booleanPlanningField('safetyBriefingHeld'),
	booleanPlanningField('hasNr10Training'),
	booleanPlanningField('servicePreChecked'),
	choicePlanningField('identifiedHazards', 'identified_hazards'),
	choicePlanningField('safetyEquipment', 'safety_equipment'),
	booleanPlanningField('requiresShutdown'),
	choicePlanningField('signageUsed', 'signage_used'),
	booleanPlanningField('requiresAreaDelimitation'),
	booleanPlanningField('requiresUtilityAssistance'),
	booleanPlanningField('requiresVoltageCheck'),
	booleanPlanningField('requiresTemporaryGrounding'),
	booleanPlanningField('workAtHeight'),
	booleanPlanningField('requiresSafetyHarness'),
	booleanPlanningField('safetyRequirementsMet'),
	booleanPlanningField('requiresReassessment'),
]

// -- §3 Influências externas -------------------------------------------------

type InfluenceKey = keyof ExternalInfluences

const toCamel = (key: string): string =>
	key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase())

/**
 * Os 22 campos saem inteiros do JSON — chave, rótulo, grupo NBR, cláusula e
 * opções. Não há lista de campos escrita aqui: acrescentar uma classe ao JSON
 * acrescenta o campo ao formulário.
 */
export const externalInfluenceFields: readonly SingleChoiceField<InfluenceKey>[] =
	externalInfluenceKeys.map((source) => {
		const entry = externalInfluenceChoice(source)

		return {
			kind: 'single-choice',
			key: toCamel(source) as InfluenceKey,
			label: entry.nbrGroup
				? `${entry.nbrGroup} — ${entry.label}`
				: entry.label,
			options: entry.options,
			nbrClause: entry.nbrClause ?? null,
		}
	})

// -- §4 Avaliação qualitativa ------------------------------------------------

type QualitativeKey = keyof QualitativeAssessment

const ternaryField = (
	key: keyof typeof qualitativeLabels,
	source: string,
): TernaryField<QualitativeKey> => ({
	kind: 'ternary',
	key,
	label: qualitativeLabels[key],
	nbrClause: qualitativeClause(source),
})

const qualitativeSingleChoice = (
	key: QualitativeKey,
	source: 'spare_circuit_capacity' | 'earthing_system_type',
): SingleChoiceField<QualitativeKey> => {
	const entry = qualitativeChoice(source)

	return {
		kind: 'single-choice',
		key,
		label: entry.label,
		options: entry.options,
		nbrClause: qualitativeClause(source),
	}
}

/**
 * Ordem do glossário §4. Os itens 10 e 20 são escolha única, não o par
 * resposta+observação — é a exceção que o contrato descreve, e ela vive aqui,
 * não espalhada em `if` de componente.
 */
export const qualitativeAssessmentFields: readonly Field<QualitativeKey>[] = [
	ternaryField(
		'hasInstallationDocumentation',
		'has_installation_documentation',
	),
	ternaryField(
		'renovationDocumentationUpdated',
		'renovation_documentation_updated',
	),
	ternaryField(
		'inspectedBeforeCommissioning',
		'inspected_before_commissioning',
	),
	ternaryField(
		'wiringAllowsMaintenanceAccess',
		'wiring_allows_maintenance_access',
	),
	ternaryField(
		'componentsSelectedForExternalInfluences',
		'components_selected_for_external_influences',
	),
	ternaryField('wiringCorrectlyInstalled', 'wiring_correctly_installed'),
	ternaryField('outletsComplyNbr14136', 'outlets_comply_nbr14136'),
	ternaryField('sufficientOutletCount', 'sufficient_outlet_count'),
	ternaryField('distributionBoardAccessible', 'distribution_board_accessible'),
	qualitativeSingleChoice('spareCircuitCapacity', 'spare_circuit_capacity'),
	ternaryField(
		'distributionBoardWarningLabels',
		'distribution_board_warning_labels',
	),
	ternaryField('protectionDevicesIdentified', 'protection_devices_identified'),
	ternaryField(
		'protectionMatchesConductorGauge',
		'protection_matches_conductor_gauge',
	),
	ternaryField('hasNeutralAndEarthBusbars', 'has_neutral_and_earth_busbars'),
	ternaryField(
		'terminalsMatchConductorGauge',
		'terminals_match_conductor_gauge',
	),
	ternaryField('conductorsColorIdentified', 'conductors_color_identified'),
	ternaryField('hasResidualCurrentDevice', 'has_residual_current_device'),
	ternaryField('hasSurgeProtectionDevice', 'has_surge_protection_device'),
	ternaryField('hasSafetyServiceEquipment', 'has_safety_service_equipment'),
	qualitativeSingleChoice('earthingSystemType', 'earthing_system_type'),
	ternaryField('hasBackupPowerSource', 'has_backup_power_source'),
	ternaryField('hasSafetyPowerSource', 'has_safety_power_source'),
	ternaryField(
		'hasSourceParallelingPrevention',
		'has_source_paralleling_prevention',
	),
]

// -- §5 Avaliação quantitativa -----------------------------------------------

type QuantitativeKey = keyof QuantitativeAssessment

/** Parte I — 13 medições. Decimais em string, do teclado ao fio. */
export const measurementFields: readonly DecimalField<QuantitativeKey>[] = (
	Object.keys(measurementLabels) as (keyof typeof measurementLabels)[]
).map((key) => ({
	kind: 'decimal',
	key,
	label: measurementLabels[key].label,
	unit: measurementLabels[key].unit,
}))

const snakeTestKey: Record<keyof typeof testLabels, string> = {
	continuityTest: 'continuity_test',
	insulationResistanceTest: 'insulation_resistance_test',
	selvPelvSeparationTest: 'selv_pelv_separation_test',
	equipotentialBondingTest: 'equipotential_bonding_test',
	appliedVoltageTest: 'applied_voltage_test',
	functionalTest: 'functional_test',
}

/** Parte II — os 6 ensaios. Binários: `Sim`/`Não`, sem `Parcialmente`. */
export const testFields: readonly BinaryField<QuantitativeKey>[] = (
	Object.keys(testLabels) as (keyof typeof testLabels)[]
).map((key) => ({
	kind: 'binary',
	key,
	label: testLabels[key].label,
	acceptance: testLabels[key].acceptance,
	nbrClause: testClause(snakeTestKey[key]),
	testKey: snakeTestKey[key],
}))

export const quantitativeAssessmentFields: readonly Field<QuantitativeKey>[] = [
	...measurementFields,
	...testFields,
]

// -- Validação ---------------------------------------------------------------

const isTernary = (value: unknown): value is TernaryAnswer =>
	typeof value === 'object' &&
	value !== null &&
	['yes', 'no', 'partial'].includes((value as TernaryAnswer).answer)

const isBinary = (value: unknown): value is BinaryAnswer =>
	typeof value === 'object' &&
	value !== null &&
	['yes', 'no'].includes((value as BinaryAnswer).answer)

const DECIMAL_PATTERN = /^-?\d+([.,]\d+)?$/

/**
 * Um campo está preenchido?
 *
 * Isso é o que decide se a seção pode ser submetida — o `PATCH` substitui a
 * seção inteira, então meia seção não é um estado que o backend aceite.
 *
 * Array vazio conta como preenchido: "nenhum risco detectado" é uma resposta
 * legítima do profissional, e nem `identified_hazards` nem `safety_equipment`
 * têm uma opção "Nenhum" para expressá-la. `notes` também é opcional em todo
 * par resposta+observação — o obrigatório é o `answer`.
 */
export function isFieldFilled<K>(field: Field<K>, value: unknown): boolean {
	switch (field.kind) {
		case 'boolean':
			return typeof value === 'boolean'
		case 'single-choice':
			return typeof value === 'string' && value !== ''
		case 'multi-choice':
			return Array.isArray(value)
		case 'ternary':
			return isTernary(value)
		case 'binary':
			return isBinary(value)
		case 'decimal':
			return typeof value === 'string' && DECIMAL_PATTERN.test(value.trim())
	}
}

/** Chaves ainda não preenchidas, na ordem do schema. */
export function missingFields<T, K extends keyof T>(
	fields: readonly Field<K>[],
	draft: Draft<T>,
): K[] {
	return fields
		.filter((field) => !isFieldFilled(field, draft[field.key]))
		.map((field) => field.key)
}
