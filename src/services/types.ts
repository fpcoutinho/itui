/**
 * Shapes da API do `raijin`, replicados à mão.
 *
 * Não há geração de tipos entre Rust e TypeScript: `docs/api-contract.md` é a
 * única especificação comum. Endpoint novo = shape novo escrito aqui, olhando o
 * contrato — nunca inferido de uma resposta observada.
 *
 * Os nomes aqui estão em `camelCase` porque descrevem o objeto **depois** da
 * conversão de borda (ver `case.ts`); no fio eles são `snake_case`.
 *
 * Nomes de campo de domínio vêm de `raijin/docs/domain-glossary.md`. Nenhum
 * deles é inventado aqui.
 */

/**
 * Decimal do backend (`numeric` no Postgres, `rust_decimal::Decimal` no Rust).
 *
 * Trafega e é armazenado como **string** de propósito: o `number` do JavaScript
 * é um double e perderia a precisão que o backend faz questão de garantir.
 * Nunca aplicar `parseFloat` antes de enviar; converter só para exibir, via
 * `formatDecimal` em `decimal.ts`.
 */
export type Decimal = string

/** Árvore de documento do TipTap. Estrutura livre — ver `OPAQUE_KEYS` em `case.ts`. */
export type TipTapDocument = Record<string, unknown>

// -- Autenticação -----------------------------------------------------------

export interface User {
	id: string
	email: string
	googleId: string | null
	avatarUrl: string | null
	createdAt: string
	updatedAt: string
}

/** Corpo comum a `/register`, `/login`, `/google` e `/refresh`. */
export interface Session {
	accessToken: string
	/** Sempre `"Bearer"`. Montar o header a partir daqui, não hardcodar o esquema. */
	tokenType: string
	/** Segundos até o vencimento do access token. Base do agendamento de renovação. */
	expiresIn: number
	user: User
}

// -- Laudos -----------------------------------------------------------------

export type ReportStatus = 'draft' | 'in_review' | 'approved' | 'archived'

/**
 * Seções do laudo. São as mesmas chaves usadas pelo `report_section` das
 * imagens e pelo campo `section` dos eventos SSE do `/generate`.
 */
export type ReportSection =
	| 'inspection_planning'
	| 'external_influences'
	| 'qualitative_assessment'
	| 'quantitative_assessment'
	| 'circuits'

/** Avaliação qualitativa (§4): ternária, com observação. */
export interface TernaryAnswer {
	answer: 'yes' | 'no' | 'partial'
	notes: string
}

/** Ensaios da avaliação quantitativa (§5 Parte II): binários, com observação. */
export interface BinaryAnswer {
	answer: 'yes' | 'no'
	notes: string
}

/**
 * As quatro seções tipadas, campo a campo.
 *
 * Os nomes são os de `raijin/docs/domain-glossary.md`, convertidos
 * mecanicamente para `camelCase` — a conversão de volta para `snake_case`
 * acontece no `request()` de `http.ts`, então o que se escreve aqui é o que o
 * backend recebe.
 *
 * Nenhum campo é opcional: o `PATCH` de seção **substitui a seção inteira**, e
 * a seção é a unidade de validação. Um `Partial<>` aqui deixaria passar em
 * tempo de compilação exatamente o corpo que o backend rejeita com `422`.
 */

/** §2 — 17 campos. `professionalQualification` e os três `string[]` são enums de `nbr-5410-choices.json`. */
export interface InspectionPlanning {
	professionalQualification: string
	teamFitForWork: boolean
	safetyBriefingHeld: boolean
	hasNr10Training: boolean
	servicePreChecked: boolean
	identifiedHazards: string[]
	safetyEquipment: string[]
	requiresShutdown: boolean
	signageUsed: string[]
	requiresAreaDelimitation: boolean
	requiresUtilityAssistance: boolean
	requiresVoltageCheck: boolean
	requiresTemporaryGrounding: boolean
	workAtHeight: boolean
	requiresSafetyHarness: boolean
	safetyRequirementsMet: boolean
	requiresReassessment: boolean
}

