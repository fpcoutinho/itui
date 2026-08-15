import { Link } from 'react-router'
import { ButtonLink } from '../components/ui/ButtonLink'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { landingTexts } from '../content/landing'
import { useSession } from '../hooks/useSession'
import './LandingPage.scss'

/**
 * Landing pública.
 *
 * Funcionalidade nova — o legado caía direto na listagem. Sem Tailwind e sem
 * biblioteca de UI de terceiros: SCSS puro com classes aninhadas e tokens do
 * Sanhauá. Os botões são do design system (via `ButtonLink`, que preserva a
 * navegação do react-router) — não há botão desenhado aqui.
 */
export function LandingPage() {
	const { status } = useSession()
	const isAuthenticated = status === 'authenticated'

	return (
		<div className="landing">
			<header className="nav">
				<Link className="brand" to="/">
					<img
						alt=""
						className="mascot"
						height={40}
						src="/mascot.webp"
						width={40}
					/>
					<span className="brand-name">Ituí</span>
				</Link>

				<nav className="actions">
					<ThemeToggle />

					{isAuthenticated ? (
						<ButtonLink size="medium" to="/plataforma">
							{landingTexts.nav.platform}
						</ButtonLink>
					) : (
						<>
							<ButtonLink appearance="ghost" size="medium" to="/conta/login">
								{landingTexts.nav.login}
							</ButtonLink>
							<ButtonLink size="medium" to="/conta/cadastro">
								{landingTexts.nav.signup}
							</ButtonLink>
						</>
					)}
				</nav>
			</header>

			<main>
				<section className="hero">
					<div className="hero-text">
						<p className="eyebrow">{landingTexts.hero.eyebrow}</p>
						<h1 className="title">{landingTexts.hero.title}</h1>
						<p className="description">{landingTexts.hero.description}</p>

						<div className="hero-actions">
							<ButtonLink
								size="large"
								to={isAuthenticated ? '/plataforma' : '/conta/cadastro'}
							>
								{isAuthenticated
									? landingTexts.nav.platform
									: landingTexts.hero.primaryCta}
							</ButtonLink>
							{isAuthenticated ? null : (
								<ButtonLink
									appearance="tertiary"
									size="large"
									to="/conta/login"
								>
									{landingTexts.hero.secondaryCta}
								</ButtonLink>
							)}
						</div>
					</div>

					<div className="hero-figure">
						<img
							alt={landingTexts.hero.mascotAlt}
							className="hero-mascot"
							src="/mascot.webp"
						/>
					</div>
				</section>

				<section className="section steps-section">
					<div className="section-header">
						<h2 className="section-title">{landingTexts.steps.title}</h2>
						<p className="section-description">
							{landingTexts.steps.description}
						</p>
					</div>

					<ol className="steps">
						{landingTexts.steps.items.map((step) => (
							<li className="step" key={step.number}>
								<span aria-hidden="true" className="number">
									{step.number}
								</span>
								<h3 className="title">{step.title}</h3>
								<p className="description">{step.description}</p>
							</li>
						))}
					</ol>
				</section>

				<section className="section compliance-section">
					<div className="section-header">
						<h2 className="section-title">{landingTexts.compliance.title}</h2>
						<p className="section-description">
							{landingTexts.compliance.description}
						</p>
					</div>

					<ul className="compliance">
						{landingTexts.compliance.items.map((item) => (
							<li className="item" key={item.title}>
								<h3 className="title">{item.title}</h3>
								<p className="description">{item.description}</p>
							</li>
						))}
					</ul>
				</section>

				{isAuthenticated ? null : (
					<section className="cta">
						<h2 className="title">{landingTexts.cta.title}</h2>
						<p className="description">{landingTexts.cta.description}</p>
						<div className="hero-actions">
							<ButtonLink
								appearance="tertiary"
								size="large"
								to="/conta/cadastro"
							>
								{landingTexts.cta.primary}
							</ButtonLink>
							<ButtonLink appearance="ghost" size="large" to="/conta/login">
								{landingTexts.cta.secondary}
							</ButtonLink>
						</div>
					</section>
				)}
			</main>

			<footer className="footer">
				<div className="footer-brand">
					<span className="brand-name">Ituí</span>
					<span className="tagline">{landingTexts.footer.tagline}</span>
				</div>
				<p className="rights">
					© {new Date().getFullYear()} Filipe Paulo Coutinho.{' '}
					{landingTexts.footer.rights}
				</p>
			</footer>
		</div>
	)
}
