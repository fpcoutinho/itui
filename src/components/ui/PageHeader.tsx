import type { ReactNode } from 'react'
import './PageHeader.scss'

interface PageHeaderProps {
	title: string
	description?: ReactNode
	/** Ações da página (botões), alinhadas à direita em telas largas. */
	actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
	return (
		<header className="page-header no-print">
			<div className="text">
				<h1 className="title">{title}</h1>
				{description ? <p className="description">{description}</p> : null}
			</div>

			{actions ? <div className="actions">{actions}</div> : null}
		</header>
	)
}