/**
 * §3 — as 22 classes NBR. Cada valor é **só o código** da classe (`"AA4"`,
 * `"AD3"`), não a opção inteira de `nbr-5410-choices.json`
 * (`"AA4 - Temperado (-5 ° a 40 °C)"`) — ver `docs/api-contract.md` §3. A
 * string completa é rótulo de exibição, e a ponte entre as duas formas é
 * `externalInfluenceCode` em `domain/nbr.ts`. Mandar a string inteira é `422`.
 *
 * `mechanicalImpactClass` (AG) e `vibrationClass` (AH) são campos separados: no
 * legado eram um só, mas são grupos independentes na norma.
 */
export interface ExternalInfluences {
	ambientTemperatureClass: string
	climaticConditionsClass: string
	altitudeClass: string
	waterPresenceClass: string
	solidBodiesPresenceClass: string
	corrosiveSubstancesClass: string
	mechanicalImpactClass: string
	vibrationClass: string
	floraAndMoldClass: string
	faunaPresenceClass: string
	electromagneticInfluenceClass: string
	solarRadiationClass: string
	lightningExposureClass: string
	airMovementClass: string
	windClass: string
	peopleCompetenceClass: string
	bodyElectricalResistanceClass: string
	earthPotentialContactClass: string
	evacuationConditionsClass: string
	processedMaterialsClass: string
	constructionMaterialsClass: string
	buildingStructureClass: string
}

/**
 * §4 — 21 itens ternários mais duas escolhas únicas.
 *
 * `spareCircuitCapacity` e `earthingSystemType` **não** usam o par
 * resposta+observação: são string de escolha única, e o backend rejeita o
 * objeto `{ answer, notes }` nesses dois campos.
 */
export interface QualitativeAssessment {
	hasInstallationDocumentation: TernaryAnswer
	renovationDocumentationUpdated: TernaryAnswer
	inspectedBeforeCommissioning: TernaryAnswer
	wiringAllowsMaintenanceAccess: TernaryAnswer
	componentsSelectedForExternalInfluences: TernaryAnswer
	wiringCorrectlyInstalled: TernaryAnswer
	outletsComplyNbr14136: TernaryAnswer
	sufficientOutletCount: TernaryAnswer
	distributionBoardAccessible: TernaryAnswer
	/** Faixa declarada pelo engenheiro. Não confundir com `SpareCircuits.required`, que é calculado. */
	spareCircuitCapacity: string
	distributionBoardWarningLabels: TernaryAnswer
	protectionDevicesIdentified: TernaryAnswer
	protectionMatchesConductorGauge: TernaryAnswer
	hasNeutralAndEarthBusbars: TernaryAnswer
	terminalsMatchConductorGauge: TernaryAnswer
	conductorsColorIdentified: TernaryAnswer
	hasResidualCurrentDevice: TernaryAnswer
	hasSurgeProtectionDevice: TernaryAnswer
	hasSafetyServiceEquipment: TernaryAnswer
	/** Determina o ramo condicional do ensaio 7.3.5 — ver `nbr-5410-tests.md`. */
	earthingSystemType: string
	hasBackupPowerSource: TernaryAnswer
	hasSafetyPowerSource: TernaryAnswer
	hasSourceParallelingPrevention: TernaryAnswer
}

/**
 * §5 Partes I e II — 13 medições decimais e 6 ensaios binários.
 *
 * As medições são `Decimal` (string) de ponta a ponta: `numeric` no Postgres
 * existe para não perder precisão, e um `parseFloat` antes do envio desfaria a
 * garantia no último metro.
 */
export interface QuantitativeAssessment {
	busbarCapacityAmps: Decimal
	mainBreakerRatingAmps: Decimal
	rcdRatingAmps: Decimal
	spdRatingAmps: Decimal
	voltageAbVolts: Decimal
	voltageAnVolts: Decimal
	currentPhaseAAmps: Decimal
	voltageBcVolts: Decimal
	voltageBnVolts: Decimal
	currentPhaseBAmps: Decimal
	voltageCaVolts: Decimal
	voltageCnVolts: Decimal
	currentPhaseCAmps: Decimal
	continuityTest: BinaryAnswer
	insulationResistanceTest: BinaryAnswer
	selvPelvSeparationTest: BinaryAnswer
	equipotentialBondingTest: BinaryAnswer
	appliedVoltageTest: BinaryAnswer
	functionalTest: BinaryAnswer
}

/**
 * Item da listagem (`GET /reports`).
 *
 * Vem **sem as seções JSONB** — o payload de listagem é leve de propósito. É um
 * tipo separado de `Report` justamente para que ninguém tente ler
 * `inspectionPlanning` de uma linha da lista.
 */
