/* =====================================================================
   CETEC FESTIVAL 2026 — DADOS DA EDIÇÃO (2026/edicao.js)
   =====================================================================
   Para criar um ano novo: copie a pasta inteira, renomeie para o ano,
   edite este arquivo + os noites/noite-N.js e adicione o ano no
   config.js (EDICOES). Só isso.
   Datas sempre no fuso de Brasília: 'AAAA-MM-DDTHH:MM:00-03:00'
   ===================================================================== */

const EDICAO = {
  ano: 2024,
  titulo: 'Cetec Festival 2024',
  descricao: '150 Anos da Imigração Italiana',

  /* quantos episódios (peças) por noite aparecem na grade de notas */
  episodiosPorNoite: 3,

  /* antes desta data o site mostra o teaser (grade borrada + countdown) */
  inicio: '2024-07-08T19:00:00-03:00',

  /* votação fecha neste horário (mantenha igual ao Apps Script da planilha) */
  fimVotacao: '',

  /* imagem de capa — coloque o arquivo dentro desta pasta */
  poster: 'poster.jpg',

  /* banner mostrado quando a votação encerra */
  mensagemFim: 'Agradecemos o apoio de todos e parabenizamos todas as apresentações! 🎉 Nos vemos em 2025...',

  sobre: {
    /* banner que aparece no topo do card — coloque o arquivo nesta pasta */
    banner: 'sobre-banner.jpg',
    titulo: '150 Anos da Imigração Italiana',
    texto: 'Ao longo das últimas três décadas, milhares de estudantes passaram pelo palco do CETEC Festival, consolidando um projeto interdisciplinar mantido pela instituição desde a sua fundação, em 1995. O evento, que teve origem em uma modesta apresentação familiar voltada ao Dia das Mães, expandiu-se até se tornar o maior festival de teatro estudantil do Rio Grande do Sul, passando a integrar o calendário oficial do município de Caxias do Sul. A edição de 2025 resgatou essa trajetória de 30 anos ao destacar a autonomia e o protagonismo juvenil. Desde a introdução de eixos temáticos nos anos 2000, os alunos mantêm a liberdade de imprimir visões próprias nas produções, transformando o festival em uma ferramenta de desenvolvimento acadêmico e de construção de identidade. O processo pedagógico, que mobilizou diversas disciplinas ao longo de todo o ano letivo, culminou em espetáculos nos quais os estudantes gerenciaram integralmente a criação — desde a concepção conceitual, pesquisa e dramaturgia até a execução técnica de iluminação, sonoplastia, cenografia e figurino. A celebração resgatou três décadas de memória institucional, reafirmando o impacto das vivências nos palcos para os mais de 13 mil alunos que já circularam pela escola.',
  },

  abertura: {
    texto: 'A cerimônia de abertura do CETEC Festival 2025 adotou como elemento central a simbologia do ipê amarelo, árvore presente no pátio da escola desde a sua criação. O elemento vegetal foi utilizado para metaforizar as raízes profundas e as ramificações de uma instituição que completou três décadas de atuação mantendo a expressão artística como um de seus pilares fundamentais. A produção cênica e visual revisitou a memória de diferentes gerações de estudantes que marcaram a história da escola ao longo desse período. No palco, os alunos das Atividades Complementares apresentaram um trabalho integrado que uniu as linguagens de Canto, Música, Dança, Cinema, Desenho e Pintura. A performance contou com um repertório musical executado ao vivo pelos próprios estudantes, iniciado com a canção "Pais e Filhos", de Renato Russo — uma escolha temática para abordar os laços geracionais do festival. A apresentação musical desdobrou-se por referências plurais, englobando a cena do rock nacional e internacional com Amigo Punk e Ana Júlia, a energia de Dont Stop Me Now, a tradição do tango em A Media Luz e Por Una Cabeza, além de expressões contemporâneas e do samba com Ginga e O Show Tem que Continuar.',
    /* link de EMBED do Spotify (Compartilhar > Incorporar > copie só o src) */
    spotify: 'https://open.spotify.com/embed/playlist/7qvqFDb37lahlydMtoln9n?utm_source=generator&si=56b49b8bd0d44524'
  }
};

/* os arquivos noites/noite-N.js preenchem este objeto */
const NOITES = {};
