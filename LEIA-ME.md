# CETECritic — Site reestruturado

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
│   ├── logo-rodape.png     ← ⚠️ ADICIONE: logo do rodapé (CETECritic branco)
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

O menu lateral **agrupa as edições por década sozinho** (Anos 2020, Anos 2010...).
A década do ano que você está vendo já abre expandida; as outras ficam recolhidas.
Não precisa configurar nada — só adicionar a linha do ano no `config.js`.

## Ano retrô ou futuro ainda sem conteúdo ("Em breve")

Quer que um ano apareça no site como **"Em breve"**, sem countdown e **sem precisar
criar a pasta do ano**? Basta a linha no `config.js` com `emBreve: true`:

`{ ano: 1998, noites: 4, emBreve: true }`

O menu mostra o ano com a etiqueta *em breve* e manda para uma página
compartilhada (`em-breve.html?ano=1998`) — nenhuma pasta `1998/` é necessária.
Dá pra cadastrar quantos anos quiser assim, só com a linha na config.

Quando for montar a edição de verdade: crie a pasta do ano (copiando outra),
ajuste o `edicao.js` (principalmente o `ano:`) e as noites, e **remova o
`emBreve: true`** (ou troque por `abreEm: '...'` se for uma edição futura com
data). Aí o menu volta a apontar para a pasta do ano com as subpáginas.

⚠️ Importante: se você deixar `emBreve: true` numa edição, o menu **ignora a pasta
daquele ano** e usa a página compartilhada. Foi isso que causava o desvio para
"Cetec Festival 2027": as pastas 2015–2018 eram cópias da 2027 (com `ano: 2027`
lá dentro), então o site lia "2027". Com `emBreve`, isso não acontece mais.

## Trocar a votação em destaque

`config.js` → `EDICAO_EM_DESTAQUE = 2027;` — pronto. Quem abrir cetecritic.xyz cai na
votação de 2027. As URLs antigas (`cetecritic.xyz/2026/`) continuam funcionando como acervo.

## Contas, perfil e bolão (login simples)

Sistema de login leve, tudo guardado na própria planilha. **Segurança propositalmente
simples** (é festival de escola): a senha vai com hash no servidor, mas avise para
ninguém usar uma senha importante.

**Para ligar isso, é obrigatório atualizar o Apps Script** (o `planilha-apps-script.gs`
já está pronto neste projeto):

1. Abra a planilha → Extensões → Apps Script.
2. Substitua o código pelo conteúdo de `planilha-apps-script.gs`.
3. Implantar → Gerenciar implantações → editar a implantação atual → **Nova versão** → Implantar.
   (Mantenha a mesma URL `/exec`; assim o `API_URL` do config.js continua valendo.)
4. Nas duas primeiras vezes que alguém criar conta / palpitar, o script cria
   sozinho as abas `usuarios` e `palpites`. Não precisa criar à mão.

O que passa a existir no site:

- **Entrar / Criar conta** no menu lateral (usuário + senha, mínimo 4 caracteres).
- **Perfil** (`perfil.html`): junta as avaliações da pessoa de todas as edições,
  estatísticas e badges (🎖️ *Veterano de {ano}*, dedicação, bolão etc.).
- Ao avaliar **logado**, a avaliação fica ligada à conta e aparece no perfil
  (quem não entra continua votando anônimo, igual antes).
- **Bolão por episódio**: fica logo abaixo do bloco principal da página da edição
  e **só aparece em edições que têm `fimVotacao`** (data de fechamento no edicao.js).
  Libera junto com o "Monte o Seu" (a data `monteAbreEm` do config.js; sem essa
  data, abre assim que a edição começa). A pessoa logada chuta a **nota final de
  cada episódio** (grade). Quando a votação **fecha**, aparece o placar de quem
  teve o **menor erro médio** por episódio, e o 1º lugar ganha 🔮 *Vidente do
  Bolão {ano}* no perfil. Antes de fechar, ninguém vê o palpite dos outros.
