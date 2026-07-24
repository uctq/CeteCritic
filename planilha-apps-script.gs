const SHEET_NAME = 'submissions';
// Nota máxima permitida no front-end (mantenha igual ao NOTA_MAXIMA do config.js)
const MAX_RATING = 10;

// ===== TRAVA DE VOTAÇÃO NO SERVIDOR (POR ANO) =====
// Mesmo que alguém mude o relógio do próprio celular/PC, o servidor rejeita
// qualquer voto enviado depois do horário do ano correspondente (fuso -03:00).
// Ao criar uma edição nova, adicione uma linha aqui (igual ao fimVotacao do edicao.js).
// Use null para uma votação SEMPRE ABERTA (sem prazo). Ano que não estiver
// na lista continua bloqueado (proteção contra voto em edição inexistente).
const FESTIVAL_END_BY_YEAR = {
  2027: new Date('2027-07-17T23:59:00-03:00'),
  2026: new Date('2026-07-18T23:59:00-03:00'),
  2025: null,
  2024: null,
  2023: null,
  2022: null,
  2021: null,
  2020: null,  // exemplo: edição retrô com votação permanente
};

// Ano da edição atual. Usado como fallback se o front não mandar o ano.
const CURRENT_EDITION_YEAR = 2026;

function votingClosed_(year) {
  const y = Number(year);
  if (!(y in FESTIVAL_END_BY_YEAR)) return true; // ano não cadastrado = fechado
  const end = FESTIVAL_END_BY_YEAR[y];
  if (end === null) return false;                // null = sempre aberta
  return new Date() >= end;
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['id', 'ts', 'name', 'grid', 'year', 'user']);
  }
  return sheet;
}

// ===== CONTAS (login simples) E BOLÃO =====
// Tudo fica na própria planilha, em duas abas novas:
//   usuarios  -> user | senhaHash | salt | token | criadoEm
//   palpites  -> user | year | palpite | ts
// A aba 'usuarios' NUNCA é devolvida no doGet público (só o servidor a lê).
const USERS_SHEET = 'usuarios';
const PALPITES_SHEET = 'palpites';
const VISITAS_SHEET = 'visitas';
const CARIMBOS_SHEET = 'carimbos';
const REPUT_SHEET = 'reputacao';   // karma: 1 voto (+1/-1) por usuário em cada perfil

// Login: trava depois de 5 tentativas erradas, por 10 minutos.
const MAX_TENTATIVAS = 5;
const LOCK_MS = 10 * 60 * 1000;
// Cooldown entre carimbos do mesmo usuário no mesmo perfil.
const CARIMBO_COOLDOWN_MS = 5 * 60 * 1000;
// Tipos de carimbo aceitos (o visual/explicação fica no site).
const CARIMBOS_VALIDOS = { joia: 1, critico: 1, parceiro: 1, lenda: 1, concordo: 1, discordo: 1, palmas: 1, polemico: 1 };

function getUsersSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(USERS_SHEET);
  if (!sh) { sh = ss.insertSheet(USERS_SHEET); sh.appendRow(['user', 'senhaHash', 'salt', 'token', 'criadoEm', 'tentativas', 'lockUntil', 'perfil']); }
  return sh;
}
function getVisitasSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(VISITAS_SHEET);
  if (!sh) { sh = ss.insertSheet(VISITAS_SHEET); sh.appendRow(['profileUser', 'visitorUser', 'ts', 'count']); }
  return sh;
}
function getCarimbosSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CARIMBOS_SHEET);
  if (!sh) { sh = ss.insertSheet(CARIMBOS_SHEET); sh.appendRow(['profileUser', 'fromUser', 'tipo', 'ts']); }
  return sh;
}
function getReputSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(REPUT_SHEET);
  // Uma linha por (perfil votado, quem votou). valor = +1 ou -1.
  if (!sh) { sh = ss.insertSheet(REPUT_SHEET); sh.appendRow(['profileUser', 'fromUser', 'valor', 'ts']); }
  return sh;
}
function getPalpitesSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(PALPITES_SHEET);
  // 'palpites' guarda um JSON por episódio: {"s1e1":8.5,"s1e2":7,...}
  if (!sh) { sh = ss.insertSheet(PALPITES_SHEET); sh.appendRow(['user', 'year', 'palpites', 'ts']); }
  return sh;
}
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function normUser_(u) { return String(u || '').trim().toLowerCase(); }
// Hash SHA-256 com salt (não é fortaleza, mas evita guardar senha em texto puro).
function hash_(senha, salt) {
  const raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(salt) + '|' + String(senha), Utilities.Charset.UTF_8);
  return raw.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}
