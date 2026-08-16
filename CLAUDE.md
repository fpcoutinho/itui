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
- **Exportação**: PDF via `window.print()` + `@page` (`src/styles/print.scss`); DOCX via `@turbodocx/html-to-docx` + `file-saver` no navegador — 100% client-side, sem rota de exportação no `raijin`.

## Rotas

URLs em português (são conteúdo voltado ao usuário, diferente de rota de API):

| Rota | Conteúdo | Acesso |
|---|---|---|
| `/` | Landing | Público |
| `/plataforma` | Shell do dashboard (`DashboardLayout` + `Sidebar`), com `<Outlet>`; a raiz redireciona pra `relatorios` | Privado |
| `/plataforma/relatorios` | Lista de laudos | Privado |
| `/plataforma/relatorios/novo` | Criação de laudo | Privado |
| `/plataforma/relatorios/:reportId` | Laudo: wizard de inspeção em 8 etapas (5 seções, imagens, documento, exportação) | Privado |
| `/plataforma/perfil` | Conta: e-mail, nome, título profissional, tema, troca de senha e sair | Privado |
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
| `/register` | `{ email, password, full_name? }` | 201 + sessão |
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

## Perfil do usuário

`GET`/`PATCH /api/v1/user/profile` e `PATCH /api/v1/user/password` (`src/services/user.ts`). São rotas autenticadas comuns (Bearer), não rotas de `/auth`.

