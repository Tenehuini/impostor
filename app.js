'use strict';

const MIN_PLAYERS = 3;
const STORAGE_KEY = 'impostor.state.v1';
const AVATAR = { m: 'assets/male.jpg', f: 'assets/female.jpg' };

const ALL_CATEGORY_IDS = CATEGORIES.map((c) => c.id);

const state = Object.assign(
  { players: [], impostors: 1, voteMode: 'group', categories: ALL_CATEGORY_IDS.slice(), customEnabled: false, customWord: '' },
  load() || {}
);
// Las categorías agregadas en una versión nueva aparecen marcadas;
// las guardadas que ya no existen se descartan.
const knownCategories = state.knownCategories || ALL_CATEGORY_IDS.filter((id) => id !== 'comida');
state.categories = ALL_CATEGORY_IDS.filter(
  (id) => state.categories.includes(id) || !knownCategories.includes(id)
);
state.knownCategories = ALL_CATEGORY_IDS.slice();
delete state.round;

const $ = (sel) => document.querySelector(sel);

// ---------- persistencia ----------
function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}
function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* sin storage */ }
}

// ---------- reglas ----------
// Los impostores tienen que ser menos que la mitad de los jugadores.
function maxImpostors(n) {
  return Math.max(1, Math.floor((n - 1) / 2));
}
function clampImpostors() {
  state.impostors = Math.min(Math.max(1, state.impostors), maxImpostors(state.players.length));
}

// ---------- navegación ----------
function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.toggleAttribute('data-active', s.id === id));
  window.scrollTo(0, 0);
}

// ---------- pantalla 1: jugadores ----------
const form = $('#player-form');
const nameInput = $('#player-name');
const errorEl = $('#player-error');

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = !msg;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = nameInput.value.trim().replace(/\s+/g, ' ');
  const gender = form.elements.gender.value;

  if (!name) return showError('Ingresá un nombre.');
  if (state.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    return showError('Ya hay un jugador con ese nombre.');
  }

  state.players.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, gender });
  save();
  showError('');
  nameInput.value = '';
  nameInput.focus();
  renderPlayers();
});

nameInput.addEventListener('input', () => showError(''));

$('#player-list').addEventListener('click', (e) => {
  const btn = e.target.closest('.remove');
  if (!btn) return;
  state.players = state.players.filter((p) => p.id !== btn.dataset.id);
  save();
  renderPlayers();
});

function renderPlayers() {
  const list = $('#player-list');
  list.replaceChildren(...state.players.map((p) => {
    const li = document.createElement('li');
    const img = document.createElement('img');
    img.src = AVATAR[p.gender];
    img.alt = p.gender === 'f' ? 'Femenino' : 'Masculino';
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = p.name;
    const rm = document.createElement('button');
    rm.className = 'remove';
    rm.dataset.id = p.id;
    rm.setAttribute('aria-label', `Quitar a ${p.name}`);
    rm.textContent = '×';
    li.append(img, name, rm);
    return li;
  }));

  const n = state.players.length;
  $('#player-count').textContent = n;
  const hint = $('#empty-hint');
  hint.hidden = n >= MIN_PLAYERS;
  hint.textContent = n === 0
    ? `Todavía no hay jugadores. Se necesitan al menos ${MIN_PLAYERS}.`
    : `Faltan ${MIN_PLAYERS - n} jugador${MIN_PLAYERS - n === 1 ? '' : 'es'} más.`;
  $('#to-config').disabled = n < MIN_PLAYERS;
}

$('#to-config').addEventListener('click', () => {
  if (state.players.length < MIN_PLAYERS) return;
  clampImpostors();
  save();
  renderConfig();
  show('screen-config');
});

