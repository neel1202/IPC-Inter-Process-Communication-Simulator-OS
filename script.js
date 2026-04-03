function hl(id) {
  document.querySelectorAll('.code-lines div').forEach(el => el.classList.remove('highlight'));
  if (id) { const el = document.getElementById(id); if (el) el.classList.add('highlight'); }
}
function hlClear() { hl(null); }

function getDelay(sliderId) {
  const el = document.getElementById(sliderId);
  const val = el ? parseInt(el.value, 10) : 50;
  return 2000 - (val * 19);
}

const gToast      = document.getElementById('global-toast');
const gToastIcon  = document.getElementById('toast-icon');
const gToastTitle = document.getElementById('toast-title');
const gToastSub   = document.getElementById('toast-sub');
let _toastTimer   = null;

function showToast(type, icon, title, sub) {
  if (_toastTimer) clearTimeout(_toastTimer);
  gToast.className = '';
  void gToast.offsetWidth;
  gToastIcon.textContent  = icon;
  gToastTitle.textContent = title;
  gToastSub.textContent   = sub;
  gToast.classList.add('show', 'type-' + type);
  _toastTimer = setTimeout(() => { gToast.className = ''; }, 2700);
}

function addLog(logEl, cssClass, icon, text) {
  const placeholder = logEl.querySelector('.log-placeholder');
  if (placeholder) placeholder.remove();
  const ts = new Date().toLocaleTimeString('en-GB', { hour12: false });
  const entry = document.createElement('div');
  entry.className = 'sig-entry ' + cssClass;
  entry.innerHTML = '<span>' + icon + '</span><span>' + text + '</span><span class="sig-time">' + ts + '</span>';
  logEl.appendChild(entry);
  logEl.scrollTop = logEl.scrollHeight;
}

function clearLog(logEl, placeholder) {
  logEl.innerHTML = '<div class="log-placeholder">' + (placeholder || 'No events yet...') + '</div>';
}

const bufferSize    = 5;
let buffer          = [];
let pcMutex         = 1, pcEmpty = 5, pcFull = 0;
let pcIsProducing   = false, pcIsConsuming = false;
let consumerBlocked = false, producerBlocked = false;

const pcBuffer     = document.getElementById('pc-buffer');
const pcProduceBtn = document.getElementById('pc-produce-btn');
const pcConsumeBtn = document.getElementById('pc-consume-btn');
const pcResetBtn   = document.getElementById('pc-reset-btn');
const pcStatus     = document.getElementById('pc-status');
const pcMutexEl    = document.getElementById('pc-mutex');
const pcEmptyEl    = document.getElementById('pc-empty');
const pcFullEl     = document.getElementById('pc-full');
const pcSignalLog  = document.getElementById('pc-signal-log');
const pcWakeArrow  = document.getElementById('pc-wake-arrow');

let _arrowTimer = null;
function showWakeArrow(direction) {
  if (_arrowTimer) clearTimeout(_arrowTimer);
  pcWakeArrow.classList.remove('show', 'arrow-to-consumer', 'arrow-to-producer');
  void pcWakeArrow.offsetWidth;
  if (direction === 'to-consumer') {
    pcWakeArrow.textContent = '🟢 signal(full) ➜➜➜ Consumer WAKE-UP CALL!';
    pcWakeArrow.classList.add('show', 'arrow-to-consumer');
  } else {
    pcWakeArrow.textContent = '🟣 signal(empty) ➜➜➜ Producer WAKE-UP CALL!';
    pcWakeArrow.classList.add('show', 'arrow-to-producer');
  }
  _arrowTimer = setTimeout(() => pcWakeArrow.classList.remove('show'), 2800);
}

function pulseBufferSlot(index) {
  const slots = pcBuffer.querySelectorAll('.buffer-slot');
  const slot = slots[Math.min(index, slots.length - 1)];
  if (!slot) return;
  slot.classList.remove('wake-pulse');
  void slot.offsetWidth;
  slot.classList.add('wake-pulse');
  slot.addEventListener('animationend', () => slot.classList.remove('wake-pulse'), { once: true });
}

function renderPcBuffer() {
  pcBuffer.innerHTML = '';
  for (let i = 0; i < bufferSize; i++) {
    const slot = document.createElement('div');
    slot.className = 'buffer-slot';
    if (i < buffer.length) { slot.classList.add('filled'); slot.textContent = buffer[i]; }
    pcBuffer.appendChild(slot);
  }
  pcMutexEl.textContent = pcMutex;
  pcEmptyEl.textContent = pcEmpty;
  pcFullEl.textContent  = pcFull;
}

