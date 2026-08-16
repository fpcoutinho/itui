import { reportTexts } from '../../../content/report'
import type {
	WizardStep,
	WizardStepId,
} from '../../../hooks/useInspectionWizard'
import './WizardSteps.scss'

const { wizard } = reportTexts

const statusLabels = {
	done: wizard.done,
	pending: wizard.pending,
	optional: wizard.optional,
} as const

interface WizardStepsProps {
	steps: WizardStep[]
	current: WizardStepId
	onSelect: (id: WizardStepId) => void
}

/**
 * Navegação entre as etapas.
 *
 * Toda etapa é sempre alcançável: as seções são independentes no backend (cada
 * uma tem seu `PATCH`), e travar a navegação em cascata só impediria o
 * engenheiro de voltar para corrigir o que já preencheu. O estado de cada etapa
 * é informado, não imposto.
 */
export function WizardSteps({ steps, current, onSelect }: WizardStepsProps) {
	return (
		<nav aria-label={wizard.label} className="wizard-steps no-print">
			<ol className="list">
				{steps.map((step, index) => (
					<li className="item" key={step.id}>
						<button
							aria-current={step.id === current ? 'step' : undefined}
							className={`step ${step.status}${step.id === current ? ' active' : ''}`}
							onClick={() => onSelect(step.id)}
							type="button"
						>
							<span className="position">{index + 1}</span>
							<span className="text">
								<span className="label">{step.label}</span>
								<span className="status">{statusLabels[step.status]}</span>
							</span>
						</button>
					</li>
				))}
			</ol>
		</nav>
	)
}
