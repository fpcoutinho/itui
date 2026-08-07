# CLAUDE.md

Frontend do sistema de Laudos de Engenharia Elétrica. React + Vite, Design System Sanhauá. Substitui o front do monolito Django legado (repositório `gerador`, congelado — **não releia esse repositório**; conhecimento de domínio necessário já está em `docs/` e vem do backend `raijin`).

## Repositórios do projeto

| Repositório | Conteúdo |
|---|---|
| `gerador` | Monolito Django legado. Congelado. |
| `raijin` | Backend Rust/Axum + schema do banco. Fonte de verdade do domínio (`raijin/docs/domain-glossary.md`). |
| `itui` (este) | Frontend. |

O contrato entre `itui` e `raijin` é a **API REST**, documentada em `raijin/docs/api-contract.md` (ainda não existe — nasce junto com os endpoints, Step 4 da migração). Sem tipos compartilhados automaticamente entre Rust e TypeScript: ao consumir um endpoint novo, replique o shape manualmente em `src/services/`.

## Stack

- **Build**: Vite + React + TypeScript.
- **Lint/format**: Biome (não ESLint/Prettier) — `npm run lint`, `npm run lint:fix`, `npm run format`.
- **Rotas**: `react-router` (declarativo, `BrowserRouter`/`Routes`/`Route`).
- **Design System**: [Sanhauá](https://github.com/fpcoutinho/sanhaua) — pacote npm próprio (`sanhaua`), já publicado. Multiplataforma (React/Vue/Web Components); aqui usamos a build React (`sanhaua/react`).
- **Editor**: TipTap (WYSIWYG, salva JSONB) — entra no Step 5.
- **Exportação**: PDF via `window.print()` + `@page`; DOCX via `html-to-docx` no navegador — 100% client-side, entra no Step 6.

## Rotas

URLs em português (são conteúdo voltado ao usuário, diferente de rota de API):

| Rota | Conteúdo | Acesso |
|---|---|---|
| `/` | Landing | Público |
| `/plataforma` | Lista de laudos | Privado |
| `/conta/login` | Login (e-mail/senha + Google) | Público |
| `/conta/cadastro` | Cadastro | Público |
| `/conta/logout` | Ação: `POST /api/v1/auth/logout` com `credentials: 'include'`, limpa o access token da memória, redireciona pra `/` | — |

O legado não tinha landing — a raiz caía direto na listagem. A landing é **funcionalidade nova**, decidida explicitamente, e precisa ser bem cuidada visualmente (não é migração, não tem "como já era" pra copiar).

`/conta/logout` não é página de conteúdo, mas também **não é ação puramente client-side**: o refresh token é um cookie `httpOnly`, então JS não consegue lê-lo nem apagá-lo. Sem o `POST /api/v1/auth/logout` a sessão de 30 dias continua viva no servidor mesmo com a UI parecendo deslogada.

## Contrato de autenticação

Dois tokens, dois transportes diferentes:

- **Access token** — vem no corpo JSON da resposta, vale 15 minutos, vai em `Authorization: Bearer <token>` em toda chamada de API que não seja de auth. Guardar **só em memória, nunca em `localStorage`**: o refresh token já está protegido de XSS por ser `httpOnly`, e jogar o access token no storage devolveria parte dessa superfície.
- **Refresh token** — cookie `httpOnly` setado pelo backend. JS não lê nem precisa ler; basta `fetch(..., { credentials: 'include' })` nas rotas de auth. Atributos do cookie: `HttpOnly; Secure; SameSite=None; Path=/api/v1/auth`.

As cinco rotas, todas `POST` sob `/api/v1/auth`:

| Rota | Corpo | Retorno |
|---|---|---|
| `/register` | `{ email, password }` | 201 + sessão |
| `/login` | `{ email, password }` | 200 + sessão |
| `/google` | `{ id_token }` | 200 + sessão |
| `/refresh` | (nenhum — o cookie é a credencial) | 200 + sessão |
| `/logout` | (nenhum — o cookie é a credencial) | 204 |

O corpo "sessão" é `{ access_token, token_type, expires_in, user }`. `token_type` é sempre `"Bearer"` — montar o header a partir dele em vez de hardcodar o esquema. O refresh token **não** vem no corpo.

**Renovação**: agendar o refresh a partir de `expires_in` (segundos); **não** decodificar o JWT no navegador. Em 401 de qualquer chamada de API, tentar `POST /auth/refresh` uma vez e repetir a requisição original; se o refresh também der 401, mandar o usuário pro login.

**Multi-aba já está resolvido no backend**: a rotação do refresh token tem uma janela de tolerância de 10 segundos justamente pra que duas abas renovando ao mesmo tempo não derrubem a sessão uma da outra. Ou seja, o `itui` **não** precisa de `BroadcastChannel` nem de lock em `localStorage` — não implemente essa coordenação.

**Google**: carregar o Google Identity Services, usar o `GOOGLE_CLIENT_ID` (não é segredo — vai no bundle por design), receber o ID Token e mandá-lo pra `/api/v1/auth/google`.

**Erros**:

- 401 em `/login` é **sempre** a mensagem genérica "E-mail ou senha inválidos". O backend nunca revela se o e-mail existe nem se é conta Google — isso seria um oráculo de enumeração de usuários. Por isso a dica de "entrou com o Google?" na UI é **linha estática abaixo do formulário** (ex.: "Entrou com o Google? Use o botão acima"), nunca algo renderizado em reação à resposta do servidor.
- 409 em `/register` distingue dois casos na mensagem: e-mail já cadastrado, ou e-mail que é conta Google (usar o botão do Google).
- 503 em `/google` é serviço de chaves do Google inacessível — mostrar retentativa, não erro de credencial.

**CORS**: toda chamada autenticada precisa de `credentials: 'include'`, e a origem de dev do `itui` precisa estar registrada em `CORS_ALLOWED_ORIGINS` no `.env` do `raijin` — é o primeiro lugar a olhar quando aparecer falha opaca de CORS.

## Convenções de código

- Tudo em inglês no código: variáveis, funções, props, hooks, nomes de arquivo. `camelCase` pra variáveis/funções/props/hooks, `PascalCase` pra componentes e seus arquivos `.tsx`.
- Português só em conteúdo voltado ao usuário final: labels, textos de UI, mensagens de erro exibidas, URLs de rota, e o conteúdo do laudo gerado. Textos ficam isolados (i18n/constantes), não espalhados em JSX.
- **Não invente nomes de campo do domínio.** Vêm de [`raijin`'s `domain-glossary.md`](../raijin/docs/domain-glossary.md) — consulte lá antes de nomear um campo de formulário, prop ou variável de estado ligada ao laudo.

## Design System Sanhauá — como está configurado

- **PROIBIDO** Tailwind ou biblioteca de UI de terceiros (DaisyUI, shadcn/ui, Material UI etc.).
- **BEM** rigoroso pra classes CSS (`.report-editor__button`, `.report-editor__button--active`).
- **SCSS puro**, um arquivo `.scss` por componente, acoplado ao `.tsx`.
- **Tokens injetados globalmente** via `vite.config.ts` (`css.preprocessorOptions.scss.additionalData`, apontando pra `sanhaua/system/themes/main/design-tokens/design-tokens.scss`). Nenhum `.scss` de componente precisa importar tokens manualmente — só usar `var(--color-primary)`, `var(--spacing-sm)`, `var(--radius-base)` etc.
- O pacote `sanhaua` usa um alias interno `@theme` nos próprios arquivos-fonte; replicado em `resolve.alias` do `vite.config.ts` (necessário pra resolver `system.scss` de dentro de `node_modules` sem erro).
- Componentes prontos vêm de `sanhaua/react`. Componentes novos e genéricos o bastante pra virar parte do DS nascem em `src/components/ui/` e podem subir pro pacote `sanhaua` depois — não duplicar o que já existe lá.

## Estrutura de pastas

- `src/pages/` — um componente por rota (`LandingPage`, `PlatformPage`, `pages/account/LoginPage` etc.).
- `src/components/ui/` — componentes base reutilizáveis (Button, Input, Card), candidatos a subir pro `sanhaua`.
- `src/components/features/` — componentes de domínio (`InspectionForm`, `ReportEditor`).
- `src/hooks/` — hooks de estado e chamadas de API (ex.: `useGenerateAI`, que consome o SSE do `raijin`).
- `src/services/` — clientes HTTP e integração com a API Rust.

## Documentação de domínio

- [`docs/nbr-5410-choices.json`](docs/nbr-5410-choices.json) — cópia do arquivo homônimo do `raijin`. Alimenta os `<select>` do formulário de inspeção. É **cópia**, não link simbólico nem dependência cross-repo — os dois repos são independentes; se a lista mudar, sincronizar manualmente (muda raramente, só quando a norma muda).
- Nomenclatura completa dos ~90 campos do laudo, tipos e regras por seção: `raijin/docs/domain-glossary.md` (repositório irmão).

## Decisões já fechadas (não reabrir sem motivo novo)

- Biome, não ESLint/Prettier.
- `react-router`, não outra lib de rotas.
- Auth: JWT emitido pelo `raijin` (não Supabase Auth). No login com Google o `itui` **fala direto com o Google**: carrega o Google Identity Services, obtém um ID Token e só então o manda pro `raijin`. Ver "Contrato de autenticação" abaixo.
- Upload de imagem: `itui` faz `PUT` direto pra URL pré-assinada que o `raijin` gera — sem SDK de storage de provedor nenhum no frontend (mantém o frontend portável entre provedores).
- Avaliação qualitativa do formulário é ternária (Sim/Não/Parcialmente); ensaios da avaliação quantitativa são binários (Sim/Não). Ver `domain-glossary.md` no `raijin`.
- Seção de imagens do documento exportado: grade rotulada `(a)(b)(c)` + legenda + parágrafo de análise (não a lista solta do legado) — ver `raijin/docs/findings-taxonomy.md`.