async function produce() {
  if (pcIsProducing || pcIsConsuming) return;
  pcIsProducing = true;
  pcStatus.classList.remove('blocked-state');

  pcStatus.textContent = 'Producer: produce_item() — generating item...';
  hl('pc-p-3');
  await new Promise(r => setTimeout(r, getDelay('pc-speed')));

  hl('pc-p-4');
  pcStatus.textContent = 'Producer: wait(empty) — checking for free slot...';
  await new Promise(r => setTimeout(r, getDelay('pc-speed')));

  if (pcEmpty > 0) {
    pcEmpty--; producerBlocked = false; renderPcBuffer();

    hl('pc-p-5');
    pcStatus.textContent = 'Producer: wait(mutex) — locking critical section...';
    await new Promise(r => setTimeout(r, getDelay('pc-speed')));
    pcMutex = 0; renderPcBuffer();

    hl('pc-p-6');
    pcStatus.textContent = 'Producer: add_to_buffer() — writing item 🟢';
    await new Promise(r => setTimeout(r, getDelay('pc-speed')));
    buffer.push(Math.floor(Math.random() * 100));
    pcMutex = 1; renderPcBuffer();

    hl('pc-p-7');
    pcStatus.textContent = 'Producer: signal(mutex) — releasing critical section';
    await new Promise(r => setTimeout(r, getDelay('pc-speed')));

    hl('pc-p-8');
    pcFull++; renderPcBuffer();
    
    if (consumerBlocked) {
      pcStatus.textContent = 'Producer: signal(full) 🔔 — WAKE-UP CALL sent to Consumer!';
      await new Promise(r => setTimeout(r, getDelay('pc-speed')));

      showToast('full', '🔔', 'signal(full) sent!', 'Producer → Consumer WAKE-UP CALL');
      showWakeArrow('to-consumer');
      addLog(pcSignalLog, 'sig-full', '🟢', 'signal(full) → Consumer WOKEN  item=' + buffer[buffer.length - 1]);
      pulseBufferSlot(buffer.length - 1);

      consumerBlocked = false;
      setTimeout(() => {
        pcStatus.textContent = 'Consumer WOKEN by signal(full) — now unblocked and consuming!';
        pcStatus.classList.remove('blocked-state');
      }, 400);
    } else {
      pcStatus.textContent = 'Producer: signal(full) — consumer is already active';
      await new Promise(r => setTimeout(r, getDelay('pc-speed')));
      pcStatus.textContent = 'Producer done ✅';
    }
  } else {
    producerBlocked = true;
    pcStatus.textContent = 'Buffer FULL ⚠️ — Producer BLOCKED! Awaiting signal(empty) from Consumer...';
    pcStatus.classList.add('blocked-state');
    addLog(pcSignalLog, 'sig-blocked', '⚠️', 'Producer BLOCKED — waiting for signal(empty)');
  }
  hlClear(); pcIsProducing = false;
}

