/**
 * Conteúdo da landing pública.
 *
 * A landing é funcionalidade **nova**: o sistema legado não tinha uma, a raiz
 * caía direto na listagem. Não há "como já era" para copiar, então o texto é
 * decisão de produto e mora aqui, revisável num lugar só.
 *
 * O `icon` de cada item é nome de glifo do Material Symbols Rounded (a fonte
 * vem do `sanhaua/style.css`). Fica junto do item, e não numa tabela paralela
 * no JSX, porque é parte do descritor — trocar o item sem trocar o glifo
 * produziria um pictograma que não descreve mais nada.
 */

export const landingTexts = {
	nav: {
		login: 'Entrar',
		signup: 'Criar conta',
		platform: 'Ir para a plataforma',
	},

	hero: {
		badge: 'Conforme a NBR 5410',
		title: 'Da inspeção em campo ao laudo pronto para entrega.',
		description:
			'O Ituí conduz o engenheiro pelo roteiro da NBR 5410, organiza as evidências fotográficas e entrega o documento técnico formatado — sem planilha paralela e sem template de Word quebrado.',
		primaryCta: 'Começar agora',
		secondaryCta: 'Já tenho conta',
		mascotAlt: 'Ituí, o mascote da plataforma',
		highlights: [
			{ value: '5', label: 'seções normativas no roteiro' },
			{ value: '22', label: 'classes de influência externa' },
			{ value: '6', label: 'ensaios com critério de aceitação' },
		],
	},

	steps: {
		eyebrow: 'Como funciona',
		title: 'Três etapas, um documento',
		description:
			'O trabalho de campo alimenta o documento final diretamente. Nada é redigitado.',
		items: [
			{
				number: '01',
				icon: 'checklist',
				title: 'Inspeção guiada',
				description:
					'Formulário estruturado nas seções da norma: planejamento, influências externas, avaliação qualitativa e quantitativa, e o quadro de circuitos. As opções normativas já vêm da NBR 5410 — nada de campo livre onde deveria haver classificação.',
			},
			{
				number: '02',
				icon: 'photo_library',
				title: 'Evidência fotográfica categorizada',
				description:
					'Cada foto entra classificada por tipo de não conformidade e pela seção do laudo a que pertence. Elas saem no documento como grade rotulada, com legenda e análise — não como uma pilha de imagens no fim do arquivo.',
			},
			{
				number: '03',
				icon: 'edit_document',
				title: 'Documento editável e exportável',
				description:
					'As tabelas e os dados são montados de forma determinística. Você revisa, ajusta e exporta em PDF ou DOCX.',
			},
		],
	},

	compliance: {
		eyebrow: 'A norma por dentro',
		title: 'A norma é a estrutura, não um anexo',
		description:
			'O roteiro de inspeção segue a NBR 5410. As classificações de influência externa, os seis ensaios da avaliação quantitativa e o cálculo de espaço de reserva do quadro estão embutidos no fluxo.',
		items: [
			{
				icon: 'rule',
				title: 'Classificações normativas completas',
				description:
					'As 22 classes de influência externa com código e descrição, escolhidas de lista — sem digitar "AA5" de memória.',
			},
			{
				icon: 'experiment',
				title: 'Os seis ensaios, com critério de aceitação',
				description:
					'Procedimento e critério aparecem como texto de apoio no formulário, inclusive a ramificação por esquema de aterramento.',
			},
			{
				icon: 'calculate',
				title: 'Espaço de reserva calculado',
				description:
					'A exigência do item 6.5.4.7 é recalculada a partir dos circuitos cadastrados e mostrada ao lado do que foi declarado — divergência fica visível, sem veredito automático.',
			},
			{
				icon: 'auto_awesome',
				title: 'Assistente de IA',
				description:
					'Receba sugestões de redação técnica de um assistente de IA! Ele analisa os dados da sua inspeção e gera o texto diretamente no editor, seção por seção.',
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
