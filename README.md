<div align="center">
  <!-- <img src="docs/assets/logo.png" alt="Ituí" width="96" /> -->

  # Ituí 🐟⚡

  Interface web do automatizador de **Laudos de Engenharia Elétrica**.  
  Aplicação em **React + TypeScript**, estilizada com o Design System **Sanhauá** (SCSS + BEM), formulários guiados por schema e editor **TipTap** com streaming de IA em tempo real.

  ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&labelColor=18181B)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white&labelColor=18181B)
  ![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white&labelColor=18181B)
  ![Biome](https://img.shields.io/badge/Biome-1.9-60A5FA?logo=biome&logoColor=white&labelColor=18181B)
  ![TipTap](https://img.shields.io/badge/TipTap-WYSIWYG-2563EB?labelColor=18181B)
  ![Sanhauá](https://img.shields.io/badge/Design_System-Sanhauá-009688?labelColor=18181B)
  ![NBR 5410](https://img.shields.io/badge/NBR_5410-Compliant-00C853?labelColor=18181B)
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
- **Design System & Estilização:** [Sanhauá](https://github.com/fpcoutinho/sanhaua) (`sanhaua/react`) — SCSS puro, tokens globais injetados no Vite e metodologia BEM rigorosa (PROIBIDO Tailwind CSS).
- **Editor Rich Text:** TipTap (StarterKit, Underline, Link) salvando estrutura nativa em JSONB.
- **Exportação de Documentos:** PDF via `window.print()` + `@page` e DOCX via `html-to-docx` (100% client-side, sem dependência de servidor).

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
| `/conta/logout` | Ação client-side: descarta o JWT local e redireciona | Privado |

## 📂 Estrutura do Projeto

```text
src/
├── pages/             # Componentes de rota (LandingPage, PlatformPage, pages/account/*)
├── components/
│   ├── ui/            # Componentes base do DS (Button, Input, Card) — candidatos ao Sanhauá
│   └── features/      # Componentes de domínio (InspectionForm, ReportEditor)
├── hooks/             # Custom hooks (ex: useGenerateAI para consumo do SSE)
└── services/          # Clientes HTTP e contratos espelhados da API do Raijin
docs/
└── nbr-5410-choices.json # Cópia local sincronizada com o backend (fonte dos selects)
```

## 🚀 Comandos de Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento local
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
```

## 📚 Documentação e Sincronização de Domínio

A fonte de verdade dos nomes de campos, tipos e enums reside em `raijin/docs/domain-glossary.md`. Nenhuma prop, estado ou campo de formulário no **Ituí** deve ter sua nomenclatura inventada — siga rigorosamente o glossário.