async function consume() {
  if (pcIsProducing || pcIsConsuming) return;
  pcIsConsuming = true;
  pcStatus.classList.remove('blocked-state');

  hl('pc-c-3');
  pcStatus.textContent = 'Consumer: wait(full) — checking for available item...';
  await new Promise(r => setTimeout(r, getDelay('pc-speed')));

  if (pcFull > 0) {
    pcFull--; consumerBlocked = false; renderPcBuffer();

    hl('pc-c-4');
    pcStatus.textContent = 'Consumer: wait(mutex) — locking critical section...';
    await new Promise(r => setTimeout(r, getDelay('pc-speed')));
    pcMutex = 0; renderPcBuffer();

    hl('pc-c-5');
    pcStatus.textContent = 'Consumer: remove_from_buffer() — taking item 🟣';
    await new Promise(r => setTimeout(r, getDelay('pc-speed')));
    const consumed = buffer.shift();
    pcMutex = 1; renderPcBuffer();

    hl('pc-c-6');
    pcStatus.textContent = 'Consumer: signal(mutex) — releasing critical section';
    await new Promise(r => setTimeout(r, getDelay('pc-speed')));

    hl('pc-c-7');
    pcEmpty++; renderPcBuffer();
    
    if (producerBlocked) {
      pcStatus.textContent = 'Consumer: signal(empty) 🔔 — WAKE-UP CALL sent to Producer!';
      await new Promise(r => setTimeout(r, getDelay('pc-speed')));

      showToast('empty', '🔔', 'signal(empty) sent!', 'Consumer → Producer WAKE-UP CALL');
      showWakeArrow('to-producer');
      addLog(pcSignalLog, 'sig-empty', '🟣', 'signal(empty) → Producer WOKEN  consumed=' + consumed);
      pulseBufferSlot(0);

      producerBlocked = false;
      setTimeout(() => {
        pcStatus.textContent = 'Producer WOKEN by signal(empty) — slot freed, now unblocked!';
        pcStatus.classList.remove('blocked-state');
      }, 400);

      hl('pc-c-8');
      pcStatus.textContent = 'Consumer: consume_item(' + consumed + ') ✅';
      await new Promise(r => setTimeout(r, getDelay('pc-speed')));
    } else {
      pcStatus.textContent = 'Consumer: signal(empty) — producer is already active';
      await new Promise(r => setTimeout(r, getDelay('pc-speed')));

      hl('pc-c-8');
      pcStatus.textContent = 'Consumer: consume_item(' + consumed + ') ✅';
      await new Promise(r => setTimeout(r, getDelay('pc-speed')));
    }
  } else {
    consumerBlocked = true;
    pcStatus.textContent = 'Buffer EMPTY ⚠️ — Consumer BLOCKED! Awaiting signal(full) from Producer...';
    pcStatus.classList.add('blocked-state');
    addLog(pcSignalLog, 'sig-blocked', '⚠️', 'Consumer BLOCKED — waiting for signal(full)');
  }
  hlClear(); pcIsConsuming = false;
}

function resetPc() {
  if (pcIsProducing || pcIsConsuming) return;
  if (typeof pcAutoInterval !== 'undefined' && pcAutoInterval) { clearInterval(pcAutoInterval); pcAutoInterval = null; document.getElementById('pc-auto-btn').textContent = '▶ Auto'; document.getElementById('pc-auto-btn').style.background = ''; }
  buffer = []; pcMutex = 1; pcEmpty = bufferSize; pcFull = 0;
  consumerBlocked = false; producerBlocked = false;
  pcStatus.classList.remove('blocked-state');
  pcStatus.textContent = 'Producer and Consumer are idle.';
  pcWakeArrow.classList.remove('show', 'arrow-to-consumer', 'arrow-to-producer');
  clearLog(pcSignalLog, 'No signals sent yet...');
  hlClear(); renderPcBuffer();
}

pcProduceBtn.addEventListener('click', produce);
pcConsumeBtn.addEventListener('click', consume);
pcResetBtn.addEventListener('click', resetPc);

const pcAutoBtn = document.getElementById('pc-auto-btn');
let pcAutoInterval = null;
function togglePcAuto() {
  if (pcAutoInterval) {
    clearInterval(pcAutoInterval);
    pcAutoInterval = null;
    pcAutoBtn.textContent = '▶ Auto';
    pcAutoBtn.style.background = '';
  } else {
    pcAutoBtn.textContent = '⏹ Stop';
    pcAutoBtn.style.background = '#ef4444';
    pcAutoInterval = setInterval(() => {
      if (Math.random() < 0.5) produce();
      else consume();
    }, getDelay('pc-speed') + 500);
  }
}
if (pcAutoBtn) pcAutoBtn.addEventListener('click', togglePcAuto);

let currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);

const themeBtns = document.querySelectorAll('.theme-btn');

function updateThemeButtons() {
  themeBtns.forEach(btn => {
    if (btn.getAttribute('data-mode') === currentTheme) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

themeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentTheme = btn.getAttribute('data-mode');
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('theme', currentTheme);
    updateThemeButtons();
  });
});

updateThemeButtons();

let dpN = 5;
let dpStates      = Array(dpN).fill(0);
let dpChopsticks  = Array(dpN).fill(1);
let dpHungryTicks = Array(dpN).fill(0);
let dpFirstPickSide = Array(dpN).fill('LEFT');
let dpDeadlockCount = 0;
let dpStepCount   = 0;
let dpBusy        = false;
let dpAutoInterval = null;

