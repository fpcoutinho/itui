# Candidatos ao Design System Sanhauá

Quarentena de `src/design-system/`: componentes **micro e agnósticos a contexto**
escritos aqui porque o [Sanhauá](https://github.com/fpcoutinho/sanhaua) ainda não
os tem. A intenção é subi-los para o pacote e voltar a consumi-los como
dependência, num follow-up — não mantê-los aqui para sempre.

O critério de entrada é único: **o componente não pode saber nada de laudo,
sessão ou API.** Se souber, o lugar dele é `src/components/ui/` (acoplado ao
contexto da aplicação) ou `src/components/features/` (domínio).

O que o Sanhauá `0.17.0` exporta hoje, e que **não** deve ser reimplementado:
`UaAccordion`, `UaAlert`, `UaAvatar`, `UaBadge`, `UaButton`, `UaButtonIcon`, `UaCard`,
`UaInputField`, `UaInputRadio`, `UaPagination`, `UaSelect`, `UaSkeleton`, `UaTable`,
`UaToast`.

---

## Na quarentena hoje

Os dois entraram com o wizard de inspeção (Step 6b). Nenhum sabe o que é laudo,
seção ou API — recebem rótulo, valor e `onChange`.

| Componente | Por que foi escrito aqui | O que falta para subir |
|---|---|---|
| `TextArea` | O pacote tem `UaInputField` (linha única) e **nenhum** equivalente multilinha. Os ~27 campos de observação (`notes`) da §4 e da §5 Parte II são texto longo. | Virar `UaTextArea` com as mesmas props de `UaInputField` (`appearance`, `size`, `error`, `hint`, `widthBehavior`) e o mesmo wiring de `aria-invalid`/`aria-describedby`, que aqui está replicado à mão. |
| `CheckboxGroup` | O pacote tem `UaInputRadio` mas nenhum checkbox. A §2 tem três campos `enum[]` (riscos, EPIs, sinalização) que são seleção múltipla de verdade. | Separar em `UaInputCheckbox` (o controle) + agrupamento, espelhando a divisão que já existe no rádio. O `fieldset`/`legend` é a parte que não pode se perder na subida: é o que faz o leitor de tela anunciar a pergunta antes das oito opções. |

## O que já subiu

Os dois componentes que moravam aqui antes subiram para o pacote na `0.13.0`:

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
