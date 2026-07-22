/* =====================================================================
   CETECRITIC — LÓGICA COMPARTILHADA (assets/core.js)
   =====================================================================
   Você normalmente NÃO precisa mexer aqui.
   O que muda ano a ano fica em: config.js, ANO/edicao.js, ANO/noites/*.js

   Cada página define antes de carregar este arquivo:
     const BASE   = '../';                        // caminho até a raiz do site
     const PAGINA = { tipo:'noite', noite: 1 };   // o que renderizar
   Tipos: 'edicao' | 'sobre' | 'abertura' | 'noite' | 'monte'
   ===================================================================== */

/* ---------------------- utilidades ---------------------- */
function esc(str){ const d = document.createElement('div'); d.textContent = str ?? ''; return d.innerHTML; }
function media(arr){ return (!arr || !arr.length) ? null : arr.reduce((a,b)=>a+b,0)/arr.length; }

function corDaNota(r){
  if(r === null || r === undefined || r === '' || isNaN(r)) return null;
  const v = Math.round(parseFloat(r) * 10) / 10;
  if(v >= 9.0) return '#188a53';
  if(v >= 8.0) return '#31b96e';
  if(v >= 7.0) return '#f3ca4d';
  if(v >= 6.0) return '#e48135';
  return '#d93c3c';
}

function formatDuracao(ms){
  if(ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const days  = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins  = Math.floor((totalSec % 3600) / 60);
  const secs  = totalSec % 60;
  const pad = n => String(n).padStart(2, '0');
  return days > 0 ? `${days}d ${pad(hours)}:${pad(mins)}:${pad(secs)}` : `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
}

function tempoAtras(ts){
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60000);
  if(mins < 1) return 'agora mesmo';
  if(mins < 60) return `há ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if(hrs < 24) return `há ${hrs}h`;
  return `há ${Math.floor(hrs/24)}d`;
}

/* ---------------------- contexto da página ---------------------- */
const ED  = (typeof EDICAO !== 'undefined') ? EDICAO : null;
const ANO = ED ? ED.ano : null;
const CFG_EDICAO = ANO ? (EDICOES.find(e => e.ano === ANO) || { noites: 5 }) : null;
const NUM_NOITES = CFG_EDICAO ? CFG_EDICAO.noites : 5;
const EPS = (ED && ED.episodiosPorNoite) ? ED.episodiosPorNoite : 3;
const ND  = (typeof NOITES !== 'undefined') ? NOITES : {};

/* o nº de episódios pode variar por noite: vale o tamanho da lista de peças
   do noites/noite-N.js; noite sem peças cadastradas usa o episodiosPorNoite */
function epsDaNoite(s){
  const nd = ND[s];
  return (nd && Array.isArray(nd.pecas) && nd.pecas.length) ? nd.pecas.length : EPS;
}
let MAX_EPS = EPS;
for(let _s = 1; _s <= NUM_NOITES; _s++) MAX_EPS = Math.max(MAX_EPS, epsDaNoite(_s));

function dataNoite(n){ return (ND[n] && ND[n].data) ? new Date(ND[n].data) : null; }
const INICIO      = (ED && ED.inicio)     ? new Date(ED.inicio)     : null;
const FIM_VOTACAO = (ED && ED.fimVotacao) ? new Date(ED.fimVotacao) : null;

/* ---------------------- horário oficial (servidor) ----------------------
   O relógio do visitante pode estar errado (ou alterado de propósito).
   O site só libera a votação depois de receber o horário do servidor
   (vem junto na resposta do fetchVotos). */
let serverTimeOffset = null;
let serverSaysClosed = false;
function agora(){ return serverTimeOffset === null ? new Date() : new Date(Date.now() + serverTimeOffset); }
function horarioSincronizado(){ return serverTimeOffset !== null; }

function inicioEdicao(){ return INICIO || dataNoite(1); }
function edicaoComecou(){ const d = inicioEdicao(); return d ? agora() >= d : true; }
function noiteLiberada(n){ const d = dataNoite(n); return d ? agora() >= d : true; }
function votacaoEncerrada(){ return serverSaysClosed || (FIM_VOTACAO && agora() >= FIM_VOTACAO); }
function podeVotar(){ return horarioSincronizado() && edicaoComecou() && !votacaoEncerrada(); }

function fmtData(d){
  return d ? d.toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '';
}
function cabecalhoNoite(n){
  return noiteLiberada(n) ? `S${n}` : `S${n} <span class="lock-icon" title="Libera em ${fmtData(dataNoite(n))}">🔒</span>`;
}

/* ---------------------- votos (planilha) ---------------------- */
let submissions = [];

async function fetchVotos(){
  if(!ANO || !API_URL || API_URL.startsWith('COLE_AQUI')) return;
  try{
    /* cache:'no-store' + parâmetro _ : garante que o navegador/Google não
       devolva uma resposta velha em cache (senão o site "não atualiza") */
    const res  = await fetch(API_URL + '?year=' + ANO + '&_=' + Date.now(), { cache: 'no-store' });
    const data = await res.json();
    if(Array.isArray(data)){
      submissions = filtrarVotosDoAno(data, ANO);
    } else {
      submissions = filtrarVotosDoAno(data.submissions, ANO);
      if(typeof data.serverNow === 'number') serverTimeOffset = data.serverNow - Date.now();
      serverSaysClosed = !!data.votingClosed;
    }
  }catch(e){ console.error('Falha ao carregar avaliações', e); }
}

async function postVoto(sub){
  if(!API_URL || API_URL.startsWith('COLE_AQUI')){
    alert('A planilha ainda não foi configurada (API_URL no config.js).');
    return;
  }
  try{
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // evita preflight CORS no Apps Script
      body: JSON.stringify(sub)
    });
  }catch(e){ console.error('Falha ao enviar avaliação', e); }
}

function valoresDaChave(key){
  return submissions.map(s => s.grid[key]).filter(v => v !== undefined && v !== null);
}

/* Cada voto pertence a UMA edição. Voto sem ano (linhas antigas da planilha)
   pertence ao ANO_VOTOS_ANTIGOS do config.js — nunca a todas as edições. */
const ANO_LEGADO = (typeof ANO_VOTOS_ANTIGOS !== 'undefined') ? ANO_VOTOS_ANTIGOS : 2026;
function filtrarVotosDoAno(lista, ano){
  return (lista || []).filter(s => (s.year ? Number(s.year) : ANO_LEGADO) === Number(ano));
}

/* ---------------------- shell (sidebar + rodapé + modais) ---------------------- */
function htmlSidebar(){
  let h = `<div class="sidebar-logo">
    <img src="${BASE}assets/logo.png" alt="" onerror="this.style.display='none'">
    <span>CETEC<br>Critic</span>
    <button class="nav-toggle" id="navToggle" aria-label="Abrir menu">☰</button>
  </div>
  <div class="sidebar-nav" id="sidebarNav">
  <button class="nav-link nav-parent" id="navMonte">Monte o Seu</button>
  <a class="nav-link nav-parent${PAGINA.tipo === 'hall' ? ' active' : ''}" href="${BASE}hall.html">Hall da Fama</a>`;

  EDICOES.forEach(e => {
    const aberto = e.ano === ANO;
    const p = `${BASE}${e.ano}/`;
    const at = cond => cond ? ' active' : '';
    let filhos = `
      <a class="nav-link nav-child${at(aberto && PAGINA.tipo === 'sobre')}" href="${p}sobre.html">Sobre</a>
      <a class="nav-link nav-child${at(aberto && PAGINA.tipo === 'abertura')}" href="${p}abertura.html">Abertura</a>`;
    for(let n = 1; n <= e.noites; n++){
      filhos += `<a class="nav-link nav-child${at(aberto && PAGINA.tipo === 'noite' && PAGINA.noite === n)}" href="${p}noite-${n}.html">Noite ${n}</a>`;
    }
    h += `<div class="nav-section${aberto ? ' open' : ''}">
      <a class="nav-link nav-parent${at(aberto && (PAGINA.tipo === 'edicao' || PAGINA.tipo === 'monte'))}" href="${p}index.html">
        <span>Cetec Festival ${e.ano}</span><span class="nav-caret">▾</span>
      </a>
      <div class="nav-children">${filhos}</div>
    </div>`;
  });
  return h + '</div>'; /* fecha .sidebar-nav */
}

function htmlModalMonte(){
  const opcoes = EDICOES.map(e => {
    const trancado = e.monteAbreEm && agora() < new Date(e.monteAbreEm);
    const sub = trancado
      ? `Ainda não disponível — abre em ${fmtData(new Date(e.monteAbreEm))}`
      : 'Monte sua tabela com foto, título e descrição';
    return `<a class="year-pick-btn" href="${BASE}${e.ano}/monte.html">
      <span class="yr">Cetec Festival ${e.ano}</span>
      <span class="yr-sub">${sub}</span>
    </a>`;
  }).join('');
  return `<div class="modal-overlay" id="monteModalOverlay">
    <div class="modal-card">
      <div class="modal-header"><h2>Monte o Seu</h2><button class="modal-close" id="monteModalClose">✕</button></div>
      <div class="modal-sub">Escolha para qual festival você quer montar a sua versão.</div>
      <div class="year-pick-options">${opcoes}</div>
    </div>
  </div>`;
}

function montarShell(conteudo){
  document.body.insertAdjacentHTML('afterbegin', `
    <nav class="sidebar">${htmlSidebar()}</nav>
    <div class="main-content">
      ${conteudo}
      <footer class="site-footer">
        <img class="footer-logo" src="${BASE}assets/logo-rodape.png" alt="" onerror="this.style.display='none'">
        <div>${esc(RODAPE)}</div>
      </footer>
    </div>`);

  document.body.insertAdjacentHTML('beforeend', htmlModalMonte());
  const mo = document.getElementById('monteModalOverlay');
  document.getElementById('navMonte').addEventListener('click', () => {
    mo.classList.add('open');
    requestAnimationFrame(() => mo.classList.add('show'));
  });
  document.getElementById('monteModalClose').addEventListener('click', () => fecharOverlay(mo));
  mo.addEventListener('click', ev => { if(ev.target === mo) fecharOverlay(mo); });

  /* menu retrátil no celular */
  const navToggle = document.getElementById('navToggle');
  if(navToggle) navToggle.addEventListener('click', () =>
    document.querySelector('.sidebar').classList.toggle('nav-open'));
}

function fecharOverlay(el){
  el.classList.remove('show');
  setTimeout(() => el.classList.remove('open'), 200);
}

/* ---------------------- countdowns (tick global) ----------------------
   Qualquer elemento com data-count-to="ISO" é atualizado a cada segundo.
   Se tiver data-reload="1", a página recarrega quando o tempo zera
   (é assim que noites/edições "abrem" sozinhas). */
let tickPagina = null;
setInterval(() => {
  document.querySelectorAll('[data-count-to]').forEach(el => {
    const resto = new Date(el.dataset.countTo) - agora();
    el.textContent = formatDuracao(resto);
    if(resto <= 0 && el.dataset.reload === '1' && !el.dataset.reloaded){
      el.dataset.reloaded = '1';
      setTimeout(() => location.reload(), 1200);
    }
  });
  if(tickPagina) tickPagina();
}, 1000);

function htmlCountdownBox(ate, comReload){
  return `<div class="grid-countdown-box">
    <div class="lbl">Abre em</div>
    <div class="val" data-count-to="${ate.toISOString()}"${comReload ? ' data-reload="1"' : ''}>--:--:--</div>
  </div>`;
}

/* ---------------------- grids ---------------------- */
function gridVazioHtml(){
  let h = `<div class="grid-row"><div class="cell label"></div>`;
  for(let s = 1; s <= NUM_NOITES; s++) h += `<div class="cell header">S${s}</div>`;
  h += `</div>`;
  for(let e = 1; e <= MAX_EPS; e++){
    h += `<div class="grid-row"><div class="cell label">E${e}</div>`;
    for(let s = 1; s <= NUM_NOITES; s++)
      h += e <= epsDaNoite(s) ? `<div class="cell empty-cell">–</div>` : `<div class="cell cell-void"></div>`;
    h += `</div>`;
  }
  return h;
}

