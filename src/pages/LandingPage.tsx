import { Link } from 'react-router'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { landingTexts } from '../content/landing'
import { useSession } from '../hooks/useSession'
import './LandingPage.scss'

/**
 * Landing pública.
 *
 * Funcionalidade nova — o legado caía direto na listagem. Sem Tailwind e sem
 * biblioteca de UI de terceiros: SCSS puro, BEM, tokens do Sanhauá.
 */
export function LandingPage() {
	const { status } = useSession()
	const isAuthenticated = status === 'authenticated'

	return (
		<div className="landing">
			<header className="landing__nav">
				<Link className="landing__brand" to="/">
					<img
						alt=""
						className="landing__brand-mascot"
						height={40}
						src="/mascot.webp"
						width={40}
					/>
					<span className="landing__brand-name">Ituí</span>
				</Link>

				<nav className="landing__nav-actions">
					<ThemeToggle />

					{isAuthenticated ? (
						<Link
							className="landing__button landing__button--primary"
							to="/plataforma"
						>
							{landingTexts.nav.platform}
						</Link>
					) : (
						<>
							<Link className="landing__button" to="/conta/login">
								{landingTexts.nav.login}
							</Link>
							<Link
								className="landing__button landing__button--primary"
								to="/conta/cadastro"
							>
								{landingTexts.nav.signup}
							</Link>
						</>
					)}
				</nav>
			</header>

			<main>
				<section className="landing__hero">
					<div className="landing__hero-text">
						<p className="landing__eyebrow">{landingTexts.hero.eyebrow}</p>
						<h1 className="landing__hero-title">{landingTexts.hero.title}</h1>
						<p className="landing__hero-description">
							{landingTexts.hero.description}
						</p>

						<div className="landing__hero-actions">
							<Link
								className="landing__button landing__button--primary landing__button--large"
								to={isAuthenticated ? '/plataforma' : '/conta/cadastro'}
							>
								{isAuthenticated
									? landingTexts.nav.platform
									: landingTexts.hero.primaryCta}
							</Link>
							{isAuthenticated ? null : (
								<Link
									className="landing__button landing__button--large"
									to="/conta/login"
								>
									{landingTexts.hero.secondaryCta}
								</Link>
							)}
						</div>
					</div>

					<div className="landing__hero-figure">
						<img
							alt={landingTexts.hero.mascotAlt}
							className="landing__hero-mascot"
							src="/mascot.webp"
						/>
					</div>
				</section>

				<section className="landing__section landing__section--steps">
					<div className="landing__section-header">
						<h2 className="landing__section-title">
							{landingTexts.steps.title}
						</h2>
						<p className="landing__section-description">
							{landingTexts.steps.description}
						</p>
					</div>

					<ol className="landing__steps">
						{landingTexts.steps.items.map((step) => (
							<li className="landing__step" key={step.number}>
								<span aria-hidden="true" className="landing__step-number">
									{step.number}
								</span>
								<h3 className="landing__step-title">{step.title}</h3>
								<p className="landing__step-description">{step.description}</p>
							</li>
						))}
					</ol>
				</section>

				<section className="landing__section landing__section--compliance">
					<div className="landing__section-header">
						<h2 className="landing__section-title">
							{landingTexts.compliance.title}
						</h2>
						<p className="landing__section-description">
							{landingTexts.compliance.description}
						</p>
					</div>

					<ul className="landing__compliance">
						{landingTexts.compliance.items.map((item) => (
							<li className="landing__compliance-item" key={item.title}>
								<h3 className="landing__compliance-title">{item.title}</h3>
								<p className="landing__compliance-description">
									{item.description}
								</p>
							</li>
						))}
					</ul>
				</section>

				{isAuthenticated ? null : (
					<section className="landing__cta">
						<h2 className="landing__cta-title">{landingTexts.cta.title}</h2>
						<p className="landing__cta-description">
							{landingTexts.cta.description}
						</p>
						<div className="landing__hero-actions">
							<Link
								className="landing__button landing__button--inverse landing__button--large"
								to="/conta/cadastro"
							>
								{landingTexts.cta.primary}
							</Link>
							<Link
								className="landing__button landing__button--ghost landing__button--large"
								to="/conta/login"
							>
								{landingTexts.cta.secondary}
							</Link>
						</div>
					</section>
				)}
			</main>

			<footer className="landing__footer">
				<div className="landing__footer-brand">
					<span className="landing__brand-name">Ituí</span>
					<span className="landing__footer-tagline">
						{landingTexts.footer.tagline}
					</span>
				</div>
				<p className="landing__footer-rights">
					© {new Date().getFullYear()} fpcoutinho.{' '}
					{landingTexts.footer.rights}
				</p>
			</footer>
		</div>
	)
}
