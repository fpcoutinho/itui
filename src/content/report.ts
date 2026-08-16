/**
 * Textos pt-BR do laudo, isolados do JSX.
 *
 * Os rótulos de campo são transcrições de `raijin/docs/domain-glossary.md` —
 * são a pergunta que o engenheiro lê na inspeção, e mudá-los muda o documento
 * final. **Não reescrever para "melhorar".**
 *
 * O que **não** está aqui, de propósito: rótulo e opções das influências
 * externas e das escolhas normativas da §2/§4 (vêm de `nbr-5410-choices.json`),
 * e o procedimento dos ensaios (vem de `nbr-5410-tests.json`). Duplicar isso
 * aqui criaria uma segunda fonte da verdade para conteúdo normativo.
 */

import type { ReportSection } from '../services/types'

/** Título de cada seção. Os mesmos rótulos que o `/draft` usa como âncora. */
export const sectionTitles: Record<ReportSection, string> = {
	inspection_planning: 'Avaliação e planejamento da execução',
	external_influences: 'Avaliação das influências externas',
	qualitative_assessment: 'Avaliação qualitativa da instalação',
	quantitative_assessment: 'Avaliação quantitativa da instalação',
	circuits: 'Circuitos',
}

/** §2 — os 13 campos booleanos. Os 4 de escolha têm rótulo no JSON normativo. */
export const inspectionPlanningLabels = {
	teamFitForWork:
		'Os participantes da inspeção estão bem fisicamente e mentalmente?',
	safetyBriefingHeld: 'Houve diálogo de segurança?',
	hasNr10Training: 'Um ou mais executores da inspeção possui curso NR-10?',
	servicePreChecked: 'O serviço foi preliminarmente conferido?',
	requiresShutdown:
		'Este serviço requer desligamento ou bloqueio de equipamento ou rede?',
	requiresAreaDelimitation: 'Necessita delimitar a área de trabalho?',
	requiresUtilityAssistance: 'Necessita de auxílio de concessionária local?',
	requiresVoltageCheck: 'Necessário fazer verificação de tensão?',
	requiresTemporaryGrounding: 'A inspeção requer aterramento temporário?',
	workAtHeight: 'A inspeção será realizada em altura?',
	requiresSafetyHarness:
		'Será necessário se aprisionar à escada e utilização de cinto de segurança?',
	safetyRequirementsMet:
		'Os requisitos de segurança foram atendidos por todos?',
	requiresReassessment:
		'Houve necessidade de reavaliação das inspeções realizadas?',
} as const

/** §4 — os 21 itens ternários. As duas escolhas únicas têm rótulo no JSON. */
export const qualitativeLabels = {
	hasInstallationDocumentation:
		'Há documentação da instalação e esta inclui plantas, esquemas unifilares e outros, detalhes de montagem, memorial descritivo, especificações de componentes, parâmetros de projeto?',
	renovationDocumentationUpdated:
		'O ambiente sofreu alguma reforma e a documentação foi atualizada ou acrescida de algum aditivo de projeto?',
	inspectedBeforeCommissioning:
		'A instalação foi inspecionada antes da entrada em funcionamento e existe algum documento atestando esse fato?',
	wiringAllowsMaintenanceAccess:
		'As linhas elétricas estão dispostas de modo a permitir verificações, ensaios, reparos ou modificação da instalação?',
	componentsSelectedForExternalInfluences:
		'Os componentes da instalação foram selecionados e instalados levando-se em conta as influências externas?',
	wiringCorrectlyInstalled:
		'As linhas elétricas estão corretamente instaladas?',
	outletsComplyNbr14136:
		'As tomadas de força existentes atendem ao novo padrão nacional NBR 14136/2002?',
	sufficientOutletCount:
		'O ambiente apresenta tomadas de força em quantidade suficiente?',
	distributionBoardAccessible:
		'O quadro de distribuição está devidamente instalado em local de fácil acesso à manutenção, inspeção e ensaio?',
	distributionBoardWarningLabels:
		'Há indicações de advertência nos quadros de distribuição?',
	protectionDevicesIdentified:
		'Os dispositivos de proteção estão dispostos e identificados de forma fácil de reconhecer os respectivos circuitos protegidos?',
	protectionMatchesConductorGauge:
		'A proteção dos circuitos é compatível com a bitola dos condutores?',
	hasNeutralAndEarthBusbars:
		'O Quadro de distribuição possui barramento de neutro e aterramento?',
	terminalsMatchConductorGauge:
		'Todas as conexões estão com terminais apropriados para cada bitola utilizada?',
	conductorsColorIdentified:
		'Os condutores estão identificados por cores ou conforme sua função?',
	hasResidualCurrentDevice:
		'Existe disjuntor diferencial residual instalado no quadro de distribuição?',
	hasSurgeProtectionDevice:
		'Existe dispositivo de proteção contra surtos de tensões?',
	hasSafetyServiceEquipment:
		'Há elementos para serviços de segurança a exemplo de iluminação de emergência, exaustores de fumaça, etc?',
	hasBackupPowerSource: 'Existe fonte alternativa ou de reserva de energia?',
	hasSafetyPowerSource: 'Existe fonte de segurança de energia?',
	hasSourceParallelingPrevention:
		'Há mecanismos para evitar o paralelismo das fontes?',
} as const

