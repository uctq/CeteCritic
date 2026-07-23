/* =====================================================================
   CETEC FESTIVAL 2024 — DADOS DA EDIÇÃO (2024/edicao.js)
   =====================================================================
   Enquanto a data de "inicio" não chega, o site mostra automaticamente
   o teaser (grade borrada + countdown) em todas as páginas deste ano.
   Preencha os textos e as peças (noites/noite-N.js) quando quiser —
   nada aparece antes da hora.
   ===================================================================== */

const EDICAO = {
  ano: 2024,
  titulo: 'Cetec Festival 2024',
  descricao: '150 Anos da Imigração Italiana',

  episodiosPorNoite: 3,

  /* antes desta data: teaser com countdown */
  inicio: '2024-07-08T19:00:00-03:00',

  /* AJUSTE quando a programação oficial sair (e atualize o Apps Script) */
  fimVotacao: '',

  poster: 'poster.jpg',

  mensagemFim: 'Agradecemos o apoio de todos e parabenizamos todas as apresentações! 🎉 Nos vemos em 2025...',

  sobre: {
    banner: 'sobre-banner.jpg',  /* banner no topo do card (opcional) */
    titulo: '150 Anos da Imigração Italiana',
    texto: 'A edição de 2024 do CETEC Festival adotou como eixo central os 150 Anos da Imigração Italiana no RS: Um Intercâmbio Permanente, propondo uma análise das transformações sociais ocorridas ao longo de um século e meio de conexões entre a Itália e o Brasil. Tendo o UCS Teatro como palco principal, o evento resgatou o marco histórico de 1875 para investigar como a chegada dos imigrantes moldou o território gaúcho, seus costumes e sua população. Distanciando-se de abordagens meramente comemorativas ou saudosistas, a proposta buscou examinar as convergências e distinções culturais resultantes dessa troca contínua entre as duas nações. A realização foi fruto de um processo pedagógico transdisciplinar que mobilizou os estudantes ao longo de todo o ano letivo. A autonomia dos alunos manifestou-se na coordenação de todas as etapas de produção, abrangendo desde a pesquisa conceitual e escrita dramatúrgica até o desenvolvimento técnico e operacional de iluminação, sonoplastia, figurino e cenografia.'        /* vazio = página mostra countdown até o início da edição */
  },

  abertura: {
    texto: 'A cerimônia de abertura do CETEC Festival 2024 prestou uma homenagem direta às raízes da cultura italiana, estruturando uma apresentação que sintetizou a diversidade artística promovida pela instituição. No palco, os estudantes das Atividades Complementares conduziram um espetáculo multidisciplinar, integrando os trabalhos desenvolvidos ao longo do período letivo nas oficinas de Dança, Música, Canto, Teatro, Ateliê Literário, Cinema, Desenho e Pintura. A encenação estabeleceu uma ponte entre as artes plásticas, a literatura e as artes cênicas, refletindo o caráter híbrido da produção estudantil. A construção sonora da abertura resgatou composições icônicas da música italiana e da tradição erudita. O repertório musical incluiu a célebre L italiano, de Toto Cutugno — peça fundamental na identidade pop do país europeu —, além da lírica contemporânea de Speranza, interpretada por Laura Pausini, e o clássico Volare (Nel blu dipinto di blu), de Domenico Modugno. A atmosfera cênica foi complementada pela execução instrumental das valsas Lágrima e Gran Vals, do violonista e compositor espanhol Francisco Tárrega, adicionando sofisticação técnica e sensibilidade erudita ao ato inicial.',       /* vazio = página mostra countdown até o início da edição */
    spotify: 'https://open.spotify.com/embed/playlist/5jmRaafEymFdkQzf9cRnU5?utm_source=generator&si=30e23ced3a364819'
  }
};

/* os arquivos noites/noite-N.js preenchem este objeto */
const NOITES = {};
