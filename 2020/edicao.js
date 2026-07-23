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
    texto: 'Coincidindo com o aniversário de 25 anos do CETEC, a edição de 2020 do festival levou ao palco os principais acontecimentos históricos, sociais e culturais que marcaram a humanidade nas duas últimas décadas e meia. Diante das restrições impostas pela pandemia da Covid-19, o evento passou por uma reestruturação inédita, migrando integralmente para as plataformas virtuais e adaptando sua linguagem teatral para o formato audiovisual. A realização das peças exigiu uma reformulação nas dinâmicas de produção pedagógica. Impedidos de utilizar o espaço físico do teatro, os estudantes assumiram o controle das gravações e da edição a partir de suas próprias casas. A autonomia dos alunos manteve-se central em todas as etapas, desde a delimitação dos temas e escrita da dramaturgia até a adaptação técnica para o ambiente digital. O festival registrou a capacidade de adaptação da comunidade escolar e o uso da tecnologia como ferramenta de expressão e análise crítica.'        /* vazio = página mostra countdown até o início da edição */
  },

  abertura: {
    texto: 'A cerimônia de abertura do CETEC Festival 2020 refletiu o contexto de isolamento através de uma produção 100% online. Os estudantes das Atividades Complementares produziram registros em vídeo de forma individual, que foram posteriormente unificados em uma montagem audiovisual integrada. O material combinou expressões de dança, música, artes visuais e performance cênica, simbolizando a união coletiva mesmo à distância. A trilha sonora da abertura foi construída com obras que transmitiam mensagens de esperança e renovação diante do cenário incerto daquele período. A montagem foi embalada pela canção Quando O Sol Bater Na Janela Do Teu Quarto, da banda Legião Urbana, e pelo clássico Here Comes The Sun, de autoria de George Harrison para os Beatles. A sobreposição das vozes e imagens dos alunos sobre esses arranjos marcou o início de uma edição histórica focada no acolhimento e na superação através da arte.',       /* vazio = página mostra countdown até o início da edição */
    spotify: 'https://open.spotify.com/embed/playlist/0zw50HuXQZ99BBXMDBaoLN?utm_source=generator&si=e923c51a61054277'
  }
};

/* os arquivos noites/noite-N.js preenchem este objeto */
const NOITES = {};