/** §5 Parte I — rótulo e unidade das 13 medições. */
export const measurementLabels = {
	busbarCapacityAmps: { label: 'Capacidade de barramento', unit: 'A' },
	mainBreakerRatingAmps: { label: 'Proteção Geral Disjuntor', unit: 'A' },
	rcdRatingAmps: { label: 'Proteção DR', unit: 'A' },
	spdRatingAmps: { label: 'Proteção DPS', unit: 'A' },
	voltageAbVolts: { label: 'Vab', unit: 'V' },
	voltageAnVolts: { label: 'Van', unit: 'V' },
	currentPhaseAAmps: { label: 'Ia', unit: 'A' },
	voltageBcVolts: { label: 'Vbc', unit: 'V' },
	voltageBnVolts: { label: 'Vbn', unit: 'V' },
	currentPhaseBAmps: { label: 'Ib', unit: 'A' },
	voltageCaVolts: { label: 'Vca', unit: 'V' },
	voltageCnVolts: { label: 'Vcn', unit: 'V' },
	currentPhaseCAmps: { label: 'Ic', unit: 'A' },
} as const

/**
 * §5 Parte II — pergunta e critério de aceitação dos 6 ensaios.
 *
 * O **procedimento** não está aqui: vem de `nbr-5410-tests.json`, inclusive o
 * ramo condicional de 7.3.5. O **critério de aceitação** existe só na versão
 * `.md` do mesmo documento, e é transcrito literalmente daqui para a tela.
 */
export const testLabels = {
	continuityTest: {
		label:
			'Continuidade dos condutores de proteção e das eqüipotencializações principal e suplementar?',
		acceptance:
			'Critério não numérico: verificação de continuidade elétrica, não de valor de resistência.',
	},
	insulationResistanceTest: {
		label: 'Resistência de isolamento da instalação elétrica?',
		acceptance:
			'Para circuitos com tensão nominal até 500 V usar uma tensão de ensaio de 500 Vdd e obter R ≥ 0,5 MΩ.',
	},
	selvPelvSeparationTest: {
		label:
			'Resistência de isolamento aplicável a SELV, PELV e separação elétrica?',
		acceptance:
			'Para circuitos com extra baixa tensão funcional e SELV usar uma tensão de ensaio de 250 Vdd e obter R ≥ 0,25 MΩ.',
	},
	equipotentialBondingTest: {
		label:
			'Verificação das condições de proteção por eqüipotencialização e seccionamento automático da alimentação?',
		acceptance:
			'Critério conforme o esquema de aterramento declarado na avaliação qualitativa.',
	},
	appliedVoltageTest: {
		label: 'Ensaio de tensão aplicada?',
		acceptance:
			'Ausência de arcos ou disrupções durante 1 min de aplicação. Consultar a tabela 61 da NBR 5410 para a tensão a ser aplicada.',
	},
	functionalTest: {
		label: 'Ensaio de funcionamento?',
		acceptance:
			'Critério qualitativo: inspeção visual e funcional, sem valor numérico.',
	},
} as const

/** §5 Parte III — rótulos do circuito. */
export const circuitLabels = {
	circuitModel: 'Circuito',
	phase: 'Fase',
	breaker: 'Disjuntor',
	description: 'Descrição',
	conductor: 'Condutor',
	current: 'Corrente (A)',
} as const

