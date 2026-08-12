/**
 * Conteúdo da landing pública.
 *
 * A landing é funcionalidade **nova**: o sistema legado não tinha uma, a raiz
 * caía direto na listagem. Não há "como já era" para copiar, então o texto é
 * decisão de produto e mora aqui, revisável num lugar só.
 */

export const landingTexts = {
	nav: {
		login: 'Entrar',
		signup: 'Criar conta',
		platform: 'Ir para a plataforma',
	},

	hero: {
		eyebrow: 'Laudos de engenharia elétrica',
		title: 'Da inspeção em campo ao laudo pronto para entrega.',
		description:
			'O Ituí conduz o engenheiro pelo roteiro da NBR 5410, organiza as evidências fotográficas e entrega o documento técnico formatado — sem planilha paralela e sem template de Word quebrado.',
		primaryCta: 'Começar agora',
		secondaryCta: 'Já tenho conta',
		mascotAlt: 'Ituí, o mascote da plataforma',
	},

	steps: {
		title: 'Três etapas, um documento',
		description:
			'O trabalho de campo alimenta o documento final diretamente. Nada é redigitado.',
		items: [
			{
				number: '01',
				title: 'Inspeção guiada',
				description:
					'Formulário estruturado nas seções da norma: planejamento, influências externas, avaliação qualitativa e quantitativa, e o quadro de circuitos. As opções normativas já vêm da NBR 5410 — nada de campo livre onde deveria haver classificação.',
			},
			{
				number: '02',
				title: 'Evidência fotográfica categorizada',
				description:
					'Cada foto entra classificada por tipo de não conformidade e pela seção do laudo a que pertence. Elas saem no documento como grade rotulada, com legenda e análise — não como uma pilha de imagens no fim do arquivo.',
			},
			{
				number: '03',
				title: 'Documento editável e exportável',
				description:
					'As tabelas e os dados são montados de forma determinística; a redação técnica é sugerida por IA e chega no editor, seção a seção. Você revisa, ajusta e exporta em PDF ou DOCX.',
			},
		],
	},

	compliance: {
		title: 'A norma é a estrutura, não um anexo',
		description:
			'O roteiro de inspeção segue a NBR 5410. As classificações de influência externa, os seis ensaios da avaliação quantitativa e o cálculo de espaço de reserva do quadro estão embutidos no fluxo.',
		items: [
			{
				title: 'Classificações normativas completas',
				description:
					'As 22 classes de influência externa com código e descrição, escolhidas de lista — sem digitar "AA5" de memória.',
			},
			{
				title: 'Os seis ensaios, com critério de aceitação',
				description:
					'Procedimento e critério aparecem como texto de apoio no formulário, inclusive a ramificação por esquema de aterramento.',
			},
			{
				title: 'Espaço de reserva calculado',
				description:
					'A exigência do item 6.5.4.7 é recalculada a partir dos circuitos cadastrados e mostrada ao lado do que foi declarado — divergência fica visível, sem veredito automático.',
			},
			{
				title: 'Sem teto artificial de circuitos',
				description:
					'O limite de 13 circuitos do sistema antigo era restrição do template de Word. Aqui não existe.',
			},
		],
	},

	cta: {
		title: 'Pronto para o próximo laudo?',
		description: 'Crie sua conta e comece pela primeira inspeção.',
		primary: 'Criar conta',
		secondary: 'Entrar',
	},

	footer: {
		tagline: 'Automatizador de laudos de inspeção elétrica.',
		rights: 'Todos os direitos reservados.',
	},
} as const
