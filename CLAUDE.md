# CLAUDE.md

Frontend do sistema de Laudos de Engenharia Elétrica. React + Vite, Design System Sanhauá. Substitui o front do monolito Django legado (repositório `gerador`, congelado — **não releia esse repositório**; conhecimento de domínio necessário já está em `docs/` e vem do backend `raijin`).

## Repositórios do projeto

| Repositório | Conteúdo |
|---|---|
| `gerador` | Monolito Django legado. Congelado. |
| `raijin` | Backend Rust/Axum + schema do banco. Fonte de verdade do domínio (`raijin/docs/domain-glossary.md`). |
| `itui` (este) | Frontend. |

O contrato entre `itui` e `raijin` é a **API REST**, documentada em [`./docs/api-contract.md`](./docs/api-contract.md) — leia antes de escrever qualquer serviço: rota, campo, formato de erro e o consumo do SSE estão todos lá, com código pronto. Sem tipos compartilhados automaticamente entre Rust e TypeScript: ao consumir um endpoint novo, replique o shape manualmente em `src/services/`.

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

- 401 em `/login` é **sempre** a mensagem genérica "E-mail ou senha inválidos". O backend nunca revela se o e-mail existe nem se é conta Google — isso seria um oráculo de enumeração de usuários. Por isso qualquer dica de "entrou com o Google?" na UI só pode ser **texto estático**, nunca algo renderizado em reação à resposta do servidor. Hoje não existe dica nenhuma na tela de login — o botão do Google fica logo abaixo do formulário e se explica sozinho; se voltar a existir, tem que ser estática.
- 409 em `/register` distingue dois casos na mensagem: e-mail já cadastrado, ou e-mail que é conta Google (usar o botão do Google).
- 503 em `/google` é serviço de chaves do Google inacessível — mostrar retentativa, não erro de credencial.

**CORS**: toda chamada autenticada precisa de `credentials: 'include'`. Em dev, com o proxy do Vite, não há CORS nenhum — as chamadas são same-origin. Só no **modo cross-origin** (`VITE_API_BASE_URL` preenchido) e em produção a origem do `itui` precisa estar em `CORS_ALLOWED_ORIGINS` no `.env` do `raijin`; é o primeiro lugar a olhar diante de falha opaca de CORS.

**Cookie de terceiros em produção**: se o front e a API ficarem em domínios registráveis diferentes, o cookie de refresh vira third-party. O Safari bloqueia isso por padrão (ITP) e a sessão de 30 dias não sobrevive a um reload lá; Chrome e Firefox ainda funcionam hoje, mas é terreno que os navegadores vêm fechando.

O alvo de deploy resolve isso sem custo: o build do `itui` é estático (S3) e o `raijin` roda em Lambda/ECS, e **uma distribuição CloudFront serve os dois sob o mesmo domínio** — comportamento padrão apontando pro bucket, e um comportamento `/api/*` apontando pro `raijin`. Aí a API é same-origin em produção, o cookie é first-party, não há CORS, e o proxy do dev server vira réplica exata do prod em vez de divergência. É a topologia a mirar; enquanto ela não existir, testar sessão em modo cross-origin antes de subir.

## Convenções de código

