/* =====================================================================
   CETEC FESTIVAL 2020 — DADOS DA EDIÇÃO (2020/edicao.js)
   =====================================================================
   Enquanto a data de "inicio" não chega, o site mostra automaticamente
   o teaser (grade borrada + countdown) em todas as páginas deste ano.
   Preencha os textos e as peças (noites/noite-N.js) quando quiser —
   nada aparece antes da hora.
   ===================================================================== */

const EDICAO = {
  ano: 2020,
  titulo: 'Cetec Festival 2020',
  descricao: '25 Anos de História, Talento e Emoção',

  episodiosPorNoite: 4,

  /* antes desta data: teaser com countdown */
  inicio: '2020-10-14T19:00:00-03:00',

  /* AJUSTE quando a programação oficial sair (e atualize o Apps Script) */
  fimVotacao: '',

  poster: 'poster.jpg',

  mensagemFim: 'Agradecemos o apoio de todos e parabenizamos todas as apresentações! 🎉 Nos vemos em 2021...',

  sobre: {
    banner: 'sobre-banner.jpg',  /* banner no topo do card (opcional) */
    titulo: '25 Anos de História, Talento e Emoção',
    texto: ''        /* vazio = página mostra countdown até o início da edição */
  },

  abertura: {
    texto: '',       /* vazio = página mostra countdown até o início da edição */
    spotify: ''
  }
};

/* os arquivos noites/noite-N.js preenchem este objeto */
const NOITES = {};