const dpTable           = document.getElementById('dp-table');
const dpStatus          = document.getElementById('dp-status');
const dpChopsticksEl    = document.getElementById('dp-chopsticks');
const dpStepCountEl     = document.getElementById('dp-step-count');
const dpDeadlockCountEl = document.getElementById('dp-deadlock-count');
const dpTickBtn         = document.getElementById('dp-tick-btn');
const dpAutoBtn         = document.getElementById('dp-auto-btn');
const dpResetBtn        = document.getElementById('dp-reset-btn');
const dpDeadlockAlert   = document.getElementById('dp-deadlock-alert');
const dpEventLog        = document.getElementById('dp-event-log');
const dpNInput          = document.getElementById('dp-n-input');
const dpPreventCb       = document.getElementById('dp-prevent-cb');
const dpStarveBars      = document.getElementById('dp-starve-bars');

function renderDpTable() {
  if (dpStarveBars && dpStarveBars.children.length !== dpN) {
    let HTML = '';
    for(let i=0; i<dpN; i++) {
      HTML += `<div class="starve-bar-row"><span>P${i}</span><div class="starve-bar-outer"><div class="starve-bar-inner" id="dp-starve-${i}"></div></div><span class="starve-val" id="dp-starve-val-${i}">0</span></div>`;
    }
    dpStarveBars.innerHTML = HTML;
  }

  dpTable.innerHTML = '';
  const R = 110;
  for (let i = 0; i < dpN; i++) {
    const angle = (i * (360 / dpN) - 90) * (Math.PI / 180);
    const x = R * Math.cos(angle) + 150;
    const y = R * Math.sin(angle) + 150;
    const phil = document.createElement('div');
    phil.className = 'philosopher';
    if (dpStates[i] === 0) phil.classList.add('thinking');
    else if (dpStates[i] === 1) phil.classList.add('hungry');
    else if (dpStates[i] === 3) phil.classList.add('holding-left');
    else if (dpStates[i] === 2) phil.classList.add('eating');
    phil.style.left = x + 'px';
    phil.style.top  = y + 'px';
    phil.textContent = 'P' + i;
    if (dpHungryTicks[i] >= 3) {
      const badge = document.createElement('div');
      badge.style.cssText = 'position:absolute;top:-6px;right:-6px;background:#ef4444;color:#fff;border-radius:50%;width:16px;height:16px;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;';
      badge.textContent = dpHungryTicks[i];
      phil.style.position = 'absolute';
      phil.appendChild(badge);
    }
    dpTable.appendChild(phil);
  }
  for (let i = 0; i < dpN; i++) {
    const angle = ((i - 0.5) * (360 / dpN) - 90) * (Math.PI / 180);
    const rChop = 60;
    const x = rChop * Math.cos(angle) + 150;
    const y = rChop * Math.sin(angle) + 150;
    const chop = document.createElement('div');
    chop.className = 'chopstick';
    if (dpChopsticks[i] === 0) chop.classList.add('taken');
    chop.style.left = x + 'px';
    chop.style.top  = y + 'px';
    const rotation = angle * (180 / Math.PI) + 90;
    chop.style.transform = 'translate(-50%,-50%) rotate(' + rotation + 'deg)';
    dpTable.appendChild(chop);
  }
  const avail = dpChopsticks.filter(c => c === 1).length;
  dpChopsticksEl.textContent    = avail;
  dpStepCountEl.textContent     = dpStepCount;
  dpDeadlockCountEl.textContent = dpDeadlockCount;

  const maxStarve = Math.max(...dpHungryTicks, 5);
  for (let i = 0; i < dpN; i++) {
    const bar = document.getElementById('dp-starve-' + i);
    const val = document.getElementById('dp-starve-val-' + i);
    if (bar) {
      const pct = Math.min((dpHungryTicks[i] / maxStarve) * 100, 100);
      bar.style.width = pct + '%';
      if (dpHungryTicks[i] >= 5)      bar.style.background = 'linear-gradient(90deg,#ef4444,#dc2626)';
      else if (dpHungryTicks[i] >= 3) bar.style.background = 'linear-gradient(90deg,#f59e0b,#ef4444)';
      else                             bar.style.background = 'linear-gradient(90deg,#10b981,#f59e0b)';
    }
    if (val) val.textContent = dpHungryTicks[i];
  }
}

