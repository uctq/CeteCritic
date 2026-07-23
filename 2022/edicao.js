/* =====================================================================
   CETEC FESTIVAL 2022 — DADOS DA EDIÇÃO (2022/edicao.js)
   =====================================================================
   Enquanto a data de "inicio" não chega, o site mostra automaticamente
   o teaser (grade borrada + countdown) em todas as páginas deste ano.
   Preencha os textos e as peças (noites/noite-N.js) quando quiser —
   nada aparece antes da hora.
   ===================================================================== */

const EDICAO = {
  ano: 2022,
  titulo: 'Cetec Festival 2022',
  descricao: '100 Anos da Semana da Arte Moderna',

  episodiosPorNoite: 3,

  /* antes desta data: teaser com countdown */
  inicio: '2022-07-12T19:00:00-03:00',

  /* AJUSTE quando a programação oficial sair (e atualize o Apps Script) */
  fimVotacao: '',

  poster: 'poster.jpg',

  mensagemFim: 'Agradecemos o apoio de todos e parabenizamos todas as apresentações! 🎉 Nos vemos em 2023...',

  sobre: {
    banner: 'sobre-banner.jpg',  /* banner no topo do card (opcional) */
    titulo: '100 Abis da Semana da Arte Moderna',
    texto: 'A edição de 2022 do CETEC Festival adotou como fio condutor o centenário da Semana de Arte Moderna de 1922, explorando a ideia de ruptura e transformação cultural no Brasil. O evento utilizou as produções cênicas dos estudantes para resgatar o espírito dos intelectuais e artistas que buscaram afirmar uma identidade genuinamente nacional, plural e livre de amarras eurocêntricas. As peças teatrais desenvolvidas pelos alunos refletiram essa busca por uma poética própria, traduzindo questões de brasilidade, diversidade e linguagem para o palco do UCS Teatro. O projeto foi estruturado a partir de um processo pedagógico multidisciplinar que valorizou a pesquisa e o protagonismo jovem. Os estudantes atuaram em todas as frentes de produção, desde a concepção do argumento e elaboração dos roteiros até a gestão técnica e estética de figurinos, cenografia, sonoplastia e iluminação.'        /* vazio = página mostra countdown até o início da edição */
  },

  abertura: {
    texto: 'A cerimônia de abertura do CETEC Festival 2022 foi concebida como uma extensão simbólica do movimento modernista de 1922, reunindo diferentes linguagens artísticas em uma apresentação integrada. Os alunos das Atividades Complementares ocuparam o palco para exibir as produções desenvolvidas nas oficinas de Dança, Música, Canto, Teatro, Ateliê Literário, além da oficina de Criatividade e Expressividade. A performance inicial articulou elementos visuais, corporais e literários para estabelecer a atmosfera do festival. A seleção musical da abertura percorreu obras fundamentais da música brasileira que dialogam com a busca por inovação e identidade. O repertório executado ao vivo incluiu a célebre instrumental O Trenzinho do Caipira, composta por Heitor Villa-Lobos, símbolo da fusão entre a música erudita e as raízes populares brasileiras. A apresentação prosseguiu com a crítica social urbana de Cotidiano, obra de Chico Buarque, e culminou com a irreverência e energia de Jardins da Babilônia, clássico de Rita Lee, conectando o legado modernista às manifestações da cultura pop nacional.',       /* vazio = página mostra countdown até o início da edição */
    spotify: 'https://open.spotify.com/embed/playlist/4jUVVip2SeugGj1tlzhc9V?utm_source=generator&si=73392e065a804ec2'
  }
};

/* os arquivos noites/noite-N.js preenchem este objeto */
const NOITES = {};
