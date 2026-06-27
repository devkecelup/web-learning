// ─────────────────────────────────────────────
//  STORAGE
// ─────────────────────────────────────────────
const Storage = {
  get: (key) => JSON.parse(localStorage.getItem(key)) || null,
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  init: () => {
    if (!Storage.get('penmaba_progress')) Storage.set('penmaba_progress', {});
    if (!Storage.get('math_progress'))    Storage.set('math_progress', {});
    if (!Storage.get('current_paket'))    Storage.set('current_paket', 1);
    if (!Storage.get('current_subject'))  Storage.set('current_subject', 'inggris');
    if (!Storage.get('score_history'))    Storage.set('score_history', []);
  }
};

// ─────────────────────────────────────────────
//  GLOBAL STATE
// ─────────────────────────────────────────────
let currentQuestions     = [];
let currentQuestionIndex = 0;
let userAnswers          = {};
let currentPaket         = 1;
let currentSubject       = 'inggris';
let examTimer            = null;
let timeLeft             = 45 * 60;
let isTranslationVisible = false;
let progressChart        = null;
let chartFilter          = 'all';

// ─────────────────────────────────────────────
//  ROUTER
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Storage.init();
  const path = window.location.pathname;
  if (path.includes('dashboard')) initDashboard();
  else if (path.includes('study'))  initStudy();
  else if (path.includes('result')) initResult();
});

// ═══════════════════════════════════════════════
//  DASHBOARD
// ═══════════════════════════════════════════════
function initDashboard() {
  const progress     = Storage.get('penmaba_progress') || {};
  const mathProgress = Storage.get('math_progress')    || {};
  const history      = Storage.get('score_history')    || [];

  // Stats – safe Number() conversion to prevent NaN from stale localStorage data
  let totalScore = 0, completedCount = 0;
  Object.values(progress).forEach(s => {
    const n = Number(s);
    if (!isNaN(n)) { totalScore += n; completedCount++; }
  });
  Object.values(mathProgress).forEach(s => {
    const n = Number(s);
    if (!isNaN(n)) { totalScore += n; completedCount++; }
  });
  const avgScore = completedCount > 0 ? Math.round(totalScore / completedCount) : 0;

  document.getElementById('totalScore').innerText    = avgScore;
  document.getElementById('totalSessions').innerText = history.length;
  document.getElementById('totalDone').innerText     = completedCount;

  renderEnglishModules(progress);
  renderMathModules(mathProgress);
  renderChart(history, 'all');

  if (window.lucide) lucide.createIcons();
}

// ── English module rows
function renderEnglishModules(progress) {
  const container = document.getElementById('timelineContainer');
  if (!container) return;
  container.innerHTML = '';

  for (let i = 1; i <= 3; i++) {
    const done  = progress[i] !== undefined;
    const score = done ? progress[i] : null;
    const col   = score >= 80 ? 'var(--accent)' : score >= 60 ? 'var(--math)' : 'var(--danger)';

    container.innerHTML += `
      <div class="module-row">
        <div class="module-num module-num-eng">P${i}</div>
        <div class="module-info">
          <div class="module-label">Paket ${i} — Reading &amp; Grammar</div>
          ${done
            ? `<div class="module-bar-wrap"><div class="module-bar-fill" style="width:${score}%;background:${col};"></div></div>`
            : `<div class="module-sub">Belum dikerjakan</div>`
          }
        </div>
        <div class="module-score" style="color:${done ? col : 'var(--muted)'};">${done ? score : '—'}</div>
        <button class="btn ${done ? 'btn-outline' : 'btn-primary'} text-xs"
          style="padding:7px 16px;flex-shrink:0;font-size:.78rem;"
          onclick="startPaket(${i},'inggris')">${done ? 'Ulangi' : 'Mulai'}</button>
      </div>`;
  }
}