function novoToken_() { return Utilities.getUuid().replace(/-/g, ''); }
function acharUsuario_(user) {
  const sh = getUsersSheet_();
  const data = sh.getDataRange().getValues();
  const alvo = normUser_(user);
  for (let i = 1; i < data.length; i++) {
    if (normUser_(data[i][0]) === alvo) {
      return {
        row: i + 1, user: String(data[i][0]), senhaHash: String(data[i][1]), salt: String(data[i][2]), token: String(data[i][3]),
        tentativas: Number(data[i][5]) || 0, lockUntil: Number(data[i][6]) || 0, perfil: String(data[i][7] || '{}')
      };
    }
  }
  return null;
}
function verificarToken_(user, token) {
  if (!user || !token) return false;
  const u = acharUsuario_(user);
  return !!(u && u.token && u.token === String(token));
}

function hasInvalidRating_(grid) {
  if (!grid) return true;
  return Object.keys(grid).some(function (k) {
    const val = Number(grid[k]);
    return val < 1 || isNaN(val) || val > MAX_RATING;
  });
}

function doGet(e) {
  // ---- Perfil público de um usuário (config/showcase, visitas, carimbos) ----
  if (e && e.parameter && e.parameter.perfil) {
    const alvo = String(e.parameter.perfil);
    const u = acharUsuario_(alvo);
    let cfg = {};
    if (u) { try { cfg = JSON.parse(u.perfil || '{}'); } catch (x) { cfg = {}; } }
    const vRows = getVisitasSheet_().getDataRange().getValues().slice(1);
    const visitas = vRows.filter(r => normUser_(r[0]) === normUser_(alvo))
      .map(r => ({ visitor: String(r[1]), ts: Number(r[2]), count: Number(r[3]) || 1 }));
    const totalVisitas = visitas.reduce((a, b) => a + b.count, 0);
    const cRows = getCarimbosSheet_().getDataRange().getValues().slice(1);
    const carimbos = cRows.filter(r => normUser_(r[0]) === normUser_(alvo))
      .map(r => ({ from: String(r[1]), tipo: String(r[2]), ts: Number(r[3]) }));
    // ---- reputação (karma): soma dos votos; 'por' = voto do visitante logado ----
    const rRows = getReputSheet_().getDataRange().getValues().slice(1);
    const por = e.parameter.por ? normUser_(e.parameter.por) : null;
    let reputacao = 0, meuVoto = 0;
    rRows.forEach(function (r) {
      if (normUser_(r[0]) === normUser_(alvo)) {
        const v = Number(r[2]) || 0;
        reputacao += v;
        if (por && normUser_(r[1]) === por) meuVoto = v;
      }
    });
    return json_({ user: u ? u.user : alvo, existe: !!u, perfil: cfg, totalVisitas: totalVisitas, visitas: visitas, carimbos: carimbos, reputacao: reputacao, meuVoto: meuVoto });
  }

  // ---- Ranking de reputação (todos os perfis, maior -> menor) ----
  if (e && e.parameter && e.parameter.ranking === 'reputacao') {
    const rRows = getReputSheet_().getDataRange().getValues().slice(1);
    const soma = {};   // chave normalizada -> { user (exibição), rep }
    rRows.forEach(function (r) {
      const key = normUser_(r[0]);
      if (!key) return;
      if (!soma[key]) soma[key] = { user: String(r[0]), rep: 0 };
      soma[key].rep += Number(r[2]) || 0;
    });
    const ranking = Object.keys(soma).map(function (k) { return soma[k]; })
      .sort(function (a, b) { return b.rep - a.rep; });
    return json_({ ranking: ranking });
  }

  // ---- Bolão: lista os palpites de um ano, mas SÓ depois da votação fechar
  //      (antes disso ninguém vê o palpite dos outros, pra não copiar) ----
  if (e && e.parameter && e.parameter.palpites) {
    const y = Number(e.parameter.palpites);
    if (!votingClosed_(y)) return json_({ open: true, palpites: [] });
    const rows = getPalpitesSheet_().getDataRange().getValues().slice(1);
    const palpites = rows
      .filter(r => r[0] !== '')
      .map(r => {
        let p = {};
        try { p = JSON.parse(r[2] || '{}'); } catch (e) { p = {}; }
        return { user: String(r[0]), year: Number(r[1]), palpites: p, ts: Number(r[3]) };
      })
      .filter(p => p.year === y);
    return json_({ closed: true, palpites: palpites });
  }

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
        year: year,
        user: String(r[5] || '')   // dono da avaliação (vazio = anônima)
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

// Roteia por 'action'. Sem action = voto (compatível com o site antigo).
function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'json inválido' }); }
  const action = body && body.action ? String(body.action) : 'voto';
  if (action === 'registrar') return apiRegistrar_(body);
  if (action === 'login')     return apiLogin_(body);
  if (action === 'palpite')   return apiPalpite_(body);
  if (action === 'perfil')    return apiPerfil_(body);
  if (action === 'visita')    return apiVisita_(body);
  if (action === 'carimbo')   return apiCarimbo_(body);
  if (action === 'reputacao') return apiReputacao_(body);
  return apiVoto_(body);
}

