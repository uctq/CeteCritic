/* =====================================================================
   CETEC FESTIVAL 2026 — DADOS DA EDIÇÃO (2026/edicao.js)
   =====================================================================
   Para criar um ano novo: copie a pasta inteira, renomeie para o ano,
   edite este arquivo + os noites/noite-N.js e adicione o ano no
   config.js (EDICOES). Só isso.
   Datas sempre no fuso de Brasília: 'AAAA-MM-DDTHH:MM:00-03:00'
   ===================================================================== */

const EDICAO = {
  ano: 2026,
  titulo: 'Cetec Festival 2026',
  descricao: 'Como o tempo custa a passar quando a gente espera! Principalmente quando venta. Parece que o vento maneia o tempo.',

  /* quantos episódios (peças) por noite aparecem na grade de notas */
  episodiosPorNoite: 3,

  /* antes desta data o site mostra o teaser (grade borrada + countdown) */
  inicio: '2026-07-12T19:00:00-03:00',

  /* votação fecha neste horário (mantenha igual ao Apps Script da planilha) */
  fimVotacao: '2026-07-18T23:59:00-03:00',

  /* imagem de capa — coloque o arquivo dentro desta pasta */
  poster: 'poster.jpg',

  /* banner mostrado quando a votação encerra */
  mensagemFim: 'Agradecemos o apoio de todos e parabenizamos todas as apresentações! 🎉 Nos vemos em 2027...',

  sobre: {
    /* banner que aparece no topo do card — coloque o arquivo nesta pasta */
    banner: 'sobre-banner.jpg',
    titulo: 'Veríssimos em Tempos de Fronteiras ao Vento',
    texto: 'A edição de 2026 do CETEC Festival, realizada entre 12 a 17 de julho, ocupou o palco do UCS Teatro com a mostra "Veríssimos em Tempos de Fronteiras ao Vento", consolidando um espaço de intersecção entre a literatura, a história regional e a prática pedagógica. O evento resgatou a densidade cultural das obras de Erico e Luis Fernando Veríssimo, utilizando o universo ficcional de pai e filho para traçar paralelos profundos entre as raízes da identidade gaúcha e as complexidades da sociedade contemporânea. Além disso, as apresentações integraram as celebrações dos 400 anos das Missões Jesuíticas Guaranis, costurando o passado histórico do Rio Grande do Sul com as narrativas atuais. O ponto central do festival foi o protagonismo e a autonomia dos estudantes. Após um criterioso processo de pesquisa interdisciplinar, os jovens assumiram a responsabilidade por toda a cadeia de produção dos espetáculos. O trabalho envolveu desde a transposição de conceitos para roteiros teatrais até o desenvolvimento técnico e artístico de cenografia, iluminação, sonoplastia, figurino e direção de elenco. No encerramento do projeto, os alunos deixaram de ser apenas intérpretes para se tornarem os verdadeiros autores da experiência cênica.'
  },

  abertura: {
    texto: 'A abertura do CETEC Festival 2026 foi marcada por um espetáculo de forte intensidade, protagonizado pelos estudantes das Atividades Complementares. A apresentação promoveu um diálogo entre diferentes épocas através de um repertório que uniu clássicos do cancioneiro regional e da música popular brasileira. No palco, foram resgatadas composições emblemáticas da identidade gaúcha, como "Vento Negro", de José Fogaça, "Maria Fumaça", da dupla Kleiton & Kledir, e "Desgarrados", de Sergio Napp e Mário Barbará. Rompendo fronteiras geracionais, a performance também incorporou o impacto de "Como Nossos Pais", obra de Belchior consagrada por Elis Regina, e a fusão cultural de "Herdeiro da Pampa Pobre", de Vainê Darde e Gaúcho da Fronteira, célebre na versão do grupo Engenheiros do Hawaii. O ato inicial sintetizou a convergência de múltiplas linguagens artísticas, integrando produções desenvolvidas pelos alunos nas áreas de Dança, Música, Canto, Cinema, Desenho e Pintura.',
    /* link de EMBED do Spotify (Compartilhar > Incorporar > copie só o src) */
    spotify: 'https://open.spotify.com/embed/playlist/0sUU7hfUXYSzcTNmnZiDpQ?utm_source=generator&si=c02da34565824395'
  }
};

/* os arquivos noites/noite-N.js preenchem este objeto */
const NOITES = {};
