import type { ReactNode } from 'react'
import { UaButton, UaModal } from 'sanhaua/react'
import { reportTexts } from '../../content/report'
import './ConfirmDialog.scss'

const { confirmDialog: texts } = reportTexts

interface ConfirmDialogProps {
	isOpen: boolean
	title: ReactNode
	description: ReactNode
	/** Rótulo do botão que executa a ação. O padrão é o genérico "Confirmar". */
	confirmLabel?: string
	/** `danger` para ação destrutiva (remover circuito, descartar edição). */
	appearance?: 'primary' | 'danger'
	onConfirm: () => void
	onClose: () => void
}

/**
 * Confirmação modal — o substituto do `window.confirm`.
 *
 * O nativo bloqueia a thread, não aceita estilo nenhum e alguns navegadores o
 * suprimem depois do segundo uso na mesma página; um `UaModal` é do design
 * system, fica no fluxo de foco da página e deixa a ação destrutiva ser pintada
 * como destrutiva.
 */
export function ConfirmDialog({
	isOpen,
	title,
	description,
	confirmLabel,
	appearance = 'primary',
	onConfirm,
	onClose,
}: ConfirmDialogProps) {
	return (
		<UaModal
			className="confirm-dialog"
			footer={
				<div className="actions">
					<UaButton appearance="tertiary" onClick={onClose} type="button">
						{texts.cancel}
					</UaButton>
					<UaButton appearance={appearance} onClick={onConfirm} type="button">
						{confirmLabel ?? texts.confirm}
					</UaButton>
				</div>
			}
			isOpen={isOpen}
			onClose={onClose}
			size="small"
			title={title}
		>
			<p className="description">{description}</p>
		</UaModal>
	)
}
