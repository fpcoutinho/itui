#!/usr/bin/env bash
#
# Publica o build do itui no S3 e invalida o CloudFront.
#
#   S3_BUCKET=meu-bucket CLOUDFRONT_DISTRIBUTION_ID=E123ABC ./deploy/deploy.sh
#
# Requer AWS CLI v2 autenticada com permissão de s3:PutObject/DeleteObject no
# bucket e cloudfront:CreateInvalidation na distribuição.

set -euo pipefail

: "${S3_BUCKET:?defina S3_BUCKET}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?defina CLOUDFRONT_DISTRIBUTION_ID}"

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
