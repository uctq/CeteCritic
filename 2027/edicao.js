/* =====================================================================
   CETEC FESTIVAL 2027 — DADOS DA EDIÇÃO (2027/edicao.js)
   =====================================================================
   Enquanto a data de "inicio" não chega, o site mostra automaticamente
   o teaser (grade borrada + countdown) em todas as páginas deste ano.
   Preencha os textos e as peças (noites/noite-N.js) quando quiser —
   nada aparece antes da hora.
   ===================================================================== */

const EDICAO = {
  ano: 2027,
  titulo: 'Cetec Festival 2027',
  descricao: '',

  episodiosPorNoite: 3,

  /* antes desta data: teaser com countdown */
  inicio: '2027-07-12T19:00:00-03:00',

  /* AJUSTE quando a programação oficial sair (e atualize o Apps Script) */
  fimVotacao: '2027-07-17T23:59:00-03:00',

  poster: 'poster.jpg',

  mensagemFim: 'Agradecemos o apoio de todos e parabenizamos todas as apresentações! 🎉 Nos vemos em 2028...',

  sobre: {
    banner: 'sobre-banner.jpg',  /* banner no topo do card (opcional) */
    titulo: '',
    texto: ''        /* vazio = página mostra countdown até o início da edição */
  },

  abertura: {
    texto: '',       /* vazio = página mostra countdown até o início da edição */
    spotify: ''
  }
};

/* os arquivos noites/noite-N.js preenchem este objeto */
const NOITES = {};
