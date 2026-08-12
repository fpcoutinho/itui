// CloudFront Function (viewer request) — fallback de SPA.
//
// Anexar **somente ao comportamento padrão** da distribuição, nunca ao `/api/*`.
//
// Por que não usar Custom Error Responses, que é o truque comum de SPA:
// elas são configuradas por *distribuição*, não por comportamento, e passariam a
// valer também para as respostas do raijin. O contrato da API usa `404` de forma
// central — `GET /reports/{id}` responde `404` tanto para "não existe" quanto
// para "não é seu", de propósito, para não vazar a existência de laudo alheio.
// Mapeando 404 para /index.html com status 200, esse `404` chegaria ao frontend
// como um HTML dentro de um `200`, o `request()` tentaria dar JSON.parse numa
// página inteira, e o erro apareceria como qualquer coisa menos "laudo não
// encontrado".
//
// Reescrevendo aqui, no viewer request do comportamento padrão, o S3 nunca é
// consultado para uma rota de aplicação e a API fica intocada.

// O runtime do CloudFront Functions invoca `handler` como global — não há import
// nem export, e o dialeto é um ES5.1 restrito (daí o `var`).
// biome-ignore lint/correctness/noUnusedVariables: ponto de entrada do CloudFront Functions
function handler(event) {
	var request = event.request
	var uri = request.uri

	// Se o último segmento tem extensão, é arquivo de verdade (/assets/index-a1b2.js,
	// /favicon.svg, /mascot.webp): deixa passar para o S3.
	var lastSegment = uri.substring(uri.lastIndexOf('/') + 1)

	if (lastSegment.indexOf('.') !== -1) {
		return request
	}

	// Rota da aplicação (/, /plataforma, /conta/login): o React Router resolve
	// no cliente a partir do index.html.
	request.uri = '/index.html'

	return request
}
