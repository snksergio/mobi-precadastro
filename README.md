# iGreen MOB · páginas da live de lançamento

Duas páginas estáticas (HTML, CSS e JavaScript puros, sem build e sem dependências):

| Página | Arquivo | Prévia |
| --- | --- | --- |
| Pré-cadastro (convite para a live) | `pre-cadastro.html` | https://snksergio.github.io/mobi-precadastro/pre-cadastro.html |
| Lançamento (escolha da licença e pedido) | `lancamento.html` | https://snksergio.github.io/mobi-precadastro/lancamento.html |

## Estrutura

```
index.html            página inicial com os links das duas prévias
pre-cadastro.html
lancamento.html
live-igreen.ics       arquivo de agenda da live (cópia; o pré-cadastro também gera o .ics no próprio JS)
css/
  fonts.css           Instrument Sans + Geist Mono embutidas (woff2 em data URL)
  pre-cadastro.css
  lancamento.css
js/
  config.js           dados do consultor (WhatsApp) usados pelo lançamento
  pre-cadastro.js
  lancamento.js
img/
  logo-igreen.svg, luz-sim.webp
  pre-cadastro/       imagens do pré-cadastro (WebP)
  lancamento/         fotos dos eletropostos (WebP)
```

## Rodar localmente

Abra os arquivos direto no navegador ou sirva a pasta:

```bash
npx serve .
```

## Pontos de integração

**Pré-cadastro** (`js/pre-cadastro.js`)
- Formulário `#lead-form`: campos `name`, `phone` (máscara de WhatsApp), `email`, opcionais `city` e `interest`, e o aceite `#consent`. Hoje a validação roda e mostra a confirmação de exemplo; **nada é enviado**. A chamada para a API entra no `submit` do formulário.
- Convite do licenciado: `?ref=CODIGO` na URL mostra o código no formulário. O link é montado na janela "Sou licenciado · preparar convite".
- Botão "Simular": link para o simulador oficial com o `ref` no próprio HTML.
- Data e horário da live: textos no HTML; o arquivo de agenda (.ics) é gerado no JS.
- Avisos de prévia ("Simulação concluída. Nenhum cadastro foi enviado.", janela de privacidade e rodapé) devem ser trocados pelos textos finais.

**Lançamento** (`js/lancamento.js`)
- Modelos e valores no objeto `MODELS`; link direto para um modelo: `?modelo=mobi|fast|ultra`.
- Pedido em etapas (dados → revisão → pagamento PIX ou cartão). O pagamento e o QR do PIX são **simulados**; a integração entra nas funções de envio do pedido e de pagamento.
- WhatsApp do consultor: `js/config.js` ou `?whats=55DDNUMERO` na URL.