// ---------- pantalla 2: configuración ----------
function renderConfig() {
  const n = state.players.length;
  const max = maxImpostors(n);
  $('#total-players').textContent = n;
  $('#avatar-strip').replaceChildren(...state.players.map((p) => {
    const img = document.createElement('img');
    img.src = AVATAR[p.gender];
    img.alt = p.name;
    img.title = p.name;
    return img;
  }));
  $('#imp-count').textContent = state.impostors;
  $('#imp-minus').disabled = state.impostors <= 1;
  $('#imp-plus').disabled = state.impostors >= max;
  $('#imp-hint').textContent = `Con ${n} jugadores podés tener hasta ${max} impostor${max === 1 ? '' : 'es'}.`;
  document.querySelectorAll('input[name="vote-mode"]').forEach((r) => { r.checked = r.value === state.voteMode; });
  $('#group-mode-hint').textContent =
    `Discuten y eligen juntos. Tienen ${formatTime(groupVoteSeconds(n) * 1000)} en total para votar en toda la partida.`;
}

// Tiempo total de votación en grupo: 2 minutos + 30 segundos por cada jugador después del cuarto.
function groupVoteSeconds(n) {
  return 120 + 30 * Math.max(0, n - 4);
}

function formatTime(ms) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

document.querySelectorAll('input[name="vote-mode"]').forEach((r) => r.addEventListener('change', () => {
  state.voteMode = r.value;
  save();
}));

$('#imp-minus').addEventListener('click', () => { state.impostors--; clampImpostors(); save(); renderConfig(); });
$('#imp-plus').addEventListener('click', () => { state.impostors++; clampImpostors(); save(); renderConfig(); });
$('#back-to-players').addEventListener('click', () => show('screen-players'));

$('#to-categories').addEventListener('click', () => {
  renderCategories();
  show('screen-categories');
});

// ---------- pantalla 3: categorías ----------
const catList = $('#category-list');
const customEnabled = $('#custom-enabled');
const customBox = $('#custom-box');
const customWord = $('#custom-word');
const catError = $('#cat-error');

function showCatError(msg) {
  catError.textContent = msg;
  catError.hidden = !msg;
}

function buildCategoryList() {
  catList.replaceChildren(...CATEGORIES.map((c) => {
    const label = document.createElement('label');
    label.className = 'cat-opt';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = c.id;
    const icon = document.createElement('span');
    icon.className = 'cat-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = c.icon;
    const name = document.createElement('span');
    name.className = 'cat-name';
    name.textContent = c.name;
    const count = document.createElement('small');
    count.className = 'cat-count';
    count.textContent = `${c.words.length} palabras`;
    name.append(count);
    const check = document.createElement('span');
    check.className = 'check';
    check.setAttribute('aria-hidden', 'true');
    label.append(input, icon, name, check);
    return label;
  }));
}

function renderCategories() {
  const selected = new Set(state.categories);
  catList.querySelectorAll('input').forEach((i) => { i.checked = selected.has(i.value); i.disabled = state.customEnabled; });
  catList.classList.toggle('is-disabled', state.customEnabled);

  const n = state.categories.length;
  const words = CATEGORIES.filter((c) => selected.has(c.id)).reduce((acc, c) => acc + c.words.length, 0);
  $('#cat-summary').textContent = state.customEnabled
    ? 'Usando palabra personalizada'
    : `${n} de ${CATEGORIES.length} · ${words} palabras`;
  const toggleAll = $('#cat-toggle-all');
  toggleAll.textContent = n === CATEGORIES.length ? 'Desmarcar todas' : 'Marcar todas';
  toggleAll.disabled = state.customEnabled;
  toggleAll.style.visibility = state.customEnabled ? 'hidden' : '';

  customEnabled.checked = state.customEnabled;
  customBox.hidden = !state.customEnabled;
  if (customWord.value !== state.customWord) customWord.value = state.customWord;
}

catList.addEventListener('change', (e) => {
  const input = e.target;
  state.categories = input.checked
    ? ALL_CATEGORY_IDS.filter((id) => id === input.value || state.categories.includes(id))
    : state.categories.filter((id) => id !== input.value);
  save();
  showCatError('');
  renderCategories();
});

$('#cat-toggle-all').addEventListener('click', () => {
  state.categories = state.categories.length === CATEGORIES.length ? [] : ALL_CATEGORY_IDS.slice();
  save();
  showCatError('');
  renderCategories();
});