function apiVoto_(body) {
  const sheet = getSheet_();
  if (!body || !body.id || !body.grid) return json_({ ok: false, error: 'dados inválidos' });

  const year = body.year ? Number(body.year) : CURRENT_EDITION_YEAR;

  // ===== BLOQUEIO: votação encerrada para o ano do voto =====
  if (votingClosed_(year)) return json_({ ok: false, error: 'votação encerrada' });

  // Avaliação maliciosa descartada silenciosamente
  if (hasInvalidRating_(body.grid)) return json_({ ok: true });

  // Se veio user + token válidos, a avaliação fica registrada como daquele usuário.
  let user = '';
  if (body.user && verificarToken_(body.user, body.token)) user = String(body.user);

  sheet.appendRow([
    String(body.id),
    Number(body.ts) || Date.now(),
    String(body.name || '').slice(0, 40),
    JSON.stringify(body.grid),
    year,
    user
  ]);

  return json_({ ok: true });
}

function apiRegistrar_(body) {
  const lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (err) { return json_({ ok: false, error: 'servidor ocupado, tente de novo' }); }
  try {
    const user = String(body.user || '').trim();
    const senha = String(body.senha || '');
    if (user.length < 2 || user.length > 20) return json_({ ok: false, error: 'usuário deve ter de 2 a 20 caracteres' });
    if (!/^[A-Za-z0-9_.\- ]+$/.test(user)) return json_({ ok: false, error: 'usuário tem caracteres inválidos' });
    if (senha.length < 4) return json_({ ok: false, error: 'a senha precisa de pelo menos 4 caracteres' });
    if (acharUsuario_(user)) return json_({ ok: false, error: 'esse usuário já existe' });
    const salt = novoToken_().slice(0, 8);
    const token = novoToken_();
    getUsersSheet_().appendRow([user, hash_(senha, salt), salt, token, Date.now()]);
    return json_({ ok: true, user: user, token: token });
  } finally { lock.releaseLock(); }
}

