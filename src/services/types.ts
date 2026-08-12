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
 * As seções tipadas são tratadas como mapas até o wizard existir: os ~90 nomes
 * de campo são do `domain-glossary.md` do raijin e serão transcritos de lá, não
 * inventados aqui.
 */
export type InspectionPlanning = Record<string, string | boolean | string[]>
export type ExternalInfluences = Record<string, string>
export type QualitativeAssessment = Record<string, TernaryAnswer | string>
export type QuantitativeAssessment = Record<string, unknown>

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