- **`undefined` não chega ao fio.** O `PATCH` do perfil distingue campo ausente (não mexe) de `null` (limpa), mas `JSON.stringify` apaga chaves `undefined` — um campo esvaziado na tela sairia como "não mexa" e o valor antigo voltaria no próximo `GET`, calado. Por isso `updateProfile` normaliza `undefined`, `null` e string em branco todos para `null`, e sempre manda os três campos limpáveis. Patch parcial de verdade tem função própria (`updateThemePreference`).
- **A senha devolve sessão, não usuário.** A troca revoga todos os refresh tokens do usuário, inclusive o de quem trocou, e o backend reemite o par no mesmo response — o retorno vai pra `adoptSession`. O `Set-Cookie` sai por `issue_session` e por isso carrega `Path=/api/v1/auth` explícito, apesar da requisição ser em `/api/v1/user/password`; sem esse `Path` o navegador gravaria um segundo cookie de escopo `/api/v1/user` e o refresh seguinte apresentaria o token revogado.
- **Tema é campo do usuário** (`theme_preference`, ternário: `light`/`dark`/`system`). Por isso o `ThemeProvider` mora **dentro** do `SessionProvider`: o login adota a preferência do servidor por cima da local (uma vez por usuário, via ref — não a cada renovação de sessão), e a troca no toggle aplica na hora e faz o `PATCH` em segundo plano. Falha de rede não desfaz a troca: ela continua valendo nesta aba e no `localStorage`, que é de onde o script anti-FOUC do `index.html` lê — e esse script também entende `system`. Anônimo não persiste nada; o `PATCH` tomaria 401 e o retry de refresh derrubaria a sessão inexistente pro login.

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

  **O componente do Sanhauá usa as mesmas classes curtas por dentro** — `UaAlert` embrulha o próprio conteúdo num `.content` e tem `.title`/`.description` lá dentro; `UaSelect` tem `.value`, `.label`, `.option`. Como o escopo é por aninhamento, uma regra nossa solta no bloco (`.dashboard-layout { .content { … } }`) atravessa qualquer componente do pacote que esteja dentro dele — foi assim que todo alerta da área logada apareceu com um cartão escuro de raio 32px dentro. Regra prática: classe que o pacote também usa fica **aninhada no elemento a que pertence** (`.intro { .title { … } }`) ou presa com filho direto (`> .title`); e nome que descreve o papel do nosso layout (`.panel`) é melhor que nome genérico (`.content`).

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
- Componentes prontos vêm de `sanhaua/react` — na `0.19.0` são dezenove: `UaAccordion`, `UaAlert`, `UaAvatar`, `UaBadge`, `UaButton`, `UaButtonIcon`, `UaCard`, `UaCheckbox`, `UaInputField`, `UaInputGroup`, `UaModal`, `UaPagination`, `UaRadio`, `UaSelect`, `UaSkeleton`, `UaTable`, `UaTabs`, `UaTextarea`, `UaToast`. Não duplicar nenhum deles. `UaInputRadio` virou `UaRadio` na `0.18.0` (classe `.ua-input-radio` → `.ua-radio`).
  - **`UaTabs` é só o `tablist`** — o painel é marcação de quem usa, não JSX passado por prop. Controlado por `value`/`onChange`, e por dentro a barra é **um único stop de Tab**: setas, Home e End movem entre as abas, pulando as desabilitadas. O `panelId` do item amarra o par (`aria-controls` na aba, e a aba ganha o id `${panelId}-tab`, que o painel referencia de volta em `aria-labelledby`). `activation="manual"` separa foco de seleção, e é o que o `ProfilePage` usa: com `automatic` a seta trocaria de aba e descartaria a linha em edição sem o usuário ter pedido.
  - **`UaModal` substituiu o `window.confirm`**: o nativo bloqueia a thread, não aceita estilo e alguns navegadores o suprimem depois do segundo uso na mesma página. As duas confirmações do wizard (remover circuito, gerar o parecer por cima do texto editado) passam pelo `ConfirmDialog` de `src/components/ui/`, que embrulha o `UaModal`.
  - **`UaInputGroup` é só a cápsula** (`fieldset`/`legend`, com `hint`/`error`/`required`/`orientation`), servindo tanto a `UaCheckbox` quanto a `UaRadio`. Mapear as opções e calcular o array de seleção múltipla é de quem usa — ver `MultiChoice` em `SchemaField.tsx`.
  - `UaTextarea` tem a anatomia do `UaInputField`; `onChange` é o evento nativo do React, e rótulo invisível é omitir `label` e passar `aria-label` (o wrapper cai de `<label>` para `<div>` sozinho).
  - **`UaTable` não ordena**: `sortable` por coluna só desenha o controle, e `onSortChange` emite `{ key, direction }` pra cima. Quem ordena é o backend — ver `ReportTable`, cujas `key` de coluna são os nomes do `sort` da API (`location_code`, `inspected_at`…), sem tabela de tradução no meio.
  - **`UaAlert` e `UaCard` substituíram o `Banner` e o `Card` locais**, que foram apagados de `src/components/ui/`. `UaAlert` tem as mesmas cinco `appearance` do toast, `title` (string), `description` (`ReactNode`), `icon` (`false` esconde) e uma ação opcional (`actionLabel` + `actionAs: 'button' | 'link'`) que só emite `onActionClick`. Ele **não tem dismiss**: o aviso de auto-preenchimento do planejamento, que precisava ser dispensável, usa a ação (`actionLabel` + `onActionClick`) pra isso.
  - **`UaCard` é só a superfície** (borda, raio, padding, sombra) — não tem `title` nem espaçamento interno. Cabeçalho, tipografia e o gap entre blocos são de quem usa: ver `.create-report-card` em `CreateReportForm.scss`. `behavior: 'container' | 'button' | 'link'` troca o elemento raiz entre `div`, `button` e `a`.
  - `UaInputField` aceita `type` (`text`, `email`, `password`, `number`, `tel`, `url`, `search`, `date`, `datetime-local`, `time`), além de `error` e `hint` com o wiring de acessibilidade (`aria-invalid`, `aria-describedby`, `role="alert"`). Serve pra senha e e-mail; não existe mais motivo pra escrever campo de texto próprio.
  - As uniões de `appearance` são estreitas e vêm do SCSS: botão é `primary | secondary | tertiary | ghost | success | danger | warning | informative` (**não** tem `neutral`); campo é `neutral | success | error`; toast é `neutral | success | warning | danger | informative`. `borderStyle` é só `square | round`.

## Estrutura de pastas