// ── Math module rows
function renderMathModules(mathProgress) {
  const container = document.getElementById('mathTimelineContainer');
  if (!container) return;
  container.innerHTML = '';

  const mathPakets = [
    { id: 'pm1', label: 'Paket 1', desc: '20 soal penalaran & aritmatika' }
  ];

  mathPakets.forEach(p => {
    const done  = mathProgress[p.id] !== undefined;
    const score = done ? mathProgress[p.id] : null;
    const col   = score >= 80 ? 'var(--accent)' : score >= 60 ? 'var(--math)' : 'var(--danger)';

    container.innerHTML += `
      <div class="module-row">
        <div class="module-num module-num-math">P1</div>
        <div class="module-info">
          <div class="module-label">${p.label} — ${p.desc}</div>
          ${done
            ? `<div class="module-bar-wrap"><div class="module-bar-fill" style="width:${score}%;background:${col};"></div></div>`
            : `<div class="module-sub">Belum dikerjakan</div>`
          }
        </div>
        <div class="module-score" style="color:${done ? col : 'var(--muted)'};">${done ? score : '—'}</div>
        <button class="btn text-xs btn-math"
          style="padding:7px 16px;flex-shrink:0;font-size:.78rem;"
          onclick="startPaket('${p.id}','math')">${done ? 'Ulangi' : 'Mulai'}</button>
      </div>`;
  });
}

