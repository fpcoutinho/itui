/**
 * Exportação PDF pela impressão do navegador.
 *
 * Não há gerador de PDF no bundle, e é decisão, não falta: o mecanismo de
 * impressão do navegador já pagina, quebra tabela, repete cabeçalho e escreve
 * PDF/A — e o faz com o mesmo motor que renderizou o laudo na tela, então o
 * arquivo é fiel ao que o engenheiro revisou. Uma biblioteca de PDF traria
 * megabytes de fontes e uma segunda implementação de layout para divergir da
 * primeira.
 *
 * O preço é que o layout impresso é responsabilidade do CSS (`styles/print.scss`)
 * e o destino "Salvar como PDF" é uma escolha do usuário no diálogo, não algo
 * que a aplicação possa forçar.
 */

import { waitForImages } from './imageAssets'

interface ExportPdfInput {
	/**
	 * Raiz da região impressa — a `<img>` daqui é a que precisa estar carregada.
	 * `null` cai no documento inteiro, que é o pior caso aceitável.
	 */
	root: HTMLElement | null
	/**
	 * Vira o nome sugerido no diálogo de impressão: o Chrome usa o
	 * `document.title` como nome do PDF salvo. Sem isso o engenheiro recebe um
	 * arquivo chamado "Ituí".
	 */
	fileName: string
}

/**
 * Prepara e abre o diálogo de impressão.
 *
 * A espera pelas imagens é o passo que não pode ser pulado: `window.print()` é
 * síncrono e fotografa o documento como ele está: `<img>` ainda em voo sai como
 * espaço em branco, e o achado fotográfico — que é a parte do laudo que
 * ninguém consegue refazer depois — some do PDF sem aviso nenhum.
 */
export async function exportReportToPdf({
	root,
	fileName,
}: ExportPdfInput): Promise<void> {
	await waitForImages(root ?? document.body)

	// Um quadro depois do carregamento: as imagens acabaram de chegar e o layout
	// ainda não reposicionou o que elas empurraram.
	await new Promise((resolve) => requestAnimationFrame(resolve))

	const previousTitle = document.title
	document.title = fileName

	try {
		window.print()
	} finally {
		// `print()` só retorna depois que o diálogo fecha nos navegadores atuais,
		// mas o `finally` cobre o caso em que ele não bloqueia — o título nunca
		// pode ficar preso no nome do arquivo.
		document.title = previousTitle
	}
}