- `src/pages/` — um componente por rota (`LandingPage`, `pages/platform/ReportsPage`, `pages/account/LoginPage` etc.).
- `src/domain/` — o laudo como dado, sem React: `nbr.ts` (acesso tipado aos JSON normativos de `docs/`) e `reportSchema.ts` (o schema declarativo das seções — descritor de campo, ordem de exibição e validação de completude). É a única camada que conhece os ~90 campos pelo nome; componente de formulário recebe descritor.
- `src/layouts/` — shells de rota com `<Outlet>`. Hoje só o `DashboardLayout`, a moldura escura da área logada: ele pinta com os tokens `--app-shell*` (a superfície mais escura nos dois temas) e religa `--app-surface*` pra `--app-panel*` dentro do painel de conteúdo, pra que componente elevado continue elevado no tema escuro.
- `src/components/ui/` — componentes base acoplados ao contexto da aplicação (`PageHeader`, `Sidebar`, `ThemeToggle`, `ButtonLink`, `ConfirmDialog`, `ErrorBoundary`). O `ErrorBoundary` é a **única classe** do repositório: `componentDidCatch` não tem equivalente em hook. Ele envolve o `<Outlet>` por dentro do painel do `DashboardLayout` — não o shell inteiro — para que a barra lateral sobreviva ao erro e o usuário saia da tela quebrada navegando. A `key` é a da localização: o boundary só limpa o próprio estado quando remonta. `Card` e `Banner` moravam aqui e saíram na `0.15.0`, virando `UaCard` e `UaAlert` no pacote.
- `src/components/features/` — componentes de domínio (`CreateReportForm`, `GoogleSignInButton`, futuros `InspectionForm`/`ReportEditor`).
- `src/design-system/` — **quarentena, hoje inexistente**: era onde ficavam componentes micro e agnósticos a contexto, candidatos a subir pro `sanhaua` e voltar como dependência. `TextField` e `DataTable` subiram na `0.13.0`; `TextArea` e `CheckboxGroup` subiram na `0.18.0` (viraram `UaTextarea`, e `UaCheckbox` + `UaInputGroup`), e a pasta foi apagada. Recriá-la só quando houver candidato novo, registrado em [`docs/design-system-candidates.md`](docs/design-system-candidates.md). O critério de entrada é único: não pode saber nada de laudo, sessão ou API.
- `src/export/` — o laudo virando **arquivo**: `exportPdf.ts` (impressão do navegador), `exportDocx.ts` (conversor + download), `exportHtml.ts` (o HTML que alimenta o conversor) e `imageAssets.ts` (foto em Base64 e espera de carregamento). Não é `services/`: não há HTTP com o `raijin` aqui — o único `fetch` é o do bucket, atrás de URL assinada.
- `src/hooks/` — hooks de estado e chamadas de API (`useSession`, `useReports`, `useGoogleIdentity`; futuro `useGenerateAI`, que consome o SSE do `raijin`).
- `src/services/` — clientes HTTP e integração com a API Rust. A conversão `snake_case` ↔ `camelCase` acontece **só** aqui, dentro do `request()` de `http.ts`.
- `src/session/` — provider do access token em memória e da renovação agendada.
- `src/content/` — textos em pt-BR voltados ao usuário, isolados do JSX.
- `src/styles/` — `global.scss` (reset e base). Estilo de componente mora no `.scss` ao lado do `.tsx`.

## Documentação de domínio

- [`docs/nbr-5410-choices.json`](docs/nbr-5410-choices.json) — cópia do arquivo homônimo do `raijin`. Alimenta os `<select>` do formulário de inspeção. É **cópia**, não link simbólico nem dependência cross-repo — os dois repos são independentes; se a lista mudar, sincronizar manualmente (muda raramente, só quando a norma muda).
- [`docs/nbr-5410-tests.md`](docs/nbr-5410-tests.md) + [`.json`](docs/nbr-5410-tests.json) — os 6 ensaios: procedimento e critério de aceitação, exibidos como texto de apoio no formulário. A ramificação do ensaio 7.3.5 por esquema de aterramento está aqui. **Cópia**, mesma política do `nbr-5410-choices.json`.
- [`docs/findings-taxonomy.md`](docs/findings-taxonomy.md) — as 5 categorias de não conformidade e seus slugs canônicos. Alimenta o seletor de `finding_category` no upload de imagem. **Cópia**, mesma política.
- [`docs/design-system-candidates.md`](docs/design-system-candidates.md) — registro do que passou por `src/design-system/`, por que foi escrito aqui em vez de vir do Sanhauá, e o que falta pra subir pro pacote. Atualizar sempre que um componente entrar ou sair da quarentena.
- Nomenclatura completa dos ~90 campos do laudo, tipos e regras por seção: `raijin/docs/domain-glossary.md` (repositório irmão).

## Decisões já fechadas (não reabrir sem motivo novo)

