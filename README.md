# itui

Frontend do sistema de Laudos de Engenharia Elétrica. O engenheiro preenche dados de inspeção, anexa fotos, e o sistema gera um laudo técnico (PDF/DOCX) com auxílio de IA.

Parte de uma reescrita em três repositórios: [`gerador`](../gerador) (monolito Django legado, congelado, referência de domínio) → [`raijin`](../raijin) (backend Rust/Axum + banco) + `itui` (este, frontend). Ver [`CLAUDE.md`](CLAUDE.md) para o contexto completo da migração, decisões de arquitetura e convenções.

## Stack

- [Vite](https://vite.dev) + React + TypeScript
- [Biome](https://biomejs.dev) para lint e formatação (não ESLint/Prettier)
- [react-router](https://reactrouter.com) para rotas
- [Sanhauá](https://github.com/fpcoutinho/sanhaua) como Design System — SCSS puro, metodologia BEM

## Comandos

```bash
npm install        # instalar dependências
npm run dev         # servidor de desenvolvimento
npm run build       # build de produção (tsc -b && vite build)
npm run preview     # servir o build localmente
npm run lint         # checar lint/formatação (Biome)
npm run lint:fix     # corrigir automaticamente
npm run format       # só formatação
```

## Rotas

| Rota | Conteúdo | Acesso |
|---|---|---|
| `/` | Landing | Público |
| `/plataforma` | Lista de laudos | Privado |
| `/conta/login` | Login (e-mail/senha + Google) | Público |
| `/conta/cadastro` | Cadastro | Público |
| `/conta/logout` | Descarta o JWT e redireciona | — |

## Estrutura

```
src/
  pages/               componentes de rota (LandingPage, PlatformPage, pages/account/*)
  components/ui/       componentes base do Design System (Button, Input, Card)
  components/features/ componentes de domínio (InspectionForm, ReportEditor)
  hooks/                hooks de estado e chamadas de API
  services/             clientes HTTP e integração com a API do raijin
docs/
  nbr-5410-choices.json cópia das listas normativas (fonte: raijin/docs/)
```

## Status

Bootstrap inicial. Rotas e estrutura de pastas montadas; telas ainda são placeholders — aguardando o contrato de API do `raijin` para o CRUD de laudos e a integração de IA.
