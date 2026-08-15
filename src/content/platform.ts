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
		underConstruction:
			'Ainda não há o que editar: a API não expõe dados de perfil além do e-mail da sessão.',
		email: 'E-mail',
		theme: 'Tema',
	},

	filters: {
		legend: 'Filtrar laudos',
		status: 'Situação',
		anyStatus: 'Todas as situações',
		locationPrefix: 'Bloco',
		locationPrefixPlaceholder: 'Ex.: CCHLA',
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
		/** Sem total: a listagem devolve array cru. Ver `docs/api-contract.md`. */
		range: (first: number, last: number) => `Mostrando ${first}–${last}`,
	},

	sort: {
		/**
		 * A ordenação é client-side e só classifica a página carregada, então os
		 * controles somem quando há mais de uma. Ver `docs/api-contract.md`.
		 */
		paginatedHint:
			'A ordenação fica disponível quando todos os laudos cabem numa página.',
	},

	empty: {
		title: 'Nenhum laudo por aqui',
		description: 'Crie o primeiro laudo para começar o registro da inspeção.',
		filtered: 'Nenhum laudo corresponde aos filtros aplicados.',
	},

	form: {
		title: 'Novo laudo',
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
} as const
