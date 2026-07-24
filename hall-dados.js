/* =====================================================================
   HALL DA FAMA — CONFIGURAÇÃO (hall-dados.js)
   =====================================================================
   Tudo que é calculável vem sozinho dos votos + dos arquivos das edições.
   Aqui ficam os ajustes, os dados históricos e as suas badges manuais.
   ===================================================================== */

const HALL = {
  /* mínimo de avaliações para uma peça entrar em rankings, recordes e
     badges (evita que 1 voto solitário de 10.0 vire "a melhor da história") */
  minAvaliacoes: 3,

  /* ---- ORDEM das seções do Hall da Fama ----
     Liste as chaves na ordem que você quer que apareçam na página.
     Chave que você não citar aqui aparece no final, na ordem padrão — então
     não precisa listar todas, só as que você quer mover para cima/baixo.
     Chaves disponíveis:
       badges              → 🏅 As Badges (legenda)
       topPecas            → 🏆 Top Peças (gráfico)
       topNoites           → 🌙 Top Noites (gráfico)
       topFestivais        → 🏅 Top Festivais (gráfico)
       mediaTurmas         → 🎓 Média histórica por turma
       comparacaoDestaque  → ⚖️ edição em destaque vs. história
       compararEdicoes     → 🆚 Comparar edições (dois seletores)
       evolucao            → 📈 Evolução do festival
       distribuicao        → 🍩 Distribuição das notas
       heatmap             → 🗓️ Notas por noite ao longo dos anos
       recPecas            → 🏆 Prateleira dos Campeões
       recNoites           → 🌙 A Batalha das Noites
       recEdicoes          → 📅 Linha do Tempo & Edições
       recComunidade       → 👥 Números da Comunidade
       rankUsuarios        → 👤 Ranking de usuários (top avaliadores, presença, streak, bolão)
       topReputacao        → 👑 Maiores reputações (top usuários por reputação + cargo)
       curiosidades        → 🎭 Curiosidades
     Exemplo: colocar o ranking de usuários e as curiosidades logo no topo:
       ordemSecoes: ['rankUsuarios', 'curiosidades'], */
  ordemSecoes: [
    'badges', 'topPecas', 'topNoites', 'rankUsuarios', 'topReputacao', 'topFestivais', 'mediaTurmas', 'comparacaoDestaque',
    'compararEdicoes', 'evolucao', 'distribuicao', 'heatmap',
    'recPecas', 'recNoites', 'recEdicoes', 'recComunidade', 'curiosidades'
  ],

  /* ---- QUANTIDADE de itens ("quadrados"/barras/linhas) em cada ranking ---- */
  contagens: {
    topPecas: 10,       // barras do gráfico "Top Peças"
    topNoites: 10,       // barras do gráfico "Top Noites"
    rankUsuarios: 10     // linhas de cada coluna do "Ranking de usuários"
  },

  /* ---- dados manuais (deixe '' para esconder o card) ---- */
  edicoesRealizadas: '31',   // ex: '32 edições (1995–2026)'
  publicoEstimado: '≈ 96 mil',     // ex: '15 mil pessoas'

  /* ---- BADGES EXTRAS (manuais) ----
     Medalhas que VOCÊ dá para uma peça específica. Aparecem ao lado do
     título da peça na página da noite dela e na legenda do Hall da Fama.
       ano ..... edição da peça
       chave ... posição dela: 's<noite>e<episódio>' (ex: 's2e1' = Noite 2, 1ª peça)
       emoji ... a medalha em si
       nome .... título curto
       desc .... explicação (aparece no tooltip e na legenda)
     Copie o modelo abaixo, descomente e ajuste: */
  badgesExtras: [
    // { ano: 2026, chave: 's1e1', emoji: '🎬', nome: 'Prêmio do Júri', desc: 'Escolhida pelo júri técnico como destaque da edição.' },
    // { ano: 2026, chave: 's3e2', emoji: '🎭', nome: 'Revelação', desc: 'Elenco estreante que roubou a cena.' },
  ],

  /* ---- curiosidades escritas à mão (entram no fim da lista de recordes) ---- */
  curiosidades: [
    // { emoji: '🎭', titulo: 'Título da curiosidade', texto: 'Descrição...' },
    { emoji: '🗓️', titulo: 'Cetec Festival Adiado', texto: 'O Cetec Festival de 2021 foi realizado em outubro, devido pandêmia de COVID-19 na época' },
    { emoji: '📽️', titulo: 'Cetec Festival Transmitido', texto: 'Devido a pandêmia o Cetec Festival de 2020 foi o primeiro a ser transmitido ao vivo no Youtube e Facebook' },
    { emoji: '📹', titulo: 'Cetec Festival Gravado', texto: 'O Cetec Festival de 2020 foi a primeira, e até o momentoa unica, edição onde as peças foram exibidas gravadas devido a pandemia' },
    // { emoji: '🏛️', titulo: 'Com link', texto: 'Descrição...', url: '2026/noite-1.html' },
  ]
};
