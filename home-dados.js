/* =====================================================================
   PÁGINA INICIAL — SEUS DADOS (home-dados.js)
   =====================================================================
   Tudo aqui é manual e fácil de editar. As curiosidades automáticas
   (maior média da história, diferença entre 1ª e última etc.) o site
   calcula sozinho e mistura com as suas.
   ===================================================================== */

const HOME_DADOS = {

  /* ---- CURIOSIDADES (manuais) ----
     Texto simples ou objeto com emoji/url. Aparecem antes das automáticas. */
  curiosidades: [
    // 'A primeira peça cadastrada no site é de 1995.',
    // { emoji: '🎪', texto: 'O Festival 2024 teve exatamente 18 apresentações.', url: '2024/index.html' },
  ],

  /* ---- LINHA DO TEMPO ----
     ano: 'texto'. Os anos cadastrados no config.js entram sozinhos (com
     link e, se ainda não abriram, "Em produção..."). Anos antigos sem
     pasta também podem estar aqui — viram só texto. Buracos entre anos
     aparecem como "···" automaticamente. */
  linhaDoTempo: {
    1995: 'Primeiro CETEC Festival.',
    2020: '25 Anos do Cetec - Primeiro Cetec Festival Realizado com Gravações',
    2021: 'O Jovem Desvendando o Mundo Pela Mitologia - Cetec Festival Realizado Mais Tarde Devido a Pandemia',
    2026: 'Veríssimos em Tempos de Fronteiras ao Vento — estreia do CETECritic.',
    // 2020: 'Edição cancelada pela pandemia.',
    // 2008: 'Primeira edição no UCS Teatro.',
  },

  /* ---- NESSE DIA NA HISTÓRIA ----
     Aparece na home só no dia/mês marcado. url e emoji são opcionais. */
  nesteDia: [
    // { dia: 12, mes: 7, emoji: '🎬', texto: 'Em 2026, começava o CETEC Festival dos Veríssimos.', url: '2026/index.html' },
    // { dia: 17, mes: 7, texto: 'Em 2026, a Noite 5 fechava o festival com casa cheia.' },
  ]
};
