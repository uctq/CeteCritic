/* =====================================================================
   CETEC FESTIVAL 2021 — DADOS DA EDIÇÃO (2021/edicao.js)
   =====================================================================
   Enquanto a data de "inicio" não chega, o site mostra automaticamente
   o teaser (grade borrada + countdown) em todas as páginas deste ano.
   Preencha os textos e as peças (noites/noite-N.js) quando quiser —
   nada aparece antes da hora.
   ===================================================================== */

const EDICAO = {
  ano: 2021,
  titulo: 'Cetec Festival 2021',
  descricao: 'O Jovem Desvendando o Mundo Pela Mitologia',

  episodiosPorNoite: 3,

  /* antes desta data: teaser com countdown */
  inicio: '2021-10-04T19:00:00-03:00',

  /* AJUSTE quando a programação oficial sair (e atualize o Apps Script) */
  fimVotacao: '',

  poster: 'poster.jpg',

  mensagemFim: 'Agradecemos o apoio de todos e parabenizamos todas as apresentações! 🎉 Nos vemos em 2028...',

  sobre: {
    banner: 'sobre-banner.jpg',  /* banner no topo do card (opcional) */
    titulo: 'O Jovem Desvendando o Mundo Pela Mitologia',
    texto: 'A edição de 2021 do CETEC Festival adotou a mitologia como eixo central, propondo uma investigação sobre como as narrativas místicas e os símbolos ancestrais dialogam com a experiência humana e o desenvolvimento dos jovens. A proposta buscou utilizar o fazer artístico para conectar os estudantes a saberes históricos, antropológicos, sociais, culturais e filosóficos, estimulando a autocompreensão e a empatia. A identidade visual do evento foi concebida e desenvolvida pelos próprios alunos, contando com o suporte da Oficina de Desenho e Pintura. O conceito gráfico apresentou uma figura mística central capaz de condensar referências de diferentes tradições culturais. A composição integrou o elemento ocular no peito — associado à proteção na mitologia egípcia, ao afastamento de energias negativas na tradição grega e ao chakra cardíaco na perspectiva hindu —, asas inspiradas em figuras aladas e elementos lunares vinculados a tradições pagãs e originárias. A escolha das cores opostas e complementares, amarelo e roxo, simbolizou a pluralidade dos mitos que, apesar de distintos, convergiram no propósito de explicar a relação do indivíduo com o mundo.'        /* vazio = página mostra countdown até o início da edição */
  },

  abertura: {
    texto: 'A cerimônia de abertura do CETEC Festival 2021 carregou um significado singular ao ser realizada em meio aos desafios impostos pela pandemia. Em um período marcado pelo isolamento social e pela necessidade de adaptação dos processos de aprendizagem, a arte emergiu como um espaço fundamental de acolhimento, resiliência e reconexão entre os estudantes. Mesmo diante das restrições do momento, a produção das Atividades Complementares reafirmou o papel da expressão cultural na superação das adversidades. A seleção musical da abertura articulou temas de transformação, brasilidade e espiritualidade para marcar o início das apresentações. O repertório executado incluiu a canção Como Uma Onda, de Lulu Santos e Nelson Motta, evocando a impermanência e a constante mudança da vida. A apresentação incorporou também a fusão de ritmos e a síncope de Jack Soul Brasileiro, obra de Lenine, e a profundidade ancestral de Canto de Xangô, composição de Baden Powell e Vinicius de Moraes, estabelecendo uma ponte entre o contexto do festival e a riqueza do patrimônio cultural brasileiro.',       /* vazio = página mostra countdown até o início da edição */
    spotify: 'https://open.spotify.com/embed/playlist/6zv318RPSPCyeJiQzUvg8l?utm_source=generator&si=5dc8a495ed0345a5'
  }
};

/* os arquivos noites/noite-N.js preenchem este objeto */
const NOITES = {};