customEnabled.addEventListener('change', () => {
  state.customEnabled = customEnabled.checked;
  save();
  showCatError('');
  renderCategories();
  if (state.customEnabled) customWord.focus();
});

customWord.addEventListener('input', () => {
  state.customWord = customWord.value;
  save();
  showCatError('');
});

$('#back-to-config').addEventListener('click', () => { renderConfig(); show('screen-config'); });

// ---------- azar ----------
// Usa crypto cuando está disponible (más parejo que Math.random).
function randomInt(n) {
  if (window.crypto && crypto.getRandomValues) {
    const limit = Math.floor(0x100000000 / n) * n;
    const buf = new Uint32Array(1);
    do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % n;
  }
  return Math.floor(Math.random() * n);
}
const pickRandom = (arr) => arr[randomInt(arr.length)];
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Palabra personalizada si está activada; si no, una palabra al azar entre todas
// las de las categorías marcadas. Así cada categoría sale en proporción a
// cuántas palabras tiene (una categoría chica sale poco si hay otras marcadas).
function chooseWord() {
  if (state.customEnabled) {
    const word = state.customWord.trim().replace(/\s+/g, ' ');
    return word ? { word, category: null } : null;
  }
  const pool = CATEGORIES.filter((c) => state.categories.includes(c.id));
  const total = pool.reduce((sum, c) => sum + c.words.length, 0);
  if (!total) return null;
  let r = randomInt(total);
  for (const c of pool) {
    if (r < c.words.length) return { word: c.words[r], category: c.name };
    r -= c.words.length;
  }
  return null;
}

// La ronda vive solo en memoria: la palabra y los impostores no se guardan.
let round = null;

const isImpostor = (p) => round.impostorIds.has(p.id);
const alivePlayers = () => round.players.filter((p) => !round.eliminated.has(p.id));
const impostorWord = (p) => (p.gender === 'f' ? 'IMPOSTORA' : 'IMPOSTOR');
const plural = (n, one, many) => (n === 1 ? one : many);

function startRound() {
  const choice = chooseWord();
  if (!choice) return false;
  const impostorIds = new Set(shuffle(state.players).slice(0, state.impostors).map((p) => p.id));
  round = {
    word: choice.word,
    players: state.players.slice(), // el celular pasa en el orden de la lista
    impostorIds,
    eliminated: new Set(),
    index: 0, // jugador que está viendo su rol
    starterId: pickRandom(state.players).id, // quien empieza cada vuelta de pistas
    lap: 0, // número de vuelta de pistas
    // Tiempo de votación en grupo que queda; se descuenta entre votaciones.
    voteTimeLeft: groupVoteSeconds(state.players.length) * 1000,
  };
  renderHandoff();
  show('screen-reveal');
  return true;
}

$('#start-game').addEventListener('click', () => {
  if (state.customEnabled && !state.customWord.trim()) return showCatError('Escribí la palabra personalizada.');
  if (!state.customEnabled && !state.categories.length) return showCatError('Marcá al menos una categoría.');
  startRound();
});

// ---------- pantalla 4: reparto ----------
const revealBtn = $('#reveal-btn');
const hideBtn = $('#hide-btn');

function renderHandoff() {
  const p = round.players[round.index];
  $('#reveal-progress').textContent = `Jugador ${round.index + 1} de ${round.players.length}`;
  $('#handoff-avatar').src = AVATAR[p.gender];
  $('#handoff-avatar').alt = p.name;
  $('#handoff-name').textContent = p.name;
  $('#handoff').hidden = false;
  $('#role').hidden = true;
  revealBtn.textContent = `Soy ${p.name}, ver mi palabra`;
  revealBtn.hidden = false;
  hideBtn.hidden = true;
}