function checkDeadlock() {
  const allBlocked = dpStates.every(s => s === 1 || s === 3);
  if (allBlocked) {
    let anyCanEat = false;
    for (let i = 0; i < dpN; i++) {
      const left = i;
      const right = (i + 1) % dpN;
      const isOdd = (i % 2 !== 0);
      const usePrevention = dpPreventCb ? dpPreventCb.checked : false;
      const firstStr = usePrevention ? (isOdd ? 'RIGHT' : 'LEFT') : dpFirstPickSide[i];
      const firstPick = (firstStr === 'LEFT') ? left : right;
      const secondPick = (firstStr === 'LEFT') ? right : left;
      if (dpStates[i] === 1 && dpChopsticks[firstPick] === 1) { anyCanEat = true; break; }
      if (dpStates[i] === 3 && dpChopsticks[secondPick] === 1) { anyCanEat = true; break; }
    }
    if (!anyCanEat) {
      dpDeadlockAlert.classList.add('show');
      dpTable.classList.add('deadlock-glow');
      dpDeadlockCount++;
      showToast('deadlock', '💀', 'DEADLOCK DETECTED!', 'All 5 philosophers stuck — no one can eat');
      addLog(dpEventLog, 'sig-deadlock', '💀', 'DEADLOCK — no available chopsticks');
      return true;
    }
  }
  dpDeadlockAlert.classList.remove('show');
  dpTable.classList.remove('deadlock-glow');
  return false;
}

async function randomDpStep() {
  if (dpBusy) return;
  dpBusy = true;
  dpStepCount++;

  let i = Math.floor(Math.random() * dpN);
  let state = dpStates[i];

  if (state === 0) {
    hl('dp-p-3');
    await new Promise(r => setTimeout(r, getDelay('dp-speed')));
    dpStates[i] = 1;
    dpHungryTicks[i] = 0;
    
    const side = Math.random() < 0.5 ? 'LEFT' : 'RIGHT';
    dpFirstPickSide[i] = side;
    
    dpStatus.textContent = 'Philosopher ' + i + ' is THINKING → HUNGRY (' + side + ' first)';
    addLog(dpEventLog, 'sig-blocked', '🟡', 'Philosopher ' + i + ' is HUNGRY (waiting for ' + side + ')');

  } else if (state === 1) {
    const left  = i;
    const right = (i + 1) % dpN;
    const isOdd = (i % 2 !== 0);
    const usePrevention = dpPreventCb ? dpPreventCb.checked : false;
    const firstStr = usePrevention ? (isOdd ? 'RIGHT' : 'LEFT') : dpFirstPickSide[i];
    const firstPick = (firstStr === 'LEFT') ? left : right;

    hl('dp-p-4');
    await new Promise(r => setTimeout(r, getDelay('dp-speed')));
    dpHungryTicks[i]++;

    if (firstPick !== left && firstPick !== right) { console.error('ERROR: Philosopher ' + i + ' tried to pick unassigned chopstick ' + firstPick); }

    if (dpChopsticks[firstPick] === 1) {
      dpChopsticks[firstPick] = 0;
      dpStates[i] = 3; // Holding first chopstick
      dpStatus.textContent = 'Philosopher ' + i + ' picked ' + firstStr + ' chopstick ' + firstPick;
      addLog(dpEventLog, 'sig-think', '🥢', 'Philosopher ' + i + ' picked ' + firstStr + ' chopstick ' + firstPick);
    }

  } else if (state === 3) {
    const left  = i;
    const right = (i + 1) % dpN;
    const isOdd = (i % 2 !== 0);
    const usePrevention = dpPreventCb ? dpPreventCb.checked : false;
    const firstStr = usePrevention ? (isOdd ? 'RIGHT' : 'LEFT') : dpFirstPickSide[i];
    const secondStr = (firstStr === 'LEFT') ? 'RIGHT' : 'LEFT';
    const secondPick = (secondStr === 'LEFT') ? left : right;
    
    hl('dp-p-5');
    await new Promise(r => setTimeout(r, getDelay('dp-speed')));
    dpHungryTicks[i]++;

    if (secondPick !== left && secondPick !== right) { console.error('ERROR: Philosopher ' + i + ' tried to pick unassigned chopstick ' + secondPick); }

    if (dpChopsticks[secondPick] === 1) {
      dpChopsticks[secondPick] = 0;
      dpStates[i] = 2; // Eating
      dpHungryTicks[i] = 0;
      dpStatus.textContent = 'Philosopher ' + i + ' picked ' + secondStr + ' chopstick ' + secondPick + ' → Philosopher ' + i + ' is EATING 🍜';
      hl('dp-p-6');
      await new Promise(r => setTimeout(r, getDelay('dp-speed')));
      addLog(dpEventLog, 'sig-eat', '🍜', 'Philosopher ' + i + ' is EATING');
      showToast('signal', '🍜', 'Philosopher ' + i + ' is EATING!', 'Has both left (' + left + ') and right (' + right + ') chopsticks.');
    }

  } else if (state === 2) {
    const left  = i;
    const right = (i + 1) % dpN;
    hl('dp-p-7');
    await new Promise(r => setTimeout(r, getDelay('dp-speed')));
    dpChopsticks[left]  = 1;

    hl('dp-p-8');
    await new Promise(r => setTimeout(r, getDelay('dp-speed')));
    dpChopsticks[right] = 1;

    dpStates[i] = 0;
    dpStatus.textContent = 'Philosopher ' + i + ' is THINKING';
    addLog(dpEventLog, 'sig-think', '💭', 'Philosopher ' + i + ' is THINKING (released chopsticks)');

    const nb1 = (i + dpN - 1) % dpN;
    const nb2 = (i + 1) % dpN;
    let woken = [];
    if (dpStates[nb1] === 1 || dpStates[nb1] === 3) woken.push('P' + nb1);
    if (dpStates[nb2] === 1 || dpStates[nb2] === 3) woken.push('P' + nb2);
    if (woken.length) {
      showToast('wakeup', '🔔', 'Chopsticks Released!', woken.join(', ') + ' may now acquire them');
      addLog(dpEventLog, 'sig-eat', '🔔', woken.join(', ') + ' potentially unblocked');
    }
  }

  renderDpTable();
  checkDeadlock();
  hlClear();
  dpBusy = false;
}

