const SHEET_NAME = 'submissions';
// Defina aqui a nota máxima permitida no seu front-end (ex: 5, 10, 100)
const MAX_RATING = 10;

// ===== TRAVA DE VOTAÇÃO NO SERVIDOR =====
// Mesmo que alguém mude o relógio do próprio celular/PC, o servidor rejeita
// qualquer voto enviado depois deste horário (fuso de Brasília, -03:00).
const FESTIVAL_END = new Date('2026-07-18T23:59:00-03:00');

// Ano da edição atual. Usado como fallback se o front não mandar o ano.
const CURRENT_EDITION_YEAR = 2026;

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['id', 'ts', 'name', 'grid', 'year']);
  }
  return sheet;
}

// Renomeado para abranger mais casos de griefers
function hasInvalidRating_(grid) {
  if (!grid) return true; // Se mandou sem grid, descarta

  return Object.keys(grid).some(function (k) {
    const val = Number(grid[k]);
    // Shadowban se: menor que 1, não for número (NaN), ou for maior que o máximo permitido
    return val < 1 || isNaN(val) || val > MAX_RATING;
  });
}

function doGet(e) {
  const sheet = getSheet_();
  const data = sheet.getDataRange().getValues();
  const rows = data.slice(1);

  const yearFilter = e && e.parameter && e.parameter.year
    ? Number(e.parameter.year)
    : null;

  const submissions = rows
    .filter(r => r[0] !== '')
    .map(r => {
      let grid = {};
      try { grid = JSON.parse(r[3] || '{}'); } catch (err) { grid = {}; }

      // Usa o ano da planilha. Se não existir (linhas antigas), assume a edição atual
      const year = r[4] ? Number(r[4]) : CURRENT_EDITION_YEAR;

      return {
        id: String(r[0]),
        ts: Number(r[1]),
        name: String(r[2] || ''),
        grid: grid,
        year: year
      };
    })
    .filter(sub => !hasInvalidRating_(sub.grid)) // Oculta avaliações corrompidas
    .filter(sub => yearFilter ? sub.year === yearFilter : true);

  // Envia também o horário oficial do servidor. O site usa isso para
  // saber se a votação já acabou, sem confiar no relógio do visitante.
  return ContentService
    .createTextOutput(JSON.stringify({
      serverNow: Date.now(),
      votingClosed: new Date() >= FESTIVAL_END,
      submissions: submissions
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // ===== BLOQUEIO DEFINITIVO: votação encerrada =====
  if (new Date() >= FESTIVAL_END) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'votação encerrada' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = getSheet_();
  const body = JSON.parse(e.postData.contents);

  if (!body || !body.id || !body.grid) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: 'dados inválidos' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Avaliação maliciosa descartada silenciosamente
  if (hasInvalidRating_(body.grid)) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // Se o front não mandar o ano, usa a edição atual definida acima.
  // (Não usa new Date().getFullYear() para não "vazar" voto de uma edição
  //  para outra caso alguém vote com relógio errado ou em janeiro do ano seguinte.)
  const year = body.year ? Number(body.year) : CURRENT_EDITION_YEAR;

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

/**
 * LIMPEZA RETROATIVA ATUALIZADA
 */
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

/**
 * PREENCHIMENTO RETROATIVO DO ANO (coluna E)
 * Rode uma vez manualmente para preencher linhas antigas sem ano.
 */
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