function apiLogin_(body) {
  const user = String(body.user || '').trim();
  const senha = String(body.senha || '');
  const u = acharUsuario_(user);
  if (!u) return json_({ ok: false, error: 'usuário não encontrado' });

  const agora = Date.now();
  const sh = getUsersSheet_();
  // ainda travado?
  if (u.lockUntil > agora) {
    const min = Math.ceil((u.lockUntil - agora) / 60000);
    return json_({ ok: false, error: 'muitas tentativas — espere ' + min + ' min e tente de novo' });
  }
  // senha errada: conta a tentativa, trava ao chegar no limite
  if (hash_(senha, u.salt) !== u.senhaHash) {
    const tent = u.tentativas + 1;
    if (tent >= MAX_TENTATIVAS) {
      sh.getRange(u.row, 6).setValue(0);                 // zera contador
      sh.getRange(u.row, 7).setValue(agora + LOCK_MS);   // trava 10 min
      return json_({ ok: false, error: 'muitas tentativas — bloqueado por 10 minutos' });
    }
    sh.getRange(u.row, 6).setValue(tent);
    return json_({ ok: false, error: 'senha incorreta (' + (MAX_TENTATIVAS - tent) + ' tentativa(s) restante(s))' });
  }
  // sucesso: renova token, zera tentativas e trava
  const token = novoToken_();
  sh.getRange(u.row, 4).setValue(token);
  sh.getRange(u.row, 6).setValue(0);
  sh.getRange(u.row, 7).setValue(0);
  return json_({ ok: true, user: u.user, token: token });
}

function apiPerfil_(body) {
  const user = String(body.user || '');
  if (!verificarToken_(user, body.token)) return json_({ ok: false, error: 'faça login' });
  const u = acharUsuario_(user);
  if (!u) return json_({ ok: false, error: 'usuário não encontrado' });
  const cfg = (body.perfil && typeof body.perfil === 'object') ? body.perfil : {};
  getUsersSheet_().getRange(u.row, 8).setValue(JSON.stringify(cfg));
  return json_({ ok: true });
}

function apiVisita_(body) {
  const user = String(body.user || '');
  if (!verificarToken_(user, body.token)) return json_({ ok: false });
  const alvo = String(body.alvo || '');
  if (!alvo || normUser_(alvo) === normUser_(user)) return json_({ ok: true }); // não conta auto-visita
  const lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (err) { return json_({ ok: false }); }
  try {
    const sh = getVisitasSheet_();
    const data = sh.getDataRange().getValues();
    const pa = normUser_(alvo), vi = normUser_(user);
    for (let i = 1; i < data.length; i++) {
      if (normUser_(data[i][0]) === pa && normUser_(data[i][1]) === vi) {
        sh.getRange(i + 1, 3).setValue(Date.now());
        sh.getRange(i + 1, 4).setValue((Number(data[i][3]) || 0) + 1);
        return json_({ ok: true });
      }
    }
    sh.appendRow([alvo, user, Date.now(), 1]);
    return json_({ ok: true });
  } finally { lock.releaseLock(); }
}

function apiCarimbo_(body) {
  const user = String(body.user || '');
  if (!verificarToken_(user, body.token)) return json_({ ok: false, error: 'faça login' });
  const alvo = String(body.alvo || '');
  const tipo = String(body.tipo || '');
  if (!alvo || normUser_(alvo) === normUser_(user)) return json_({ ok: false, error: 'não dá pra carimbar seu próprio perfil' });
  if (!CARIMBOS_VALIDOS[tipo]) return json_({ ok: false, error: 'carimbo inválido' });
  if (!acharUsuario_(alvo)) return json_({ ok: false, error: 'perfil não encontrado' });
  const lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (err) { return json_({ ok: false, error: 'servidor ocupado, tente de novo' }); }
  try {
    const sh = getCarimbosSheet_();
    const data = sh.getDataRange().getValues();
    const pa = normUser_(alvo), fr = normUser_(user);
    let ultima = 0;
    for (let i = 1; i < data.length; i++) {
      if (normUser_(data[i][0]) === pa && normUser_(data[i][1]) === fr) ultima = Math.max(ultima, Number(data[i][3]) || 0);
    }
    const restante = CARIMBO_COOLDOWN_MS - (Date.now() - ultima);
    if (restante > 0) return json_({ ok: false, error: 'espere ' + Math.ceil(restante / 60000) + ' min para carimbar este perfil de novo' });
    sh.appendRow([alvo, user, tipo, Date.now()]);
    return json_({ ok: true });
  } finally { lock.releaseLock(); }
}