- Tudo em inglês no código: variáveis, funções, props, hooks, nomes de arquivo. `camelCase` pra variáveis/funções/props/hooks, `PascalCase` pra componentes e seus arquivos `.tsx`.
- Português só em conteúdo voltado ao usuário final: labels, textos de UI, mensagens de erro exibidas, URLs de rota, e o conteúdo do laudo gerado. Textos ficam isolados (i18n/constantes), não espalhados em JSX.
- **Não invente nomes de campo do domínio.** Vêm de [`raijin`'s `domain-glossary.md`](../raijin/docs/domain-glossary.md) — consulte lá antes de nomear um campo de formulário, prop ou variável de estado ligada ao laudo.

## Design System Sanhauá — como está configurado

- **PROIBIDO** Tailwind ou biblioteca de UI de terceiros (DaisyUI, shadcn/ui, Material UI etc.).
- **Classes aninhadas, no padrão do próprio Sanhauá — não BEM.** O bloco leva o nome do componente em `kebab-case` (`.report-editor`); as partes internas são classes curtas e descritivas aninhadas dentro dele (`.title`, `.body`, `.icon`, `.action`); variantes e estados são classes soltas no próprio bloco, aplicadas junto (`.report-editor.active`, `.ua-alert.danger`). Nada de `&__elemento` nem `&--modificador`.

  ```scss
  .report-editor {
    display: flex;

    .button {
      @include body-2-bold;

      &.active { … }
    }
  }
  ```

  O ganho é ler igual ao fonte do pacote e conseguir grep pelo nome real da classe (`grep "\.title"` acha; `grep "report-editor__title"` não achava nada, porque no fonte só existia `&__title`). O custo é especificidade maior e o escopo depender do aninhamento — por isso **o bloco raiz é sempre o único ponto de entrada**: nenhuma regra pode começar por uma classe interna solta.

  **Migração concluída**: não há mais BEM no repositório. Os últimos 5 arquivos (`PageHeader`, `GoogleSignInButton`, `AccountLayout`, `LandingPage`, `PlatformPage`) foram convertidos junto com a troca dos botões desenhados à mão pelo `UaButton`. `grep -rE "&__|&--" src` tem que continuar vazio.

  Uma renomeação saiu daí: `auth-form__hint` virou o bloco solto `.auth-hint`. O `GoogleSignInButton` é **irmão** do `<form class="auth-form">`, não descendente — aninhar a classe sob `.auth-form` teria matado o estilo, e o nome antigo escondia isso.
- **SCSS puro**, um arquivo `.scss` por componente, acoplado ao `.tsx`.
- **Tokens injetados globalmente** via `vite.config.ts` (`css.preprocessorOptions.scss.additionalData`, apontando pra `sanhaua/system/themes/main/design-tokens/design-tokens.scss` e pra `responsiveness/responsiveness`). Nenhum `.scss` de componente precisa importar tokens manualmente.
- **Os tokens do Sanhauá são mapas e funções SCSS, não CSS custom properties.** O pacote não emite `var(--...)` nenhum — procurar por `var(--color-primary)` não acha nada porque não existe. O vocabulário real é:

  | Uso | Escreve-se |
  |---|---|
  | Cor | `map.get($color-primary-light, "500")`, `map.get($color-neutral-light, "700")` — famílias: `primary`, `secondary`, `neutral`, `success`, `warning`, `danger`, sufixo `-light`/`-dark`, chaves `"100"`–`"900"` |
  | Espaçamento | `spacing(4)` (função: `$n * 4px`; `spacing("half")` = 2px) |
  | Raio | `map.get($border-radius, "medium")` — `none`, `small`, `medium`, `large`, `pill` |
  | Espessura de borda | `map.get($border-width, "small")` — `none`, `small`, `medium`, `large` |
  | Tipografia | **mixins da escala** — ver regra própria abaixo |
  | Breakpoint | `@include breakpoint-min("sm")` — `nn`, `xs`, `sm`, `rg`, `md`, `lg`, `gt` |

- **Tipografia vem sempre de um mixin da escala. `font-size` cru é proibido** — inclusive em `rem`. Escrever `font-size: 0.9375rem` é reimplementar o design system à mão: o tamanho deixa de acompanhar o pacote e a tela fica com uma escala paralela. A escala completa, toda disponível pelo `additionalData`:

  | Mixin | Tamanho / peso |
  |---|---|
  | `headline-1` … `headline-6` | 48, 32, 28, 24, 20, 18px — peso `black` |
  | `body-1` / `body-1-bold` | 17px — `regular` / `bold` |
  | `body-2` / `body-2-bold` | 15px — `regular` / `bold` |
  | `subtitle-1` / `subtitle-2` | 15 / 12px — peso `light` |
  | `caption` | 13px — `regular` |
  | `overline` | 11px — `regular`, caixa alta com `letter-spacing` |
  | `icon-1` … `icon-4` | 24, 22, 20, 16px — para o glifo do Material Symbols, não para texto |

  Uso: `@include body-2;`, `@include headline-3;`. Todos aceitam `($responsive: true, $breakpoint)` para encolher num breakpoint. `$font-family` já vem do `body` em `global.scss` (que é `@include body-1`), então **não repita `font-family` em componente**.

  `map.get($font-weight, …)` (`light`, `regular`, `bold`, `black`) continua válido, mas **só** para o caso em que a escala não tem a variante que você precisa — hoje isso é exatamente "caption em negrito" (rótulo pequeno, pill de status). Peso junto de `font-size` cru, nunca.

- **Nunca abrir um `.scss` de componente com `@use`.** O `additionalData` é prepended a cada arquivo, então um `@use` do componente deixaria de ser a primeira regra e o Sass aborta a compilação. O `@use "sass:map"` já está na primeira linha do `additionalData`, então escreva `map.get` — igual ao próprio fonte do Sanhauá. O legado `map-get` não é mais usado aqui, e por isso `global-builtin` saiu do `silenceDeprecations` do `vite.config.ts` (sobrou só `['import']`, por conta dos `@import` do pacote).
- **A camada de responsividade inteira é injetada**, com os mixins `breakpoint-min`/`breakpoint-max`/`breakpoint-between` disponíveis — usar `@include breakpoint-min('sm')`, nunca escrever a media query à mão. Isso depende do `@use "sass:map";` ser a **primeira** linha do `additionalData`: `_media-queries.scss` chama `map.get` sem declarar o namespace no próprio arquivo, então só compila se quem importa já o tiver em escopo.
- O pacote `sanhaua` usa um alias interno `@theme` nos próprios arquivos-fonte; replicado em `resolve.alias` do `vite.config.ts` (necessário pra resolver `system.scss` de dentro de `node_modules` sem erro).
- `sanhaua/style.css` é importado no `src/main.tsx`, e o `<html>` carrega `class="sanhaua light"` (ou `dark`) — os componentes do pacote só recebem estilo dentro desse escopo. **A classe de tema mora só no `<html>`**: o script anti-FOUC do `index.html` e o `ThemeProvider` escrevem no mesmo elemento. O pacote estiliza descendentes diretamente (`.sanhaua.dark .ua-button`), então um segundo `.sanhaua` no `<body>` faria as duas regras casarem e a escura vencer por ordem de arquivo — componentes escuros no tema claro. Pelo mesmo motivo os tokens `--app-*` ficam em `:root`/`:root.dark`, não no `body`.
- **O pacote publica `.d.ts` desde a `0.13.0`.** A camada React é escrita em TypeScript e as declarações são **geradas do fonte** no build (`vite-plugin-dts`), então não há mais declaração à mão pra manter aqui — o antigo `src/types/sanhaua-react.d.ts` foi apagado. Vue e Web Components ainda têm declaração escrita à mão dentro do próprio pacote (`types/`).
- **Botão nunca se escreve à mão.** Ação é `UaButton`; navegação interna é `ButtonLink` (`src/components/ui/ButtonLink.tsx`), que veste o `<Link>` do react-router com as classes do `UaButton`. O `behavior="link"` do pacote existe, mas renderiza `<a href>` puro — reload de página inteira, e o access token vive só em memória, então cada clique derrubaria a sessão. Por isso **`ButtonLink` é o único arquivo do repo acoplado aos nomes de classe do Sanhauá** (`ua-button`, `.text`, `.icon`); nenhuma tela repete essa marcação. Se o pacote ganhar uma prop polimórfica (`as`), a troca acontece só ali.

  A única exceção é o `GoogleSignInButton`: quem recebe o clique tem que ser o widget desenhado pelo Google (único caminho do GIS que devolve um ID Token) e ele não aceita CSS nosso — a face pintada é réplica de superfície, não botão do DS.

  Três regras redefinem cor de `.ua-button.ghost`: em `.landing .cta` e em `.account .theme`, os pontos onde um fundo em gradiente inverteria o contraste e a variante do pacote sumiria. Fora desses, não sobrescrever estilo de componente do Sanhauá.
- Componentes prontos vêm de `sanhaua/react` — na `0.15.0` são oito: `UaAlert`, `UaButton`, `UaCard`, `UaInputField`, `UaInputRadio`, `UaSkeleton`, `UaTable`, `UaToast`. Não duplicar nenhum deles.
  - **`UaAlert` e `UaCard` substituíram o `Banner` e o `Card` locais**, que foram apagados de `src/components/ui/`. `UaAlert` tem as mesmas cinco `appearance` do toast, `title` (string), `description` (`ReactNode`), `icon` (`false` esconde) e uma ação opcional (`actionLabel` + `actionAs: 'button' | 'link'`) que só emite `onActionClick`. Ele **não tem dismiss**: o aviso de auto-preenchimento do planejamento, que precisava ser dispensável, usa a ação (`actionLabel` + `onActionClick`) pra isso.
  - **`UaCard` é só a superfície** (borda, raio, padding, sombra) — não tem `title` nem espaçamento interno. Cabeçalho, tipografia e o gap entre blocos são de quem usa: ver `.create-report-card` em `CreateReportForm.scss`. `behavior: 'container' | 'button' | 'link'` troca o elemento raiz entre `div`, `button` e `a`.
  - `UaInputField` aceita `type` (`text`, `email`, `password`, `number`, `tel`, `url`, `search`, `date`, `datetime-local`, `time`), além de `error` e `hint` com o wiring de acessibilidade (`aria-invalid`, `aria-describedby`, `role="alert"`). Serve pra senha e e-mail; não existe mais motivo pra escrever campo de texto próprio.
  - As uniões de `appearance` são estreitas e vêm do SCSS: botão é `primary | secondary | tertiary | ghost | success | danger | warning | informative` (**não** tem `neutral`); campo é `neutral | success | error`; toast é `neutral | success | warning | danger | informative`. `borderStyle` é só `square | round`.

## Estrutura de pastas

- `src/pages/` — um componente por rota (`LandingPage`, `PlatformPage`, `pages/account/LoginPage` etc.).
- `src/components/ui/` — componentes base acoplados ao contexto da aplicação (`PageHeader`, `ThemeToggle`). `Card` e `Banner` moravam aqui e saíram na `0.15.0`, virando `UaCard` e `UaAlert` no pacote.
- `src/components/features/` — componentes de domínio (`CreateReportForm`, `GoogleSignInButton`, futuros `InspectionForm`/`ReportEditor`).
- `src/design-system/` — **quarentena**: componentes micro e agnósticos a contexto, candidatos a subir pro `sanhaua` e voltar como dependência. **Hoje está vazia** — `TextField` e `DataTable` já subiram (viraram as props novas do `UaInputField` e o `UaTable`, na `0.13.0`). Quem entrar aqui vai registrado em [`docs/design-system-candidates.md`](docs/design-system-candidates.md). O critério de entrada é único: não pode saber nada de laudo, sessão ou API.
- `src/hooks/` — hooks de estado e chamadas de API (`useSession`, `useReports`, `useGoogleIdentity`; futuro `useGenerateAI`, que consome o SSE do `raijin`).
- `src/services/` — clientes HTTP e integração com a API Rust. A conversão `snake_case` ↔ `camelCase` acontece **só** aqui, dentro do `request()` de `http.ts`.
- `src/session/` — provider do access token em memória e da renovação agendada.
- `src/content/` — textos em pt-BR voltados ao usuário, isolados do JSX.
- `src/styles/` — `global.scss` (reset e base). Estilo de componente mora no `.scss` ao lado do `.tsx`.

## Documentação de domínio

- [`docs/nbr-5410-choices.json`](docs/nbr-5410-choices.json) — cópia do arquivo homônimo do `raijin`. Alimenta os `<select>` do formulário de inspeção. É **cópia**, não link simbólico nem dependência cross-repo — os dois repos são independentes; se a lista mudar, sincronizar manualmente (muda raramente, só quando a norma muda).
- [`docs/nbr-5410-tests.md`](docs/nbr-5410-tests.md) + [`.json`](docs/nbr-5410-tests.json) — os 6 ensaios: procedimento e critério de aceitação, exibidos como texto de apoio no formulário. A ramificação do ensaio 7.3.5 por esquema de aterramento está aqui. **Cópia**, mesma política do `nbr-5410-choices.json`.
- [`docs/findings-taxonomy.md`](docs/findings-taxonomy.md) — as 5 categorias de não conformidade e seus slugs canônicos. Alimenta o seletor de `finding_category` no upload de imagem. **Cópia**, mesma política.
- [`docs/design-system-candidates.md`](docs/design-system-candidates.md) — registro do que está em `src/design-system/`, por que foi escrito aqui em vez de vir do Sanhauá, e o que falta pra subir pro pacote. Atualizar sempre que um componente entrar ou sair da quarentena.
- Nomenclatura completa dos ~90 campos do laudo, tipos e regras por seção: `raijin/docs/domain-glossary.md` (repositório irmão).

## Decisões já fechadas (não reabrir sem motivo novo)

- Biome, não ESLint/Prettier. `docs/` fica **fora** do formatador (`files.includes` no `biome.json`): os arquivos lá são cópias byte a byte do `raijin` e reformatá-los quebraria a comparação com o original.
- `react-router`, não outra lib de rotas.
- **Em dev a API vai por proxy do Vite** (`server.proxy`, `/api` → `RAIJIN_ORIGIN`), não por chamada cross-origin. Same-origin em dev significa zero CORS e cookie de refresh first-party. **O caminho não pode ser reescrito**: o cookie tem `Path=/api/v1/auth`, e tirar o `/api` faria o navegador gravá-lo e nunca mais enviá-lo — refresh em `401` eterno, sem pista. Descartado o `vite-plugin-mkcert`/HTTPS local: resolvia menos e custava instalar uma CA raiz na máquina.
- **`VITE_API_BASE_URL` vazio = modo proxy; preenchido = modo cross-origin.** O segundo é o de produção e existe para reproduzir o caminho real da sessão localmente. Ver README.
- Camada de dados com hooks próprios sobre o cliente HTTP, sem TanStack Query nem afins — o volume atual (uma listagem, um wizard) não paga a dependência. Reavaliar quando os `PATCH` de seção chegarem.
- Auth: JWT emitido pelo `raijin` (não Supabase Auth). No login com Google o `itui` **fala direto com o Google**: carrega o Google Identity Services, obtém um ID Token e só então o manda pro `raijin`. Ver "Contrato de autenticação" abaixo.
- Upload de imagem: `itui` faz `PUT` direto pra URL pré-assinada que o `raijin` gera — sem SDK de storage de provedor nenhum no frontend (mantém o frontend portável entre provedores).
- Avaliação qualitativa do formulário é ternária (Sim/Não/Parcialmente); ensaios da avaliação quantitativa são binários (Sim/Não). Ver `domain-glossary.md` no `raijin`.
- Seção de imagens do documento exportado: grade rotulada `(a)(b)(c)` + legenda + parágrafo de análise (não a lista solta do legado) — ver `raijin/docs/findings-taxonomy.md`. **As legendas vêm prontas do `GET .../draft`**; o `itui` posiciona a foto ao lado, resolvendo o marcador `![](image:<uuid>)` para uma URL assinada fresca — e nunca gravando essa URL de volta no documento.
