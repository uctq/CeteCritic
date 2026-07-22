# CETECCritic — Site reestruturado

O site que era 1 arquivo gigante virou uma estrutura em pastas, uma por ano.
Tudo que muda "toda hora" fica no topo de 3 tipos de arquivo — o resto você nunca precisa tocar.

## Estrutura

```
cetecritic/
├── index.html              ← só redireciona p/ edição em destaque
├── config.js               ← ⭐ edição em destaque, lista de anos do menu, API da planilha
├── planilha-apps-script.gs ← cole no Apps Script da planilha (novo: datas por ano)
├── assets/
│   ├── estilo.css          ← visual (não precisa mexer)
│   ├── core.js             ← lógica (não precisa mexer)
│   ├── logo.png            ← ⚠️ ADICIONE: logo da sidebar (o "C" laranja)
│   ├── logo-rodape.png     ← ⚠️ ADICIONE: logo do rodapé (CETECCritic branco)
│   └── favicon.png         ← ⚠️ ADICIONE: ícone da aba
├── 2026/
│   ├── edicao.js           ← ⭐ título, descrição, datas, textos Sobre/Abertura
│   ├── poster.jpg          ← ⚠️ ADICIONE: capa da edição
│   ├── noites/noite-1.js … noite-5.js  ← ⭐ DATA + peças de cada noite
│   ├── index.html          ← página de votação/notas
│   ├── sobre.html, abertura.html, monte.html
│   └── noite-1.html … noite-5.html
└── 2027/                   ← já criada; vira teaser automático até as datas
```

(⚠️ = imagens que você precisa colocar; sem elas o site funciona, só fica sem logo/capa)

## Como tudo é controlado por datas

- A **data em `noites/noite-N.js`** controla sozinha: o cadeado 🔒 da coluna S`N`
  na votação E o desbloqueio automático da página da noite (antes dela, countdown;
  quando zera, a página recarrega aberta).
- O **`inicio` em `edicao.js`** controla o teaser do ano (grade borrada + countdown,
  igual o antigo "2027"). Sobre/Abertura sem texto também mostram countdown.
- O **`fimVotacao` em `edicao.js`** fecha a votação e mostra o banner de encerramento
  (o servidor valida de novo pela tabela do `.gs`, então relógio adulterado não fura).

## Criar um ano novo (ex: 2028)

1. Copie a pasta `2027` e renomeie para `2028`.
2. Troque `2027` por `2028` nos títulos dos HTML e no `edicao.js` (ano, título, datas).
3. Ajuste as datas nos `noites/noite-N.js` e preencha as peças quando a programação sair.
4. Adicione no `config.js`: `{ ano: 2028, noites: 5, abreEm: '2028-...', monteAbreEm: '2028-...' }`
   → o menu lateral inclui o ano e as subpáginas automaticamente, em todas as páginas.
5. Adicione o ano no `FESTIVAL_END_BY_YEAR` do Apps Script e reimplante.
6. Noite extra? Copie `noite-5.html` + `noites/noite-5.js`, troque o número, e aumente
   `noites:` no `config.js`. Grade, menu e cadeados se ajustam sozinhos.

## Trocar a votação em destaque

`config.js` → `EDICAO_EM_DESTAQUE = 2027;` — pronto. Quem abrir cetecritic.xyz cai na
votação de 2027. As URLs antigas (`cetecritic.xyz/2026/`) continuam funcionando como acervo.

## Baners:

Colocar baners nas pastas do ano `poster.jpg` = Poster da edição (630 x 830) / `sobre-banner.jpg` Banner do sobre (1600 x 900)

## O que foi otimizado além do pedido

- **~973 KB → ~60 KB**: as imagens saíram do HTML (eram base64 embutidas). Agora são
  arquivos normais, carregam com cache e editar os arquivos ficou leve.
- **CSS e JS compartilhados**: correção/ajuste visual feito 1 vez vale para todos os anos.
- **Bugs corrigidos** do arquivo original: função `avgOfArray` duplicada e
  `switchView('official')` chamando uma view que não existia.
- **"Monte o Seu" separado por ano** no navegador (o de 2026 não vaza para 2027);
  o que a pessoa já salvou no site antigo é migrado automaticamente.
- **Apps Script com trava por ano**: não precisa mais editar `FESTIVAL_END` a cada
  edição — só adicionar a linha do ano novo. Votos existentes continuam válidos
  (mesma planilha, mesmas colunas).
- **Countdowns que "abrem" a página sozinhos** ao zerar (recarrega automático).

## Votos antigos

Nada muda: a planilha, as colunas e o formato dos votos são os mesmos.
O site novo lê os votos de 2026 normalmente.