export interface ReportSummary {
	id: string
	locationCode: string
	inspectedAt: string
	status: ReportStatus
	createdAt: string
	updatedAt: string
}

/** Colunas ordenáveis da listagem. Os nomes são os do backend (`snake_case`). */
export type ReportSortField =
	| 'location_code'
	| 'inspected_at'
	| 'status'
	| 'created_at'
	| 'updated_at'

export type SortOrder = 'asc' | 'desc'

/**
 * Página da listagem de laudos.
 *
 * A listagem devolve envelope, não array: sem `totalItems`/`totalPages` a UI não
 * consegue dizer "página 3 de 12" nem desenhar a última página.
 */
export interface ReportPage {
	items: ReportSummary[]
	/** 1-based. */
	page: number
	pageSize: number
	totalItems: number
	totalPages: number
}

export interface Report {
	id: string
	authorId: string
	/** Padrão `BLOCO-SALA`. Ver `LOCATION_CODE_PATTERN` em `reports.ts`. */
	locationCode: string
	inspectedAt: string
	ambientTemperatureC: number | null
	weatherConditions: string | null
	responsibleParties: string[]
	status: ReportStatus
	/** `null` enquanto a etapa do wizard não foi concluída — nunca `{}`. */
	inspectionPlanning: InspectionPlanning | null
	externalInfluences: ExternalInfluences | null
	qualitativeAssessment: QualitativeAssessment | null
	quantitativeAssessment: QuantitativeAssessment | null
	/** Exceção à regra acima: nasce `{}` (árvore vazia do TipTap), nunca `null`. */
	documentContent: TipTapDocument
	createdAt: string
	updatedAt: string
}

/**
 * Espaço de reserva calculado (NBR 5410 6.5.4.7). Derivado e somente leitura:
 * recalculado a cada resposta a partir do número real de circuitos.
 *
 * `required` é `null` quando não há circuito cadastrado. Não confundir com o
 * `spare_circuit_capacity` da §4, que é a faixa declarada pelo engenheiro —
 * divergir entre os dois é informação para a UI apresentar, não veredito de
 * conformidade emitido pelo backend.
 */
export interface SpareCircuits {
	circuitCount: number
	required: number | null
}

/** `GET /reports/{id}` traz os circuitos embutidos; imagens, não. */
export interface ReportDetail extends Report {
	circuits: Circuit[]
	spareCircuits: SpareCircuits
}

/**
 * `POST /reports` devolve o `Report` mais o aviso de auto-preenchimento.
 *
 * `planningAutofilled: true` **obriga** a UI a avisar que o planejamento veio
 * do laudo anterior do mesmo bloco: são dados de segurança copiados e precisam
 * de revalidação pelo profissional. Preenchimento silencioso não é opção.
 */
export interface CreatedReport extends Report {
	planningAutofilled: boolean
}

// -- Circuitos --------------------------------------------------------------

export interface Circuit {
	id: string
	reportId: string
	circuitModel: string
	phase: string
	breaker: string
	/** Único campo opcional do circuito. */
	description: string | null
	conductor: string
	current: Decimal
	createdAt: string
	updatedAt: string
}

// -- Imagens ----------------------------------------------------------------

/** Slugs de `docs/findings-taxonomy.md`. Lista aberta, validada na borda da API. */
export type FindingCategory =
	| 'exposed_live_conductors'
	| 'improvised_earthing'
	| 'splice_conditions'
	| 'poorly_installed_wiring'
	| 'short_circuit_or_hotspot_signs'

export interface ReportImage {
	id: string
	reportId: string
	storagePath: string
	findingCategory: FindingCategory | null
	reportSection: ReportSection | null
	uploadStatus: 'pending' | 'uploaded'
	/** `null` enquanto `pending`; quando preenchido, vem do objeto real no bucket. */
	contentType: string | null
	sizeBytes: number | null
	uploadedAt: string | null
	caption: string | null
	/** Ordem dentro do laudo; é por ela que os achados saem ordenados no `/draft`. */
	position: number
	createdAt: string
	updatedAt: string
	/**
	 * URL de leitura assinada, `null` enquanto `pending`. **Vence em 5 minutos.**
	 * Descartável: não persistir, não gravar dentro do `documentContent`, não
	 * embutir no arquivo exportado. Pedir outra ao recarregar.
	 */
	viewUrl?: string | null
}
