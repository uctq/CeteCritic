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
    const res  = await fetch(API_URL + '?year=' + ANO);
    const data = await res.json();
    if(Array.isArray(data)){
      submissions = data.filter(s => !s.year || Number(s.year) === ANO);
    } else {
      submissions = (data.submissions || []).filter(s => !s.year || Number(s.year) === ANO);
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

/* ---------------------- shell (sidebar + rodapé + modais) ---------------------- */
function htmlSidebar(){
  let h = `<div class="sidebar-logo">
    <img src="${BASE}assets/logo.png" alt="" onerror="this.style.display='none'">
    <span>CETEC<br>Critic</span>
  </div>
  <button class="nav-link nav-parent" id="navMonte">Monte o Seu</button>`;

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
  return h;
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
  for(let e = 1; e <= EPS; e++){
    h += `<div class="grid-row"><div class="cell label">E${e}</div>`;
    for(let s = 1; s <= NUM_NOITES; s++) h += `<div class="cell empty-cell">–</div>`;
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

  for(let e = 1; e <= EPS; e++){
    h += `<div class="grid-row"><div class="cell label">E${e}</div>`;
    for(let s = 1; s <= NUM_NOITES; s++){
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
      for(let e = 1; e <= EPS; e++){
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
      for(let e = 1; e <= EPS; e++){
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
  for(let e = 1; e <= EPS; e++){
    h += `<div class="grid-row"><div class="cell label">E${e}</div>`;
    for(let s = 1; s <= NUM_NOITES; s++){
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
  for(let e = 1; e <= EPS; e++){
    h += `<div class="grid-row"><div class="cell label">E${e}</div>`;
    for(let s = 1; s <= NUM_NOITES; s++){
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
  for(let s = 1; s <= NUM_NOITES; s++){ if(noiteLiberada(s)) disponiveis += EPS; }

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
            <div class="noite-card-title">${esc(info.titulo)}</div>
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
    pecas.forEach((info, idx) => {
      const key = `s${n}e${idx + 1}`;
      const box = document.getElementById(`nota-${key}`);
      if(!box) return;
      const vals = valoresDaChave(key);
      const avg = media(vals);
      box.innerHTML = avg === null
        ? `<div class="val empty">–</div><div class="cnt">Sem avaliações</div>`
        : `<div class="val" style="background-color:${corDaNota(avg)}">${avg.toFixed(1)}</div><div class="cnt">${vals.length} avaliaç${vals.length === 1 ? 'ão' : 'ões'}</div>`;
    });
  }

  renderCards();
  fetchVotos().then(atualizarNotas);
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
    for(let e = 1; e <= EPS; e++){
      h += `<div class="grid-row"><div class="cell label">E${e}</div>`;
      for(let s = 1; s <= NUM_NOITES; s++){
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
      for(let e = 1; e <= EPS; e++){
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
    customValues = {};
    buildCustomGrid();
    salvarGrid();
  });
  document.getElementById('downloadCustomBtn').addEventListener('click', ev =>
    baixarImagem('custom-capture-area', `Meu_Cetec_Festival_${ANO}.png`, ev.currentTarget));

  buildCustomGrid();
}

/* ---------------------- dispatcher ---------------------- */
switch(PAGINA.tipo){
  case 'edicao':   paginaEdicao(); break;
  case 'sobre':    paginaSobre(); break;
  case 'abertura': paginaAbertura(); break;
  case 'noite':    paginaNoite(PAGINA.noite); break;
  case 'monte':    paginaMonte(); break;
  default: console.error('PAGINA.tipo desconhecido:', PAGINA.tipo);
}
