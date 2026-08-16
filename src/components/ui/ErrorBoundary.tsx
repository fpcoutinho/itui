import { Component, type ErrorInfo, type ReactNode } from 'react'
import { UaAlert, UaButton } from 'sanhaua/react'
import { platformTexts } from '../../content/platform'
import './ErrorBoundary.scss'

const { crash } = platformTexts

interface ErrorBoundaryProps {
	children: ReactNode
}

interface ErrorBoundaryState {
	error: Error | null
}

/**
 * Contenção de erro de render.
 *
 * Sem isto, uma exceção lançada durante o render sobe até a raiz e o React
 * **desmonta a árvore inteira**: o `#root` fica vazio e a tela some, sem
 * mensagem nenhuma. Foi exatamente o que aconteceu quando o `PATCH` do editor
 * devolveu um laudo sem `circuits` e o `stepStatus` do wizard leu `.length` de
 * `undefined` — o relato possível era "ficou preto".
 *
 * Fica **por dentro** do shell logado, envolvendo só o `<Outlet>`: a barra
 * lateral sobrevive ao erro e o usuário sai da tela quebrada navegando, em vez
 * de precisar recarregar. Classe e não hook porque `componentDidCatch` não tem
 * equivalente em função — é a única exceção do repositório.
 *
 * Não substitui tratamento de erro: falha de rede, `422` e afins continuam
 * sendo estado das telas. Aqui só chega o que ninguém previu.
 */
export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	state: ErrorBoundaryState = { error: null }

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { error }
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		// O console é o único destino hoje — não há coletor de erro no projeto. A
		// pilha de componentes é o que localiza o render culpado.
		console.error('Erro não tratado no render:', error, info.componentStack)
	}

	render() {
		const { error } = this.state

		if (error === null) {
			return this.props.children
		}

		return (
			<section className="error-boundary">
				<UaAlert
					appearance="danger"
					description={crash.description}
					title={crash.title}
				/>

				<details className="details">
					<summary>{crash.details}</summary>
					<pre className="message">{error.message}</pre>
				</details>

				<UaButton
					appearance="tertiary"
					onClick={() => this.setState({ error: null })}
					type="button"
				>
					{crash.retry}
				</UaButton>
			</section>
		)
	}
}
