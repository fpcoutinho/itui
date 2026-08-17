#!/usr/bin/env bash
#
# Publica o build do itui no S3 e invalida o CloudFront.
#
#   npm run deploy
#
# S3_BUCKET e CLOUDFRONT_DISTRIBUTION_ID saem do `.env.local`; defini-las no
# ambiente sobrescreve o arquivo, para um deploy pontual em outro destino.
#
# Requer AWS CLI v2 autenticada com permissão de s3:PutObject/DeleteObject no
# bucket e cloudfront:CreateInvalidation na distribuição.

set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# Ler só as duas chaves de deploy, em vez de dar `source` no arquivo inteiro:
# `.env.local` é editado à mão e um `source` executaria o que estivesse lá.
if [[ -f .env.local ]]; then
	while IFS='=' read -r key value; do
		[[ $key == S3_BUCKET || $key == CLOUDFRONT_DISTRIBUTION_ID ]] || continue
		[[ -n ${!key:-} ]] || printf -v "$key" '%s' "$value"
	done < .env.local
fi

: "${S3_BUCKET:?defina S3_BUCKET no .env.local}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?defina CLOUDFRONT_DISTRIBUTION_ID no .env.local}"

npm run build

# A ORDEM IMPORTA. Os assets sobem primeiro e **sem `--delete`**: durante o
# deploy ainda há navegadores com o index.html antigo em mãos, e apagar os
# assets que ele referencia quebraria a página no meio da publicação. Os nomes
# são versionados por hash pelo Vite, então convivem sem colidir.
#
# O custo é acúmulo de assets órfãos ao longo do tempo. Limpe com uma regra de
# ciclo de vida no bucket (expirar objetos em `assets/` sem acesso há N dias),
# não com `--delete` aqui.
echo "→ assets versionados (cache imutável)"
aws s3 sync dist/assets/ "s3://${S3_BUCKET}/assets/" \
	--cache-control "public,max-age=31536000,immutable"

# Arquivos de nome fixo (favicon.svg, mascot.png, icons.svg): cache curto, pois
# o nome não muda quando o conteúdo muda.
echo "→ arquivos estáticos de nome fixo"
aws s3 sync dist/ "s3://${S3_BUCKET}/" \
	--exclude "assets/*" \
	--exclude "index.html" \
	--cache-control "public,max-age=3600"

# O index.html é o ponteiro para tudo: sobe por último e nunca é cacheado pelo
# navegador, senão o usuário fica preso na versão anterior.
echo "→ index.html (no-cache)"
aws s3 cp dist/index.html "s3://${S3_BUCKET}/index.html" \
	--cache-control "no-cache"

# Invalidar só o que tem cache curto no edge. Os assets com hash nunca precisam
# de invalidação — e invalidação em excesso passa da cota gratuita de 1.000
# caminhos por mês.
echo "→ invalidando CloudFront"
aws cloudfront create-invalidation \
	--distribution-id "${CLOUDFRONT_DISTRIBUTION_ID}" \
	--paths "/" "/index.html" \
	--output text --query 'Invalidation.Id'

echo "✓ publicado"