- Biome, não ESLint/Prettier. `docs/` fica **fora** do formatador (`files.includes` no `biome.json`): os arquivos lá são cópias byte a byte do `raijin` e reformatá-los quebraria a comparação com o original.
- `react-router`, não outra lib de rotas.
- **Em dev a API vai por proxy do Vite** (`server.proxy`, `/api` → `RAIJIN_ORIGIN`), não por chamada cross-origin. Same-origin em dev significa zero CORS e cookie de refresh first-party. **O caminho não pode ser reescrito**: o cookie tem `Path=/api/v1/auth`, e tirar o `/api` faria o navegador gravá-lo e nunca mais enviá-lo — refresh em `401` eterno, sem pista. Descartado o `vite-plugin-mkcert`/HTTPS local: resolvia menos e custava instalar uma CA raiz na máquina.
- **`VITE_API_BASE_URL` vazio = modo proxy; preenchido = modo cross-origin.** O segundo é o de produção e existe para reproduzir o caminho real da sessão localmente. Ver README.
- Camada de dados com hooks próprios sobre o cliente HTTP, sem TanStack Query nem afins — o volume atual (uma listagem, um wizard) não paga a dependência. Reavaliado com os `PATCH` de seção no lugar: **continua sem lib de cache**, porque cada rota de seção devolve o laudo atualizado e o wizard só o aplica sobre o que já está em memória — não há invalidação de cache a coordenar. As rotas de circuito são a exceção: devolvem o `Circuit`, então mutação de circuito dispara um `GET` do laudo (ver `useCircuits.onChanged`).
  - **`PATCH` devolve `Report`, não `ReportDetail`.** `circuits` e `spare_circuits` são montados só pelo `GET /reports/{id}` — o `Report` do `raijin` é a linha da tabela e não os conhece. Por isso `useReport.applyUpdate` **mescla** (`{ ...current, ...updated }`) em vez de substituir: substituir apagava os dois campos, e o `stepStatus` do wizard lê `report.circuits.length` **em pleno render**, então o `TypeError` subia sem error boundary e desmontava a árvore inteira — tela preta até o F5. O sintoma aparecia ~1,5 s depois de a geração por IA terminar, que é quando o debounce do autosave enfim manda o primeiro `PATCH`.
- **Wizard dirigido por schema, não 90 campos escritos à mão.** Campo, rótulo, tipo e ordem vivem em `src/domain/reportSchema.ts`; opção normativa e procedimento de ensaio vêm dos JSON de `docs/` (importados, não redigitados — `resolveJsonModule` no `tsconfig.app.json`). O passo do wizard só submete com a seção **completa**, porque o `PATCH` substitui a seção inteira. Seção `null` na resposta = etapa não concluída, e é assim que o wizard sabe onde o usuário parou — não há campo de progresso.
- Auth: JWT emitido pelo `raijin` (não Supabase Auth). No login com Google o `itui` **fala direto com o Google**: carrega o Google Identity Services, obtém um ID Token e só então o manda pro `raijin`. Ver "Contrato de autenticação" abaixo.
- Upload de imagem: `itui` faz `PUT` direto pra URL pré-assinada que o `raijin` gera — sem SDK de storage de provedor nenhum no frontend (mantém o frontend portável entre provedores).
- Avaliação qualitativa do formulário é ternária (Sim/Não/Parcialmente); ensaios da avaliação quantitativa são binários (Sim/Não). Ver `domain-glossary.md` no `raijin`.
- **Exportação é 100% client-side, e os dois caminhos partem de origens diferentes.** O PDF imprime o **DOM vivo** (`window.print()`), então o layout impresso é CSS — `src/styles/print.scss`, com `@page`, `.no-print` na interface e `.print-only` na capa/assinatura. O DOCX parte de uma **string montada** (`export/exportHtml.ts`), porque o arquivo viaja e não pode conter URL assinada. Não unificar os dois: o PDF ganha fidelidade ao que foi revisado na tela, o DOCX ganha independência do navegador que o gerou.
  - **A exportação é a etapa 8 do wizard (`ExportStep`), não um rodapé do editor.** Ela remonta o documento salvo num editor **somente leitura** — o PDF imprime o DOM desta página e o DOCX parte do `getHTML()` dele —, e por isso o esquema das extensões é compartilhado (`editor/reportEditorExtensions.ts`): se as duas telas divergissem, a tabela do arquivo entregue deixaria de ser a revisada. A folha impressa fica **fora da tela** (`.print-sheet`, `position: absolute`), nunca `display: none`: imagem em bloco não renderizado não carrega, e o PDF espera o `load` de cada foto.
  - **O conversor de DOCX exige `Buffer` e `global`** — é um fork de biblioteca de Node. `export/nodeGlobals.ts` instala os dois no `globalThis` de dentro do `import()` dinâmico. Sem isso a falha é `ReferenceError` no meio da geração, com o clique já dado.
  - A moldura da área logada é `100dvh` com rolagem interna. Sem o bloco que a desmonta no `@media print`, o PDF sai **com uma página só** — a que estava visível. É o primeiro lugar a olhar diante de impressão truncada.
  - **Tabela não leva `break-inside: avoid`.** A regra existia para proteger as tabelas curtas e produzia o contrário: quase toda tabela do laudo é maior que a folha, o navegador empurrava a tabela inteira para a página seguinte e deixava o título da seção sozinho numa folha em branco. Quem mantém a grade legível é o cabeçalho repetido mais `break-inside: avoid` na **linha**. O `display: table-header-group` vai na **linha de cabeçalho** (`tr:has(> th)`), não no `thead`: o `/draft` emite `<thead>`, mas o TipTap não o tem no esquema e o descarta — a tabela renderizada é `<colgroup>` + `<tbody>`, e a regra em `thead` não casava com nada.
  - O cabeçalho e o rodapé com URL, data e "1 de 23" são desenhados pelo **navegador**, na margem do papel, fora do alcance de qualquer regra de CSS. A única saída é a caixa "Cabeçalhos e rodapés" do diálogo — por isso o aviso de impressão instrui a desmarcá-la.
  - `break-inside: avoid` está na tabela **e** na linha. Na tabela ele protege as curtas; quando a tabela é maior que a folha (a de circuitos costuma ser), o navegador descarta a restrição sozinho e pagina — que é o comportamento desejado, não uma falha.
  - O conversor de DOCX é escolhido por **`colspan`**: é o que preserva o cabeçalho de dois níveis da qualitativa e da Parte II, os mesmos dois blocos que o `/draft` emite em HTML em vez de Markdown. Trocar de biblioteca sem verificar `w:gridSpan` no `word/document.xml` desmonta as duas tabelas.
  - Ele entra por `import()` dinâmico em `useReportExport`: sozinho ele é maior que o resto da aplicação, e só serve a um clique.