function buildDisplayGrid(containerId){
  const c = document.getElementById(containerId);
  if(!c) return;
  let h = `<div class="grid-row"><div class="cell label"></div>`;
  for(let s = 1; s <= NUM_NOITES; s++) h += `<div class="cell header">${cabecalhoNoite(s)}</div>`;
  h += `</div>`;

  h += `<div class="grid-row"><div class="cell label" style="font-size:10px;">MÉDIA</div>`;
  for(let s = 1; s <= NUM_NOITES; s++) h += `<div class="cell cell-avg pop" id="${containerId}-avg-s${s}">–</div>`;
  h += `</div>`;

  for(let e = 1; e <= MAX_EPS; e++){
    h += `<div class="grid-row"><div class="cell label">E${e}</div>`;
    for(let s = 1; s <= NUM_NOITES; s++){
      if(e > epsDaNoite(s)){ h += `<div class="cell cell-void"></div>`; continue; }
      const key = `s${s}e${e}`;
      h += `<div class="cell cell-data empty-cell pop" id="${containerId}-disp-${key}" style="animation-delay:${(s+e)*0.03}s">
        <span class="val"></span><span class="tooltip"></span>
      </div>`;
    }
    h += `</div>`;
  }
  c.innerHTML = h;
}

const DISPLAY_CONTAINERS = ['grid-container', 'gerais-grid-container'];

function refreshDisplayGrids(){
  let allValues = [];
  DISPLAY_CONTAINERS.forEach(containerId => {
    if(!document.getElementById(containerId)) return;
    for(let s = 1; s <= NUM_NOITES; s++){
      let seasonValues = [];
      for(let e = 1; e <= MAX_EPS; e++){
        const key = `s${s}e${e}`;
        const vals = valoresDaChave(key);
        seasonValues = seasonValues.concat(vals);
        if(containerId === DISPLAY_CONTAINERS[0]) allValues = allValues.concat(vals);

        const cell = document.getElementById(`${containerId}-disp-${key}`);
        if(cell){
          const v = media(vals);
          const valEl = cell.querySelector('.val');
          const tipEl = cell.querySelector('.tooltip');
          if(v === null){
            valEl.textContent = '–';
            cell.classList.add('empty-cell');
            cell.style.backgroundColor = '';
            tipEl.textContent = 'Sem avaliações';
          } else {
            valEl.textContent = v.toFixed(1);
            cell.classList.remove('empty-cell');
            cell.style.backgroundColor = corDaNota(v);
            tipEl.textContent = `${vals.length} avaliação${vals.length === 1 ? '' : 'ões'}`;
          }
        }
      }
      const avgEl = document.getElementById(`${containerId}-avg-s${s}`);
      const sv = media(seasonValues);
      if(avgEl){
        if(sv === null){
          avgEl.textContent = '–';
          avgEl.style.backgroundColor = 'var(--surface-2)';
          avgEl.style.borderColor = 'var(--border)';
        } else {
          avgEl.textContent = sv.toFixed(1);
          const c = corDaNota(sv);
          avgEl.style.backgroundColor = c;
          avgEl.style.borderColor = c;
        }
      }
    }
  });

  const overall = media(allValues);
  const set = (id, txt) => { const el = document.getElementById(id); if(el) el.textContent = txt; };
  set('overallAvg', overall === null ? '–' : overall.toFixed(1));
  set('overallCount', `${submissions.length} avaliaç${submissions.length === 1 ? 'ão' : 'ões'}`);
  set('geraisAvg', overall === null ? '–' : overall.toFixed(1));
  set('geraisCount', String(submissions.length));
}

