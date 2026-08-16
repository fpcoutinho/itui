/**
 * Acesso tipado às listas normativas.
 *
 * As duas fontes são os JSON de `docs/`, **cópias byte a byte** dos arquivos
 * homônimos do `raijin` (ver CLAUDE.md). São importados diretamente, sem
 * redigitação: nenhuma opção da NBR 5410, nenhum procedimento de ensaio e
 * nenhuma cláusula aparece escrita à mão em componente ou em schema.
 *
 * As chaves dentro dos JSON estão em `snake_case` (é o vocabulário do
 * `domain-glossary.md`); os campos do wizard estão em `camelCase`, porque é o
 * que a borda de `http.ts` converte de volta. A ponte entre os dois é o campo
 * `source` de cada descritor em `reportSchema.ts` — e é a única ponte.
 */

import choicesJson from '../../docs/nbr-5410-choices.json'
import testsJson from '../../docs/nbr-5410-tests.json'

/** Uma escolha normativa: rótulo, opções e se aceita múltipla seleção. */
export interface ChoiceEntry {
	label: string
	options: readonly string[]
	multiple?: boolean
	nbrGroup?: string
	nbrClause?: string
}

const inspectionPlanningChoices = choicesJson.inspectionPlanning as Record<
	string,
	ChoiceEntry
>

const externalInfluencesChoices = choicesJson.externalInfluences as Record<
	string,
	ChoiceEntry
>

/**
 * Ordem de exibição das influências externas: a ordem de declaração do JSON, que
 * é a ordem dos grupos na norma (AA, AB, AC… BA, BB… CA, CB). `Object.keys`
 * preserva a ordem de inserção para chaves não numéricas — é o que evita manter
 * uma segunda lista aqui só para dizer em que ordem os 22 campos aparecem.
 */
export const externalInfluenceKeys = Object.keys(externalInfluencesChoices)

export function planningChoice(key: string): ChoiceEntry {
	return requireEntry(inspectionPlanningChoices, key, 'inspectionPlanning')
}

export function externalInfluenceChoice(key: string): ChoiceEntry {
	return requireEntry(externalInfluencesChoices, key, 'externalInfluences')
}

/** Cláusula NBR do item da avaliação qualitativa; `null` onde o template não trazia referência. */
export function qualitativeClause(key: string): string | null {
	const clauses = choicesJson.qualitativeAssessment.nbrClauses as Record<
		string,
		string | null
	>

	return clauses[key] ?? null
}

/** Escolha única da §4: `spare_circuit_capacity` e `earthing_system_type`. */
export function qualitativeChoice(
	key: 'spare_circuit_capacity' | 'earthing_system_type',
): ChoiceEntry {
	return choicesJson.qualitativeAssessment[key] as ChoiceEntry
}

/** Esquemas de aterramento, na ordem do JSON. Alimenta o ramo condicional do ensaio 7.3.5. */
export const earthingSystemOptions = qualitativeChoice(
	'earthing_system_type',
).options

// -- Ensaios (§5 Parte II) ---------------------------------------------------

interface TestEntry {
	clause: string
	procedure?: string
	procedureByEarthing?: Record<string, string>
}

const tests = testsJson.tests as Record<string, TestEntry>

export function testClause(key: string): string {
	return requireEntry(tests, key, 'tests').clause
}

/**
 * Procedimento do ensaio, resolvendo o ramo condicional de 7.3.5.
 *
 * `equipotential_bonding_test` é o único com `procedureByEarthing`, e as chaves
 * de lá são **prefixos**: `TN` cobre `TN-S`, `TN-C-S` e `TN-C`. Sem esquema de
 * aterramento declarado ainda na §4, não há ramo a escolher — devolve `null`, e
 * a UI pede que o usuário volte e preencha, em vez de exibir o procedimento
 * errado.
 */
export function testProcedure(
	key: string,
	earthingSystemType?: string,
): string | null {
	const entry = requireEntry(tests, key, 'tests')

	if (entry.procedure !== undefined) {
		return entry.procedure
	}

	const branches = entry.procedureByEarthing

	if (branches === undefined || !earthingSystemType) {
		return null
	}

	// `TN-C-S` casa `TN`; `TT` e `IT` casam a si mesmos. Prefixo mais longo
	// primeiro, para que uma chave `TN` futura não roube um `TN-S` mais
	// específico que venha a existir no JSON.
	const branch = Object.keys(branches)
		.sort((a, b) => b.length - a.length)
		.find((prefix) => earthingSystemType.startsWith(prefix))

	return branch === undefined ? null : branches[branch]
}

function requireEntry<T>(
	source: Record<string, T>,
	key: string,
	group: string,
): T {
	const entry = source[key]

	if (entry === undefined) {
		// Chave inexistente é erro de programação — o schema referencia o JSON por
		// string, e falhar alto aqui é o que impede um campo silenciosamente vazio.
		throw new Error(`[nbr] "${key}" não existe em ${group}.`)
	}

	return entry
}
