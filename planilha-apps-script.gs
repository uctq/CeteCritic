const SHEET_NAME = 'submissions';
// Nota máxima permitida no front-end (mantenha igual ao NOTA_MAXIMA do config.js)
const MAX_RATING = 10;

// ===== TRAVA DE VOTAÇÃO NO SERVIDOR (POR ANO) =====
// Mesmo que alguém mude o relógio do próprio celular/PC, o servidor rejeita
// qualquer voto enviado depois do horário do ano correspondente (fuso -03:00).
// Ao criar uma edição nova, adicione uma linha aqui (igual ao fimVotacao do edicao.js).
const FESTIVAL_END_BY_YEAR = {
  2026: new Date('2026-07-18T23:59:00-03:00'),
  2027: new Date('2027-07-17T23:59:00-03:00'),
};

// Ano da edição atual. Usado como fallback se o front não mandar o ano.
const CURRENT_EDITION_YEAR = 2026;

function festivalEnd_(year) {
  return FESTIVAL_END_BY_YEAR[Number(year)] || null;
}
function votingClosed_(year) {
  const end = festivalEnd_(year);
  // Ano sem data cadastrada = votação fechada (evita voto em edição inexistente)
  return end ? new Date() >= end : true;
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['id', 'ts', 'name', 'grid', 'year']);
  }
  return sheet;
}

function hasInvalidRating_(grid) {
  if (!grid) return true;
  return Object.keys(grid).some(function (k) {
    const val = Number(grid[k]);
    return val < 1 || isNaN(val) || val > MAX_RATING;
  });
}

function doGet(e) {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1);

  const yearFilter = e && e.parameter && e.parameter.year
    ? Number(e.parameter.year)
    : CURRENT_EDITION_YEAR;

  const submissions = rows
    .filter(r => r[0] !== '')
    .map(r => {
      let grid = {};
      try { grid = JSON.parse(r[3] || '{}'); } catch (err) { grid = {}; }
      const year = r[4] ? Number(r[4]) : CURRENT_EDITION_YEAR;
      return {
        id: String(r[0]),
        ts: Number(r[1]),
        name: String(r[2] || ''),
        grid: grid,
        year: year
      };
    })
    .filter(sub => !hasInvalidRating_(sub.grid))
    .filter(sub => sub.year === yearFilter);

  // Envia o horário oficial do servidor + se a votação DESSE ANO já acabou.
  return ContentService
    .createTextOutput(JSON.stringify({
      serverNow: Date.now(),
      votingClosed: votingClosed_(yearFilter),
      submissions: submissions
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const sheet = getSheet_();
  const body = JSON.parse(e.postData.contents);

  if (!body || !body.id || !body.grid) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'dados inválidos' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const year = body.year ? Number(body.year) : CURRENT_EDITION_YEAR;

  // ===== BLOQUEIO: votação encerrada para o ano do voto =====
  if (votingClosed_(year)) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'votação encerrada' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Avaliação maliciosa descartada silenciosamente
  if (hasInvalidRating_(body.grid)) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  sheet.appendRow([
    String(body.id),
    Number(body.ts) || Date.now(),
    String(body.name || '').slice(0, 40),
    JSON.stringify(body.grid),
    year
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

/** LIMPEZA RETROATIVA */
function cleanInvalidRatings() {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  let removed = 0;
  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    if (row[0] === '') continue;
    let grid = {};
    try { grid = JSON.parse(row[3] || '{}'); } catch (err) { grid = {}; }
    if (hasInvalidRating_(grid)) {
      sheet.deleteRow(i + 1);
      removed++;
    }
  }
  Logger.log(removed + ' avaliação(ões) inválida(s) removida(s).');
  return removed;
}

/** PREENCHIMENTO RETROATIVO DO ANO (coluna E) — rode uma vez se precisar */
function fillMissingYears() {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  let filled = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] !== '' && (data[i][4] === '' || data[i][4] === undefined || data[i][4] === null)) {
      sheet.getRange(i + 1, 5).setValue(CURRENT_EDITION_YEAR);
      filled++;
    }
  }
  Logger.log(filled + ' linha(s) preenchida(s) com o ano ' + CURRENT_EDITION_YEAR + '.');
  return filled;
}