/* ---------------------- lista de avaliações recebidas ---------------------- */
function renderSubmissions(){
  const list = document.getElementById('submissionList');
  if(!list) return;
  if(submissions.length === 0){
    list.innerHTML = '<div class="empty-note">Nenhuma avaliação enviada ainda. Clique em "Avaliar episódios" no topo!</div>';
    return;
  }
  const sorted = [...submissions].sort((a,b) => b.ts - a.ts);
  list.innerHTML = sorted.map((sub, i) => {
    const vals = Object.values(sub.grid);
    const avg = media(vals);
    let chips = '';
    for(let s = 1; s <= NUM_NOITES; s++){
      for(let e = 1; e <= epsDaNoite(s); e++){
        const v = sub.grid[`s${s}e${e}`];
        chips += v !== undefined
          ? `<div class="mini-chip" style="background:${corDaNota(v)}"></div>`
          : `<div class="mini-chip blank"></div>`;
      }
    }
    return `<div class="submission-item" style="animation-delay:${i*0.03}s" data-id="${sub.id}">
      <div class="submission-head">
        <div class="submission-avg" style="background:${corDaNota(avg)}">${avg.toFixed(1)}</div>
        <div class="submission-meta">
          <div class="submission-name">${sub.name ? esc(sub.name) : `Avaliação #${sorted.length - i}`}</div>
          <div class="submission-when">${tempoAtras(sub.ts)} · ${vals.length} episódio${vals.length === 1 ? '' : 's'} avaliado${vals.length === 1 ? '' : 's'}</div>
        </div>
        <div class="submission-mini">${chips}</div>
        <div class="chevron">▾</div>
      </div>
      <div class="submission-detail"><div class="submission-detail-inner">
        <div class="grid-panel mini-grid" id="detail-grid-${sub.id}"></div>
      </div></div>
    </div>`;
  }).join('');

  list.querySelectorAll('.submission-item').forEach(item => {
    item.querySelector('.submission-head').addEventListener('click', () => toggleSubmission(item));
  });
}

function toggleSubmission(item){
  const id = item.dataset.id;
  const estavaAberto = item.classList.contains('expanded');
  document.querySelectorAll('.submission-item.expanded').forEach(el => { if(el !== item) el.classList.remove('expanded'); });
  if(estavaAberto){ item.classList.remove('expanded'); return; }
  item.classList.add('expanded');
  const sub = submissions.find(s => s.id === id);
  if(sub) buildMiniGrid(`detail-grid-${id}`, sub.grid);
}

function buildMiniGrid(containerId, grid){
  const c = document.getElementById(containerId);
  if(!c || c.dataset.built === '1') return;
  c.dataset.built = '1';
  let h = `<div class="grid-row"><div class="cell label"></div>`;
  for(let s = 1; s <= NUM_NOITES; s++) h += `<div class="cell header">S${s}</div>`;
  h += `</div>`;
  for(let e = 1; e <= MAX_EPS; e++){
    h += `<div class="grid-row"><div class="cell label">E${e}</div>`;
    for(let s = 1; s <= NUM_NOITES; s++){
      if(e > epsDaNoite(s)){ h += `<div class="cell cell-void"></div>`; continue; }
      const v = grid[`s${s}e${e}`];
      h += `<div class="cell" style="background:${v !== undefined ? corDaNota(v) : 'var(--gray-cell)'}; color:${v !== undefined ? '#14161a' : 'var(--text-muted)'}">${v !== undefined ? Number(v).toFixed(1) : '–'}</div>`;
    }
    h += `</div>`;
  }
  c.innerHTML = h;
}

/* ---------------------- formulário de votação ---------------------- */
let formValues = {};
const COOLDOWN_MS = (typeof COOLDOWN_MINUTOS !== 'undefined' ? COOLDOWN_MINUTOS : 5) * 60 * 1000;
let cooldownInterval = null;

function cooldownRestanteMs(){
  const last = Number(localStorage.getItem('last-submission-ts') || 0);
  const r = COOLDOWN_MS - (Date.now() - last);
  return r > 0 ? r : 0;
}
function formatCooldown(ms){
  const totalSec = Math.ceil(ms / 1000);
  return `${Math.floor(totalSec/60)}:${String(totalSec % 60).padStart(2,'0')}`;
}

function buildFormGrid(){
  const c = document.getElementById('form-grid-container');
  if(!c) return;
  let h = `<div class="grid-row"><div class="cell label"></div>`;
  for(let s = 1; s <= NUM_NOITES; s++) h += `<div class="cell header">${cabecalhoNoite(s)}</div>`;
  h += `</div>`;
  for(let e = 1; e <= MAX_EPS; e++){
    h += `<div class="grid-row"><div class="cell label">E${e}</div>`;
    for(let s = 1; s <= NUM_NOITES; s++){
      if(e > epsDaNoite(s)){ h += `<div class="cell cell-void"></div>`; continue; }
      const key = `s${s}e${e}`;
      if(!noiteLiberada(s)){
        h += `<div class="cell cell-input locked" title="Libera em ${fmtData(dataNoite(s))}">🔒</div>`;
        continue;
      }
      const existing = formValues[key];
      h += `<div class="cell cell-input" id="fcell-${key}" style="${existing !== undefined ? `background-color:${corDaNota(existing)}` : ''}">
        <input type="number" min="0" max="${NOTA_MAXIMA}" step="0.1" placeholder="–" data-key="${key}" value="${existing !== undefined ? existing : ''}">
      </div>`;
    }
    h += `</div>`;
  }
  c.innerHTML = h;
  c.querySelectorAll('.cell-input input').forEach(inp => inp.addEventListener('input', () => onFormInput(inp)));
  updateFillHint();
}

function onFormInput(inp){
  const key = inp.dataset.key;
  const cellDiv = document.getElementById(`fcell-${key}`);
  if(inp.value === ''){
    delete formValues[key];
    cellDiv.style.backgroundColor = 'var(--surface-2)';
    updateFillHint();
    return;
  }
  let val = parseFloat(inp.value);
  if(isNaN(val)) return;
  if(val > NOTA_MAXIMA){ val = NOTA_MAXIMA; inp.value = NOTA_MAXIMA; }
  if(val < 0){ val = 0; inp.value = 0; }
  formValues[key] = val;
  cellDiv.style.backgroundColor = corDaNota(val);
  updateFillHint();
}

function updateFillHint(){
  const hintEl = document.getElementById('fillHint');
  const submitBtn = document.getElementById('submitReview');
  if(!hintEl || !submitBtn) return;

  const filled = Object.keys(formValues).length;
  let disponiveis = 0;
  for(let s = 1; s <= NUM_NOITES; s++){ if(noiteLiberada(s)) disponiveis += epsDaNoite(s); }

  const restante = cooldownRestanteMs();
  if(restante > 0){
    hintEl.textContent = `Aguarde ${formatCooldown(restante)} para enviar outra avaliação (evita spam)`;
    submitBtn.disabled = true;
    return;
  }
  hintEl.textContent = `${filled} de ${disponiveis} episódios preenchidos`;
  submitBtn.disabled = filled < 1;
}

/* ---------------------- captura de imagem (html2canvas) ---------------------- */
function neutralizarAnimacoes(clonedDoc, rootId){
  const root = clonedDoc.getElementById(rootId);
  if(!root) return;
  [root, ...root.querySelectorAll('*')].forEach(el => {
    el.style.animation = 'none';
    el.style.opacity = '1';
    el.style.transform = 'none';
  });
  root.querySelectorAll('.tooltip').forEach(el => { el.style.opacity = '0'; el.style.display = 'none'; });
  root.querySelectorAll('.cell-input input').forEach(input => {
    const raw = input.value;
    const num = parseFloat(raw);
    const span = clonedDoc.createElement('div');
    span.textContent = (raw === '' || isNaN(num)) ? '–' : num.toFixed(1);
    Object.assign(span.style, {
      width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center',
      fontWeight:'800', fontSize:'13px', fontFamily:"'Inter', sans-serif",
      color: (raw === '' || isNaN(num)) ? 'var(--text-muted)' : 'inherit'
    });
    input.replaceWith(span);
  });
}

function aguardarImagens(container){
  return Promise.all(Array.from(container.querySelectorAll('img')).map(img => {
    if(img.complete) return Promise.resolve();
    return new Promise(res => {
      img.addEventListener('load', res, { once:true });
      img.addEventListener('error', res, { once:true });
    });
  }));
}

async function baixarImagem(areaId, nomeArquivo, btn){
  const original = btn.textContent;
  btn.textContent = 'Gerando...';
  try{
    const area = document.getElementById(areaId);
    await aguardarImagens(area);
    const canvas = await html2canvas(area, {
      backgroundColor: '#17181c', scale: 2, useCORS: true, imageTimeout: 15000,
      onclone: doc => neutralizarAnimacoes(doc, areaId)
    });
    const link = document.createElement('a');
    link.download = nomeArquivo;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }catch(e){
    console.error(e);
    alert('Não foi possível gerar a imagem.');
  }finally{
    btn.textContent = original;
  }
}

/* ---------------------- estatísticas & badges ---------------------- */
function statsDeVals(vals){
  const n = vals.length;
  if(!n) return null;
  const avg = vals.reduce((a,b)=>a+b,0)/n;
  const std = Math.sqrt(vals.reduce((a,b)=>a+(b-avg)*(b-avg),0)/n);
  return {
    n, avg, std,
    min: Math.min(...vals), max: Math.max(...vals),
    p9: vals.filter(v => v >= 9).length / n,          // % de notas 9+
    p10: vals.filter(v => v >= NOTA_MAXIMA - 0.01).length / n, // % de notas máximas
    pos: vals.filter(v => v >= 7).length,             // elogios
    neg: vals.filter(v => v <= 4).length              // críticas
  };
}

const BADGES_DEF = {
  campea:       { emoji:'🥇', nome:'Campeã do ano', desc:'A peça com a maior nota média da edição.' },
  melhorHist:   { emoji:'⭐', nome:'Melhor episódio da história', desc:'A maior nota média entre TODAS as edições do festival.' },
  polemica:     { emoji:'🔥', nome:'Polêmica', desc:'As notas mais divididas do ano — teve gente amando e gente detestando.' },
  consistente:  { emoji:'🎯', nome:'Consistente', desc:'As notas mais parecidas do ano — quase todo mundo deu a mesma nota.' },
  favorita:     { emoji:'👏', nome:'Favorita do público', desc:'A maior porcentagem de notas 9+ da edição.' },
  maisAvaliada: { emoji:'📊', nome:'Mais avaliada', desc:'A peça que mais recebeu notas na edição.' },
  bemRecebida:  { emoji:'📈', nome:'Bem recebida', desc:'Mais elogios (notas 7+) do que críticas (notas 4 ou menos).' }
};

/* calcula as badges de UMA edição a partir dos votos dela.
   Retorna { 's1e1': [badge, ...], ... } */
function badgesDoAno(subs){
  const stats = {};
  const chaves = new Set();
  subs.forEach(s => Object.keys(s.grid).forEach(k => chaves.add(k)));
  chaves.forEach(k => {
    const vals = subs.map(s => Number(s.grid[k])).filter(v => !isNaN(v));
    const st = statsDeVals(vals);
    if(st) stats[k] = st;
  });
  const ks = Object.keys(stats);
  const out = {};
  ks.forEach(k => out[k] = []);
  if(!ks.length) return out;

  const minAv = (typeof HALL !== 'undefined' && HALL.minAvaliacoes) || 3;
  let elig = ks.filter(k => stats[k].n >= minAv);
  if(!elig.length) elig = ks; // pouca gente votou ainda: usa o que tem

  function top(lista, f, maior){
    let best = null;
    lista.forEach(k => {
      if(best === null || (maior ? f(stats[k]) > f(stats[best]) : f(stats[k]) < f(stats[best]))) best = k;
    });
    return best;
  }
  /* REGRA: no máximo 1 badge automática por peça por edição — vale a que
     mais se encaixa, nesta ordem de prioridade. Se a vencedora de um
     critério já tem badge melhor, aquele critério fica sem dono no ano.
     (⭐ da história e as badges manuais do hall-dados.js não contam no limite.) */
  const candidatos = [
    ['campea',       top(elig, s => s.avg, true)],
    ['favorita',     top(elig.filter(k => stats[k].p9 > 0), s => s.p9, true)],
    ['polemica',     top(elig.filter(k => stats[k].std > 0), s => s.std, true)],
    ['consistente',  elig.length > 1 ? top(elig, s => s.std, false) : null],
    ['maisAvaliada', top(ks, s => s.n, true)]
  ];
  candidatos.forEach(([tipo, k]) => {
    if(k && out[k] && out[k].length === 0) out[k].push(BADGES_DEF[tipo]);
  });
  /* consolação: também é ÚNICA — vai só para a peça sem badge com o melhor
     saldo de elogios (7+) vs críticas (4-) */
  const semBadge = elig.filter(k => out[k].length === 0 && stats[k].pos > stats[k].neg);
  if(semBadge.length){
    const bem = top(semBadge, s => s.pos - s.neg, true);
    if(bem) out[bem].push(BADGES_DEF.bemRecebida);
  }
  return out;
}

function htmlBadges(lista){
  return (lista || []).map(b => `<span class="badge" title="${b.nome}${b.desc ? ' — ' + b.desc : ''}">${b.emoji}</span>`).join('');
}

/* ---- badges extras (manuais, definidas no hall-dados.js) ----
   O hall.html carrega o hall-dados.js direto; as páginas de noite buscam
   o arquivo sob demanda para as badges extras aparecerem lá também. */
let HALL_CFG = (typeof HALL !== 'undefined') ? HALL : null;
async function carregarHallDados(){
  if(HALL_CFG) return HALL_CFG;
  try{
    const txt = await fetch(BASE + 'hall-dados.js', { cache: 'no-store' }).then(r => r.text());
    HALL_CFG = new Function(txt + '\n;return HALL;')();
  }catch(e){ HALL_CFG = {}; }
  return HALL_CFG;
}
function badgesExtrasDaPeca(ano, key){
  const lista = (HALL_CFG && HALL_CFG.badgesExtras) || [];
  return lista.filter(b => Number(b.ano) === Number(ano) && b.chave === key);
}

/* =====================================================================
   PÁGINA: EDIÇÃO (votação / notas agregadas)
   ===================================================================== */
function paginaEdicao(){
  document.title = `${ED.titulo} - Avaliações`;

  /* -------- edição ainda não começou: teaser com blur + countdown -------- */
  if(!edicaoComecou()){
    montarShell(`
      <div id="capture-area">
        <div class="left-panel">
          <div class="poster-box question-mark"><span>?</span></div>
          <div class="title-section"><h1>${esc(ED.titulo)}</h1><div class="description">-</div></div>
        </div>
        <div class="grid-blur-wrap">
          <div class="grid-panel">${gridVazioHtml()}</div>
          <div class="grid-blur-overlay">${htmlCountdownBox(inicioEdicao(), true)}</div>
        </div>
      </div>`);
    fetchVotos(); // só para sincronizar o relógio
    return;
  }

  /* -------- edição em andamento ou encerrada -------- */
  /* próxima edição = o menor ano DEPOIS do atual no config.js;
     o abreEm dela só é usado para o countdown (se faltar/for inválido,
     o banner aparece sem contador em vez de pular para outro ano) */
  const proximaCfg = EDICOES
    .filter(e => e.ano > ANO)
    .sort((a,b) => a.ano - b.ano)[0];
  let proxima = null;
  if(proximaCfg){
    const d = proximaCfg.abreEm ? new Date(proximaCfg.abreEm) : null;
    proxima = { ano: proximaCfg.ano, d: (d && !isNaN(d) && d > agora()) ? d : null };
  }

  montarShell(`
    <div class="topbar">
      <div class="topbar-actions">
        <button class="btn btn-solid" id="openReviewModal" disabled title="Verificando horário no servidor...">Avaliar episódios</button>
        <button class="btn btn-ghost" id="downloadBtn">Baixar imagem</button>
      </div>
    </div>

    <div class="countdown-banner" id="countdownBanner" style="display:none;">
      As avaliações irão fechar em <span class="cd" ${FIM_VOTACAO ? `data-count-to="${FIM_VOTACAO.toISOString()}"` : ''}>--:--:--</span>
    </div>

    <div class="end-banner" id="endBanner" style="display:none;">
      <div class="end-banner-msg">${esc(ED.mensagemFim || 'Agradecemos o apoio de todos! 🎉')}</div>
      ${proxima ? (proxima.d
        ? `<div class="end-banner-countdown">Faltam <span class="cd" data-count-to="${proxima.d.toISOString()}">--</span> para o CETEC Festival ${proxima.ano}</div>`
        : `<div class="end-banner-countdown">Nos vemos no CETEC Festival ${proxima.ano}!</div>`) : ''}
    </div>

    <div id="capture-area">
      <div class="left-panel">
        <div class="poster-box has-image" id="posterBox">
          <img src="${esc(ED.poster || 'poster.jpg')}" alt="" onerror="this.closest('.poster-box').classList.remove('has-image')">
          <div class="poster-hint"><b>${esc(ED.poster || 'poster.jpg')}</b>Coloque a imagem de capa na pasta do ano</div>
        </div>
        <div class="title-section">
          <h1>${esc(ED.titulo)}</h1>
          <div class="rating-line">
            <span class="star">★</span>
            <span class="num" id="overallAvg">–</span>
            <span class="cnt" id="overallCount">0 avaliações</span>
          </div>
          <div class="description">${esc(ED.descricao || '')}</div>
        </div>
      </div>
      <div class="grid-panel" id="grid-container"></div>
    </div>

    <div class="section" id="geraisSection">
      <h2>Avaliações Gerais</h2>
      <div class="sub">A nota exibida no topo é a média de todas as avaliações recebidas aqui — igual um agregador de notas. Você pode avaliar só os episódios que quiser, não precisa preencher tudo.</div>
      <div class="gerais-summary">
        <div class="gerais-stat"><div class="big" id="geraisAvg">–</div><div class="lbl">Nota geral</div></div>
        <div class="gerais-stat"><div class="big" id="geraisCount">0</div><div class="lbl">Avaliações recebidas</div></div>
      </div>
      <h3 class="subhead">Nota agregada por episódio</h3>
      <div class="grid-panel" id="gerais-grid-container"></div>
      <h3 class="subhead">Avaliações recebidas</h3>
      <div class="submission-list" id="submissionList">
        <div class="empty-note">Nenhuma avaliação enviada ainda. Clique em "Avaliar episódios" no topo!</div>
      </div>
    </div>`);

  /* modal de votação */
  document.body.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="modalOverlay">
      <div class="modal-card">
        <div class="modal-header"><h2>Avaliar episódios</h2><button class="modal-close" id="modalClose">✕</button></div>
        <div class="modal-sub">Clique nas células e preencha as notas de 0 a ${NOTA_MAXIMA}. Pode avaliar só os episódios que quiser — não precisa preencher todos. <br>🔒</div>
        <div class="name-field">
          <label for="reviewerName">Seu nome <span class="optional-tag">(opcional)</span></label>
          <input type="text" id="reviewerName" placeholder="Ex: Maria" maxlength="40" autocomplete="off">
        </div>
        <div class="grid-panel" id="form-grid-container"></div>
        <div class="form-footer">
          <div class="hint-text" id="fillHint"></div>
          <button class="submit-btn" id="submitReview" disabled>Enviar avaliação</button>
        </div>
        <div class="shared-note">As avaliações enviadas aqui são compartilhadas: todo mundo que abrir este site vê as mesmas notas e a mesma média. Só dá pra enviar uma avaliação a cada ${typeof COOLDOWN_MINUTOS !== 'undefined' ? COOLDOWN_MINUTOS : 5} minutos, pra evitar spam.</div>
      </div>
    </div>`);

  const modalOverlay = document.getElementById('modalOverlay');
  const btnAbrir = document.getElementById('openReviewModal');

  function abrirModal(){
    if(!podeVotar()) return;
    modalOverlay.classList.add('open');
    requestAnimationFrame(() => modalOverlay.classList.add('show'));
    updateFillHint();
    if(cooldownInterval) clearInterval(cooldownInterval);
    cooldownInterval = setInterval(updateFillHint, 1000);
  }
  function fecharModal(){
    fecharOverlay(modalOverlay);
    if(cooldownInterval){ clearInterval(cooldownInterval); cooldownInterval = null; }
  }
  btnAbrir.addEventListener('click', abrirModal);
  document.getElementById('modalClose').addEventListener('click', fecharModal);
  modalOverlay.addEventListener('click', ev => { if(ev.target === modalOverlay) fecharModal(); });

  document.getElementById('downloadBtn').addEventListener('click', ev =>
    baixarImagem('capture-area', `Cetec_Festival_${ANO}_Ratings.png`, ev.currentTarget));

  /* envio */
  const reviewerNameEl = document.getElementById('reviewerName');
  document.getElementById('submitReview').addEventListener('click', async () => {
    if(!podeVotar()) return;
    if(Object.keys(formValues).length < 1) return;
    if(cooldownRestanteMs() > 0) return;

    const btn = document.getElementById('submitReview');
    const originalLabel = btn.textContent;
    btn.disabled = true;
    btn.classList.add('loading');
    btn.innerHTML = '<span class="spinner"></span>Enviando...';
    localStorage.setItem('last-submission-ts', Date.now());

    const submission = {
      id: Date.now() + '-' + Math.random().toString(36).slice(2,7),
      ts: Date.now(),
      name: reviewerNameEl.value.trim().slice(0, 40),
      grid: { ...formValues },
      year: ANO
    };
    submissions.push(submission);
    refreshDisplayGrids();
    renderSubmissions();
    await postVoto(submission);

    btn.classList.remove('loading');
    btn.innerHTML = 'Avaliação enviada! ✓';
    await new Promise(r => setTimeout(r, 900));

    formValues = {};
    reviewerNameEl.value = '';
    buildFormGrid();
    btn.textContent = originalLabel;
    fecharModal();
  });

  /* estado do botão + banners (roda a cada segundo via tick) */
  function atualizarEstado(){
    const cb = document.getElementById('countdownBanner');
    const eb = document.getElementById('endBanner');
    if(votacaoEncerrada()){
      cb.style.display = 'none';
      eb.style.display = 'block';
      btnAbrir.disabled = true;
      btnAbrir.title = 'As avaliações encerraram';
      if(modalOverlay.classList.contains('open')) fecharModal();
    } else {
      cb.style.display = FIM_VOTACAO ? 'block' : 'none';
      eb.style.display = 'none';
      if(!horarioSincronizado()){
        btnAbrir.disabled = true;
        btnAbrir.title = 'Verificando horário no servidor...';
      } else {
        btnAbrir.disabled = false;
        btnAbrir.title = '';
      }
    }
  }
  tickPagina = atualizarEstado;

  /* carga inicial + atualização periódica */
  async function carregar(){
    await fetchVotos();
    DISPLAY_CONTAINERS.forEach(buildDisplayGrid);
    refreshDisplayGrids();
    renderSubmissions();
    if(!modalOverlay.classList.contains('open')) buildFormGrid();
    atualizarEstado();
  }
  carregar();
  setInterval(carregar, 20000);
}

/* =====================================================================
   PÁGINA: SOBRE
   ===================================================================== */
function paginaSobre(){
  document.title = `${ED.titulo} - Sobre`;
  const s = ED.sobre || {};
  if(!s.texto && !edicaoComecou() && inicioEdicao()){
    montarShell(`<div class="noite-intro"><h1>Sobre o Festival</h1></div>${htmlCountdownBox(inicioEdicao(), true)}`);
    fetchVotos();
    return;
  }
  montarShell(`
    <div class="noite-intro">
      <h1>Sobre o Festival</h1>
      <p>Contexto e proposta da edição ${ANO} do CETEC Festival.</p>
    </div>
    <div class="noite-card">
      ${s.banner ? `<img class="sobre-banner" src="${esc(s.banner)}" alt="" onerror="this.style.display='none'">` : ''}
      <div class="noite-card-title" style="margin-bottom:10px; font-size:16px;">${esc(s.titulo || ED.titulo)}</div>
      <div class="noite-card-synopsis" style="margin-bottom:0;">${esc(s.texto || 'Em breve.')}</div>
    </div>`);
}

/* =====================================================================
   PÁGINA: ABERTURA
   ===================================================================== */
function paginaAbertura(){
  document.title = `${ED.titulo} - Abertura`;
  const a = ED.abertura || {};
  if(!a.texto && !edicaoComecou() && inicioEdicao()){
    montarShell(`<div class="noite-intro"><h1>Abertura</h1></div>${htmlCountdownBox(inicioEdicao(), true)}`);
    fetchVotos();
    return;
  }
  montarShell(`
    <div class="noite-intro">
      <h1>Abertura</h1>
      <p>Um pouco sobre a noite de abertura do festival e as músicas apresentadas.</p>
    </div>
    <div class="noite-card">
      <div class="noite-card-title" style="margin-bottom:10px; font-size:16px;">Sobre a abertura</div>
      <div class="noite-card-synopsis" style="margin-bottom:18px;">${esc(a.texto || 'Em breve.')}</div>
      ${a.spotify ? `
      <div class="noite-card-title" style="margin-bottom:14px; font-size:16px;">Trilha sonora</div>
      <iframe style="border-radius:12px; border:none;" src="${esc(a.spotify)}" width="100%" height="352" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>` : ''}
    </div>`);
}

/* =====================================================================
   PÁGINA: NOITE N
   ===================================================================== */
function paginaNoite(n){
  const nd = ND[n] || {};
  document.title = `${ED.titulo} - Noite ${n}`;
  const intro = `<div class="noite-intro">
    <h1>Noite ${n}</h1>
    <p>${esc(nd.subtitulo || `Turmas que se apresentaram na noite ${n} do festival.`)}</p>
  </div>`;

  /* noite ainda trancada: só o countdown (baseado na DATA do noite-N.js) */
  if(!noiteLiberada(n)){
    montarShell(intro + htmlCountdownBox(dataNoite(n), true));
    fetchVotos();
    return;
  }

  montarShell(intro + `<div id="noite-cards" style="width:100%; max-width:900px;"></div>`);

  /* Os cards (com os vídeos) são montados UMA vez só.
     A atualização periódica mexe apenas na caixinha da nota — assim o
     iframe do YouTube nunca é recriado e o vídeo não recarrega. */
  const pecas = nd.pecas || [];

  function renderCards(){
    const container = document.getElementById('noite-cards');
    let html = '';
    pecas.forEach((info, idx) => {
      const key = `s${n}e${idx + 1}`;
      html += `<div class="noite-card">
        <div class="noite-card-head">
          <div>
            <div class="noite-card-title">${esc(info.titulo)} <span class="peca-badges" id="badges-${key}"></span></div>
            <div class="noite-card-turma">Turma ${esc(info.turma)}</div>
          </div>
          <div class="noite-card-rating" id="nota-${key}"><div class="val empty">–</div><div class="cnt">Sem avaliações</div></div>
        </div>
        <div class="noite-card-synopsis">${esc(info.sinopse)}</div>
        ${info.youtube
          ? `<iframe class="video-embed-placeholder" src="https://www.youtube.com/embed/${esc(info.youtube)}${info.youtubeInicio ? `?start=${Number(info.youtubeInicio)}` : ''}" title="${esc(info.titulo)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`
          : `<div class="video-embed-placeholder"><div class="play-icon">▶</div><div>Vídeo da apresentação em breve</div></div>`}
      </div>`;
    });
    container.innerHTML = html || '<div class="empty-note">Nenhuma apresentação cadastrada para esta noite (adicione em noites/noite-' + n + '.js).</div>';
  }

  function atualizarNotas(){
    const bmap = badgesDoAno(submissions); // badges relativas à edição inteira
    pecas.forEach((info, idx) => {
      const key = `s${n}e${idx + 1}`;
      const box = document.getElementById(`nota-${key}`);
      if(!box) return;
      const vals = valoresDaChave(key);
      const avg = media(vals);
      box.innerHTML = avg === null
        ? `<div class="val empty">–</div><div class="cnt">Sem avaliações</div>`
        : `<div class="val" style="background-color:${corDaNota(avg)}">${avg.toFixed(1)}</div><div class="cnt">${vals.length} avaliaç${vals.length === 1 ? 'ão' : 'ões'}</div>`;
      const bx = document.getElementById(`badges-${key}`);
      if(bx) bx.innerHTML = htmlBadges(bmap[key]) +
        (key === chaveMelhorHistoria ? `<span class="badge" title="${BADGES_DEF.melhorHist.nome}">${BADGES_DEF.melhorHist.emoji}</span>` : '') +
        htmlBadges(badgesExtrasDaPeca(ANO, key));
    });
  }

  renderCards();

  /* badge ⭐: confere se o melhor episódio da HISTÓRIA (todas as edições,
     mínimo de 3 avaliações) é uma peça desta noite */
  let chaveMelhorHistoria = null;
  async function checarMelhorHistoria(){
    try{
      const outros = await Promise.all(EDICOES.filter(e => e.ano !== ANO).map(async e => {
        const r = await fetch(API_URL + '?year=' + e.ano + '&_=' + Date.now(), { cache: 'no-store' });
        const j = await r.json();
        return { ano: e.ano, subs: filtrarVotosDoAno(Array.isArray(j) ? j : (j.submissions || []), e.ano) };
      }));
      const todos = [{ ano: ANO, subs: submissions }, ...outros];
      let best = null;
      todos.forEach(t => {
        const chaves = new Set();
        t.subs.forEach(s => Object.keys(s.grid).forEach(k => chaves.add(k)));
        chaves.forEach(k => {
          const vals = t.subs.map(s => Number(s.grid[k])).filter(v => !isNaN(v));
          const st = statsDeVals(vals);
          if(st && st.n >= 3 && (best === null || st.avg > best.avg)) best = { ano: t.ano, key: k, avg: st.avg };
        });
      });
      if(best && best.ano === ANO && best.key.indexOf(`s${n}e`) === 0) chaveMelhorHistoria = best.key;
    }catch(e){ /* API fora do ar: apenas não mostra a estrela */ }
  }

  fetchVotos().then(() => {
    atualizarNotas();
    checarMelhorHistoria().then(atualizarNotas);
    carregarHallDados().then(atualizarNotas); // badges extras do hall-dados.js
  });
  setInterval(() => fetchVotos().then(atualizarNotas), 20000);
}

/* =====================================================================
   PÁGINA: MONTE O SEU (pessoal, salvo só no navegador da pessoa)
   ===================================================================== */
function paginaMonte(){
  document.title = `Meu ${ED.titulo}`;

  const monteAbre = (CFG_EDICAO && CFG_EDICAO.monteAbreEm) ? new Date(CFG_EDICAO.monteAbreEm) : null;
  if(monteAbre && agora() < monteAbre){
    montarShell(`
      <div id="custom-capture-area">
        <div class="left-panel">
          <div class="poster-box question-mark"><span>?</span></div>
          <div class="title-section"><h1>Meu ${esc(ED.titulo)}</h1><div class="description">-</div></div>
        </div>
        <div class="grid-blur-wrap">
          <div class="grid-panel">${gridVazioHtml()}</div>
          <div class="grid-blur-overlay">${htmlCountdownBox(monteAbre, true)}</div>
        </div>
      </div>`);
    fetchVotos();
    return;
  }

  /* chaves por ano no localStorage (com migração dos dados antigos de 2026) */
  const K = sufixo => `custom-${sufixo}-${ANO}`;
  function lerLegado(sufixo){
    let v = localStorage.getItem(K(sufixo));
    if(v === null && ANO === 2026) v = localStorage.getItem(`custom-${sufixo}`); // versão antiga do site
    return v;
  }

  let customValues = {};
  try{ const cg = lerLegado('grid'); if(cg) customValues = JSON.parse(cg); }catch(e){ customValues = {}; }

  montarShell(`
    <div class="custom-toolbar">
      <p>Monte a sua própria versão da tabela, do jeitinho que você quiser. Isso fica só com você — não entra na página oficial nem nas Avaliações Gerais.</p>
      <div class="topbar-actions">
        <button class="btn btn-ghost" id="clearCustomBtn">Limpar</button>
        <button class="btn btn-solid" id="downloadCustomBtn">Baixar imagem</button>
      </div>
    </div>
    <div id="custom-capture-area">
      <div class="left-panel">
        <label class="poster-box" id="posterBoxCustom">
          <img id="posterImgCustom" alt="">
          <div class="poster-hint"><b>sua-capa.jpg</b>Clique para escolher a imagem de capa</div>
          <input type="file" accept="image/*" class="poster-input" id="posterInputCustom">
        </label>
        <div class="title-section">
          <h1 id="customTitle" contenteditable="true" spellcheck="false">Meu ${esc(ED.titulo)}</h1>
          <div class="description" id="customDescription" contenteditable="true" spellcheck="false">${esc(ED.descricao || 'Clique aqui para escrever sua própria descrição...')}</div>
        </div>
      </div>
      <div class="grid-panel" id="custom-grid-container"></div>
    </div>`);

  const posterBox = document.getElementById('posterBoxCustom');
  const posterImg = document.getElementById('posterImgCustom');
  const posterInput = document.getElementById('posterInputCustom');
  const titleEl = document.getElementById('customTitle');
  const descEl = document.getElementById('customDescription');

  /* poster padrão do ano, se existir na pasta */
  const posterPadrao = ED.poster || 'poster.jpg';
  const salvo = lerLegado('poster');
  posterImg.addEventListener('load', () => posterBox.classList.add('has-image'));
  posterImg.src = salvo || posterPadrao;

  /* o clique no label já abre o seletor de arquivo nativamente (sem JS) */
  posterInput.addEventListener('change', () => {
    const file = posterInput.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      posterImg.src = reader.result;
      try{ localStorage.setItem(K('poster'), reader.result); }
      catch(e){ console.warn('Imagem grande demais para salvar localmente', e); }
    };
    reader.readAsDataURL(file);
  });

  const ct = lerLegado('title');
  if(ct) titleEl.textContent = ct;
  titleEl.addEventListener('blur', () => {
    const text = titleEl.textContent.trim() || `Meu ${ED.titulo}`;
    titleEl.textContent = text;
    localStorage.setItem(K('title'), text);
  });

  const cd = lerLegado('description');
  if(cd) descEl.textContent = cd;
  descEl.addEventListener('focus', () => {
    if(descEl.classList.contains('placeholder')){ descEl.textContent = ''; descEl.classList.remove('placeholder'); }
  });
  descEl.addEventListener('blur', () => {
    const text = descEl.textContent.trim();
    if(text === ''){
      descEl.textContent = 'Clique aqui para escrever sua própria descrição...';
      descEl.classList.add('placeholder');
      localStorage.setItem(K('description'), '');
    } else {
      localStorage.setItem(K('description'), text);
    }
  });

  function salvarGrid(){
    try{ localStorage.setItem(K('grid'), JSON.stringify(customValues)); }
    catch(e){ console.error('Falha ao salvar sua tabela', e); }
  }

  function buildCustomGrid(){
    const c = document.getElementById('custom-grid-container');
    let h = `<div class="grid-row"><div class="cell label"></div>`;
    for(let s = 1; s <= NUM_NOITES; s++) h += `<div class="cell header">S${s}</div>`;
    h += `</div>`;
    h += `<div class="grid-row"><div class="cell label" style="font-size:10px;">MÉDIA</div>`;
    for(let s = 1; s <= NUM_NOITES; s++) h += `<div class="cell cell-avg" id="custom-avg-s${s}">–</div>`;
    h += `</div>`;
    for(let e = 1; e <= MAX_EPS; e++){
      h += `<div class="grid-row"><div class="cell label">E${e}</div>`;
      for(let s = 1; s <= NUM_NOITES; s++){
        if(e > epsDaNoite(s)){ h += `<div class="cell cell-void"></div>`; continue; }
        const key = `s${s}e${e}`;
        const existing = customValues[key];
        h += `<div class="cell cell-input" id="ccell-${key}" style="${existing !== undefined ? `background-color:${corDaNota(existing)}` : ''}">
          <input type="number" min="0" max="${NOTA_MAXIMA}" step="0.1" placeholder="–" data-key="${key}" value="${existing !== undefined ? existing : ''}">
        </div>`;
      }
      h += `</div>`;
    }
    c.innerHTML = h;
    c.querySelectorAll('.cell-input input').forEach(inp => inp.addEventListener('input', () => onCustomInput(inp)));
    atualizarMedias();
  }

  function onCustomInput(inp){
    const key = inp.dataset.key;
    const cellDiv = document.getElementById(`ccell-${key}`);
    if(inp.value === ''){
      delete customValues[key];
      cellDiv.style.backgroundColor = 'var(--surface-2)';
      atualizarMedias();
      salvarGrid();
      return;
    }
    let val = parseFloat(inp.value);
    if(isNaN(val)) return;
    if(val > NOTA_MAXIMA){ val = NOTA_MAXIMA; inp.value = NOTA_MAXIMA; }
    if(val < 0){ val = 0; inp.value = 0; }
    customValues[key] = val;
    cellDiv.style.backgroundColor = corDaNota(val);
    atualizarMedias();
    salvarGrid();
  }

  function atualizarMedias(){
    for(let s = 1; s <= NUM_NOITES; s++){
      const vals = [];
      for(let e = 1; e <= epsDaNoite(s); e++){
        const v = customValues[`s${s}e${e}`];
        if(v !== undefined) vals.push(v);
      }
      const el = document.getElementById(`custom-avg-s${s}`);
      const avg = media(vals);
      if(avg === null){
        el.textContent = '–';
        el.style.backgroundColor = 'var(--surface-2)';
        el.style.borderColor = 'var(--border)';
      } else {
        el.textContent = avg.toFixed(1);
        const c = corDaNota(avg);
        el.style.backgroundColor = c;
        el.style.borderColor = c;
      }
    }
  }

  document.getElementById('clearCustomBtn').addEventListener('click', () => {
    /* notas */
    customValues = {};
    buildCustomGrid();
    /* título e descrição de volta ao padrão */
    titleEl.textContent = `Meu ${ED.titulo}`;
    descEl.textContent = ED.descricao || 'Clique aqui para escrever sua própria descrição...';
    descEl.classList.remove('placeholder');
    /* poster de volta ao padrão do ano */
    posterBox.classList.remove('has-image');
    posterInput.value = '';
    posterImg.removeAttribute('src');
    posterImg.src = posterPadrao;
    /* apaga tudo que estava salvo no navegador */
    ['grid', 'title', 'description', 'poster'].forEach(s => localStorage.removeItem(K(s)));
    if(ANO === 2026){
      ['custom-grid', 'custom-title', 'custom-description', 'custom-poster'].forEach(k => localStorage.removeItem(k));
    }
  });
  document.getElementById('downloadCustomBtn').addEventListener('click', ev =>
    baixarImagem('custom-capture-area', `Meu_Cetec_Festival_${ANO}.png`, ev.currentTarget));

  buildCustomGrid();
}

/* =====================================================================
   PÁGINA: HALL DA FAMA (estatísticas de todas as edições, Chart.js)
   ===================================================================== */
async function paginaHall(){
  document.title = 'CETECCritic - Hall da Fama';
  montarShell(`
    <div class="noite-intro">
      <h1>Hall da Fama</h1>
      <p>Recordes, rankings e estatísticas de todas as edições — atualizados automaticamente. <span class="hall-stamp" id="hallAtualizado"></span></p>
    </div>

    <div class="hall-cards" id="hallCards"><div class="empty-note">Carregando estatísticas...</div></div>

    <div class="section">
      <h2>🏅 As Badges</h2>
      <div class="sub">Medalhas que as peças conquistam automaticamente (mínimo de ${(typeof HALL !== 'undefined' && HALL.minAvaliacoes) || 3} avaliações; cada peça leva no máximo 1 badge automática por edição — a que mais se encaixa). Elas aparecem ao lado do título da peça, na página da noite dela.</div>
      <div class="badge-legend">${[
        ...Object.values(BADGES_DEF),
        ...(((typeof HALL !== 'undefined' && HALL.badgesExtras) || []).filter((b, i, arr) => arr.findIndex(x => x.nome === b.nome) === i))
      ].map(b => `
        <div class="badge-item">
          <span class="badge-big">${b.emoji}</span>
          <div><div class="rec-title">${b.nome}</div><div class="rec-text">${b.desc || ''}</div></div>
        </div>`).join('')}
      </div>
    </div>

    <div class="section">
      <h2>🏆 Top 10 Peças</h2>
      <div class="sub">Clique em uma barra para abrir a página da noite da peça.</div>
      <select class="hall-select" id="hallFiltroPecas"></select>
      <div style="height:360px"><canvas id="chartTopPecas"></canvas></div>
    </div>

    <div class="section">
      <h2>🌙 Top 10 Noites</h2>
      <div class="sub">Melhor nota média por noite. Clique para abrir a noite.</div>
      <select class="hall-select" id="hallFiltroNoites"></select>
      <div style="height:360px"><canvas id="chartTopNoites"></canvas></div>
    </div>

    <div class="section">
      <h2>🏅 Top Festivais</h2>
      <div class="sub">Ranking das edições pela nota média geral. Clique para abrir a edição.</div>
      <div style="height:240px"><canvas id="chartTopFestivais"></canvas></div>
    </div>

    <div class="section">
      <h2>⚖️ ${EDICAO_EM_DESTAQUE} vs. história</h2>
      <div class="sub">Nota média por noite: a edição em destaque comparada com quem você escolher.</div>
      <div class="hall-filtros">Comparar com <select class="hall-select" id="hallCompara"><option value="hist">Média histórica</option></select></div>
      <div style="height:240px"><canvas id="chartComparacao"></canvas></div>
    </div>

    <div class="section">
      <h2>🆚 Comparar edições</h2>
      <div class="sub">Escolha duas edições para ver as notas gerais e o detalhe noite a noite, episódio por episódio. Clique numa peça para abrir a página dela.</div>
      <div class="hall-filtros">
        <select class="hall-select" id="hallCompA"></select> vs
        <select class="hall-select" id="hallCompB"></select>
      </div>
      <div class="hall-cards" id="compCards"></div>
      <div style="height:240px; margin-bottom:16px"><canvas id="chartCompNoites"></canvas></div>
      <div id="compDetalhe"></div>
    </div>

    <div class="section">
      <h2>📈 Evolução do festival</h2>
      <div class="sub">Nota média por edição e "exigência do público" (% de notas 9+). Clique num ponto para abrir a edição.</div>
      <div class="hall-filtros">De <select class="hall-select" id="hallDe"></select> até <select class="hall-select" id="hallAte"></select></div>
      <div style="height:240px"><canvas id="chartEvolucao"></canvas></div>
      <div style="height:200px; margin-top:18px"><canvas id="chartP9"></canvas></div>
    </div>

    <div class="section">
      <h2>🍩 Distribuição das notas</h2>
      <div class="sub">Todas as notas já registradas no site, agrupadas de 0 a ${NOTA_MAXIMA}.</div>
      <div style="height:300px"><canvas id="chartDist"></canvas></div>
    </div>

    <div class="section">
      <h2>🗓️ Notas por noite ao longo dos anos</h2>
      <div class="sub">Cada célula é a média da noite naquele ano. Clique para abrir.</div>
      <div class="heatmap" id="hallHeatmap"></div>
    </div>

    <div class="section"><h2>🏆 Prateleira dos Campeões</h2><div class="sub">Recordes das peças.</div><div class="record-list" id="recPecas"></div></div>
    <div class="section"><h2>🌙 A Batalha das Noites</h2><div class="sub">Recordes de programação.</div><div class="record-list" id="recNoites"></div></div>
    <div class="section"><h2>📅 Linha do Tempo &amp; Edições</h2><div class="sub">Comparativo entre os anos.</div><div class="record-list" id="recEdicoes"></div></div>
    <div class="section"><h2>👥 Números da Comunidade</h2><div class="sub">A escala da plateia do CETECCritic.</div><div class="record-list" id="recComunidade"></div></div>
    <div class="section" id="secCurio" style="display:none"><h2>🎭 Curiosidades</h2><div class="record-list" id="recCurio"></div></div>`);

  if(typeof Chart !== 'undefined'){
    Chart.defaults.color = '#9a9ea6';
    Chart.defaults.borderColor = '#2c2e33';
    Chart.defaults.font.family = "'Inter', sans-serif";
  }

  /* carrega os dados (edicao.js + noites/*.js) de TODAS as edições do config.js */
  async function carregarEdicoes(){
    const out = [];
    for(const cfg of EDICOES){
      try{
        const textos = await Promise.all([
          fetch(`${BASE}${cfg.ano}/edicao.js`).then(r => r.text()),
          ...Array.from({ length: cfg.noites }, (_, i) =>
            fetch(`${BASE}${cfg.ano}/noites/noite-${i+1}.js`).then(r => r.text()))
        ]);
        const d = new Function(textos.join('\n') + '\n;return { EDICAO, NOITES };')();
        out.push({ cfg, ed: d.EDICAO, noites: d.NOITES });
      }catch(e){ console.warn('Hall: falha ao carregar edição', cfg.ano, e); }
    }
    return out;
  }

  const edicoes = await carregarEdicoes();
  /* edições futuras (inicio ainda não chegou) ficam fora das contagens,
     dos gráficos e do heatmap — nada de spoiler nem de "3 edições" antes da hora */
  const edRealizadas = edicoes.filter(d => {
    const ini = d.ed && d.ed.inicio ? new Date(d.ed.inicio) : null;
    return !ini || isNaN(ini) || ini <= new Date();
  });
  const minAv = (typeof HALL !== 'undefined' && HALL.minAvaliacoes) || 3;
  const CORES_DIST = ['#7a1f1f','#8c2525','#9e2b2b','#b03131','#c23737','#d93c3c','#e48135','#f3ca4d','#31b96e','#188a53','#0f6b3f'];

  /* gráficos são recriados a cada atualização — o registro evita vazamento */
  const registro = {};
  function desenhar(id, config){
    const el = document.getElementById(id);
    if(!el || typeof Chart === 'undefined') return;
    if(registro[id]) registro[id].destroy();
    registro[id] = new Chart(el.getContext('2d'), config);
  }
  const barraClicavel = (itens, urlDe) => ({
    onClick: (e, els) => { if(els.length) location.href = urlDe(itens[els[0].index]); },
    onHover: (e, els) => { e.native.target.style.cursor = els.length ? 'pointer' : 'default'; }
  });

  let stats = null;
  let filtroPecas = 'all';
  let filtroNoites = 'all';
  let comparaCom = 'hist';

  /* filtros de período (o "último ano" = edição mais recente com votos) */
  const PERIODOS = [
    { v: 'all', txt: 'Todos os tempos' },
    { v: '1',   txt: 'Último ano' },
    { v: '3',   txt: 'Últimos 3 anos' },
    { v: '5',   txt: 'Últimos 5 anos' },
    { v: '10',  txt: 'Últimos 10 anos' },
    { v: '20',  txt: 'Últimos 20 anos' }
  ];
  const selPecas = document.getElementById('hallFiltroPecas');
  const selNoites = document.getElementById('hallFiltroNoites');
  [selPecas, selNoites].forEach(sel => sel.innerHTML = PERIODOS.map(p => `<option value="${p.v}">${p.txt}</option>`).join(''));
  selPecas.addEventListener('change', () => { filtroPecas = selPecas.value; desenharTopPecas(); });
  selNoites.addEventListener('change', () => { filtroNoites = selNoites.value; desenharTopNoites(); });
  document.getElementById('hallCompara').addEventListener('change', ev => { comparaCom = ev.target.value; desenharComparacao(); });
  let compA = null, compB = null;
  document.getElementById('hallCompA').addEventListener('change', ev => { compA = Number(ev.target.value); desenharCompEdicoes(); });
  document.getElementById('hallCompB').addEventListener('change', ev => { compB = Number(ev.target.value); desenharCompEdicoes(); });
  document.getElementById('hallDe').addEventListener('change', desenharEvolucao);
  document.getElementById('hallAte').addEventListener('change', desenharEvolucao);

  function anoReferencia(){
    return stats && stats.anos.length ? Math.max(...stats.anos.map(a => a.ano)) : Math.max(...EDICOES.map(e => e.ano));
  }
  function dentroDoPeriodo(ano, filtro){
    if(filtro === 'all') return true;
    return ano >= anoReferencia() - (Number(filtro) - 1);
  }

  const rItem = r => {
    const inner = `<span class="rec-emoji">${r.emoji}</span><div><div class="rec-title">${esc(r.titulo)}</div><div class="rec-text">${esc(r.texto)}</div></div>`;
    return r.url ? `<a class="record-item" href="${r.url}">${inner}</a>` : `<div class="record-item">${inner}</div>`;
  };
  const preencher = (id, recs) => {
    const el = document.getElementById(id);
    if(el) el.innerHTML = recs.length ? recs.map(rItem).join('') : '<div class="empty-note">Ainda não há avaliações suficientes.</div>';
  };
  const topDe = (lista, f, maior = true) => lista.length ? [...lista].sort((a,b) => maior ? f(b)-f(a) : f(a)-f(b))[0] : null;
  const fmtP = p => `${p.titulo} — ${p.ano}, Noite ${p.noite} (nota ${p.st.avg.toFixed(1)}, ${p.st.n} avaliaç${p.st.n === 1 ? 'ão' : 'ões'})`;

  /* ---------- cálculo de todas as estatísticas ---------- */
  function calcular(votos){
    const pecas = [], noites = [], anos = [], todasNotas = [], todosSubs = [];
    let totalVotos = 0, totalPecas = 0;

    edRealizadas.forEach(d => {
      const subs = votos[d.cfg.ano] || [];
      totalVotos += subs.length;
      subs.forEach(su => {
        todosSubs.push(su);
        Object.values(su.grid).forEach(v => { const x = Number(v); if(!isNaN(x)) todasNotas.push(x); });
      });

      let somaAno = 0, nAno = 0;
      const noitesDoAno = [], pecasDoAno = [];
      for(let n = 1; n <= d.cfg.noites; n++){
        const nd = d.noites[n];
        if(!nd || !(nd.pecas || []).length) continue;
        let somaNoite = 0, nNoite = 0;
        const pecasDaNoite = [];
        nd.pecas.forEach((p, i) => {
          totalPecas++;
          const key = `s${n}e${i+1}`;
          const vals = subs.map(su => Number(su.grid[key])).filter(v => !isNaN(v));
          const st = statsDeVals(vals);
          const item = { ano: d.cfg.ano, noite: n, ep: i+1, titulo: p.titulo, turma: p.turma, st, url: `${BASE}${d.cfg.ano}/noite-${n}.html` };
          pecas.push(item);
          if(st){ somaNoite += st.avg * st.n; nNoite += st.n; pecasDaNoite.push(item); pecasDoAno.push(item); }
        });
        if(nNoite){
          const nn = { ano: d.cfg.ano, noite: n, avg: somaNoite/nNoite, n: nNoite, pecas: pecasDaNoite, url: `${BASE}${d.cfg.ano}/noite-${n}.html` };
          noites.push(nn); noitesDoAno.push(nn);
          somaAno += somaNoite; nAno += nNoite;
        }
      }
      if(nAno){
        const valsAno = [];
        subs.forEach(su => Object.values(su.grid).forEach(v => { const x = Number(v); if(!isNaN(x)) valsAno.push(x); }));
        const avgs = pecasDoAno.map(p => p.st.avg);
        const ordN = [...noitesDoAno].sort((a,b) => a.noite - b.noite);
        anos.push({
          ano: d.cfg.ano,
          avg: somaAno/nAno,
          nVals: nAno,
          subs: subs.length,
          polar: avgs.length > 1 ? Math.max(...avgs) - Math.min(...avgs) : null,
          p9: valsAno.length ? valsAno.filter(v => v >= 9).length / valsAno.length : 0,
          cresc: ordN.length > 1 ? { d: ordN[ordN.length-1].avg - ordN[0].avg, de: ordN[0], para: ordN[ordN.length-1] } : null,
          avalPorPeca: pecasDoAno.length ? nAno / pecasDoAno.length : null
        });
      }
    });
    return { pecas, noites, anos, todasNotas, totalVotos, totalPecas, todosSubs };
  }

  /* ---------- gráficos que dependem de filtros ---------- */
  function desenharTopPecas(){
    if(!stats) return;
    const lista = stats.pecas.filter(p => p.st && dentroDoPeriodo(p.ano, filtroPecas));
    let elig = lista.filter(p => p.st.n >= minAv);
    if(!elig.length) elig = lista;
    const top = [...elig].sort((a,b) => b.st.avg - a.st.avg || b.st.n - a.st.n).slice(0, 10);
    desenhar('chartTopPecas', {
      type: 'bar',
      data: {
        labels: top.map(p => `${p.titulo} (${p.ano})`),
        datasets: [{ data: top.map(p => Number(p.st.avg.toFixed(2))), backgroundColor: top.map(p => corDaNota(p.st.avg)) }]
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        ...barraClicavel(top, p => p.url),
        plugins: { legend: { display: false } },
        scales: { x: { min: 0, max: NOTA_MAXIMA } }
      }
    });
  }

  function desenharTopNoites(){
    if(!stats) return;
    const lista = stats.noites.filter(x => dentroDoPeriodo(x.ano, filtroNoites));
    const top = [...lista].sort((a,b) => b.avg - a.avg).slice(0, 10);
    desenhar('chartTopNoites', {
      type: 'bar',
      data: { labels: top.map(x => `Noite ${x.noite} · ${x.ano}`), datasets: [{ data: top.map(x => Number(x.avg.toFixed(2))), backgroundColor: top.map(x => corDaNota(x.avg)) }] },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        ...barraClicavel(top, x => x.url),
        plugins: { legend: { display: false } },
        scales: { x: { min: 0, max: NOTA_MAXIMA } }
      }
    });
  }

  function desenharComparacao(){
    if(!stats) return;
    const maxN = Math.max(...EDICOES.map(e => e.noites));
    const labelsN = [], destPorNoite = [], outroPorNoite = [];
    for(let nn = 1; nn <= maxN; nn++){
      labelsN.push('Noite ' + nn);
      const dst = stats.noites.find(x => x.noite === nn && x.ano === EDICAO_EM_DESTAQUE);
      destPorNoite.push(dst ? Number(dst.avg.toFixed(2)) : null);
      if(comparaCom === 'hist'){
        const todas = stats.noites.filter(x => x.noite === nn);
        if(todas.length){
          let sm = 0, cnt = 0;
          todas.forEach(x => { sm += x.avg * x.n; cnt += x.n; });
          outroPorNoite.push(Number((sm/cnt).toFixed(2)));
        } else outroPorNoite.push(null);
      } else {
        const outro = stats.noites.find(x => x.noite === nn && x.ano === Number(comparaCom));
        outroPorNoite.push(outro ? Number(outro.avg.toFixed(2)) : null);
      }
    }
    desenhar('chartComparacao', {
      type: 'bar',
      data: { labels: labelsN, datasets: [
        { label: String(EDICAO_EM_DESTAQUE), data: destPorNoite, backgroundColor: '#f5c518' },
        { label: comparaCom === 'hist' ? 'Média histórica' : 'Edição ' + comparaCom, data: outroPorNoite, backgroundColor: '#5a5e66' }
      ]},
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: NOTA_MAXIMA } } }
    });
  }

  function desenharCompEdicoes(){
    if(!stats || compA === null || compB === null) return;
    const cfgA = EDICOES.find(e => e.ano === compA) || { noites: 5 };
    const cfgB = EDICOES.find(e => e.ano === compB) || { noites: 5 };
    const anoA = stats.anos.find(a => a.ano === compA);
    const anoB = stats.anos.find(a => a.ano === compB);

    /* cards-resumo: nota geral de cada edição + diferença */
    const cardAno = (ano, info, cor) => `
      <div class="hall-card">
        <div class="big" style="color:${cor}">${info ? info.avg.toFixed(1) : '–'}</div>
        <div class="lbl">${ano}</div>
        <div class="subtxt">${info ? `${info.subs} avaliações · ${info.nVals} notas` : 'sem avaliações'}</div>
      </div>`;
    let diffHtml = '';
    if(anoA && anoB){
      const d = anoA.avg - anoB.avg;
      diffHtml = `<div class="hall-card"><div class="big">${d > 0 ? '+' : ''}${d.toFixed(1)}</div><div class="lbl">Diferença</div><div class="subtxt">${Math.abs(d) < 0.05 ? 'empate técnico' : (d > 0 ? compA : compB) + ' na frente'}</div></div>`;
    }
    document.getElementById('compCards').innerHTML = cardAno(compA, anoA, '#f5c518') + cardAno(compB, anoB, '#8ab4f8') + diffHtml;

    /* barras agrupadas: média por noite das duas edições */
    const maxN = Math.max(cfgA.noites || 5, cfgB.noites || 5);
    const labels = [], dA = [], dB = [];
    for(let n = 1; n <= maxN; n++){
      labels.push('Noite ' + n);
      const xA = stats.noites.find(x => x.ano === compA && x.noite === n);
      const xB = stats.noites.find(x => x.ano === compB && x.noite === n);
      dA.push(xA ? Number(xA.avg.toFixed(2)) : null);
      dB.push(xB ? Number(xB.avg.toFixed(2)) : null);
    }
    desenhar('chartCompNoites', {
      type: 'bar',
      data: { labels, datasets: [
        { label: String(compA), data: dA, backgroundColor: '#f5c518' },
        { label: String(compB), data: dB, backgroundColor: '#8ab4f8' }
      ]},
      options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: NOTA_MAXIMA } } }
    });

    /* detalhe: episódio por episódio, lado a lado */
    const chip = p => {
      if(!p) return '<div class="comp-side empty">—</div>';
      const nota = p.st ? p.st.avg.toFixed(1) : '–';
      const cor = p.st ? corDaNota(p.st.avg) : 'var(--gray-cell)';
      const corTxt = p.st ? '#14161a' : 'var(--text-muted)';
      return `<a class="comp-side" href="${p.url}">
        <span class="comp-nota" style="background:${cor}; color:${corTxt}">${nota}</span>
        <span class="comp-titulo">${esc(p.titulo)}</span>
      </a>`;
    };
    let html = '';
    for(let n = 1; n <= maxN; n++){
      const pecasA = stats.pecas.filter(p => p.ano === compA && p.noite === n);
      const pecasB = stats.pecas.filter(p => p.ano === compB && p.noite === n);
      if(!pecasA.length && !pecasB.length) continue;
      const xA = stats.noites.find(x => x.ano === compA && x.noite === n);
      const xB = stats.noites.find(x => x.ano === compB && x.noite === n);
      html += `<h3 class="subhead">Noite ${n} — ${compA}: ${xA ? xA.avg.toFixed(1) : '–'} · ${compB}: ${xB ? xB.avg.toFixed(1) : '–'}</h3>`;
      const maxEp = Math.max(pecasA.length, pecasB.length);
      for(let e = 1; e <= maxEp; e++){
        const pA = pecasA.find(p => p.ep === e);
        const pB = pecasB.find(p => p.ep === e);
        html += `<div class="comp-row">${chip(pA)}<div class="comp-ep">E${e}</div>${chip(pB)}</div>`;
      }
    }
    document.getElementById('compDetalhe').innerHTML = html || '<div class="empty-note">Nenhuma peça cadastrada nas edições escolhidas.</div>';
  }

  function desenharEvolucao(){
    if(!stats) return;
    const de = Number(document.getElementById('hallDe').value) || 0;
    const ate = Number(document.getElementById('hallAte').value) || 9999;
    const lista = stats.anos.filter(a => a.ano >= de && a.ano <= ate).sort((a,b) => a.ano - b.ano);
    desenhar('chartEvolucao', {
      type: 'line',
      data: { labels: lista.map(a => a.ano), datasets: [{ label: 'Nota média', data: lista.map(a => Number(a.avg.toFixed(2))), borderColor: '#f5c518', backgroundColor: 'rgba(245,197,24,.15)', fill: true, tension: .3, pointRadius: 5, pointBackgroundColor: '#f5c518' }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        ...barraClicavel(lista, a => `${BASE}${a.ano}/index.html`),
        plugins: { legend: { display: false } },
        scales: { y: { min: 0, max: NOTA_MAXIMA } }
      }
    });
    desenhar('chartP9', {
      type: 'line',
      data: { labels: lista.map(a => a.ano), datasets: [{ label: '% de notas 9+', data: lista.map(a => Math.round(a.p9 * 1000) / 10), borderColor: '#31b96e', backgroundColor: 'rgba(49,185,110,.15)', fill: true, tension: .3, pointRadius: 4, pointBackgroundColor: '#31b96e' }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true } }, scales: { y: { min: 0, max: 100, ticks: { callback: v => v + '%' } } } }
    });
  }

  /* ---------- render completo ---------- */
  function renderTudo(){
    const s = stats;
    const comVotos = s.pecas.filter(p => p.st);
    let elig = comVotos.filter(p => p.st.n >= minAv);
    if(!elig.length) elig = comVotos;

    const total10s = s.todasNotas.filter(v => v >= NOTA_MAXIMA - 0.01).length;
    const mediaHist = s.todasNotas.length ? s.todasNotas.reduce((a,b)=>a+b,0)/s.todasNotas.length : null;
    const anoDest = s.anos.find(a => a.ano === EDICAO_EM_DESTAQUE);
    const melhorAno = topDe(s.anos, a => a.avg);
    const maisPart = topDe(s.anos, a => a.subs);
    const maisPolar = topDe(s.anos.filter(a => a.polar !== null), a => a.polar);

    /* ---- Seção 1: cards ---- */
    const cards = [
      { big: HALL.edicoesRealizadas || String(edRealizadas.length), lbl: 'Edições' },
      { big: String(s.totalPecas), lbl: 'Peças apresentadas' },
      { big: String(s.totalVotos), lbl: 'Avaliações recebidas' },
      { big: mediaHist === null ? '–' : mediaHist.toFixed(1), lbl: 'Média histórica', sub: anoDest ? `vs ${anoDest.avg.toFixed(1)} em ${anoDest.ano}` : '' },
      { big: String(total10s), lbl: `Notas ${NOTA_MAXIMA} dadas` }
    ];
    if(melhorAno) cards.push({ big: String(melhorAno.ano), lbl: 'Melhor edição', sub: `média ${melhorAno.avg.toFixed(1)}`, url: `${BASE}${melhorAno.ano}/index.html` });
    if(maisPart && maisPart.subs) cards.push({ big: String(maisPart.ano), lbl: 'Maior participação', sub: `${maisPart.subs} avaliações` });
    if(maisPolar) cards.push({ big: String(maisPolar.ano), lbl: 'Mais polarizada', sub: `${maisPolar.polar.toFixed(1)} pts entre extremos` });
    if(HALL.publicoEstimado) cards.push({ big: HALL.publicoEstimado, lbl: 'Público estimado' });
    document.getElementById('hallCards').innerHTML = cards.map(c => {
      const inner = `<div class="big">${c.big}</div><div class="lbl">${c.lbl}</div>${c.sub ? `<div class="subtxt">${c.sub}</div>` : ''}`;
      return c.url ? `<a class="hall-card" href="${c.url}">${inner}</a>` : `<div class="hall-card">${inner}</div>`;
    }).join('');

    /* ---- gráficos ---- */
    desenharTopPecas();
    desenharTopNoites();

    const rankAnos = [...s.anos].sort((a,b) => b.avg - a.avg);
    desenhar('chartTopFestivais', {
      type: 'bar',
      data: { labels: rankAnos.map(a => a.ano), datasets: [{ data: rankAnos.map(a => Number(a.avg.toFixed(2))), backgroundColor: rankAnos.map(a => corDaNota(a.avg)) }] },
      options: {
        responsive: true, maintainAspectRatio: false,
        ...barraClicavel(rankAnos, a => `${BASE}${a.ano}/index.html`),
        plugins: { legend: { display: false } },
        scales: { y: { min: 0, max: NOTA_MAXIMA } }
      }
    });

    /* opções do "comparar com": média histórica + cada edição com votos (menos a em destaque) */
    const selComp = document.getElementById('hallCompara');
    const vComp = selComp.value;
    selComp.innerHTML = '<option value="hist">Média histórica</option>' +
      [...s.anos].sort((a,b) => b.ano - a.ano)
        .filter(a => a.ano !== EDICAO_EM_DESTAQUE)
        .map(a => `<option value="${a.ano}">Edição ${a.ano}</option>`).join('');
    selComp.value = [...selComp.options].some(o => o.value === vComp) ? vComp : 'hist';
    comparaCom = selComp.value;
    desenharComparacao();

    /* seletores do "Comparar edições" — todas as edições do config.js.
       Padrão: as duas edições mais recentes com votos. */
    const selA = document.getElementById('hallCompA');
    const selB = document.getElementById('hallCompB');
    if(!selA.options.length){
      const anosTodos = [...EDICOES].map(e => e.ano).sort((a,b) => b - a);
      const optsE = anosTodos.map(a => `<option value="${a}">Edição ${a}</option>`).join('');
      selA.innerHTML = optsE; selB.innerHTML = optsE;
      const comVoto = [...s.anos].sort((a,b) => b.ano - a.ano).map(a => a.ano);
      compA = comVoto[0] ?? anosTodos[0];
      compB = comVoto[1] ?? anosTodos.find(a => a !== compA) ?? compA;
      selA.value = String(compA);
      selB.value = String(compB);
    }
    desenharCompEdicoes();

    const maxN = Math.max(...EDICOES.map(e => e.noites));

    /* período do gráfico de evolução (mantém a escolha do usuário) */
    const anosDisp = [...s.anos].sort((a,b) => a.ano - b.ano).map(a => a.ano);
    const selDe = document.getElementById('hallDe'), selAte = document.getElementById('hallAte');
    const vDe = selDe.value, vAte = selAte.value;
    const opts = anosDisp.map(a => `<option value="${a}">${a}</option>`).join('');
    selDe.innerHTML = opts; selAte.innerHTML = opts;
    selDe.value = anosDisp.includes(Number(vDe)) ? vDe : String(anosDisp[0] ?? '');
    selAte.value = anosDisp.includes(Number(vAte)) ? vAte : String(anosDisp[anosDisp.length-1] ?? '');
    desenharEvolucao();

    const dist = Array(11).fill(0);
    s.todasNotas.forEach(v => dist[Math.max(0, Math.min(10, Math.round(v)))]++);
    desenhar('chartDist', {
      type: 'doughnut',
      data: { labels: dist.map((_, i) => 'Nota ' + i), datasets: [{ data: dist, backgroundColor: CORES_DIST, borderColor: '#17181c', borderWidth: 2 }] },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });

    /* heatmap: anos × noites */
    let hm = '<div class="hm-row"><div class="hm-lbl"></div>' +
      Array.from({ length: maxN }, (_, i) => `<div class="hm-lbl">N${i+1}</div>`).join('') + '</div>';
    edRealizadas.forEach(d => {
      hm += `<div class="hm-row"><div class="hm-lbl">${d.cfg.ano}</div>`;
      for(let nn = 1; nn <= maxN; nn++){
        const x = s.noites.find(v => v.ano === d.cfg.ano && v.noite === nn);
        hm += x
          ? `<a class="hm-cell" href="${x.url}" style="background:${corDaNota(x.avg)}" title="Noite ${nn} de ${x.ano}: ${x.avg.toFixed(1)} (${x.n} notas)">${x.avg.toFixed(1)}</a>`
          : `<div class="hm-cell empty">–</div>`;
      }
      hm += '</div>';
    });
    document.getElementById('hallHeatmap').innerHTML = hm;

    /* ---- 1. Prateleira dos Campeões ---- */
    const recsP = [];
    const goat = topDe(elig, p => p.st.avg);
    if(goat) recsP.push({ emoji:'🏆', titulo:'A peça mais aclamada da história (GOAT)', texto: fmtP(goat), url: goat.url });
    const perfeito = topDe(elig.filter(p => p.st.p10 > 0), p => p.st.p10);
    if(perfeito) recsP.push({ emoji:'💯', titulo:`O "${NOTA_MAXIMA}/${NOTA_MAXIMA}" purista`, texto:`${Math.round(perfeito.st.p10*100)}% dos votos de ${perfeito.titulo} (${perfeito.ano}) foram nota ${NOTA_MAXIMA}`, url: perfeito.url });
    const pol = topDe(elig.filter(p => p.st.std > 0), p => p.st.std);
    if(pol) recsP.push({ emoji:'🔥', titulo:'A mais polêmica (dividiu a plateia)', texto:`${fmtP(pol)} — notas de ${pol.st.min.toFixed(1)} a ${pol.st.max.toFixed(1)}`, url: pol.url });
    const sleepers = [];
    s.noites.forEach(x => { if(x.pecas.length > 1) x.pecas.forEach(p => { if(p.st.n >= minAv) sleepers.push({ p, margem: p.st.avg - x.avg, noiteAvg: x.avg }); }); });
    const sl = topDe(sleepers, q => q.margem);
    if(sl && sl.margem > 0.2) recsP.push({ emoji:'😴', titulo:'O "Sleeper Hit" (maior surpresa)', texto:`${fmtP(sl.p)} superou a média da própria noite (${sl.noiteAvg.toFixed(1)}) em ${sl.margem.toFixed(1)} ponto(s)`, url: sl.p.url });
    if(elig.length > 1){
      const cons = topDe(elig, p => p.st.std, false);
      if(cons) recsP.push({ emoji:'🎯', titulo:'A mais consistente', texto:`${fmtP(cons)} — notas entre ${cons.st.min.toFixed(1)} e ${cons.st.max.toFixed(1)}, quase todo mundo concordou`, url: cons.url });
    }
    const fav = topDe(elig.filter(p => p.st.p9 > 0), p => p.st.p9);
    if(fav) recsP.push({ emoji:'👏', titulo:'Favorita do público', texto:`${Math.round(fav.st.p9*100)}% das notas de ${fav.titulo} (${fav.ano}) foram 9+`, url: fav.url });
    const maisAv = topDe(comVotos, p => p.st.n);
    if(maisAv) recsP.push({ emoji:'📊', titulo:'A mais avaliada', texto: fmtP(maisAv), url: maisAv.url });
    if(elig.length > 1){
      const pior = topDe(elig, p => p.st.avg, false);
      recsP.push({ emoji:'🥶', titulo:'A pior avaliada', texto: fmtP(pior), url: pior.url });
    }
    const maxInd = topDe(comVotos, p => p.st.max);
    if(maxInd) recsP.push({ emoji:'🔺', titulo:'Maior nota individual da história', texto:`Alguém deu ${maxInd.st.max.toFixed(1)} para ${maxInd.titulo} (${maxInd.ano})`, url: maxInd.url });
    const minInd = topDe(comVotos, p => p.st.min, false);
    if(minInd) recsP.push({ emoji:'🔻', titulo:'Menor nota individual da história', texto:`Alguém deu ${minInd.st.min.toFixed(1)} para ${minInd.titulo} (${minInd.ano})`, url: minInd.url });
    const perfeitas = comVotos.filter(p => p.st.avg >= NOTA_MAXIMA - 0.05);
    recsP.push({ emoji:'💎', titulo:'Peças com média perfeita', texto: perfeitas.length
      ? `${perfeitas.length}: ${perfeitas.map(p => `${p.titulo} (${p.ano})`).join(', ')}`
      : `Nenhuma média ${NOTA_MAXIMA}.0 ainda${goat ? ` — a mais próxima foi ${goat.titulo} com ${goat.st.avg.toFixed(1)}` : ''}` });
    let cresc = null;
    s.noites.forEach(x => {
      const ord = [...x.pecas].sort((a,b) => a.ep - b.ep);
      for(let i = 1; i < ord.length; i++){
        const dd = ord[i].st.avg - ord[i-1].st.avg;
        if(!cresc || dd > cresc.dd) cresc = { dd, de: ord[i-1], para: ord[i] };
      }
    });
    if(cresc && cresc.dd > 0) recsP.push({ emoji:'📈', titulo:'Maior evolução dentro de uma noite', texto:`De "${cresc.de.titulo}" (${cresc.de.st.avg.toFixed(1)}) para "${cresc.para.titulo}" (${cresc.para.st.avg.toFixed(1)}) — Noite ${cresc.para.noite} de ${cresc.para.ano}`, url: cresc.para.url });
    preencher('recPecas', recsP);

    /* ---- 2. A Batalha das Noites ---- */
    const recsN = [];
    const ouro = topDe(s.noites, x => x.avg);
    if(ouro) recsN.push({ emoji:'🌙', titulo:'A Noite Ouro (melhor da história)', texto:`Noite ${ouro.noite} de ${ouro.ano} — média ${ouro.avg.toFixed(1)} com ${ouro.n} notas`, url: ouro.url });
    const comVarias = s.noites.filter(x => x.pecas.length > 1);
    const caos = topDe(comVarias, x => Math.max(...x.pecas.map(p => p.st.avg)) - Math.min(...x.pecas.map(p => p.st.avg)));
    if(caos){
      const diff = Math.max(...caos.pecas.map(p => p.st.avg)) - Math.min(...caos.pecas.map(p => p.st.avg));
      recsN.push({ emoji:'🎢', titulo:'A Noite do Caos (montanha-russa)', texto:`Noite ${caos.noite} de ${caos.ano} — ${diff.toFixed(1)} pontos entre a melhor e a pior peça do dia`, url: caos.url });
    }
    s.anos.forEach(a => {
      s.noites.filter(x => x.ano === a.ano && x.pecas.length >= 2 && x.pecas.every(p => p.st.avg >= a.avg))
        .forEach(x => recsN.push({ emoji:'👑', titulo:'Rolo Compressor (Tripla Coroa)', texto:`Noite ${x.noite} de ${x.ano}: todas as peças acima da média do festival (${a.avg.toFixed(1)})`, url: x.url }));
    });
    const maratona = topDe(s.noites, x => x.n);
    if(maratona) recsN.push({ emoji:'🏃', titulo:'O Dia da Maratona (mais votos)', texto:`Noite ${maratona.noite} de ${maratona.ano} — ${maratona.n} notas registradas`, url: maratona.url });
    preencher('recNoites', recsN);

    /* ---- 3. Linha do Tempo & Edições ---- */
    const recsE = [];
    if(melhorAno) recsE.push({ emoji:'🏆', titulo:'O Festival do Ano (Edição Ouro)', texto:`${melhorAno.ano}, com média geral ${melhorAno.avg.toFixed(1)}`, url:`${BASE}${melhorAno.ano}/index.html` });
    if(rankAnos.length) recsE.push({ emoji:'🏅', titulo:'Ranking das edições', texto: rankAnos.map(a => `${a.ano} (${a.avg.toFixed(1)})`).join(' · ') });
    let e1s = 0, e1n = 0, eUs = 0, eUn = 0;
    s.noites.forEach(x => {
      const ultimoEp = Math.max(...x.pecas.map(q => q.ep));
      x.pecas.forEach(p => {
        if(p.ep === 1){ e1s += p.st.avg * p.st.n; e1n += p.st.n; }
        if(p.ep === ultimoEp && ultimoEp > 1){ eUs += p.st.avg * p.st.n; eUn += p.st.n; }
      });
    });
    if(e1n && eUn) recsE.push({ emoji:'🎬', titulo:'O Efeito Estreia (abertura vs. encerramento)', texto:`Peças que abrem a noite: média ${(e1s/e1n).toFixed(1)} · peças que encerram: média ${(eUs/eUn).toFixed(1)}` });
    const crescFest = topDe(s.anos.filter(a => a.cresc), a => a.cresc.d);
    if(crescFest && crescFest.cresc.d > 0) recsE.push({ emoji:'🚀', titulo:'Maior crescimento durante o festival', texto:`${crescFest.ano}: da Noite ${crescFest.cresc.de.noite} (${crescFest.cresc.de.avg.toFixed(1)}) para a Noite ${crescFest.cresc.para.noite} (${crescFest.cresc.para.avg.toFixed(1)})`, url:`${BASE}${crescFest.ano}/index.html` });
    if(maisPolar) recsE.push({ emoji:'⚡', titulo:'A edição mais polarizada', texto:`${maisPolar.ano} — ${maisPolar.polar.toFixed(1)} pontos entre a peça mais amada e a mais criticada`, url:`${BASE}${maisPolar.ano}/index.html` });
    const decadas = {};
    elig.forEach(p => { const dec = Math.floor(p.ano/10)*10; if(!decadas[dec] || p.st.avg > decadas[dec].st.avg) decadas[dec] = p; });
    Object.keys(decadas).sort().forEach(dec => recsE.push({ emoji:'📆', titulo:`Melhor peça dos anos ${dec}`, texto: fmtP(decadas[dec]), url: decadas[dec].url }));
    preencher('recEdicoes', recsE);

    /* ---- 4. Números da Comunidade ---- */
    const recsC = [];
    recsC.push({ emoji:'🗳️', titulo:'A escala da plateia', texto:`${s.totalVotos} avaliações enviadas, somando ${s.todasNotas.length} notas dadas` });
    if(mediaHist !== null) recsC.push({ emoji:'📈', titulo:'Média histórica do CETEC', texto:`${mediaHist.toFixed(1)}${anoDest ? ` — a edição ${anoDest.ano} fez ${anoDest.avg.toFixed(1)}` : ''}` });
    const buckets = {};
    s.todosSubs.forEach(su => {
      const dt = new Date(Number(su.ts));
      if(isNaN(dt.getTime())) return;
      const k = dt.getDay() + '-' + dt.getHours();
      buckets[k] = (buckets[k] || 0) + 1;
    });
    const pico = Object.entries(buckets).sort((a,b) => b[1]-a[1])[0];
    if(pico){
      const dias = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
      const [dw, hh] = pico[0].split('-').map(Number);
      recsC.push({ emoji:'⏰', titulo:'O horário mais participativo', texto:`O pico de avaliações foi numa ${dias[dw]}, por volta das ${hh}h (${pico[1]} envios nessa faixa)` });
    }
    if(comVotos.length){
      const histApp = s.todasNotas.length / comVotos.length;
      recsC.push({ emoji:'🧮', titulo:'Média de avaliações por peça', texto:`Histórico: ${histApp.toFixed(1)} notas por peça${anoDest && anoDest.avalPorPeca ? ` · ${anoDest.ano}: ${anoDest.avalPorPeca.toFixed(1)}` : ''}` });
    }
    preencher('recComunidade', recsC);

    /* ---- curiosidades manuais (hall-dados.js) ---- */
    const cur = HALL.curiosidades || [];
    const sec = document.getElementById('secCurio');
    if(cur.length){
      sec.style.display = '';
      document.getElementById('recCurio').innerHTML = cur.map(rItem).join('');
    }
  }

  /* ---------- atualização automática ---------- */
  async function atualizar(){
    try{
      const votos = {};
      await Promise.all(edicoes.map(async d => {
        try{
          /* no-store + _ : fura o cache pra sempre pegar votos frescos */
          const r = await fetch(API_URL + '?year=' + d.cfg.ano + '&_=' + Date.now(), { cache: 'no-store' });
          const j = await r.json();
          votos[d.cfg.ano] = filtrarVotosDoAno(Array.isArray(j) ? j : (j.submissions || []), d.cfg.ano);
        }catch(e){ votos[d.cfg.ano] = []; }
      }));
      stats = calcular(votos);
      renderTudo();
      const st = document.getElementById('hallAtualizado');
      if(st) st.textContent = '· atualizado às ' + new Date().toLocaleTimeString('pt-BR');
    }catch(e){ console.error('Hall: falha na atualização', e); }
  }

  await atualizar();
  setInterval(atualizar, 20000); // atualiza sozinho a cada 20s (igual ao resto do site)
}

/* ---------------------- dispatcher ---------------------- */
switch(PAGINA.tipo){
  case 'edicao':   paginaEdicao(); break;
  case 'sobre':    paginaSobre(); break;
  case 'abertura': paginaAbertura(); break;
  case 'noite':    paginaNoite(PAGINA.noite); break;
  case 'monte':    paginaMonte(); break;
  case 'hall':     paginaHall(); break;
  default: console.error('PAGINA.tipo desconhecido:', PAGINA.tipo);
}