// ── Chart
function renderChart(history, filter) {
  const canvas  = document.getElementById('progressChart');
  const emptyEl = document.getElementById('chartEmptyState');
  if (!canvas) return;

  let filtered = history;
  if (filter === 'inggris') filtered = history.filter(h => h.subject === 'inggris');
  if (filter === 'math')    filtered = history.filter(h => h.subject === 'math');

  if (filtered.length === 0) {
    canvas.style.display   = 'none';
    emptyEl.style.display  = 'flex';
    if (progressChart) { progressChart.destroy(); progressChart = null; }
    if (window.lucide) lucide.createIcons();
    return;
  }

  canvas.style.display  = 'block';
  emptyEl.style.display = 'none';

  const labels    = filtered.map(h => {
    const d = new Date(h.date);
    return `${d.getDate()}/${d.getMonth()+1} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
  });
  const scores    = filtered.map(h => h.score);
  const dotColors = filtered.map(h => h.subject === 'math' ? '#f0a500' : '#baa1c8');

  if (progressChart) progressChart.destroy();

  progressChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Nilai',
        data: scores,
        borderColor: '#baa1c8',
        backgroundColor: 'rgba(186,161,200,0.07)',
        borderWidth: 2.5,
        pointBackgroundColor: dotColors,
        pointBorderColor: dotColors,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e1d2e',
          titleColor: '#baa1c8',
          bodyColor: '#f0edf5',
          borderColor: 'rgba(186,161,200,0.2)',
          borderWidth: 1,
          callbacks: {
            title: (items) => {
              const idx = items[0].dataIndex;
              const h = filtered[idx];
              return `${h.subject === 'math' ? '📐 Matematika' : '📘 Inggris'} — ${h.paketLabel || ''}`;
            },
            label: (item) => ` Nilai: ${item.raw}/100`
          }
        }
      },
      scales: {
        x: {
          ticks: { color: '#9b97ab', font: { size: 10, family: 'Poppins' }, maxRotation: 30 },
          grid: { color: 'rgba(255,255,255,0.04)' },
          border: { color: 'rgba(255,255,255,0.06)' }
        },
        y: {
          min: 0, max: 100,
          ticks: { color: '#9b97ab', font: { size: 10, family: 'Poppins' }, stepSize: 25 },
          grid: { color: 'rgba(255,255,255,0.05)' },
          border: { color: 'rgba(255,255,255,0.06)' }
        }
      }
    }
  });
}

window.filterChart = (f) => {
  chartFilter = f;
  document.querySelectorAll('.chart-pill').forEach(b => b.classList.remove('active'));
  const map = { all: 'chartFilterAll', inggris: 'chartFilterInggris', math: 'chartFilterMath' };
  document.getElementById(map[f])?.classList.add('active');
  renderChart(Storage.get('score_history') || [], f);
};

window.switchTab = (tab) => {
  document.querySelectorAll('.subject-pill').forEach(t => t.classList.remove('active'));
  ['panelInggris','panelMath'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  if (tab === 'inggris') {
    document.getElementById('tabInggris').classList.add('active');
    document.getElementById('panelInggris').style.display = 'block';
  } else {
    document.getElementById('tabMath').classList.add('active');
    document.getElementById('panelMath').style.display = 'block';
  }
  if (window.lucide) lucide.createIcons();
};

window.startPaket = (paketId, subject) => {
  Storage.set('current_paket', paketId);
  Storage.set('current_subject', subject || 'inggris');
  window.location.href = 'study.html';
};

// ═══════════════════════════════════════════════
//  STUDY PAGE
// ═══════════════════════════════════════════════
async function initStudy() {
  currentPaket   = Storage.get('current_paket')   || 1;
  currentSubject = Storage.get('current_subject')  || 'inggris';

  const titleEl = document.getElementById('paketTitle');
  if (titleEl) titleEl.innerText = currentPaket;

  let fileName, paketLabel;
  if (currentSubject === 'math') {
    const mathFiles = { 'pm1': 'soal_penalaran_matematika.json' };
    fileName    = mathFiles[currentPaket] || 'soal_penalaran_matematika.json';
    paketLabel  = 'Penalaran Matematika – Paket 1';
  } else {
    fileName   = `paket${currentPaket}.json`;
    paketLabel = `Literasi Inggris – Paket ${currentPaket}`;
  }

  const subjectBadge = document.getElementById('subjectBadge');
  if (subjectBadge) subjectBadge.innerText = paketLabel;

  const translateBtn = document.getElementById('translateBtn');
  if (translateBtn) {
    translateBtn.style.display = currentSubject === 'math' ? 'none' : 'inline-flex';
  }

  try {
    const response = await fetch(`data/${fileName}`);
    const data     = await response.json();
    currentQuestions = data;

    if (!currentQuestions || currentQuestions.length === 0) {
      document.getElementById('qText').innerHTML = 'Maaf, soal untuk paket ini belum tersedia.';
      return;
    }

    currentQuestionIndex = 0;
    userAnswers = {};
    renderQuestionNav();
    renderQuestion();
    startTimer();
  } catch (err) {
    console.error('Failed loading data', err);
    document.getElementById('qText').innerHTML = 'Gagal memuat soal. Pastikan menggunakan Live Server.';
  }
}

function renderQuestionNav() {
  // Sidebar bubble grid
  const grid = document.getElementById('questionNavGrid');
  if (grid) {
    grid.innerHTML = '';
    currentQuestions.forEach((q, i) => {
      const div      = document.createElement('div');
      const answered = userAnswers[i] !== undefined;
      div.className  = `question-bubble ${i === currentQuestionIndex ? 'active' : ''} ${answered && i !== currentQuestionIndex ? 'answered' : ''}`;
      div.innerText  = i + 1;
      div.onclick    = () => { currentQuestionIndex = i; renderQuestion(); renderQuestionNav(); };
      grid.appendChild(div);
    });
  }
  const pct = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
  const pb = document.getElementById('progressBar');
  if (pb) pb.style.width = `${pct}%`;

  // Progress dots inside nav bar
  const dotsWrap = document.getElementById('navProgress');
  if (dotsWrap) {
    dotsWrap.innerHTML = '';
    // Only show dots if <= 30 questions (avoid overflow)
    if (currentQuestions.length <= 30) {
      currentQuestions.forEach((_, i) => {
        const dot = document.createElement('div');
        const answered = userAnswers[i] !== undefined;
        dot.className = `nav-dot${answered ? ' answered' : ''}${i === currentQuestionIndex ? ' current' : ''}`;
        dotsWrap.appendChild(dot);
      });
    }
  }

  updateNavButtons();
}

function updateNavButtons() {
  const isFirst    = currentQuestionIndex === 0;
  const isLast     = currentQuestionIndex === currentQuestions.length - 1;
  const isAnswered = userAnswers[currentQuestionIndex] !== undefined;
  const allDone    = Object.keys(userAnswers).length === currentQuestions.length;

  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const label   = document.getElementById('btnNextLabel');
  const icon    = document.getElementById('btnNextIcon');

  if (btnPrev) btnPrev.disabled = isFirst;

  if (btnNext && label) {
    if (isLast) {
      // Last question — show Kirimkan, always enabled after answering
      btnNext.classList.add('is-submit');
      label.textContent = allDone ? 'Kirimkan ✓' : 'Kirimkan';
      btnNext.disabled  = false; // allow submit even if not all answered
      if (icon) icon.setAttribute('data-lucide', 'send');
    } else {
      btnNext.classList.remove('is-submit');
      label.textContent = 'Selanjutnya';
      btnNext.disabled  = !isAnswered;
      if (icon) icon.setAttribute('data-lucide', 'chevron-right');
    }
    // Re-init icons after attribute change
    if (window.lucide) lucide.createIcons();
  }
}

function renderQuestion() {
  const q = currentQuestions[currentQuestionIndex];
  if (!q) return;

  document.getElementById('qCategory').innerText = q.kategori || 'General';
  document.getElementById('qNumber').innerText   = `Soal ${currentQuestionIndex + 1}/${currentQuestions.length}`;
  const mobileQN = document.getElementById('mobileQNumber');
  if (mobileQN) mobileQN.innerText = `${currentQuestionIndex + 1}/${currentQuestions.length}`;

  document.getElementById('qTitle').innerText    = q.judul_teks || '';
  document.getElementById('qText').innerHTML     = (q.teks || '').replace(/\n/g, '<br>');

  const qTextTrans = document.getElementById('qTextTranslation');
  if (qTextTrans) {
    qTextTrans.innerHTML = q.terjemahan_teks
      ? q.terjemahan_teks.replace(/\n/g, '<br>')
      : 'Terjemahan teks belum tersedia. Cek bagian Penjelasan.';
  }

  let questionMain = String(q.pertanyaan || '');
  let questionTrans = '';
  const qMatch = questionMain.match(/^(.*?)\s*\((.*?)\)\s*$/);
  if (qMatch) { questionMain = qMatch[1]; questionTrans = qMatch[2]; }
  document.getElementById('qQuestion').innerText = questionMain;

  const qQTrans = document.getElementById('qQuestionTranslation');
  if (qQTrans) qQTrans.innerText = questionTrans ? `(${questionTrans})` : '';

  const optContainer = document.getElementById('optionsContainer');
  optContainer.innerHTML = '';

  if (q.pilihan) {
    Object.entries(q.pilihan).forEach(([key, val]) => {
      let optMain = String(val || '');
      let optTrans = '';
      const optMatch = optMain.match(/^(.*?)\s*\((.*?)\)\s*$/);
      if (optMatch) { optMain = optMatch[1]; optTrans = optMatch[2]; }

      const isSelected = userAnswers[currentQuestionIndex] === key;
      const div = document.createElement('div');
      div.className = `option-item ${isSelected ? 'selected' : ''}`;
      div.onclick   = () => selectOption(key);
      div.innerHTML = `
        <div class="option-letter">${key}</div>
        <div style="padding-top:3px;">
          <div class="opt-main">${optMain}</div>
          ${optTrans ? `<div class="opt-trans text-xs text-secondary" style="margin-top:4px;display:none;color:var(--accent);font-style:italic;">(${optTrans})</div>` : ''}
        </div>`;
      optContainer.appendChild(div);
    });
  }

  document.getElementById('explanationCard').classList.remove('active');
  document.getElementById('explanationCard').className = 'study-explanation';
  if (userAnswers[currentQuestionIndex]) showExplanation();
  updateTranslationVisibility();
}

window.toggleTranslation = () => {
  isTranslationVisible = !isTranslationVisible;
  updateTranslationVisibility();
};

function updateTranslationVisibility() {
  const display = isTranslationVisible ? 'block' : 'none';
  const textTrans = document.getElementById('qTextTranslation');
  const qTrans    = document.getElementById('qQuestionTranslation');
  if (textTrans) textTrans.style.display = display;
  if (qTrans) {
    // show question translation only if it has content
    qTrans.style.display = (display === 'block' && qTrans.innerText.trim()) ? 'block' : 'none';
  }
  document.querySelectorAll('.opt-trans').forEach(el => el.style.display = display);
}

function selectOption(key) {
  userAnswers[currentQuestionIndex] = key;
  renderQuestion();
  renderQuestionNav();
}

function showExplanation() {
  const q        = currentQuestions[currentQuestionIndex];
  const selected = userAnswers[currentQuestionIndex];
  const correct  = q.jawaban_benar;

  const expCard = document.getElementById('explanationCard');
  const expText = document.getElementById('explanationText');
  const options = document.querySelectorAll('.option-item');

  const isCorrect = selected === correct;
  expCard.className = `study-explanation active ${isCorrect ? 'success' : 'danger'}`;

  expText.innerHTML = `<strong style="color:${isCorrect ? 'var(--accent)' : 'var(--danger)'}">Jawaban Benar: ${correct}</strong><br><br>${(q.penjelasan || '').replace(/\n/g, '<br>')}`;

  options.forEach(opt => {
    const letter = opt.querySelector('.option-letter').innerText;
    opt.classList.remove('selected');
    if (letter === correct) opt.classList.add('correct');
    else if (letter === selected && selected !== correct) opt.classList.add('incorrect');
    opt.style.pointerEvents = 'none';
  });
}

window.prevQuestion = () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion();
    renderQuestionNav();
  }
};

window.nextQuestion = () => {
  if (currentQuestionIndex < currentQuestions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
    renderQuestionNav();
  }
};

// handleNext: enforces answer-before-continue, submits on last question
window.handleNext = () => {
  const isLast     = currentQuestionIndex === currentQuestions.length - 1;
  const isAnswered = userAnswers[currentQuestionIndex] !== undefined;

  if (isLast) {
    // On last question — always allow submit
    submitExam();
    return;
  }

  if (!isAnswered) {
    // Shake the options container to hint user must answer first
    const opts = document.getElementById('optionsContainer');
    if (opts) {
      opts.style.animation = 'none';
      opts.offsetHeight; // reflow
      opts.style.animation = 'shake .4s ease';
    }
    // Flash the button
    const btn = document.getElementById('btnNext');
    if (btn) {
      btn.style.background = 'rgba(255,107,107,0.3)';
      setTimeout(() => { btn.style.background = ''; }, 500);
    }
    return;
  }

  nextQuestion();
};

function startTimer() {
  timeLeft = 45 * 60;
  const timerEl       = document.getElementById('timer');
  const mobileTimerEl = document.getElementById('mobileTimer');

  examTimer = setInterval(() => {
    if (timeLeft <= 0) { clearInterval(examTimer); submitExam(); return; }
    timeLeft--;
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    const str = `${m}:${s}`;
    if (timerEl)       timerEl.innerText       = str;
    if (mobileTimerEl) mobileTimerEl.innerText = str;
  }, 1000);
}

window.submitExam = () => {
  clearInterval(examTimer);

  let correctCount = 0;
  currentQuestions.forEach((q, i) => {
    if (userAnswers[i] === q.jawaban_benar) correctCount++;
  });
  const score = Math.round((correctCount / currentQuestions.length) * 100) || 0;

  // Save best score
  if (currentSubject === 'math') {
    const mp = Storage.get('math_progress') || {};
    if (!mp[currentPaket] || score > mp[currentPaket]) { mp[currentPaket] = score; Storage.set('math_progress', mp); }
  } else {
    const p = Storage.get('penmaba_progress') || {};
    if (!p[currentPaket] || score > p[currentPaket]) { p[currentPaket] = score; Storage.set('penmaba_progress', p); }
  }

  // Push to history
  const history    = Storage.get('score_history') || [];
  const paketLabel = currentSubject === 'math' ? 'Penalaran Mat. Paket 1' : `Inggris Paket ${currentPaket}`;
  history.push({ date: new Date().toISOString(), subject: currentSubject, paket: currentPaket, paketLabel, score });
  Storage.set('score_history', history);

  Storage.set('last_score',   score);
  Storage.set('last_correct', correctCount);
  Storage.set('last_total',   currentQuestions.length);
  window.location.href = 'result.html';
};

// ═══════════════════════════════════════════════
//  RESULT PAGE
// ═══════════════════════════════════════════════
function initResult() {
  const score   = Storage.get('last_score')   || 0;
  const paket   = Storage.get('current_paket') || 1;
  const correct = Storage.get('last_correct') || 0;
  const total   = Storage.get('last_total')   || 0;

  const resScore   = document.getElementById('resScore');
  const resPaket   = document.getElementById('resPaket');
  const resCorrect = document.getElementById('resCorrect');

  if (resScore)   resScore.innerText   = score;
  if (resPaket)   resPaket.innerText   = paket;
  if (resCorrect) resCorrect.innerText = `${correct}/${total}`;
}