function toggleDpAuto() {
  if (dpAutoInterval) {
    clearInterval(dpAutoInterval);
    dpAutoInterval = null;
    dpAutoBtn.textContent = '▶ Auto';
    dpAutoBtn.style.background = '';
  } else {
    dpAutoBtn.textContent = '⏹ Stop';
    dpAutoBtn.style.background = '#ef4444';
    dpAutoInterval = setInterval(randomDpStep, getDelay('dp-speed') + 300);
  }
}

function resetDp() {
  if (dpAutoInterval) { clearInterval(dpAutoInterval); dpAutoInterval = null; dpAutoBtn.textContent = '▶ Auto'; dpAutoBtn.style.background = ''; }
  
  if (dpNInput) {
    let pVal = parseInt(dpNInput.value, 10);
    if (isNaN(pVal) || pVal < 3) pVal = 3;
    if (pVal > 10) pVal = 10;
    dpNInput.value = pVal;
    dpN = pVal;
  }
  
  dpStates      = Array(dpN).fill(0);
  dpChopsticks  = Array(dpN).fill(1);
  dpHungryTicks = Array(dpN).fill(0);
  dpFirstPickSide = Array(dpN).fill('LEFT');
  dpDeadlockCount = 0;
  dpStepCount   = 0;
  dpBusy        = false;
  dpDeadlockAlert.classList.remove('show');
  dpTable.classList.remove('deadlock-glow');
  dpStatus.textContent = 'All philosophers are thinking.';
  clearLog(dpEventLog, 'No events yet...');
  hlClear();
  renderDpTable();
}

dpTickBtn.addEventListener('click', randomDpStep);
dpAutoBtn.addEventListener('click', toggleDpAuto);
dpResetBtn.addEventListener('click', resetDp);
if (dpNInput) dpNInput.addEventListener('change', resetDp);
if (dpPreventCb) dpPreventCb.addEventListener('change', resetDp);

let rwMutex       = 1, rwWrt = 1, rwReadCount = 0;
let activeReaders = 0, activeWriters = 0;
let rwQueue       = [];
let rwBusy        = false;
let rwWritersWaiting = 0;

