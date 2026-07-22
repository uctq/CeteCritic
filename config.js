/* =====================================================================
   CETECRITIC — CONFIGURAÇÃO GERAL (config.js)
   =====================================================================
   Tudo que muda com frequência fica AQUI ou nos arquivos do ano:
     - ANO/edicao.js .............. título, descrição, datas e textos do ano
     - ANO/noites/noite-N.js ...... DATA e PEÇAS de cada noite
   ===================================================================== */

/* Edição mostrada quando alguém abre cetecritic.xyz.
   Troque este número e pronto — a votação "em destaque" muda de ano. */
const EDICAO_EM_DESTAQUE = 2026;

/* Edições que aparecem no menu lateral (a ordem aqui = ordem do menu).
   Para um ano novo: copie a pasta de um ano, ajuste os arquivos dela
   e adicione uma linha aqui.
     ano ........... pasta do ano (ex: 2027 -> pasta /2027)
     noites ........ quantas noites aparecem no menu e na grade
     abreEm ........ (opcional) data da 1ª noite — usada no countdown
                     "faltam X para o próximo festival" do banner final
     monteAbreEm ... (opcional) quando o "Monte o Seu" desse ano libera */
const EDICOES = [
  { ano: 2027, noites: 5,
    abreEm: '2027-07-12T19:00:00-03:00',
    monteAbreEm: '2027-07-01T00:00:00-03:00' },
  { ano: 2026, noites: 5 },
  { ano: 2025, noites: 5 },
  { ano: 2024, noites: 5 },
  { ano: 2023, noites: 5 },
  { ano: 2022, noites: 5 },
  { ano: 2021, noites: 5 },
  { ano: 2020, noites: 5 },
  
  //{ ano: 2028, noites: 5,
  //  abreEm: '2028-07-10T19:00:00-03:00',
  //  monteAbreEm: '2028-07-01T00:00:00-03:00' },
];

/* Planilha (Google Apps Script) que guarda os votos — vale para todos os anos */
const API_URL = 'https://script.google.com/macros/s/AKfycbx_HwHNycDjcKfSsYfVm6j1JyLL0OXR0F8lNlG-sa-f4VYCJRWdSO2Y-CDngSUQEgfGfA/exec';

/* Nota máxima aceita nos formulários (mantenha igual ao MAX_RATING do Apps Script) */
const NOTA_MAXIMA = 10;

/* Votos antigos SEM a coluna "ano" preenchida na planilha pertencem a esta
   edição (os primeiros votos de 2026 foram salvos antes da coluna existir).
   Sem isso, eles apareceriam em todas as edições. */
const ANO_VOTOS_ANTIGOS = 2026;

/* Tempo mínimo entre envios de avaliação (anti-spam), em minutos */
const COOLDOWN_MINUTOS = 5;

/* Texto do rodapé de todas as páginas */
const RODAPE = 'Esse site não é filiado, ou mantém qualquer relação de forma oficial com nenhuma mantida da FUCS';