revealBtn.addEventListener('click', () => {
  const p = round.players[round.index];
  const imp = isImpostor(p);
  const roleEl = $('#role');
  roleEl.classList.toggle('is-impostor', imp);
  $('#role-label').textContent = imp ? (p.gender === 'f' ? 'Sos la' : 'Sos el') : 'Tu palabra es';
  $('#role-word').textContent = imp ? impostorWord(p) : round.word;
  $('#role-hint').textContent = imp
    ? 'No sabés la palabra. Escuchá a los demás y disimulá.'
    : 'Memorizala y no se la muestres a nadie.';
  $('#handoff').hidden = true;
  roleEl.hidden = false;
  revealBtn.hidden = true;
  const last = round.index === round.players.length - 1;
  hideBtn.textContent = last ? 'Ocultar y empezar' : 'Ocultar y pasar';
  hideBtn.hidden = false;
});

hideBtn.addEventListener('click', () => {
  // Borrar el contenido antes de cambiar de pantalla para que no quede visible.
  $('#role-word').textContent = '';
  $('#role').classList.remove('is-impostor');
  round.index++;
  if (round.index < round.players.length) renderHandoff();
  else startLap();
});

$('#quit-round').addEventListener('click', () => {
  if (!confirm('¿Cancelar la partida? Se va a elegir otra palabra.')) return;
  $('#role-word').textContent = '';
  round = null;
  renderCategories();
  show('screen-categories');
});

// ---------- pantalla 5: vuelta de pistas ----------
// Orden de la vuelta: jugadores en juego, empezando por quien inicia. Si esa
// persona fue expulsada, empieza la siguiente en la lista que siga en juego.
function lapOrder() {
  const n = round.players.length;
  const from = round.players.findIndex((p) => p.id === round.starterId);
  for (let k = 0; k < n; k++) {
    const p = round.players[(from + k) % n];
    if (!round.eliminated.has(p.id)) { round.starterId = p.id; break; }
  }
  const alive = alivePlayers();
  const i = alive.findIndex((p) => p.id === round.starterId);
  return alive.slice(i).concat(alive.slice(0, i));
}

function startLap() {
  round.lap++;
  round.order = lapOrder();
  round.turn = 0;
  renderClue();
  show('screen-clues');
}

function renderClue() {
  const order = round.order;
  const lapDone = round.turn >= order.length;
  const p = lapDone ? order[0] : order[round.turn];

  $('#clue-title').textContent = `Ronda ${round.lap}`;
  $('#clue-sub').textContent = `${order.length} jugadores en juego`;
  $('#clue-avatar').src = AVATAR[p.gender];
  $('#clue-avatar').alt = p.name;
  $('#clue-name').textContent = p.name;

  const next = $('#clue-next');
  $('#to-vote').hidden = !lapDone;
  $('#skip-vote').hidden = !lapDone;
  next.hidden = lapDone;

  if (lapDone) {
    // La vuelta terminó: le vuelve a tocar a quien empezó, que decide qué hacer.
    $('#clue-label').textContent = '¡Vuelta completa! Vuelve a';
    $('#clue-hint').textContent = 'Decidan: ¿votan ahora o juegan otra vuelta de pistas?';
  } else {
    $('#clue-label').textContent = round.turn === 0 ? 'Empieza' : 'Turno de';
    $('#clue-hint').textContent = 'Decí una palabra relacionada, sin decir la palabra.';
    next.textContent = round.turn < order.length - 1
      ? `Listo, sigue ${order[round.turn + 1].name}`
      : 'Listo, terminó la vuelta';
  }
}

$('#clue-next').addEventListener('click', () => { round.turn++; renderClue(); });
$('#skip-vote').addEventListener('click', startLap);
$('#to-vote').addEventListener('click', () => {
  unlockAudio(); // los celulares solo permiten sonido después de un toque
  if (state.voteMode === 'secret') startSecretVote();
  else startGroupVote();
});

function newRound() {
  stopVoteTimer();
  round = null;
  if (state.customEnabled) {
    // Con palabra personalizada, el árbitro tiene que escribir una nueva.
    state.customWord = '';
    save();
    renderCategories();
    show('screen-categories');
    $('#custom-word').focus();
  } else {
    startRound();
  }
}