const rwReadReqBtn    = document.getElementById('rw-read-req-btn');
const rwWriteReqBtn   = document.getElementById('rw-write-req-btn');
const rwReadEndBtn    = document.getElementById('rw-read-end-btn');
const rwWriteEndBtn   = document.getElementById('rw-write-end-btn');
const rwResetBtn      = document.getElementById('rw-reset-btn');
const rwStatus        = document.getElementById('rw-status');
const rwMutexEl       = document.getElementById('rw-mutex');
const rwWrtEl         = document.getElementById('rw-wrt');
const rwReadcntEl     = document.getElementById('rw-readcnt');
const rwWritersWaitEl = document.getElementById('rw-writers-waiting');
const rwDb            = document.getElementById('rw-db');
const rwAgentsArea    = document.getElementById('rw-agents-area');
const rwSignalLog     = document.getElementById('rw-signal-log');
const rwStarveAlert   = document.getElementById('rw-starve-alert');

function renderRw() {
  rwMutexEl.textContent       = rwMutex;
  rwWrtEl.textContent         = rwWrt;
  rwReadcntEl.textContent     = rwReadCount;
  rwWritersWaitEl.textContent = rwWritersWaiting;
  rwAgentsArea.innerHTML = '';

  for (let i = 0; i < rwQueue.length; i++) {
    const a = document.createElement('div');
    a.className = 'rw-agent waiting';
    a.textContent = rwQueue[i].type + ' (waiting)';
    rwAgentsArea.appendChild(a);
  }
  for (let i = 0; i < activeReaders; i++) {
    const a = document.createElement('div');
    a.className = 'rw-agent r-active';
    a.textContent = 'Reader ' + (i + 1);
    rwAgentsArea.appendChild(a);
  }
  for (let i = 0; i < activeWriters; i++) {
    const a = document.createElement('div');
    a.className = 'rw-agent w-active';
    a.textContent = 'Writer';
    rwAgentsArea.appendChild(a);
  }

  if (activeWriters > 0) rwDb.className = 'db writing';
  else if (activeReaders > 0) rwDb.className = 'db reading';
  else rwDb.className = 'db';

  if (rwWritersWaiting > 0 && activeReaders > 0) {
    rwStarveAlert.classList.add('show');
  } else {
    rwStarveAlert.classList.remove('show');
  }
}

async function processRwQueue() {
  if (rwBusy) return;
  rwBusy = true;
  if (rwQueue.length > 0) {
    const nextReq = rwQueue[0];

    if (nextReq.type === 'Reader') {
      hl('rw-r-2');
      await new Promise(r => setTimeout(r, getDelay('rw-speed')));

      if (rwWrt === 1) {
        rwMutex = 0; renderRw();
        hl('rw-r-3');
        await new Promise(r => setTimeout(r, getDelay('rw-speed')));
        rwReadCount++;

        hl('rw-r-4');
        await new Promise(r => setTimeout(r, getDelay('rw-speed')));
        if (rwReadCount === 1) rwWrt = 0;

        hl('rw-r-5');
        await new Promise(r => setTimeout(r, getDelay('rw-speed')));
        rwMutex = 1;
        rwQueue.shift();
        activeReaders++;
        rwStatus.textContent = 'Reader #' + activeReaders + ' entered database — reading 📖';
        renderRw();
        addLog(rwSignalLog, 'sig-read', '📖', 'Reader entered DB (readCount=' + rwReadCount + ', wrt=' + rwWrt + ')');

        hl('rw-r-6');
        await new Promise(r => setTimeout(r, getDelay('rw-speed')));
      } else {
        rwStatus.textContent = 'Reader BLOCKED — Writer currently holds the DB lock.';
        addLog(rwSignalLog, 'sig-blocked', '⏳', 'Reader blocked — wrt=0 (writer active)');
      }

    } else if (nextReq.type === 'Writer') {
      hl('rw-w-2');
      await new Promise(r => setTimeout(r, getDelay('rw-speed')));

      if (rwWrt === 1 && activeReaders === 0) {
        rwWrt = 0;
        rwQueue.shift();
        rwWritersWaiting = Math.max(0, rwWritersWaiting - 1);
        activeWriters++;
        rwStatus.textContent = 'Writer entered database — writing ✏️';
        renderRw();
        addLog(rwSignalLog, 'sig-write', '✏️', 'Writer entered DB exclusively (wrt=0, readers=0)');
        showToast('signal', '✏️', 'Writer Acquired DB Lock', 'Exclusive write access granted via wait(wrt)');

        hl('rw-w-3');
        await new Promise(r => setTimeout(r, getDelay('rw-speed')));
      } else {
        rwWritersWaiting++;
        rwStatus.textContent = 'Writer BLOCKED — DB is busy (readers=' + activeReaders + ', wrt=' + rwWrt + ')';
        addLog(rwSignalLog, 'sig-blocked', '⏳', 'Writer blocked — DB busy (readers=' + activeReaders + ')');
        if (activeReaders > 0) {
          showToast('deadlock', '⚠️', 'Writer Starvation Risk!', 'Writer waiting while ' + activeReaders + ' reader(s) active');
        }
      }
    }
  }
  hlClear();
  rwBusy = false;
}