- **Badges do perfil**: mais de 20 tipos (algumas fáceis, várias difíceis). O
  perfil mostra 3 por vez (trocam a cada reload); "Ver todas" abre o resto, e as
  ainda não conquistadas ficam apagadas. As avaliações do perfil abrem ao clicar,
  mostrando a grade de notas daquela edição.

Reset de senha não existe (não tem e-mail no circuito): se precisar, você edita/apaga
a linha da pessoa na aba `usuarios` na mão. A aba `usuarios` **nunca** é enviada para
o navegador — só o servidor lê as senhas.

### Camada social (perfis, carimbos, visitas, XP, comparação)

Tudo isso também vive na planilha. **Exige republicar o Apps Script** (o `.gs` já traz
tudo). Ele cria sozinho, no primeiro uso, as abas novas: `visitas` e `carimbos`, e
usa colunas extras na `usuarios` (`tentativas`, `lockUntil`, `perfil`).

- **Trava de login**: 5 tentativas de senha erradas travam a conta por 10 minutos.
- **Review anônima**: logado, dá pra marcar "enviar como anônimo" no voto — aí a
  avaliação não entra no seu perfil, XP nem ranking.
- **Nível por XP**: cada episódio avaliado vale 20 XP; a cada 100 XP sobe um nível.
- **Perfil por usuário**: `perfil.html?user=NOME` abre o perfil de qualquer pessoa.
  Ao visitar, fica registrada uma visita (aparece a contagem e a lista no perfil).
- **Carimbos**: no perfil dos outros dá pra deixar carimbos pré-definidos (💎 👏 🧐 …),
  com 5 min de intervalo por perfil. O "?" ao lado do título explica cada um.
- **Compare / Afinidade**: no perfil de outra pessoa, o botão "Compare" mostra a
  afinidade de gosto (baseada nas notas das MESMAS peças) e onde vocês mais divergem.
- **Showcase**: no seu perfil, "Editar destaques" deixa escolher peça/edição/noite
  favorita e a playlist de abertura para exibir.
- **Hall → Ranking de usuários**: top avaliadores, marcando presença, streak de
  festivais e bolões vencidos — tudo calculado sozinho a partir dos votos.
- **Badges**: catálogo grande (histórico, bolão, comportamento, comunidade, especiais).
  Algumas são aproximações do que você descreveu; "Mestre dos Bastidores" fica travada
  (depende de upload de foto, que ainda não existe).
- **Configuração do perfil (`perfil.js`)**: agora os ajustes do perfil ficam num
  arquivo só, igual ao `config.js`/`hall-dados.js`. Lá você muda XP por episódio,
  XP por nível, quantas badges aparecem por vez, as metas de várias badges e a lista
  de **carimbos** (emoji/nome/descrição). ⚠️ Se criar um carimbo novo, a chave dele
  também precisa entrar no `CARIMBOS_VALIDOS` do `planilha-apps-script.gs` (e
  republicar), senão o servidor recusa.

### Buscar (busca.html)

Página nova de busca (link "🔎 Buscar" no menu, entre Monte o Seu e Hall). Acha
**peças, festivais e usuários** com filtros de nota mínima, ano, noite e turma; o
campo de texto procura por nome de peça, turma ou usuário. Usuários aparecem com a
bolinha redonda (igual ao perfil) e peças/festivais com a miniatura do `poster.jpg`.
Não precisa de nada no backend — usa os votos e os arquivos das edições.

> Passo de deploy: Apps Script → colar o `.gs` → Implantar → Gerenciar implantações →
> editar → **Nova versão** → Implantar. As abas novas se criam sozinhas.

> Depois de reimplantar, teste criar uma conta uma vez. Se der erro de conexão no
> login mas o voto normal funciona, me avise: é a única parte que depende de o
> Apps Script responder ao POST (o resto do site já lê a planilha sem problema).

## Baners:

