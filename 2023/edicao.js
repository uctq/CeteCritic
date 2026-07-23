/* =====================================================================
   CETEC FESTIVAL 2023 — DADOS DA EDIÇÃO (2023/edicao.js)
   =====================================================================
   Enquanto a data de "inicio" não chega, o site mostra automaticamente
   o teaser (grade borrada + countdown) em todas as páginas deste ano.
   Preencha os textos e as peças (noites/noite-N.js) quando quiser —
   nada aparece antes da hora.
   ===================================================================== */

const EDICAO = {
  ano: 2023,
  titulo: 'Cetec Festival 2023',
  descricao: 'Frutos da Revolução: A arte me transforma e eu transformo o mundo',

  episodiosPorNoite: 3,

  /* antes desta data: teaser com countdown */
  inicio: '2023-07-10T19:00:00-03:00',

  /* AJUSTE quando a programação oficial sair (e atualize o Apps Script) */
  fimVotacao: '',

  poster: 'poster.jpg',

  mensagemFim: 'Agradecemos o apoio de todos e parabenizamos todas as apresentações! 🎉 Nos vemos em 2024...',

  sobre: {
    banner: 'sobre-banner.jpg',  /* banner no topo do card (opcional) */
    titulo: 'Frutos da Revolução: A arte me transforma e eu transformo o mundo',
    texto: 'Ao longo da trajetória humana, transformações profundas e movimentos revolucionários alteraram de forma decisiva as estruturas da sociedade. A edição de 2023 do CETEC Festival tomou essa premissa como ponto de partida sob o tema A arte me transforma e eu transformo o mundo. O UCS Teatro serviu de palco para produções que abordaram processos de mudança histórica, social, política e cultural, estabelecendo conexões entre os acontecimentos do passado e os dilemas contemporâneos. As encenações exploraram desde revoluções políticas e transições tecnológicas até pautas socioambientais e movimentos culturais, utilizando a narrativa dramática para instigar reflexões sobre liberdade, justiça e direitos humanos. A realização do evento refletiu o envolvimento integral dos estudantes em todas as fases do processo pedagógico. Os alunos gerenciaram desde a investigação teórica e redação dos roteiros até os aspectos operacionais do espetáculo, assumindo o controle técnico de cenografia, iluminação, sonoplastia e figurino.'        /* vazio = página mostra countdown até o início da edição */
  },

  abertura: {
    texto: 'A cerimônia de abertura do CETEC Festival 2023 traduziu o conceito de revolução através da integração de diferentes linguagens artísticas. Conduzida pelos alunos das Atividades Complementares, a apresentação marcou a culminância das oficinas pedagógicas de Dança, Música, Canto, Teatro, Ateliê Literário, Desenho e Pintura. O espetáculo inicial combinou performance cênica, artes visuais e expressão literária para introduzir o eixo temático daquele ano. A concepção musical da abertura trouxe uma seleção de obras emblemáticas da música popular brasileira que dialogam com a ideia de transformação e permanência. O repertório executado ao vivo incluiu a clássica Velha Roupa Colorida, de Belchior e consagrada na voz de Elis Regina, evocando a rutura geracional e a renovação cultural. A apresentação desdobrou-se pelo samba com O Show Tem Que Continuar, de Arlindo Cruz, reafirmando a resiliência através do fazer artístico, e incorporou a sensibilidade da cena gaúcha com a canção Relógios de Sol, do compositor Nei Lisboa',       /* vazio = página mostra countdown até o início da edição */
    spotify: 'https://open.spotify.com/embed/playlist/1w92xh8JsxKf08275eKfbk?utm_source=generator&si=daa4f049cf5c4d88'
  }
};

/* os arquivos noites/noite-N.js preenchem este objeto */
const NOITES = {};