function reqRead() {
  rwQueue.push({ type: 'Reader' });
  rwStatus.textContent = 'Reader requested database access.';
  renderRw();
  processRwQueue();
}

function reqWrite() {
  rwQueue.push({ type: 'Writer' });
  rwStatus.textContent = 'Writer requested database access.';
  renderRw();
  processRwQueue();
}

async function endRead() {
  if (activeReaders === 0) return;

  hl('rw-r-7');
  await new Promise(r => setTimeout(r, getDelay('rw-speed')));
  activeReaders--;
  rwMutex = 0; renderRw();

  hl('rw-r-8');
  await new Promise(r => setTimeout(r, getDelay('rw-speed')));
  rwReadCount--;

  hl('rw-r-9');
  await new Promise(r => setTimeout(r, getDelay('rw-speed')));

  if (rwReadCount === 0) {
    rwWrt = 1;
    rwStatus.textContent = 'Last reader left → signal(wrt) 🔔 — WAKE-UP CALL sent to Writers!';
    addLog(rwSignalLog, 'sig-wrt', '🔔', 'signal(wrt) → Writer WOKEN (readCount=0, last reader exited)');
    showToast('wakeup', '🔔', 'signal(wrt) sent!', 'Last reader exited → Writer is now unblocked');
  } else {
    rwStatus.textContent = 'Reader left DB. ' + rwReadCount + ' reader(s) still active.';
  }

  hl('rw-r-10');
  await new Promise(r => setTimeout(r, getDelay('rw-speed')));
  rwMutex = 1;
  renderRw();
  hlClear();
  setTimeout(processRwQueue, 500);
}

async function endWrite() {
  if (activeWriters === 0) return;

  hl('rw-w-4');
  await new Promise(r => setTimeout(r, getDelay('rw-speed')));
  activeWriters--;

  rwWrt = 1;
  const nextInQueue = rwQueue.length > 0 ? rwQueue[0].type : null;
  rwStatus.textContent = 'Writer done → signal(wrt) 🔔 — WAKE-UP CALL sent!';
  addLog(rwSignalLog, 'sig-wrt', '🔔', 'signal(wrt) → ' + (nextInQueue ? nextInQueue + ' WOKEN' : 'DB now free'));
  showToast('wakeup', '🔔', 'signal(wrt) sent!', 'Writer released DB lock → ' + (nextInQueue || 'No one') + ' unblocked');

  renderRw();
  hlClear();
  setTimeout(processRwQueue, 500);
}

function resetRw() {
  if (rwBusy) return;
  rwMutex = 1; rwWrt = 1; rwReadCount = 0;
  activeReaders = 0; activeWriters = 0; rwWritersWaiting = 0;
  rwQueue = [];
  rwStarveAlert.classList.remove('show');
  hlClear();
  rwStatus.textContent = 'Database is idle.';
  clearLog(rwSignalLog, 'No signals sent yet...');
  renderRw();
}

rwReadReqBtn.addEventListener('click', reqRead);
rwWriteReqBtn.addEventListener('click', reqWrite);
rwReadEndBtn.addEventListener('click', endRead);
rwWriteEndBtn.addEventListener('click', endWrite);
rwResetBtn.addEventListener('click', resetRw);

const pages    = document.querySelectorAll('.page');
const navItems = document.querySelectorAll('#nav-list li');

function switchPage(target) {
  let found = false;
  pages.forEach(p => { if (p.id === target) { p.classList.add('active'); found = true; } else p.classList.remove('active'); });
  if (!found && target !== 'home') pages[0].classList.add('active');
  navItems.forEach(n => n.classList.toggle('active', n.getAttribute('data-target') === target));
}

navItems.forEach(n => n.addEventListener('click', () => switchPage(n.getAttribute('data-target'))));
document.querySelectorAll('.card[data-link]').forEach(c => c.addEventListener('click', () => switchPage(c.getAttribute('data-link'))));

renderPcBuffer();
renderDpTable();
renderRw();
