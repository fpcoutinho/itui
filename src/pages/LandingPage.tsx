import { Link } from 'react-router'
import { ButtonLink } from '../components/ui/ButtonLink'
import { ThemeToggle } from '../components/ui/ThemeToggle'
import { landingTexts } from '../content/landing'
import { useSession } from '../hooks/useSession'
import './LandingPage.scss'

export function LandingPage() {
	const { status } = useSession()
	const isAuthenticated = status === 'authenticated'

	return (
		<div className="landing">
			<header className="nav">
				<div className="container">
					<Link className="brand" to="/">
						<img
							alt=""
							className="mascot"
							height={36}
							src="/mascot.webp"
							width={36}
						/>
						<span className="brand-name">Ituí</span>
					</Link>

					<nav className="actions">
						<ThemeToggle />

						{isAuthenticated ? (
							<ButtonLink appearance="ghost" size="medium" to="/plataforma">
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
				</div>
			</header>

			<main>
				<section className="hero">
					<div className="container">
						<div className="intro">
							<p className="badge">
								<span aria-hidden="true" className="dot" />
								{landingTexts.hero.badge}
							</p>

							<h1 className="title">{landingTexts.hero.title}</h1>
							<p className="description">{landingTexts.hero.description}</p>

							<div className="hero-actions">
								<ButtonLink
									appearance={isAuthenticated ? 'ghost' : 'primary'}
									rightIcon="arrow_forward"
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

						<div className="figure">
							<img
								alt={landingTexts.hero.mascotAlt}
								className="hero-mascot"
								src="/mascot.webp"
							/>
						</div>
					</div>

					<div className="container">
						<ul className="highlights">
							{landingTexts.hero.highlights.map((highlight) => (
								<li className="highlight" key={highlight.label}>
									<span className="value">{highlight.value}</span>
									<span className="label">{highlight.label}</span>
								</li>
							))}
						</ul>
					</div>
				</section>

				<section className="section steps-section">
					<div className="container">
						<div className="section-header">
							<p className="eyebrow">{landingTexts.steps.eyebrow}</p>
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
									<span
										aria-hidden="true"
										className="material-symbols-rounded marker"
									>
										{step.icon}
									</span>
									<h3 className="title">{step.title}</h3>
									<p className="description">{step.description}</p>
								</li>
							))}
						</ol>
					</div>
				</section>

				<section className="section compliance-section">
					<div className="container">
						<div className="section-header">
							<p className="eyebrow">{landingTexts.compliance.eyebrow}</p>
							<h2 className="section-title">{landingTexts.compliance.title}</h2>
							<p className="section-description">
								{landingTexts.compliance.description}
							</p>
						</div>

						<ul className="compliance">
							{landingTexts.compliance.items.map((item) => (
								<li className="item" key={item.title}>
									<span
										aria-hidden="true"
										className="material-symbols-rounded marker"
									>
										{item.icon}
									</span>
									<h3 className="title">{item.title}</h3>
									<p className="description">{item.description}</p>
								</li>
							))}
						</ul>
					</div>
				</section>
			</main>

			<footer className="footer">
				<div className="container">
					<div className="footer-brand">
						<span className="brand-name">Ituí</span>
						<span className="tagline">{landingTexts.footer.tagline}</span>
					</div>
					<p className="rights">
						© {new Date().getFullYear()} Filipe Paulo Coutinho.{' '}
						{landingTexts.footer.rights}
					</p>
				</div>
			</footer>
		</div>
	)
}
