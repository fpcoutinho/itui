import { UaAlert, UaCard } from 'sanhaua/react'
import { reportTexts } from '../../../content/report'
import { qualitativeChoice } from '../../../domain/nbr'
import type { SpareCircuits } from '../../../services/types'
import './SpareCircuitsPanel.scss'

const { spareCircuits: texts } = reportTexts

/**
 * Faixas de `spare_circuit_capacity`, na ordem do JSON normativo. A posição é
 * significativa: são os mesmos degraus da tabela 6.5.4.7, e é por isso que dá
 * para mapear uma contagem de circuitos para a faixa correspondente sem
 * redigitar os rótulos.
 */
const CAPACITY_RANGES = qualitativeChoice('spare_circuit_capacity').options

const UPPER_BOUNDS = [6, 12, 30]

/** Faixa em que um laudo com `count` circuitos cai; `null` sem circuito cadastrado. */
function rangeForCount(count: number): string | null {
	if (count === 0) {
		return null
	}

	const index = UPPER_BOUNDS.findIndex((bound) => count <= bound)

	return CAPACITY_RANGES[index === -1 ? CAPACITY_RANGES.length - 1 : index]
}

interface SpareCircuitsPanelProps {
	spareCircuits: SpareCircuits
	/** Faixa declarada pelo engenheiro na §4; `null` enquanto a seção não foi salva. */
	declared: string | null
}

/**
 * O declarado e o calculado, lado a lado.
 *
 * `spare_circuits` é derivado e somente leitura — vem recalculado a cada
 * resposta do backend, a partir do número real de circuitos. `declared` é a
 * faixa que o engenheiro escolheu na avaliação qualitativa.
 *
 * Divergir entre os dois é **informação para apresentar**, não veredito de
 * conformidade: o backend deliberadamente não emite esse veredito, e a UI não
 * o inventa.
 */
export function SpareCircuitsPanel({
	spareCircuits,
	declared,
}: SpareCircuitsPanelProps) {
	const computed = rangeForCount(spareCircuits.circuitCount)
	const diverges =
		declared !== null && computed !== null && declared !== computed

	return (
		<UaCard className="spare-circuits">
			<h3 className="title">{texts.title}</h3>

			<dl className="figures">
				<div className="figure">
					<dt className="term">{texts.circuitCount}</dt>
					<dd className="value">{spareCircuits.circuitCount}</dd>
				</div>

				<div className="figure">
					<dt className="term">{texts.declared}</dt>
					<dd className="value">{declared ?? texts.notDeclared}</dd>
				</div>

				<div className="figure">
					<dt className="term">{texts.required}</dt>
					<dd className="value">{spareCircuits.required ?? texts.none}</dd>
				</div>
			</dl>

			{diverges ? (
				<UaAlert appearance="informative" description={texts.divergence} />
			) : null}
		</UaCard>
	)
}
