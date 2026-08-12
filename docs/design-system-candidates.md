# Candidatos ao Design System Sanhauá

Quarentena de `src/design-system/`: componentes **micro e agnósticos a contexto**
escritos aqui porque o [Sanhauá](https://github.com/fpcoutinho/sanhaua) ainda não
os tem. A intenção é subi-los para o pacote e voltar a consumi-los como
dependência, num follow-up — não mantê-los aqui para sempre.

O critério de entrada é único: **o componente não pode saber nada de laudo,
sessão ou API.** Se souber, o lugar dele é `src/components/ui/` (acoplado ao
contexto da aplicação) ou `src/components/features/` (domínio).

O que o Sanhauá `0.15.0` exporta hoje, e que **não** deve ser reimplementado:
`UaAlert`, `UaButton`, `UaCard`, `UaInputField`, `UaInputRadio`, `UaSkeleton`, `UaTable`,
`UaToast`.

---

## A quarentena está vazia

Os dois componentes que moravam aqui subiram para o pacote na `0.13.0`:

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
| `Textarea` | campos de observação da avaliação qualitativa (§4) |
| `Slider` | — sem uso identificado ainda |
| `ImageCarousel` | upload e revisão de achados fotográficos |