document.querySelectorAll('.js-new-round').forEach((b) => b.addEventListener('click', newRound));
document.querySelectorAll('.js-home').forEach((b) => b.addEventListener('click', () => {
  stopVoteTimer();
  round = null;
  show('screen-players');
}));
document.querySelectorAll('.js-end-game').forEach((b) => b.addEventListener('click', () => {
  if (!confirm('¿Terminar la partida y ver quiénes eran los impostores?')) return;
  stopVoteTimer();
  renderEnd(null);
  show('screen-end');
}));

// ---------- votación: grilla de jugadores ----------
function renderVoteGrid(container, players) {
  container.replaceChildren(...players.map((p) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'vote-opt';
    b.dataset.id = p.id;
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', 'false');
    const img = document.createElement('img');
    img.src = AVATAR[p.gender];
    img.alt = '';
    const name = document.createElement('span');
    name.textContent = p.name;
    b.append(img, name);
    return b;
  }));
}

// Marca la opción tocada y devuelve el jugador elegido (o null).
function pickFromGrid(container, e) {
  const opt = e.target.closest('.vote-opt');
  if (!opt) return null;
  container.querySelectorAll('.vote-opt').forEach((o) => o.setAttribute('aria-checked', String(o === opt)));
  return round.players.find((p) => p.id === opt.dataset.id);
}

// ---------- pantalla 6: votación en grupo ----------
let groupChoice = null;

function startGroupVote() {
  groupChoice = null;
  const alive = alivePlayers();
  $('#vote-sub').textContent = `Ronda ${round.lap} · ${alive.length} jugadores en juego`;
  renderVoteGrid($('#vote-list'), alive);
  const eject = $('#eject-btn');
  eject.disabled = true;
  eject.textContent = 'Elegí a alguien';
  show('screen-vote');
  startVoteTimer();
}

// ---------- temporizador de la votación en grupo ----------
// Se calcula contra una hora límite, así sigue siendo exacto aunque la
// pantalla se bloquee o el navegador frene el intervalo.
let voteDeadline = 0;
let voteTicker = null;

function renderTimer(ms) {
  $('#timer-text').textContent = formatTime(ms);
  $('#vote-timer').classList.toggle('is-low', ms <= 30000);
}

function startVoteTimer() {
  stopVoteTimer();
  voteDeadline = Date.now() + round.voteTimeLeft;
  renderTimer(round.voteTimeLeft);
  voteTicker = setInterval(tickVoteTimer, 250);
}

function tickVoteTimer() {
  if (!voteTicker) return;
  const left = voteDeadline - Date.now();
  renderTimer(left);
  if (left > 0) return;
  stopVoteTimer();
  round.voteTimeLeft = 0;
  if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
  playTimeUpSound();
  renderEnd('impostores', 'tiempo');
  show('screen-end');
}

// Detiene el reloj y guarda el tiempo que quedó para la próxima votación.
function stopVoteTimer() {
  if (!voteTicker) return;
  clearInterval(voteTicker);
  voteTicker = null;
  if (round) round.voteTimeLeft = Math.max(0, voteDeadline - Date.now());
}

// ---------- sonido de fin de tiempo ----------
// Se genera con Web Audio (sin archivos). El contexto se crea en un toque del
// usuario porque los navegadores móviles bloquean el audio hasta entonces.
let audioCtx = null;

function unlockAudio() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtx) audioCtx = new Ctx();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch { /* sin audio */ }
}

// Alarma: tres pitidos rápidos y uno largo que baja de tono.
function playTimeUpSound() {
  if (!audioCtx) return;
  try {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t0 = audioCtx.currentTime + 0.05;
    const beep = (start, dur, from, to) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(from, start);
      osc.frequency.exponentialRampToValueAtTime(to, start + dur);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
      gain.gain.setValueAtTime(0.25, start + dur - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    };
    beep(t0, 0.15, 880, 880);
    beep(t0 + 0.22, 0.15, 880, 880);
    beep(t0 + 0.44, 0.15, 880, 880);
    beep(t0 + 0.7, 0.9, 660, 220);
  } catch { /* sin audio */ }
}

