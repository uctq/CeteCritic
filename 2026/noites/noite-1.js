/* =====================================================================
   NOITE 1 — CETEC FESTIVAL 2026
   =====================================================================
   A DATA abaixo controla TUDO sozinha:
     - o cadeado 🔒 da coluna S1 na página de votação
     - o countdown/desbloqueio automático da página noite-1.html
   Para uma noite nova: copie este arquivo, mude o número em NOITES[N]
   e ajuste data e peças. A ordem das peças = E1, E2, E3...
   ===================================================================== */

NOITES[1] = {
  data: '2026-07-13T19:00:00-03:00',
  subtitulo: 'Turmas que se apresentaram na primeira noite do festival.',
  pecas: [
    {
      titulo: 'É Vero, Verissimos!',
      turma: '01',
      sinopse: 'O que deveria ser apenas mais uma manhã monótona no CETEC se transforma em um pesadelo épico quando o tempo se rompe, transportando quatro alunos para dentro de uma das maiores obras da literatura brasileira: \'O Tempo e o Vento\'. A confusão cômica rapidamente se torna perigosa quando o som de galopes e tiros corta o ar. Presos no fogo cruzado entre Farrapos e a Tropa Imperial, eles descobrem que, no universo de Erico Verissimo, o passado é vivo, sangrento e implacável.',
      youtube: 'cwk-zqIPCXw',        // id do vídeo (deixe '' se ainda não tiver)
      youtubeInicio: 3435            // segundo em que a peça começa no vídeo
    },
    {
      titulo: 'Calados pela Morte',
      turma: 'B2',
      sinopse: 'Sete mortos permanecem sem sepultamento devido a uma greve de coveiros em uma cidade marcada por crimes silenciosos. Ao despertar, percebem que não podem ser ouvidos por ninguém, exceto um detetive desprezado pela população. Enquanto buscam compreender as circunstâncias de suas mortes, descobrem que suas histórias estão interligadas. Inspirada em \'Incidente em Antares\', propõe uma reflexão sobre as vozes silenciadas.',
      youtube: 'cwk-zqIPCXw',
      youtubeInicio: 5210
    },
    {
      titulo: 'O Clube dos Anjos - O que não engorda, mata',
      turma: 'B3',
      sinopse: 'Em um luxuoso clube da alta sociedade gaúcha, jantares periódicos reúnem nobres em torno de pratos refinados preparados por um chef francês. Entre uma taça de vinho e outra, mortes inexplicáveis acontecem e deixam o questionamento: quem realmente está no controle dessa história?',
      youtube: 'cwk-zqIPCXw',
      youtubeInicio: 8789
    }
  ]
};
