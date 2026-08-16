/**
 * Textos pt-BR da exportação, isolados do JSX.
 *
 * Os rótulos daqui são de **tela e de documento** ao mesmo tempo: o mesmo
 * `header.location` que rotula a linha do cabeçalho impresso também rotula a
 * célula do `.docx`. Manter um só lugar evita que o PDF e o DOCX divirjam no
 * nome de um campo.
 */

export const exportTexts = {
	title: 'Ações finais',
	description:
		'Os campos abaixo compõem a capa, o cabeçalho institucional e a assinatura do documento exportado. Eles não fazem parte do laudo no servidor — ficam salvos apenas neste navegador.',

	/** Recado que justifica o `localStorage`; some se o usuário nunca preencher nada. */
	localOnly:
		'Preenchimento local: estes campos não são enviados ao servidor nem versionados junto do laudo.',

	groups: {
		cover: 'Capa e cabeçalho institucional',
		art: 'Responsabilidade técnica',
		signature: 'Parecer e assinatura',
	},

	fields: {
		institutionName: 'Nome da empresa ou instituição',
		institutionSubtitle: 'Linha complementar do cabeçalho',
		documentTitle: 'Título do documento',
		clientName: 'Contratante',
		coverLocation: 'Edificação ou endereço',
		artNumber: 'Número da ART',
		artNote: 'Observação da ART',
		closingRemarks: 'Parecer final',
		signerName: 'Responsável técnico',
		signerTitle: 'Título profissional',
		signerRegistration: 'Registro profissional (CREA/CFT)',
		signaturePlace: 'Local da assinatura',
		signatureDate: 'Data da assinatura',
	},

	hints: {
		documentTitle: 'Aparece na capa e no nome do arquivo exportado.',
		artNumber:
			'Anotação de Responsabilidade Técnica registrada para o serviço.',
		closingRemarks:
			'Texto livre impresso acima da linha de assinatura. Não substitui o parecer do editor.',
	},

	/** Rótulos do cabeçalho de identificação, montado a partir do `GET /reports/{id}`. */
	header: {
		title: 'Identificação da inspeção',
		inspectedAt: 'Data e hora da inspeção',
		location: 'Local inspecionado',
		temperature: 'Temperatura ambiente',
		weather: 'Condições climáticas',
		responsibleParties: 'Responsáveis presentes',
		art: 'ART',
		client: 'Contratante',
		notInformed: 'Não informado',
	},

	cover: {
		defaultTitle: 'Laudo de inspeção predial de instalações elétricas',
		standard: 'ABNT NBR 5410',
		issuedAt: 'Emitido em',
	},

	signature: {
		title: 'Parecer e assinatura',
		line: 'Assinatura do responsável técnico',
	},

	actions: {
		pdf: 'Exportar PDF',
		docx: 'Exportar DOCX',
		preparingPdf: 'Preparando impressão…',
		preparingDocx: 'Montando o arquivo…',
	},

	dismiss: 'Dispensar aviso',

	status: {
		/** O diálogo de impressão é do navegador: a partir daqui a UI não controla mais nada. */
		printReady:
			'A janela de impressão foi aberta. Escolha "Salvar como PDF" no destino.',
		docxReady: 'Arquivo .docx gerado.',
	},

	errors: {
		emptyDocument:
			'O documento está vazio. Gere ou escreva o parecer antes de exportar.',
		printFailed: 'Não foi possível preparar a impressão.',
		docxFailed: 'Não foi possível gerar o arquivo .docx.',
		/**
		 * Uma foto que não pôde ser baixada é perda de conteúdo no arquivo final —
		 * o documento sai, mas o usuário precisa saber que saiu incompleto.
		 */
		missingImages: (count: number) =>
			count === 1
				? '1 imagem não pôde ser incorporada ao arquivo e saiu apenas como legenda.'
				: `${count} imagens não puderam ser incorporadas ao arquivo e saíram apenas como legenda.`,
	},
} as const
