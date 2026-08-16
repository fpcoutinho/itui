# Candidatos ao Design System Sanhauá

Registro da quarentena de `src/design-system/`: componentes **micro e agnósticos a
contexto** escritos aqui porque o
[Sanhauá](https://github.com/fpcoutinho/sanhaua) ainda não os tinha, com a
intenção de subi-los para o pacote e voltar a consumi-los como dependência.

**A quarentena está vazia hoje** — a pasta `src/design-system/` foi apagada na
`0.18.0`, quando os dois últimos moradores subiram. Ela volta a existir quando
houver um novo candidato; o critério de entrada continua sendo único: **o
componente não pode saber nada de laudo, sessão ou API.** Se souber, o lugar dele
é `src/components/ui/` (acoplado ao contexto da aplicação) ou
`src/components/features/` (domínio).

O que o Sanhauá `0.19.0` exporta hoje, e que **não** deve ser reimplementado:
`UaAccordion`, `UaAlert`, `UaAvatar`, `UaBadge`, `UaButton`, `UaButtonIcon`, `UaCard`,
`UaCheckbox`, `UaInputField`, `UaInputGroup`, `UaModal`, `UaPagination`, `UaRadio`,
`UaSelect`, `UaSkeleton`, `UaTable`, `UaTabs`, `UaTextarea`, `UaToast`.

`UaInputRadio` foi **renomeado para `UaRadio`** na `0.18.0` (o tipo virou
`UaRadioProps` e a classe CSS `.ua-input-radio` virou `.ua-radio`).

---

## O que já subiu

Na `0.19.0` entrou `UaTabs`, e ele é o único que **nunca passou pela quarentena**:
as abas do `ProfilePage` eram marcação solta na página, não um componente. Extrair o
que existia teria levado junto o que faltava — sem `aria-controls`/`aria-labelledby`
ligando aba e painel, sem roving tabindex, sem navegação por seta. Foi escrito direto
no pacote porque o trabalho era escrever o padrão inteiro, não mover código.

Ele é **só a barra**. Chegou a ter um `content` por item, com o componente renderizando
o `tabpanel` — some o wiring de `id`, mas some junto a árvore da página: o conteúdo
de duas telas inteiras vira valor de prop, e quem lê o `ProfilePage` não enxerga mais
onde cada painel começa. O `panelId` resolve o mesmo problema sem esconder markup.

Na `0.18.0` subiram os dois últimos da quarentena, ambos vindos do wizard de
inspeção (Step 6b):

| Era | Virou |
|---|---|
| `TextArea` | `UaTextarea` — mesma anatomia do `UaInputField`, com `appearance`, `size`, `borderStyle`, `widthBehavior` e `resize` que o local não tinha. `onChange` passou a ser o evento nativo do React (não o valor extraído), e não há `hideLabel`: rótulo invisível é omitir `label` e passar `aria-label`. |
| `CheckboxGroup` | `UaCheckbox` (o controle, com `indeterminate`) + `UaInputGroup` (a cápsula `fieldset`/`legend`, que serve também ao rádio). O componente único virou dois: mapear as opções e calcular o array resultante passou a ser de quem usa — ver `MultiChoice` em `SchemaField.tsx`. |

Antes deles, na `0.13.0`:

| Era | Virou |
|---|---|
| `TextField` | props novas do `UaInputField`: `type`, `error`, `hint` |
| `DataTable` | `UaTable` |

Junto com eles saiu a terceira dívida da mesma natureza, o
`src/types/sanhaua-react.d.ts`: o pacote passou a publicar declarações de tipo, e
a camada React virou TypeScript, então o `.d.ts` é **gerado do fonte** no build em
vez de escrito à mão aqui. O arquivo foi apagado.

Valeu registrar por que isso importava: a declaração à mão tinha divergido do
fonte em quatro pontos, e o TypeScript validava contra uma ficção —
`UaToast` recebia `message` (não `content`), `UaButton` tinha `tertiary`/`ghost`
que a união não listava, `borderStyle` não tem `pill`, e `appearance` de campo é
`neutral | success | error`, não as sete opções declaradas.

### O que ficou pendente no pacote

- `UaTable` existe só em React. Vue e Web Components não têm equivalente.
- `UaInputField` em React aceita `type="password"` como campo simples: o toggle de
  mostrar/ocultar existe só no `UaInputPassword` do Vue.

---

## Ainda não escritos

Previstos pelo `CLAUDE.md` mas sem uso concreto no código atual — entram quando
a tela que os exige existir, não antes:

| Componente | Entra com |
|---|---|
| `Slider` | — sem uso identificado ainda |
| `ImageCarousel` | revisão dos achados fotográficos. O upload (Step 6b) resolveu-se com grade estática: enquanto a miniatura depende de uma `view_url` que vence em 5 minutos, carrossel só adiantaria o vencimento das fotos que ninguém olhou. |
| `ProgressBar` | barra de progresso do upload, hoje um `<progress>` nativo estilizado dentro de `ImagesStep.scss` — pequeno demais para justificar quarentena própria antes de ter um segundo uso. |
