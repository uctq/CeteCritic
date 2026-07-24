/* =====================================================================
   PERFIL — CONFIGURAÇÃO (perfil.js)
   =====================================================================
   Ajustes do perfil do usuário. Carregado só na perfil.html.
   Mudou algo aqui? É só recarregar a página — nada de mexer no core.js.
   ===================================================================== */

const PERFIL = {

  /* ---- NÍVEL / XP ----
     Cada episódio avaliado vale xpPorEpisodio. A cada xpPorNivel de XP a
     pessoa sobe um nível. (Padrão: 20 xp por episódio, 100 xp por nível.) */
  xpPorEpisodio: 20,
  xpPorNivel: 100,

  /* ---- BADGES ----
     Quantas badges aparecem por vez no modo recolhido (trocam a cada reload). */
  badgesPreview: 4,

  /* Metas de algumas badges — mude o número para deixar mais fácil/difícil.
     (As badges que não estão aqui têm a regra fixa no core.js.) */
  metas: {
    plateiaRaiz: 4,        // nº de edições diferentes para "Plateia Raiz"
    historiador: 5,        // nº de edições diferentes para "Historiador"
    espectadorSerie: 10,   // nº de peças avaliadas para "Espectador em Série"
    metralhadora: 100,     // nº de notas dadas para "Metralhadora de notas"
    colecionador: 15,      // nº de badges para "Colecionador"
    gemeoAfinidade: 90,    // % de afinidade para "Gêmeo de Opinião"
    lendaNivel: 5          // nível mínimo para "Lenda do Fórum"
  },

  /* ---- CARIMBOS ----
     Os carimbos que dá pra deixar no perfil dos outros.
     A CHAVE (joia, palmas, ...) também precisa existir no CARIMBOS_VALIDOS
     do planilha-apps-script.gs, senão o servidor recusa. Para criar um novo:
       1) adicione aqui { chave: { emoji, nome, desc } }
       2) adicione a mesma chave no CARIMBOS_VALIDOS do .gs e republique. */
  carimbos: {
    joia:     { emoji: '💎', nome: 'Joia',        desc: 'Curtiu o perfil e as avaliações dessa pessoa.' },
    palmas:   { emoji: '👏', nome: 'Palmas',      desc: 'Reconhecimento pelas boas avaliações.' },
    critico:  { emoji: '🧐', nome: 'Bom crítico', desc: 'Acha que a pessoa avalia com critério.' },
    parceiro: { emoji: '🤝', nome: 'Parceiro',    desc: 'Um agrado de quem acompanha o festival junto.' },
    concordo: { emoji: '✅', nome: 'Concordo',    desc: 'Costuma concordar com as notas dessa pessoa.' },
    discordo: { emoji: '❌', nome: 'Discordo',    desc: 'Discorda (na boa!) das notas dessa pessoa.' },
    polemico: { emoji: '🔥', nome: 'Polêmico',    desc: 'As opiniões dessa pessoa dão o que falar.' },
    lenda:    { emoji: '👑', nome: 'Lenda',       desc: 'Respeito máximo pela dedicação ao acervo.' }
  }
};
