import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { authTexts } from '../../content/auth'
import './AccountLayout.scss'

interface AccountLayoutProps {
	title: string
	subtitle: string
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
			<Link aria-label="Ituí" className="account__brand" to="/">
				<img alt="" className="account__mascot" src="/mascot.webp" width={40} />
			</Link>

			<div className="account__theme">
				<ThemeToggle />
			</div>

			<section className="account__pane">
				<div className="account__card">
					<div className="account__intro">
						<h1 className="account__title">{title}</h1>
						<p className="account__subtitle">{subtitle}</p>
					</div>

					{children}

					<p className="account__footer">{footer}</p>
				</div>
			</section>

			<AccountShowcase />
		</main>
	)
}

/**
 * Painel decorativo com a prévia do produto.
 *
 * O quadro interno é **placeholder**: quando houver captura da tela de geração
 * de laudos, trocar a `<div className="account__preview">` por uma `<img>` com
 * o mesmo enquadramento (canto superior esquerdo ancorado, sangrando à direita
 * e embaixo). `aria-hidden` porque o painel inteiro é ornamento — o conteúdo
 * acionável está todo no formulário.
 */
function AccountShowcase() {
	return (
		<aside aria-hidden="true" className="account__showcase">
			<div className="account__showcase-copy">
				<p className="account__showcase-title">{authTexts.showcase.title}</p>
				<p className="account__showcase-text">
					{authTexts.showcase.description}
				</p>
			</div>

			<div className="account__frame">
				<div className="account__preview">
					<span className="account__preview-label">
						{authTexts.showcase.placeholder}
					</span>
				</div>
			</div>
		</aside>
	)
}