document.addEventListener('visibilitychange', () => { if (voteTicker && !document.hidden) tickVoteTimer(); });

$('#vote-list').addEventListener('click', (e) => {
  const p = pickFromGrid($('#vote-list'), e);
  if (!p) return;
  groupChoice = p;
  const eject = $('#eject-btn');
  eject.disabled = false;
  eject.textContent = `Expulsar a ${p.name}`;
});

$('#eject-btn').addEventListener('click', () => {
  if (!groupChoice || !voteTicker) return;
  stopVoteTimer();
  round.eliminated.add(groupChoice.id);
  renderVerdict({ expelled: groupChoice });
  show('screen-result');
});

// ---------- pantalla 6b: votación secreta ----------
let secretChoice = null;

function startSecretVote() {
  round.voters = alivePlayers();
  round.voterIndex = 0;
  round.ballots = new Map(); // votante -> votado (solo en memoria)
  renderSecretHandoff();
  show('screen-secret');
}

function renderSecretHandoff() {
  const v = round.voters[round.voterIndex];
  secretChoice = null;
  $('#secret-sub').textContent = `Voto ${round.voterIndex + 1} de ${round.voters.length}`;
  $('#secret-avatar').src = AVATAR[v.gender];
  $('#secret-avatar').alt = v.name;
  $('#secret-name').textContent = v.name;
  $('#secret-handoff').hidden = false;
  $('#secret-ballot').hidden = true;
  $('#secret-list').replaceChildren();
  const open = $('#secret-open');
  open.textContent = `Soy ${v.name}, votar`;
  open.hidden = false;
  $('#secret-cast').hidden = true;
}

$('#secret-open').addEventListener('click', () => {
  const v = round.voters[round.voterIndex];
  $('#secret-ballot-hint').textContent = `${v.name}, ¿a quién querés expulsar?`;
  renderVoteGrid($('#secret-list'), round.voters.filter((p) => p.id !== v.id));
  $('#secret-handoff').hidden = true;
  $('#secret-ballot').hidden = false;
  $('#secret-open').hidden = true;
  const cast = $('#secret-cast');
  cast.disabled = true;
  cast.textContent = 'Elegí a alguien';
  cast.hidden = false;
});

$('#secret-list').addEventListener('click', (e) => {
  const p = pickFromGrid($('#secret-list'), e);
  if (!p) return;
  secretChoice = p;
  const cast = $('#secret-cast');
  cast.disabled = false;
  cast.textContent = `Votar a ${p.name}`;
});

$('#secret-cast').addEventListener('click', () => {
  if (!secretChoice) return;
  round.ballots.set(round.voters[round.voterIndex].id, secretChoice.id);
  // Borrar la elección de la pantalla antes de pasar el celular.
  $('#secret-list').replaceChildren();
  round.voterIndex++;
  if (round.voterIndex < round.voters.length) {
    renderSecretHandoff();
    return;
  }
  // Conteo: el más votado es expulsado; si hay empate, nadie.
  const counts = new Map();
  round.ballots.forEach((target) => counts.set(target, (counts.get(target) || 0) + 1));
  const max = Math.max(...counts.values());
  const top = [...counts].filter(([, c]) => c === max).map(([id]) => round.players.find((p) => p.id === id));
  round.ballots = null;
  if (top.length === 1) {
    round.eliminated.add(top[0].id);
    renderVerdict({ expelled: top[0], counts });
  } else {
    renderVerdict({ tie: top, counts });
  }
  show('screen-result');
});

// ---------- pantalla 7: resultado del voto ----------
// null = sigue la partida; 'inocentes' o 'impostores' = ganador.
function winner() {
  const alive = alivePlayers();
  const imps = alive.filter(isImpostor).length;
  if (imps === 0) return 'inocentes';
  if (imps >= alive.length - imps) return 'impostores';
  return null;
}