// ===== REPUTAÇÃO / KARMA =====
// 1 voto por usuário em cada perfil. valor: +1 (upvote), -1 (downvote) ou 0 (tira o voto).
// Votar de novo com o mesmo valor pelo front vira 0 (toggle) — aqui só aplicamos o que chegar.
function apiReputacao_(body) {
  const user = String(body.user || '');
  if (!verificarToken_(user, body.token)) return json_({ ok: false, error: 'faça login' });
  const alvo = String(body.alvo || '');
  if (!alvo || normUser_(alvo) === normUser_(user)) return json_({ ok: false, error: 'não dá pra votar no seu próprio perfil' });
  if (!acharUsuario_(alvo)) return json_({ ok: false, error: 'perfil não encontrado' });

  let valor = Number(body.valor);
  if (valor !== 1 && valor !== -1 && valor !== 0) valor = 0;

  const lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (err) { return json_({ ok: false, error: 'servidor ocupado, tente de novo' }); }
  try {
    const sh = getReputSheet_();
    const data = sh.getDataRange().getValues();
    const pa = normUser_(alvo), fr = normUser_(user);
    let minhaRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (normUser_(data[i][0]) === pa && normUser_(data[i][1]) === fr) { minhaRow = i + 1; break; }
    }
    if (minhaRow > 0) {
      if (valor === 0) sh.deleteRow(minhaRow);
      else { sh.getRange(minhaRow, 3).setValue(valor); sh.getRange(minhaRow, 4).setValue(Date.now()); }
    } else if (valor !== 0) {
      sh.appendRow([alvo, user, valor, Date.now()]);
    }
    // recomputa o total e o voto atual do usuário
    const d2 = sh.getDataRange().getValues();
    let total = 0, meu = 0;
    for (let i = 1; i < d2.length; i++) {
      if (normUser_(d2[i][0]) === pa) {
        const v = Number(d2[i][2]) || 0;
        total += v;
        if (normUser_(d2[i][1]) === fr) meu = v;
      }
    }
    return json_({ ok: true, total: total, meu: meu });
  } finally { lock.releaseLock(); }
}

function apiPalpite_(body) {
  const user = String(body.user || '');
  if (!verificarToken_(user, body.token)) return json_({ ok: false, error: 'faça login para palpitar' });
  const year = body.year ? Number(body.year) : CURRENT_EDITION_YEAR;
  if (votingClosed_(year)) return json_({ ok: false, error: 'o bolão desse ano já fechou' });

  // palpite por episódio: objeto {"s1e1":8.5,...}. Valida cada nota 0..MAX.
  const entrada = (body.palpites && typeof body.palpites === 'object') ? body.palpites : null;
  if (!entrada) return json_({ ok: false, error: 'nenhum palpite enviado' });
  const limpos = {};
  Object.keys(entrada).forEach(function (k) {
    const v = Number(entrada[k]);
    if (!isNaN(v) && v >= 0 && v <= MAX_RATING) limpos[k] = v;
  });
  if (!Object.keys(limpos).length) return json_({ ok: false, error: 'palpites inválidos' });
  const payload = JSON.stringify(limpos);

  const lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (err) { return json_({ ok: false, error: 'servidor ocupado, tente de novo' }); }
  try {
    const sh = getPalpitesSheet_();
    const data = sh.getDataRange().getValues();
    const alvo = normUser_(user);
    for (let i = 1; i < data.length; i++) {          // já palpitou? atualiza
      if (normUser_(data[i][0]) === alvo && Number(data[i][1]) === year) {
        sh.getRange(i + 1, 3).setValue(payload);
        sh.getRange(i + 1, 4).setValue(Date.now());
        return json_({ ok: true });
      }
    }
    sh.appendRow([user, year, payload, Date.now()]);
    return json_({ ok: true });
  } finally { lock.releaseLock(); }
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
