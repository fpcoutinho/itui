import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { authTexts } from '../../content/auth'
import './AccountLayout.scss'

interface AccountLayoutProps {
	title: string
	/** Opcional: o cadastro se explica pelo título e dispensa a linha de apoio. */
	subtitle?: string
	children: ReactNode
	/** Rodapé do cartão: link para a outra tela de conta. */
	footer: ReactNode
}

/**
 * Moldura comum ao login e ao cadastro: formulário à esquerda, vitrine do
 * produto à direita.
 *
 * A vitrine some abaixo de `md` — em tela estreita ela roubaria o formulário,
 * que é a única coisa acionável da página.
 */
export function AccountLayout({
	title,
	subtitle,
	children,
	footer,
}: AccountLayoutProps) {
	return (
		<main className="account">
			{/* Marca e alternador ficam ancorados nos cantos da TELA, fora das duas
			    colunas: a esquerda é do formulário, a direita é ornamento. */}
			<Link aria-label="Ituí" className="brand" to="/">
				<img alt="" className="mascot" src="/mascot.webp" width={40} />
			</Link>

			<div className="theme">
				<ThemeToggle />
			</div>

			<section className="pane">
				<div className="card">
					<div className="intro">
						<h1 className="title">{title}</h1>
						{subtitle ? <p className="subtitle">{subtitle}</p> : null}
					</div>

					{children}

					<p className="footer">{footer}</p>
				</div>
			</section>

			<AccountShowcase />
		</main>
	)
}

/**
 * Painel decorativo com a prévia do produto.
 */
function AccountShowcase() {
	return (
		<aside aria-hidden="true" className="showcase">
			<div className="copy">
				<p className="title">{authTexts.showcase.title}</p>
				<p className="text">{authTexts.showcase.description}</p>
			</div>

			<div className="frame">
				<img
					alt="Preview do Ituí, mostrando a tela de relatórios"
					className="preview"
					src="/preview.png"
				/>
			</div>
		</aside>
	)
}