function renderTally(counts) {
  const list = $('#tally');
  list.hidden = !counts;
  if (!counts) return list.replaceChildren();
  const rows = [...counts].sort((a, b) => b[1] - a[1]);
  list.replaceChildren(...rows.map(([id, c]) => {
    const p = round.players.find((x) => x.id === id);
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = p.name;
    const votes = document.createElement('strong');
    votes.textContent = `${c} ${plural(c, 'voto', 'votos')}`;
    li.append(name, votes);
    return li;
  }));
}

function renderVerdict({ expelled, tie, counts }) {
  const v = $('#verdict');
  const avatar = $('#verdict-avatar');
  renderTally(counts);
  const next = $('#verdict-next');

  if (tie) {
    v.classList.remove('is-impostor');
    avatar.hidden = true;
    $('#verdict-label').textContent = 'Empate';
    $('#verdict-word').textContent = 'NADIE';
    const names = tie.map((p) => p.name);
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}` : names[0];
    $('#verdict-hint').textContent = `Empataron ${list}. Nadie es expulsado.`;
    next.textContent = 'Jugar otra vuelta';
    next.onclick = startLap;
    return;
  }

  const caught = isImpostor(expelled);
  v.classList.toggle('is-impostor', caught);
  avatar.hidden = false;
  avatar.src = AVATAR[expelled.gender];
  avatar.alt = expelled.name;
  $('#verdict-label').textContent = `${expelled.name} era`;
  $('#verdict-word').textContent = caught ? impostorWord(expelled) : 'INOCENTE';

  const result = winner();
  const left = alivePlayers().filter(isImpostor).length;
  let hint;
  if (result === 'inocentes') hint = '¡Descubrieron a todos los impostores!';
  else if (result === 'impostores') hint = 'Los impostores ya son tantos como los inocentes.';
  else if (caught) hint = `Bien ahí. Todavía ${plural(left, 'queda', 'quedan')} ${left} ${plural(left, 'impostor', 'impostores')}.`;
  else hint = `Expulsaron a un inocente. ${plural(left, 'El impostor sigue', 'Los impostores siguen')} entre ustedes.`;
  $('#verdict-hint').textContent = hint;

  next.textContent = result ? 'Ver resultado' : 'Jugar otra vuelta';
  next.onclick = result
    ? () => { renderEnd(result); show('screen-end'); }
    : startLap;
}

// ---------- pantalla 8: fin ----------
function renderEnd(result, reason) {
  const imps = round.players.filter(isImpostor);
  const allFemale = imps.every((p) => p.gender === 'f');
  const one = imps.length === 1;
  const impLabel = one
    ? (allFemale ? 'la impostora' : 'el impostor')
    : (allFemale ? 'las impostoras' : 'los impostores');

  if (result === 'inocentes') {
    $('#end-title').textContent = '¡Ganaron los inocentes!';
    $('#end-sub').textContent = `Descubrieron a ${impLabel}.`;
  } else if (result === 'impostores') {
    $('#end-title').textContent = one ? `¡Ganó ${impLabel}!` : `¡Ganaron ${impLabel}!`;
    $('#end-sub').textContent = reason === 'tiempo'
      ? 'Se terminó el tiempo de votación.'
      : 'No lograron descubrir a tiempo.';
  } else {
    $('#end-title').textContent = 'Partida terminada';
    $('#end-sub').textContent = 'Sin ganador.';
  }
  $('#end-word').textContent = round.word;
  $('#end-imp-title').textContent = impLabel.charAt(0).toUpperCase() + impLabel.slice(1);

  $('#end-impostors').replaceChildren(...imps.map((p) => {
    const li = document.createElement('li');
    const img = document.createElement('img');
    img.src = AVATAR[p.gender];
    img.alt = '';
    const name = document.createElement('span');
    name.className = 'name';
    name.textContent = p.name;
    const out = round.eliminated.has(p.id);
    const tag = document.createElement('span');
    tag.className = 'tag ' + (out ? 'tag-caught' : 'tag-free');
    tag.textContent = out ? (p.gender === 'f' ? 'Descubierta' : 'Descubierto') : 'Zafó';
    li.append(img, name, tag);
    return li;
  }));
}

// ---------- init ----------
buildCategoryList();
renderPlayers();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