Colocar baners nas pastas do ano `poster.jpg` = Poster da edição (630 x 830) / `sobre-banner.jpg` Banner do sobre (1600 x 900)

## Banners de votação (automáticos)

Na página principal da edição, os banners se controlam sozinhos pelas datas:

- Antes do `inicio`: teaser (grade borrada + countdown de abertura).
- Edição aberta com `fimVotacao` marcado: faixa dourada "As avaliações irão
  fechar em HH:MM:SS" contando ao vivo.
- Depois do `fimVotacao`: banner de agradecimento (`mensagemFim` do edicao.js)
  + countdown para a próxima edição (`abreEm` do config.js).

## Votação sempre aberta (ex: edição retrô)

Quer deixar um ano votando pra sempre (tipo um 2025 retrô)?

1. No `ANO/edicao.js`: `fimVotacao: ''` → o site nunca fecha, sem countdown.
2. No Apps Script: `2025: null` no `FESTIVAL_END_BY_YEAR` → o servidor aceita
   votos daquele ano sem prazo. Reimplante depois de editar.

Ano que NÃO estiver no `FESTIVAL_END_BY_YEAR` é bloqueado pelo servidor
(proteção contra voto em edição inexistente). Resumindo: data = fecha na data,
`null` = nunca fecha, ausente = já fechado.

## Hall da Fama (hall.html + hall-dados.js)

Tudo do Hall se calcula sozinho a partir dos votos + arquivos das edições, e
atualiza a cada 20s (tem o carimbo "atualizado às..." no topo). O que é seu
para editar fica no `hall-dados.js`:

- `minAvaliacoes` — mínimo de votos para rankings/recordes/badges (padrão 3).
- `edicoesRealizadas` / `publicoEstimado` — dados históricos manuais dos cards.
- `badgesExtras` — badges manuais (prêmio do júri etc.), template comentado lá.
- `curiosidades` — itens escritos à mão na lista de recordes.

## Badges

- Automáticas: cada peça leva NO MÁXIMO 1 badge automática por edição — a que
  mais se encaixa, nesta prioridade: 🥇 campeã → 👏 favorita → 🔥 polêmica →
  🎯 consistente → 📊 mais avaliada. 📈 "bem recebida" é consolação e também é
  única: vai só para a peça sem badge com o melhor saldo de elogios vs críticas.
  Mínimo de avaliações: `minAvaliacoes` do hall-dados.js.
- ⭐ Melhor episódio da história e as badges manuais (`badgesExtras`) não
  contam nesse limite — podem aparecer junto.
- A legenda completa aparece na seção "As Badges" do Hall da Fama.

## Edições fora do padrão (noites e peças variáveis)

Cada edição pode ter formato próprio — tipo 2019, que pulou a segunda-feira
e teve 4 peças na terça:

- **Quantidade de noites**: `noites:` na linha do ano no `config.js`
  (fica lá, e não no edicao.js, porque o menu lateral de TODAS as páginas
  precisa saber quantas noites listar sem carregar os arquivos do ano).
- **Dia sem apresentação**: não existe "noite pulada" — as noites são
  numeradas em sequência (Noite 1, 2, 3...) e cada uma tem a própria data
  no `noites/noite-N.js`. Se não teve segunda, a Noite 1 é terça e pronto.
- **Quantidade de peças por noite**: é o tamanho da lista `pecas` do
  `noites/noite-N.js`. Noite com 4 peças ganha linha E4 na grade; as outras
  noites ficam com espaço vazio (célula invisível) naquela linha. O
  `episodiosPorNoite` do edicao.js vira só o padrão para noites ainda sem
  peças cadastradas.
- ⚠️ NÃO reordene as peças de uma noite depois que já houver votos: a nota
  fica amarrada à posição (1ª peça = E1). Reordenar troca as notas de dona.

## Celular

O menu vira uma faixa compacta no topo (logo + botão ☰). Os links só aparecem
ao tocar no ☰. Nada para configurar.

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
