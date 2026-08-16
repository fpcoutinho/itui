import type { ReportStatus } from '../services/types'

/** Rótulos pt-BR dos valores de `report_status`. Os slugs são do backend. */
export const reportStatusLabels: Record<ReportStatus, string> = {
	draft: 'Rascunho',
	in_review: 'Em revisão',
	approved: 'Aprovado',
	archived: 'Arquivado',
}

export const platformTexts = {
	title: 'Meus laudos',
	description:
		'Inspeções registradas por você, das mais recentes às mais antigas.',

	newReport: 'Novo laudo',
	cancel: 'Cancelar',

	nav: {
		label: 'Navegação principal',
		reports: 'Laudos',
		newReport: 'Novo laudo',
		profile: 'Perfil',
		signOut: 'Sair',
	},

	detail: {
		title: 'Laudo',
		underConstruction:
			'A tela do laudo entra no próximo passo, junto do editor. Por enquanto ela só confirma que a navegação chegou até aqui.',
		identifier: 'Identificador',
		back: 'Voltar aos laudos',
	},

	profile: {
		title: 'Perfil',
		description:
			'Seus dados aparecem no cabeçalho e na assinatura dos laudos gerados.',

		tabs: {
			label: 'Seções do perfil',
			personal: 'Informações Pessoais',
			security: 'Login e Segurança',
		},

		/** Ações da linha em modo leitura/edição. */
		edit: 'Editar',
		editField: (field: string) => `Editar ${field.toLowerCase()}`,
		cancel: 'Cancelar',
		done: 'Concluir',
		/** Valor ausente na linha — o campo é opcional, não é erro. */
		empty: 'Não informado',

		account: 'Conta',
		email: 'E-mail',
		/**
		 * O e-mail é a chave que liga login por senha e login pelo Google, então
		 * não é editável — e a tela precisa dizer isso, senão o campo travado
		 * parece defeito.
		 */
		emailLocked: 'O e-mail não pode ser alterado.',
		googleAccount: 'Conta vinculada ao Google',

		data: 'Dados pessoais',
		fullName: 'Nome completo',
		fullNameHint: 'Deixe em branco para remover.',
		professionalTitle: 'Título profissional',
		professionalTitleHint:
			'Como assina os laudos. Ex.: Engenheira Eletricista.',
		save: 'Salvar',
		saving: 'Salvando…',
		saved: 'Perfil atualizado.',

		theme: 'Tema',
		themeHint: 'Fica salvo na sua conta e vale em qualquer dispositivo.',
		themeOptions: {
			system: 'Seguir o sistema',
			light: 'Claro',
			dark: 'Escuro',
		},

		password: 'Senha',
		currentPassword: 'Senha atual',
		newPassword: 'Nova senha',
		newPasswordHint: 'Mínimo de 8 caracteres.',
		confirmPassword: 'Confirmar nova senha',
		changePassword: 'Alterar senha',
		changingPassword: 'Alterando…',
		/**
		 * A troca revoga todos os refresh tokens do usuário: os outros aparelhos
		 * caem no próximo refresh, e só este segue logado. Avisar antes, senão a
		 * queda em outro dispositivo parece bug.
		 */
		passwordWarning:
			'Ao alterar a senha, as sessões abertas em outros dispositivos são encerradas.',
		passwordChanged: 'Senha alterada.',
		passwordMismatch: 'A confirmação não confere com a nova senha.',
		/** Conta criada pelo Google não tem senha para trocar por aqui. */
		passwordUnavailable:
			'Esta conta entra pelo Google e não tem senha para alterar.',
	},

	loading: 'Carregando laudos…',

	filters: {
		legend: 'Filtrar laudos',
		status: 'Situação',
		anyStatus: 'Todas as situações',
		search: 'Buscar laudos',
		searchPlaceholder: 'Local ou responsável',
		clear: 'Limpar filtros',
	},

	table: {
		caption: 'Laudos de inspeção elétrica',
		locationCode: 'Local',
		inspectedAt: 'Inspeção',
		status: 'Situação',
		updatedAt: 'Atualizado',
	},

	pagination: {
		label: 'Paginação dos laudos',
		previous: 'Anterior',
		next: 'Próxima',
		range: (first: number, last: number, total?: number) =>
			total === undefined
				? `Mostrando ${first}–${last}`
				: `Mostrando ${first}–${last} de ${total}`,
	},

	empty: {
		title: 'Nenhum laudo por aqui',
		description: 'Crie o primeiro laudo para começar o registro da inspeção.',
		filtered: 'Nenhum laudo corresponde aos filtros aplicados.',
	},

	form: {
		title: 'Novo laudo',
		description:
			'Preencha os campos abaixo com os metadados coletados em campo para dar início ao fluxo de vistoria e carregar as diretrizes da inspeção.',
		locationCode: 'Código do local',
		locationCodeHint:
			'Padrão BLOCO-SALA, em maiúsculas. Ex.: CCHLA-102, CI-T02.',
		locationCodeInvalid:
			'Use o padrão BLOCO-SALA em maiúsculas, como CCHLA-102 ou CI-T02.',
		inspectedAt: 'Data e hora da inspeção',
		inspectedAtRequired: 'Informe a data e a hora da inspeção.',
		ambientTemperature: 'Temperatura ambiente (°C)',
		weatherConditions: 'Condições do tempo',
		weatherConditionsPlaceholder: 'Ex.: Ensolarado',
		responsibleParties: 'Responsáveis',
		responsiblePartiesHint: 'Separe vários nomes por vírgula.',
		submit: 'Criar laudo',
		submitting: 'Criando…',
	},

	/**
	 * Aviso obrigatório quando a criação volta com `planning_autofilled: true`.
	 *
	 * O backend copia os 17 campos de planejamento do laudo mais recente do mesmo
	 * bloco. São dados de **segurança** — qualificação profissional, riscos
	 * identificados, EPIs, sinalização — e precisam ser revalidados na inspeção
	 * atual. Preenchimento silencioso não é opção.
	 */
	autofill: {
		title: 'Planejamento preenchido automaticamente',
		description:
			'Copiamos o planejamento do laudo anterior deste bloco. Confira e revalide cada item antes de prosseguir — as condições da inspeção podem ter mudado.',
		dismiss: 'Dispensar aviso',
	},

	/**
	 * O que aparece no lugar da tela quando um render estoura.
	 *
	 * A mensagem técnica é exibida de propósito: sem ela o relato que chega é
	 * "ficou preto", que não localiza nada.
	 */
	crash: {
		title: 'Algo quebrou nesta tela',
		description:
			'O restante da aplicação continua funcionando — use o menu para sair daqui, ou tente montar a tela de novo.',
		retry: 'Tentar de novo',
		details: 'Detalhe técnico',
	},
} as const
