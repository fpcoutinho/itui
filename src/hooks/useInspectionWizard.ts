import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { reportTexts } from '../content/report'
import type { ReportDetail, ReportSection } from '../services/types'

/**
 * As oito etapas. As cinco primeiras são seções do laudo; `images` não é seção
 * — é um anexo transversal (a foto pode pertencer a qualquer seção ou a
 * nenhuma), e por isso fica no fim, depois de haver conteúdo a ilustrar.
 *
 * `document` é o editor, e vem por dependência real: o `/draft` monta o texto a
 * partir das seções preenchidas e das imagens confirmadas, então abri-lo antes
 * só produziria um documento de "seção não avaliada".
 *
 * `export` fecha a sequência e é a única etapa que não toca no laudo: capa,
 * ART, assinatura e os dois botões que produzem o arquivo. Estava empilhada
 * abaixo do editor e fazia uma página que só terminava depois do laudo inteiro.
 */
export type WizardStepId = ReportSection | 'images' | 'document' | 'export'

export const WIZARD_STEPS: readonly WizardStepId[] = [
	'inspection_planning',
	'external_influences',
	'qualitative_assessment',
	'quantitative_assessment',
	'circuits',
	'images',
	'document',
	'export',
]

export type StepStatus = 'done' | 'pending' | 'optional'

export interface WizardStep {
	id: WizardStepId
	label: string
	status: StepStatus
}

interface UseInspectionWizardResult {
	steps: WizardStep[]
	current: WizardStepId
	currentIndex: number
	isFirst: boolean
	isLast: boolean
	goTo: (id: WizardStepId) => void
	next: () => void
	previous: () => void
}

/**
 * Onde o usuário parou.
 *
 * Não há campo de progresso no laudo, e não precisa haver: seção `null` é
 * exatamente "esta etapa ainda não foi concluída" — o backend nunca grava `{}`
 * nas quatro seções tipadas. O legado inferia isso checando se um campo-sentinela
 * estava vazio, o que quebrava assim que o campo escolhido virava opcional.
 */
function stepStatus(report: ReportDetail | null, id: WizardStepId): StepStatus {
	if (report === null) {
		return 'pending'
	}

	switch (id) {
		case 'inspection_planning':
			return report.inspectionPlanning === null ? 'pending' : 'done'
		case 'external_influences':
			return report.externalInfluences === null ? 'pending' : 'done'
		case 'qualitative_assessment':
			return report.qualitativeAssessment === null ? 'pending' : 'done'
		case 'quantitative_assessment':
			return report.quantitativeAssessment === null ? 'pending' : 'done'
		case 'circuits':
			// Sem seção JSONB para consultar: a Parte III é tabela relacional, e o
			// sinal de conclusão é haver ao menos um circuito.
			return report.circuits.length > 0 ? 'done' : 'pending'
		case 'images':
			// Laudo sem foto continua sendo laudo válido — o `/draft` monta o
			// documento inteiro sem nenhuma imagem.
			return 'optional'
		case 'document':
			// `document_content` nasce `{}` e nunca é `null`: a árvore vazia é o
			// sinal de que o documento ainda não foi gerado.
			return Object.keys(report.documentContent).length > 0 ? 'done' : 'pending'
		case 'export':
			// Exportar não é estado do laudo: o arquivo sai do navegador e não deixa
			// rastro no servidor. Marcar como pendente faria o laudo parecer
			// incompleto para sempre.
			return 'optional'
	}
}

export function useInspectionWizard(
	report: ReportDetail | null,
): UseInspectionWizardResult {
	const [currentIndex, setCurrentIndex] = useState(0)

	/**
	 * O ponto de retomada é calculado **uma vez**, na primeira resposta. Recalcular
	 * a cada atualização arrastaria o usuário para a frente no instante em que ele
	 * salvasse uma etapa que resolveu revisitar.
	 */
	const resumed = useRef(false)

	useEffect(() => {
		if (report === null || resumed.current) {
			return
		}

		resumed.current = true

		const firstPending = WIZARD_STEPS.findIndex(
			(id) => stepStatus(report, id) === 'pending',
		)

		setCurrentIndex(firstPending === -1 ? 0 : firstPending)
	}, [report])

	const steps = useMemo(
		() =>
			WIZARD_STEPS.map((id) => ({
				id,
				label: reportTexts.wizard.steps[id],
				status: stepStatus(report, id),
			})),
		[report],
	)

	const goTo = useCallback((id: WizardStepId) => {
		const index = WIZARD_STEPS.indexOf(id)

		if (index !== -1) {
			setCurrentIndex(index)
		}
	}, [])

	const next = useCallback(
		() =>
			setCurrentIndex((index) => Math.min(index + 1, WIZARD_STEPS.length - 1)),
		[],
	)

	const previous = useCallback(
		() => setCurrentIndex((index) => Math.max(index - 1, 0)),
		[],
	)

	return {
		steps,
		current: WIZARD_STEPS[currentIndex],
		currentIndex,
		isFirst: currentIndex === 0,
		isLast: currentIndex === WIZARD_STEPS.length - 1,
		goTo,
		next,
		previous,
	}
}