/** Rótulos pt-BR das categorias de achado (`docs/findings-taxonomy.md`). */
export const findingCategoryLabels = {
	exposed_live_conductors: 'Condutores energizados expostos e sem proteção',
	improvised_earthing: 'Aterramentos improvisados',
	splice_conditions: 'Condições das emendas',
	poorly_installed_wiring: 'Linhas elétricas mal instaladas ou afixadas',
	short_circuit_or_hotspot_signs:
		'Sinais de ocorrência de curtos ou pontos quentes',
} as const

export const reportTexts = {
	/** Rótulos genéricos do `ConfirmDialog`; o texto da pergunta é de quem abre. */
	confirmDialog: {
		confirm: 'Confirmar',
		cancel: 'Cancelar',
	},

	answers: {
		yes: 'Sim',
		no: 'Não',
		partial: 'Parcialmente',
		notes: 'Observações',
		notesPlaceholder: 'Observações do inspetor (opcional)',
	},

	wizard: {
		label: 'Etapas da inspeção',
		steps: {
			inspection_planning: 'Planejamento',
			external_influences: 'Influências externas',
			qualitative_assessment: 'Avaliação qualitativa',
			quantitative_assessment: 'Avaliação quantitativa',
			circuits: 'Circuitos',
			images: 'Imagens',
			document: 'Documento',
			export: 'Exportar',
		},
		stepPosition: (current: number, total: number) =>
			`Etapa ${current} de ${total}`,
		done: 'Concluída',
		pending: 'Pendente',
		optional: 'Opcional',
		previous: 'Voltar',
		next: 'Avançar',
		save: 'Salvar seção',
		saving: 'Salvando…',
		saved: 'Seção salva.',
		/**
		 * O `PATCH` substitui a seção inteira, então só faz sentido submeter quando
		 * ela está completa. A mensagem diz quantos itens faltam, não quais — a
		 * marcação de erro por campo é que aponta o lugar.
		 */
		incomplete: (missing: number) =>
			missing === 1
				? 'Falta 1 item para concluir esta seção.'
				: `Faltam ${missing} itens para concluir esta seção.`,
		requiredField: 'Preencha este item.',
		invalidDecimal: 'Informe um número (use vírgula ou ponto como separador).',
	},

	loading: 'Carregando laudo…',

	quantitative: {
		partOne: 'Parte I — Quadro de distribuição e alimentador principal',
		partTwo: 'Parte II — Ensaios realizados',
		clause: 'NBR 5410',
		procedure: 'Procedimento',
		acceptance: 'Critério de aceitação',
		/**
		 * 7.3.5 ramifica pelo esquema de aterramento da §4. Sem ele preenchido não
		 * há ramo a exibir — mostrar um procedimento arbitrário seria pior que não
		 * mostrar nenhum.
		 */
		missingEarthingSystem:
			'O procedimento deste ensaio depende do esquema de aterramento. Preencha "Qual o esquema de aterramento utilizado?" na avaliação qualitativa.',
	},

	spareCircuits: {
		title: 'Espaço de reserva no quadro de distribuição',
		declared: 'Faixa declarada na avaliação qualitativa',
		circuitCount: 'Circuitos cadastrados',
		required: 'Espaço de reserva exigido (NBR 5410 6.5.4.7)',
		none: 'Nenhum circuito cadastrado ainda — não há exigência a calcular.',
		notDeclared: 'Ainda não declarada.',
		/**
		 * Divergência entre o declarado e o calculado é **informação**, não veredito:
		 * o backend deliberadamente não emite conformidade aqui, e a UI não inventa.
		 */
		divergence:
			'A faixa declarada não corresponde ao número de circuitos cadastrados. Confira qual dos dois reflete a instalação — o sistema não emite conformidade sobre isso.',
	},

	circuits: {
		title: 'Circuitos do quadro de distribuição',
		description: 'Sem limite de quantidade. Só a descrição é opcional.',
		add: 'Adicionar circuito',
		edit: 'Editar',
		remove: 'Remover',
		save: 'Salvar circuito',
		cancel: 'Cancelar',
		empty: 'Nenhum circuito cadastrado.',
		confirmRemove: (model: string) => `Remover o circuito ${model}?`,
		caption: 'Circuitos do quadro de distribuição',
		actions: 'Ações',
	},

	images: {
		title: 'Imagens do laudo',
		description:
			'Categoria do achado e seção do laudo são independentes: uma foto pode ter as duas, só uma, ou nenhuma. Sem seção, a foto entra no apêndice geral.',
		select: 'Escolher imagem',
		noFileSelected: 'Nenhum arquivo escolhido',
		findingCategory: 'Categoria da não conformidade',
		reportSection: 'Seção do laudo',
		caption: 'Legenda',
		noFindingCategory: 'Sem categoria',
		noSection: 'Apêndice geral',
		send: 'Enviar imagem',
		empty: 'Nenhuma imagem enviada.',
		pending: 'Envio incompleto',
		uploaded: 'Enviada',
		uploading: 'Enviando…',
		confirming: 'Confirmando…',
		retry: 'Tentar novamente',
		unsupportedType: 'Formato não aceito. Use JPEG, PNG, WEBP ou HEIC.',
		/** `view_url` vence em 5 minutos; a miniatura é recarregada, nunca guardada. */
		refresh: 'Atualizar miniaturas',
		loading: 'Carregando imagens…',
		view: 'Ver imagem',
		viewerTitle: 'Imagem do laudo',
		viewerPrevious: 'Imagem anterior',
		viewerNext: 'Próxima imagem',
		viewerPosition: (current: number, total: number) =>
			`${current} de ${total}`,
		viewerExpired:
			'O link desta imagem venceu. Use "Atualizar miniaturas" para pedir outro.',
	},

	/**
	 * Texto que entra **dentro** do laudo gerado, e não na interface em volta
	 * dele. Rótulos verbatim do cabeçalho do formulário legado
	 * (`raijin/docs/report-template.md` §"Cabeçalho do laudo") — quem confere o
	 * laudo compara com o formulário de campo, então reescrevê-los para "soar
	 * melhor" quebra a conferência.
	 */
	document: {
		context: {
			date: 'Data da inspeção',
			time: 'Hora da inspeção',
			location: 'Local',
			temperature: 'Condições climáticas: Temperatura',
			weather: 'Clima',
			responsibleParties: 'Responsáveis',
			notInformed: 'Não informado',
		},
	},

	editor: {
		title: 'Documento do laudo',
		description:
			'O texto abaixo é gerado a partir das seções preenchidas e pode ser editado livremente. As alterações são salvas automaticamente.',

		generate: '✨ Gerar Parecer com IA',
		regenerate: '✨ Gerar novamente',
		/** Só habilita com documento: a etapa seguinte não tem o que exportar sem ele. */
		toExport: 'Ir para a exportação',
		cancel: 'Interromper geração',
		drafting: 'Montando o documento…',
		streaming: 'Escrevendo o parecer…',

		/**
		 * A geração **substitui** o documento pelo modelo determinístico antes de
		 * streamar a prosa. Quem já editou precisa saber disso antes de clicar.
		 */
		confirmRegenerate:
			'Gerar novamente substitui todo o conteúdo do editor pelo documento montado a partir das seções. As edições feitas aqui serão perdidas. Continuar?',

		/**
		 * `finish_reason: "length"`: o teto de tokens cortou a redação. A última
		 * seção chegou incompleta e as seguintes não chegaram — apresentar como
		 * pronto seria entregar um laudo cortado sem avisar.
		 */
		truncated:
			'A redação foi interrompida pelo limite de texto do modelo: a última seção ficou incompleta e as seguintes não foram escritas. Os dados e as tabelas do laudo estão completos — gere novamente para tentar a redação inteira.',

		/** Falha do provedor no meio do stream. O documento determinístico continua íntegro. */
		generationFailed:
			'A redação por IA falhou, mas o documento do laudo está completo no editor — só a prosa não foi escrita.',

		empty:
			'Este laudo ainda não tem documento. Gere o parecer para montar o texto a partir das seções preenchidas.',

		saveStatus: {
			idle: '',
			pending: 'Alterações não salvas',
			saving: 'Salvando…',
			saved: 'Salvo',
			error: 'Não foi possível salvar',
		},
		saveNow: 'Salvar agora',

		toolbar: {
			label: 'Formatação do documento',
			undo: 'Desfazer',
			redo: 'Refazer',
			bold: 'Negrito',
			italic: 'Itálico',
			underline: 'Sublinhado',
			strike: 'Tachado',
			heading2: 'Título de seção',
			heading3: 'Subtítulo',
			bulletList: 'Lista com marcadores',
			orderedList: 'Lista numerada',
			link: 'Inserir link',
			unlink: 'Remover link',
			linkPrompt: 'Endereço do link:',
		},
	},
} as const
