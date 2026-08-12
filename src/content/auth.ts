/**
 * Textos das telas de conta.
 *
 * Isolados aqui, e não espalhados no JSX: é o que permite revisar o registro
 * linguístico num lugar só e trocar por i18n depois sem caçar string em
 * componente.
 */

export const authTexts = {
	login: {
		title: 'Bem-vindo ao Ituí ⚡',
		subtitle: 'Acesse seus laudos de inspeção elétrica.',
		email: 'E-mail',
		password: 'Senha',
		submit: 'Entrar',
		submitting: 'Entrando…',
		noAccount: 'Ainda não tem conta?',
		signupLink: 'Criar conta',
	},

	signup: {
		title: 'Criar conta',
		email: 'E-mail',
		password: 'Senha',
		passwordHint: 'Mínimo de 8 caracteres.',
		submit: 'Criar conta',
		submitting: 'Criando…',
		hasAccount: 'Já tem conta?',
		loginLink: 'Entrar',
	},

	/**
	 * Painel lateral das telas de conta. Hoje é um placeholder; o lugar da
	 * captura de tela do gerador de laudos em funcionamento.
	 */
	showcase: {
		title: 'Do ensaio ao laudo assinado.',
		description:
			'Registre a inspeção, anexe as evidências e gere o documento conforme a NBR 5410 — sem sair do navegador.',
		placeholder: 'Prévia do gerador de laudos',
	},

	logout: {
		title: 'Saindo…',
		description: 'Encerrando sua sessão com segurança.',
	},

	google: {
		divider: 'ou',
		/**
		 * Texto da face visível do botão. Precisa continuar reconhecível como
		 * "Entrar com o Google" — as diretrizes de marca do Google exigem a marca
		 * "G" oficial e um rótulo dessa família.
		 */
		buttonLabel: 'Continuar com o Google',
		unavailable:
			'O login com Google não está configurado nesta instalação. Use e-mail e senha.',
		loadFailed:
			'Não foi possível carregar o login do Google. Recarregue a página.',
		/**
		 * `503` em `/auth/google` é o serviço de chaves do Google inacessível —
		 * problema de disponibilidade, não credencial ruim. A mensagem precisa
		 * convidar à retentativa em vez de acusar o usuário.
		 */
		serviceUnavailable:
			'O serviço do Google está indisponível no momento. Tente novamente em instantes.',
	},

	errors: {
		/**
		 * `401` no login é **sempre** esta mensagem, para e-mail inexistente e para
		 * senha errada. O backend chega a verificar um hash-isca quando o usuário
		 * não existe, para que o tempo de resposta não vire oráculo; ramificar a
		 * mensagem na UI desfaria essa proteção de graça.
		 */
		invalidCredentials: 'E-mail ou senha inválidos.',
		emailRequired: 'Informe seu e-mail.',
		emailInvalid: 'Informe um e-mail válido.',
		passwordRequired: 'Informe sua senha.',
		passwordTooShort: 'A senha precisa ter ao menos 8 caracteres.',
	},
} as const

/** Mesmo mínimo que o backend aplica. */
export const MIN_PASSWORD_LENGTH = 8