- **Capa, cabeçalho institucional, ART e assinatura não são campos do laudo.** Vivem em `localStorage` (`domain/exportSettings.ts` + `useExportSettings`), com duas chaves — a do laudo e a de "último uso", que preenche o próximo. Não propor persistência no `raijin`: o `Report` modela a inspeção, e isso é diagramação do arquivo entregue. O cabeçalho de identificação é montado no frontend (`domain/reportHeader.ts`) porque `location_code` e `responsible_parties` são omitidos do `/draft` por privacidade.
- **Toda exportação renova as URLs de imagem antes de começar** (`useReportImageUrls().refresh`). A `view_url` vence em 5 minutos e o editor fica aberto por horas: sem isso, o PDF sai com moldura vazia e o `.docx` sem foto, os dois em silêncio. No PDF a espera pelo `load` de cada `<img>` é obrigatória — `window.print()` é síncrono e não espera rede.
- Seção de imagens do documento exportado: grade rotulada `(a)(b)(c)` + legenda + parágrafo de análise (não a lista solta do legado) — ver `raijin/docs/findings-taxonomy.md`. **As legendas vêm prontas do `GET .../draft`**; o `itui` posiciona as fotos, resolvendo o marcador `![](image:<uuid>)` para uma URL assinada fresca — e nunca gravando essa URL de volta no documento.
  - O `/draft` emite as fotos de um achado **num parágrafo só** e a legenda numerada ("Figura 1. …: (a) … (b) …") no parágrafo seguinte. Na tela e no papel esse parágrafo vira uma faixa `flex` de fotos lado a lado; no `.docx`, uma linha de tabela com uma célula por foto (`export/exportHtml.ts`), porque o Word não tem grade de CSS. Não voltar ao desenho antigo de "uma foto ao lado da própria legenda": a legenda ABNT descreve o **grupo**, e é ela que dá à figura um número pelo qual o parecer possa citá-la.
- **A estrutura do documento é do `raijin`, não daqui.** Legenda ABNT das tabelas ("Tabela 7. …"), os checkboxes `[X]`/`[ ]` da Tabela 7, a letra S/N/P das Tabelas 9 e 11 e a legenda das figuras são montados em `raijin/src/document/` (`sections.rs`, `template.rs`, `checkbox.rs`). O `itui` recebe isso pronto do `/draft` — mexer na aparência dessas tabelas **daqui** é sintoma de estar editando o lugar errado.
  - A exceção é o **cabeçalho de contexto** das Tabelas 7, 8 e 9 (data, hora, local, clima, responsáveis), que é montado em `domain/reportDocument.ts` e inserido logo abaixo da legenda. Ele não pode vir do `/draft`: `location_code` e `responsible_parties` são omitidos do modelo do `raijin` por privacidade, pelo mesmo motivo que `domain/reportHeader.ts` existe. O acoplamento entre os dois lados é o formato da legenda (`**Tabela N. …**` → `<p><strong>`), fixado por teste no backend.
  - Ele é um **nó do esquema do TipTap** (`extensions/InspectionContext.ts`), não um `<div>` solto: o editor descarta todo elemento que não conhece. Pela mesma razão o espaçamento entre pares na linha é NBSP, e não um `<span>` com largura — o `<span>` some no `setContent` e os pares chegam colados.
