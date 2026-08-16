<div align="center">
  <img src="public/mascot.webp" alt="Ituí" width="128" />

  # Ituí

  Interface web do automatizador de **Laudos de Engenharia Elétrica**.  
  Aplicação em **React + TypeScript**, estilizada com o Design System **Sanhauá** (SCSS puro), formulários guiados por schema e editor **TipTap** com streaming de IA em tempo real.

  ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&labelColor=18181B)
  ![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white&labelColor=18181B)
  ![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white&labelColor=18181B)
  ![Biome](https://img.shields.io/badge/Biome-2.5-60A5FA?logo=biome&logoColor=white&labelColor=18181B)
  ![TipTap](https://img.shields.io/badge/TipTap-WYSIWYG-2563EB?labelColor=18181B)
  ![Sanhauá](https://img.shields.io/badge/Design_System-Sanhauá-009688?labelColor=18181B)
  ![NBR 5410](https://img.shields.io/badge/NBR_5410-Compliant-00C853?labelColor=18181B)
  ![License](https://img.shields.io/badge/Licen%C3%A7a-Propriet%C3%A1ria-red?labelColor=18181B)
</div>

---

## 📌 Visão Geral

O **Ituí** é a interface do usuário onde o engenheiro eletricista realiza o preenchimento dos dados de inspeção em campo, anexa evidências fotográficas, recebe sugestões da IA via streaming e edita o laudo técnico final.

### Ecossistema de Repositórios

| Repositório | Descrição |
|---|---|
| [`gerador`](../gerador) | Monolito Django legado. Congelado, mantido apenas para consulta histórica. |
| [`raijin`](../raijin) | Backend em Rust/Axum + PostgreSQL + proxy de IA e emissão de URLs pré-assinadas. |
| **`itui`** *(este)* | Frontend React/Vite + Design System Sanhauá. Comunica-se com o Raijin via API REST. |

## 🛠️ Stack Tecnológica

- **Build & Core:** Vite + React 19 + TypeScript
- **Tooling (Lint & Format):** [Biome](https://biomejs.dev) (substitui ESLint e Prettier com performance nativa em Rust)
- **Roteamento:** `react-router` (declarativo, com URLs amigáveis em português)
- **Design System & Estilização:** [Sanhauá](https://github.com/fpcoutinho/sanhaua) (`sanhaua/react`) — SCSS puro, tokens globais injetados no Vite e classes aninhadas seguindo a convenção do próprio pacote — sem BEM (PROIBIDO Tailwind CSS).
- **Editor Rich Text:** TipTap (StarterKit, Underline, Link) salvando estrutura nativa em JSONB.
- **Exportação de Documentos:** PDF via `window.print()` + `@page` e DOCX via `@turbodocx/html-to-docx` + `file-saver` (100% client-side, sem dependência de servidor). As fotos entram no `.docx` em Base64, baixadas da URL assinada no momento da exportação; o conversor preserva `colspan`, exigência das tabelas de cabeçalho duplo do laudo.

## 📐 Arquitetura e Decisões de Frontend

- **Formulário Dirigido por Schema Declarativo:** O formulário de inspeção não declara os ~90 campos manualmente. A renderização é guiada dinamicamente pelo mapa do glossário de domínio e pelas opções estáticas de [`docs/nbr-5410-choices.json`](docs/nbr-5410-choices.json).
- **Streaming de IA no TipTap (SSE):** O hook `useGenerateAI` consome *Server-Sent Events* da API Rust e atualiza o estado do editor TipTap em tempo real conforme a Groq gera o parecer normativo.
- **Avaliação Qualitativa Ternária:** Suporta a regra de negócio com respostas `Sim`, `Não` e `Parcialmente` + observação textual. Ensaios quantitativos exibem textos de procedimento e critérios da NBR 5410.
- **Upload Direto para Storage (Zero-SDK):** Faz o `PUT` HTTP diretamente para a URL pré-assinada emitida pelo Raijin, eliminando SDKs de provedores específicos e garantindo portabilidade entre S3, Supabase Storage e R2.

## 🗺️ Rotas da Aplicação

| Rota | Descrição | Acesso |
|---|---|---|
| `/` | Landing page institucional e comercial (funcionalidade nova) | Público |
| `/plataforma` | Painel principal, gestão e listagem dos laudos | Privado |
| `/conta/login` | Autenticação (e-mail/senha + Google OAuth) | Público |
| `/conta/cadastro` | Registro de novos engenheiros | Público |
| `/conta/logout` | Ação: encerra a sessão no backend (`POST /api/v1/auth/logout`) e redireciona — ver `CLAUDE.md` | Privado |

## 📂 Estrutura do Projeto

```text
src/
├── pages/             # Componentes de rota (LandingPage, PlatformPage, pages/account/*)
├── components/
│   ├── ui/            # Base acoplado ao contexto da app (PageHeader, ThemeToggle)
│   └── features/      # Domínio (CreateReportForm, GoogleSignInButton)
├── design-system/     # Quarentena: micro e agnóstico a contexto (hoje, vazia)
├── session/           # Access token em memória + renovação agendada
├── export/            # Laudo → arquivo: impressão (PDF), conversão (DOCX), imagens em Base64
├── hooks/             # useSession, useReports, useGoogleIdentity
├── services/          # Clientes HTTP e contratos espelhados da API do Raijin
├── content/           # Textos pt-BR isolados do JSX
└── styles/            # global.scss (reset e base)
docs/
├── api-contract.md    # Cópia do contrato REST — leia antes de escrever serviço
├── nbr-5410-*.json    # Cópias locais sincronizadas com o backend
└── design-system-candidates.md # O que está na quarentena e por quê
```

> `docs/` fica fora do Biome (`files.includes` no `biome.json`): são cópias byte a
> byte do `raijin`, e reformatá-las quebraria a comparação com o original.

## ⚙️ Setup

### 1. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Nenhuma é segredo — tudo com prefixo `VITE_` vai para o bundle em texto claro:

| Variável | O que é |
|---|---|
| `RAIJIN_ORIGIN` | destino do proxy do dev server. Sem prefixo `VITE_`: é lida só pelo `vite.config.ts`, em Node, e não vai para o bundle |
| `VITE_API_BASE_URL` | base da API no navegador, **sem** o `/api/v1`. Vazio = modo proxy |
| `VITE_GOOGLE_CLIENT_ID` | Client ID do Google Identity Services |

### 2. A API em dev vai por proxy, não cross-origin

```bash
npm run dev   # http://localhost:5173
```

O `vite.config.ts` encaminha `/api` para o `RAIJIN_ORIGIN`. Como as chamadas
saem para a própria origem do front, duas coisas somem de uma vez: **CORS** (nem
preflight nem `CORS_ALLOWED_ORIGINS` para manter em sincronia) e a discussão
sobre **cookie de terceiros** — o refresh token é first-party.

Uma armadilha para não reintroduzir: o cookie tem `Path=/api/v1/auth`. Qualquer
`rewrite` no proxy que remova o `/api` faz o navegador **gravar** o cookie e
nunca mais enviá-lo. O sintoma é `401` eterno no refresh, sem pista da causa. O
caminho é preservado de propósito.

#### Modo cross-origin, para reproduzir produção

Preencha `VITE_API_BASE_URL` (ex.: `https://api.seudominio.com`) e as chamadas
voltam a sair diretas, como em produção. Nesse modo a origem do front **precisa**
estar em `CORS_ALLOWED_ORIGINS` no `.env` do `raijin`. Use antes de subir, para
exercitar o caminho real da sessão — é o que o proxy convenientemente esconde.

### 3. O que se mantém em sincronia com o `raijin`

1. **`GOOGLE_CLIENT_ID`** — é o mesmo valor dos dois lados. O front usa para
   inicializar o Google Identity Services; o backend, para validar a *audience*
   do ID Token. Client ID diferente = `401` em todo login com Google.
2. **`CORS_ALLOWED_ORIGINS`** — irrelevante no modo proxy; obrigatório no modo
   cross-origin e em produção, caso a API não fique sob o mesmo domínio.
3. **`docs/`** — `api-contract.md`, `nbr-5410-*.json` e `findings-taxonomy.md`
   são cópias manuais. Se mudarem no `raijin`, sincronize aqui.

## 🚀 Comandos de Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento local (https://localhost:5173)
npm run dev

# Checar lint e formatação com o Biome
npm run lint

# Corrigir automaticamente problemas de lint e formatação
npm run lint:fix

# Formatar arquivos
npm run format

# Gerar build de produção (tsc -b && vite build)
npm run build

# Executar a build de produção localmente
npm run preview

# Publicar (ver "Deploy" abaixo)
S3_BUCKET=... CLOUDFRONT_DISTRIBUTION_ID=... npm run deploy
```

## ☁️ Deploy — S3 + CloudFront

O build é estático e vai para um bucket **S3 privado**; o `raijin` roda em
**Lambda** com Function URL. Uma única distribuição **CloudFront** serve os dois
sob o mesmo domínio, e é isso que torna a API same-origin em produção: cookie de
refresh first-party, sem CORS, e o proxy do dev server vira réplica do prod.

### Por que mesma origem

O refresh token é `HttpOnly; Secure; SameSite=None; Path=/api/v1/auth`. Servido de
um domínio registrável diferente do front, ele vira cookie de terceiros — o Safari
bloqueia por padrão (ITP) e a sessão de 30 dias morre a cada reload. Sob o mesmo
domínio o problema deixa de existir. **Não é preciso domínio próprio**: o
`*.cloudfront.net` da distribuição já resolve, porque o cookie é host-only.

### Comportamentos da distribuição

A ordem importa — `/api/*` precisa vir **antes** do padrão.

| Precedência | Path pattern | Origem | Cache | Origin request policy |
|---|---|---|---|---|
| 0 | `/api/*` | Function URL do Lambda | `CachingDisabled` | `AllViewerExceptHostHeader` |
| — | `Default (*)` | bucket S3, via OAC | `CachingOptimized` | — |

Detalhes que quebram silenciosamente se errados:

- **`/api/*` com cache desabilitado, sem exceção.** Com cache ligado, o CloudFront
  serviria a resposta de `GET /reports` de um usuário para outro. É vazamento de
  dados, não lentidão.
- **Métodos permitidos em `/api/*`**: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE.
  O padrão da console é só GET/HEAD e faria todo `POST /auth/login` falhar.
- **`AllViewerExceptHostHeader`** é o que encaminha `Authorization` e `Cookie`. A
  exceção do `Host` é necessária porque a Function URL rejeita um `Host` que não
  seja o dela.
- **O caminho é preservado.** Nada de reescrever `/api` para `/`: o cookie tem
  `Path=/api/v1/auth` e deixaria de ser enviado, resultando em `401` eterno no
  refresh sem pista da causa.

### Fallback de SPA: CloudFront Function, não Custom Error Response

[`deploy/spa-router.js`](deploy/spa-router.js) reescreve rotas de aplicação
(`/plataforma`, `/conta/login`) para `/index.html`. Publique como **CloudFront
Function** e associe ao **viewer request do comportamento padrão apenas**.

O truque usual de SPA — mapear 403/404 para `/index.html` com status 200 — **não
serve aqui**. Custom Error Responses são configuradas por distribuição, não por
comportamento, e valeriam também para o `raijin`. O contrato usa `404` de forma
central (`GET /reports/{id}` responde `404` tanto para "não existe" quanto para
"não é seu", de propósito), e esse `404` chegaria ao frontend como HTML dentro de
um `200`.

### Ordem de criação

1. Bucket S3 **privado** — sem acesso público, sem static website hosting.
2. Distribuição CloudFront com origem no bucket via **OAC**; aplique a bucket
   policy que a console gera.
3. Origem 2: a Function URL do `raijin`; comportamento `/api/*` conforme a tabela.
4. Publique a CloudFront Function e associe ao comportamento padrão.
5. `VITE_API_BASE_URL` **vazio** no build de produção — as chamadas saem
   relativas e o CloudFront roteia.
6. Adicione o domínio da distribuição às *Authorized JavaScript origins* do OAuth
   client no Google Cloud Console. Sem isso o botão do Google não inicializa em
   produção, e o erro no console não é óbvio.
7. Defina retenção nos log groups do CloudWatch (o padrão é não expirar nunca).

### Publicar

```bash
S3_BUCKET=meu-bucket CLOUDFRONT_DISTRIBUTION_ID=E123ABC npm run deploy
```

[`deploy/deploy.sh`](deploy/deploy.sh) sobe os assets versionados primeiro (cache
imutável, **sem `--delete`**, para não quebrar quem está com o `index.html`
antigo em mãos), depois o `index.html` com `no-cache`, e invalida só `/` e
`/index.html` — assets com hash nunca precisam de invalidação, e a cota gratuita
é de 1.000 caminhos por mês.

Assets órfãos acumulam com o tempo: limpe com uma regra de ciclo de vida no
bucket, não com `--delete` no deploy.

## 🔑 Como a sessão funciona

Dois tokens, dois transportes, e a divisão é deliberada:

| | Onde vive | Validade | Quem renova |
|---|---|---|---|
| **Access token** | memória do `itui` (um `useRef` no `SessionProvider`) | 15 min | timer agendado por `expires_in` |
| **Refresh token** | cookie `httpOnly` que o JS não lê | 30 dias | rotacionado a cada uso |

- **Nunca `localStorage`.** O refresh token está protegido de XSS por ser
  `httpOnly`; guardar o access token no storage devolveria metade dessa
  superfície de ataque de graça.
- **A renovação é agendada por `expires_in`** (segundos, no corpo da resposta) —
  o JWT **não** é decodificado no navegador.
- **No boot, um `POST /auth/refresh`.** Como o token vive só em memória, ele
  morre a cada reload; apresentar o cookie é a única forma de restaurar a sessão.
  `401` aqui é o caminho normal de quem não está logado, não um erro.
- **`401` em qualquer chamada** dispara um refresh e **uma** repetição da
  requisição original. Falhou o refresh, a sessão acabou — inclusive porque um
  takeover de conta via Google revoga toda a cadeia de refresh tokens do usuário.
- **Sem coordenação entre abas.** A rotação do refresh token tem uma janela de
  tolerância de 10 s no backend, justamente para duas abas renovando ao mesmo
  tempo não derrubarem a sessão uma da outra. Não implemente `BroadcastChannel`.

## 📚 Documentação e Sincronização de Domínio

A fonte de verdade dos nomes de campos, tipos e enums reside em `raijin/docs/domain-glossary.md`. Nenhuma prop, estado ou campo de formulário no **Ituí** deve ter sua nomenclatura inventada — siga rigorosamente o glossário.

O contrato REST está em [`docs/api-contract.md`](docs/api-contract.md) — rota, campo, formato de erro e consumo do SSE. Leia antes de escrever qualquer serviço; não infira nada de uma resposta observada.

Dois detalhes do contrato que geram bug silencioso se ignorados:

- **Decimais são string no fio** (`"127.30"`). `numeric` no Postgres e
  `rust_decimal::Decimal` no Rust existem para não perder precisão; um
  `parseFloat` antes de enviar desfaz essa garantia no último metro. Converter
  **só para exibir** (`src/services/decimal.ts`).
- **`422` tem duas formas.** O semântico traz o envelope `{ "error": "..." }` com
  mensagem pt-BR pronta para a tela. O estrutural (JSON malformado, campo
  ausente, tipo errado) é rejeitado pelo extractor do axum antes do handler e
  volta como texto puro em inglês — serve para depurar, nunca para exibir. O
  parse de erro em `src/services/http.ts` não assume corpo JSON.

## 🔒 Licença e Propriedade

Este projeto é um software proprietário e de uso confidencial. Todos os direitos sobre o código-fonte, arquitetura, design e documentação são reservados a **Filipe Paulo Coutinho**. 

O acesso ao repositório não concede nenhuma licença de uso, cópia, modificação ou redistribuição por terceiros sem autorização prévia por escrito.
