import { Link, type LinkProps } from 'react-router'

/**
 * Navegação interna com a aparência do `UaButton`.
 *
 * O `UaButton` do Sanhauá já sabe virar link (`behavior="link"`), mas só como
 * `<a href>` — o pacote é multiplataforma e não pode importar `react-router`.
 * Um `<a href>` aqui faria reload de página inteira, e o access token vive
 * **só em memória** (ver "Contrato de autenticação" no CLAUDE.md): cada clique
 * num CTA descartaria a sessão e forçaria um `POST /auth/refresh`.
 *
 * Então a navegação continua sendo o `<Link>` do react-router e a aparência vem
 * das classes do próprio Sanhauá. Este arquivo é o **único** ponto do `itui`
 * acoplado a esses nomes de classe (incluindo o `<span className="text">`, que
 * é onde o pacote aplica a tipografia da escala); nenhuma tela repete a
 * marcação. Se o Sanhauá ganhar uma prop polimórfica (`as`), é aqui que a troca
 * acontece — em um lugar só.
 */

type ButtonAppearance =
	| 'primary'
	| 'secondary'
	| 'tertiary'
	| 'ghost'
	| 'success'
	| 'danger'
	| 'warning'
	| 'informative'

interface ButtonLinkProps extends LinkProps {
	appearance?: ButtonAppearance
	size?: 'small' | 'medium' | 'large'
	widthBehavior?: 'auto' | 'full'
	borderStyle?: 'square' | 'round'
	leftIcon?: string
	rightIcon?: string
}

export function ButtonLink({
	appearance = 'primary',
	size = 'medium',
	widthBehavior = 'auto',
	borderStyle = 'square',
	leftIcon,
	rightIcon,
	className,
	children,
	...linkProps
}: ButtonLinkProps) {
	const classes = [
		'ua-button',
		size,
		appearance,
		widthBehavior,
		borderStyle,
		className,
	]
		.filter(Boolean)
		.join(' ')

	return (
		<Link {...linkProps} className={classes}>
			{leftIcon ? (
				<span className="material-symbols-rounded icon">{leftIcon}</span>
			) : null}
			<span className="text">{children}</span>
			{rightIcon ? (
				<span className="material-symbols-rounded icon">{rightIcon}</span>
			) : null}
		</Link>
	)
}
