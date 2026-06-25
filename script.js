// Core Storage Functions
const Storage = {
  get: (key) => JSON.parse(localStorage.getItem(key)) || null,
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  init: () => {
    if (!Storage.get('penmaba_progress')) Storage.set('penmaba_progress', {});
    if (!Storage.get('penmaba_vocab')) Storage.set('penmaba_vocab', []);
    if (!Storage.get('current_paket')) Storage.set('current_paket', 1);
  }
};

// Global State
let currentQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {};
let currentPaket = 1;
let examTimer = null;
let timeLeft = 45 * 60; // 45 minutes
let isTranslationVisible = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  Storage.init();
  const path = window.location.pathname;
  
  if (path.includes('dashboard')) {
    initDashboard();
  } else if (path.includes('study')) {
    initStudy();
  } else if (path.includes('result')) {
    initResult();
  }
});

// Dashboard Logic
function initDashboard() {
  const progress = Storage.get('penmaba_progress');
  const vocab = Storage.get('penmaba_vocab');
  
  // Calculate average score
  let totalScore = 0;
  let completedCount = 0;
  
  const timelineContainer = document.getElementById('timelineContainer');
  timelineContainer.innerHTML = ''; // clear

  // Render 3 pakets dynamically
  for (let i = 1; i <= 3; i++) {
    const isCompleted = progress[i] !== undefined;
    const score = isCompleted ? progress[i] : 0;
    
    if (isCompleted) {
      totalScore += score;
      completedCount++;
    }

    const itemHTML = `
      <div class="timeline-item">
        <div class="timeline-dot" style="${isCompleted ? 'background: var(--primary); border-color: var(--card-bg);' : 'background: var(--card-bg); border-color: var(--card-border);'}"></div>
        <div class="glass-card" style="padding: 16px;">
          <div class="flex justify-between items-center mb-2">
            <h4 class="font-bold">Paket ${i}</h4>
            ${isCompleted ? 
              `<span class="badge" style="background: var(--primary);">Completed</span>` : 
              `<span class="badge" style="background: var(--card-bg); color: var(--text-secondary); border: 1px solid var(--card-border);">Belum Selesai</span>`
            }
          </div>
          <p class="text-sm text-secondary mb-3">Literasi Bahasa Inggris</p>
          <div class="flex justify-between items-center">
            <span class="font-bold text-accent">${isCompleted ? score + '/100' : '-/100'}</span>
            <button class="btn btn-primary text-xs" style="padding: 6px 12px;" onclick="startPaket(${i})">
              ${isCompleted ? 'Ulangi' : 'Mulai'}
            </button>
          </div>
        </div>
      </div>
    `;
    timelineContainer.innerHTML += itemHTML;
  }

  const avgScore = completedCount > 0 ? Math.round(totalScore / completedCount) : 0;
  
  document.getElementById('totalScore').innerText = avgScore;
  document.getElementById('totalVocab').innerText = vocab.length;

  // Render Vocab
  const vocabList = document.getElementById('vocabList');
  vocabList.innerHTML = '';
  if (vocab.length === 0) {
    vocabList.innerHTML = '<p class="text-sm text-secondary text-center py-4">Belum ada vocabulary yang disimpan.</p>';
  } else {
    // Show last 5 vocabs
    vocab.slice().reverse().slice(0, 5).forEach(v => {
      vocabList.innerHTML += `
        <div class="p-3 border rounded border-card-border" style="border: 1px solid var(--card-border); padding: 12px; border-radius: var(--radius-sm);">
          <div class="font-bold text-primary">${v.kata}</div>
          <div class="text-sm text-secondary">${v.arti}</div>
        </div>
      `;
    });
  }
}

window.startPaket = (paketId) => {
  Storage.set('current_paket', paketId);
  window.location.href = 'study.html';
};

// Study Logic
async function initStudy() {
  currentPaket = Storage.get('current_paket') || 1;
  const titleEl = document.getElementById('paketTitle');
  if (titleEl) titleEl.innerText = currentPaket;
  
  try {
    const response = await fetch(`data/paket${currentPaket}.json`);
    const data = await response.json();
    currentQuestions = data;
    
    // Validate if data is empty
    if(!currentQuestions || currentQuestions.length === 0) {
       document.getElementById('qText').innerHTML = "Maaf, soal untuk paket ini belum tersedia. Silakan kembali ke Dashboard.";
       return;
    }
    
    currentQuestionIndex = 0;
    userAnswers = {};
    
    renderQuestionNav();
    renderQuestion();
    startTimer();
  } catch (err) {
    console.error("Failed loading data", err);
    document.getElementById('qText').innerHTML = "Gagal memuat soal. Pastikan Anda menjalankan website ini menggunakan Live Server.";
  }
}

function renderQuestionNav() {
  const grid = document.getElementById('questionNavGrid');
  grid.innerHTML = '';
  currentQuestions.forEach((q, i) => {
    const div = document.createElement('div');
    div.className = `question-bubble ${i === currentQuestionIndex ? 'active' : ''}`;
    div.innerText = i + 1;
    div.onclick = () => {
      currentQuestionIndex = i;
      renderQuestion();
      renderQuestionNav();
    };
    grid.appendChild(div);
  });
  
  const progress = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
  document.getElementById('progressBar').style.width = `${progress}%`;
}

function renderQuestion() {
  const q = currentQuestions[currentQuestionIndex];
  if(!q) return;

  document.getElementById('qCategory').innerText = q.kategori || 'General';
  document.getElementById('qNumber').innerText = `Soal ${currentQuestionIndex + 1}/${currentQuestions.length}`;
  const mobileQNumber = document.getElementById('mobileQNumber');
  if(mobileQNumber) mobileQNumber.innerText = `${currentQuestionIndex + 1}/${currentQuestions.length}`;
  
  document.getElementById('qTitle').innerText = q.judul_teks || '';
  
  // Format text (handling newlines)
  const textHtml = (q.teks || "").replace(/\n/g, '<br>');
  document.getElementById('qText').innerHTML = textHtml;
  
  // Handle Text Translation
  const qTextTranslation = document.getElementById('qTextTranslation');
  if(q.terjemahan_teks) {
    qTextTranslation.innerHTML = q.terjemahan_teks.replace(/\n/g, '<br>');
  } else {
    qTextTranslation.innerHTML = "Terjemahan teks belum tersedia secara khusus di paket ini. Cek bagian Penjelasan untuk bantuan arti.";
  }
  
  // Extract Translation from Question if exists (pattern: "... (Translation)")
  let questionMain = String(q.pertanyaan || "");
  let questionTrans = "";
  const qMatch = questionMain.match(/^(.*?)\s*\((.*?)\)\s*$/);
  if (qMatch) {
    questionMain = qMatch[1];
    questionTrans = qMatch[2];
  }
  
  document.getElementById('qQuestion').innerText = questionMain;
  
  const qQuestionTransEl = document.getElementById('qQuestionTranslation');
  if (questionTrans) {
    qQuestionTransEl.innerText = "(" + questionTrans + ")";
    // Visibility handled by updateTranslationVisibility() later
  } else {
    qQuestionTransEl.innerText = "";
  }

  const optContainer = document.getElementById('optionsContainer');
  optContainer.innerHTML = '';
  
  if (q.pilihan) {
      Object.entries(q.pilihan).forEach(([key, val]) => {
        let optMain = String(val || "");
        let optTrans = "";
        const optMatch = optMain.match(/^(.*?)\s*\((.*?)\)\s*$/);
        if (optMatch) {
          optMain = optMatch[1];
          optTrans = optMatch[2];
        }

        const isSelected = userAnswers[currentQuestionIndex] === key;
        const div = document.createElement('div');
        div.className = `option-item ${isSelected ? 'selected' : ''}`;
        div.onclick = () => selectOption(key);
        
        div.innerHTML = `
          <div class="option-letter">${key}</div>
          <div style="padding-top: 4px;">
            <div class="opt-main">${optMain}</div>
            ${optTrans ? `<div class="opt-trans text-xs text-secondary" style="margin-top: 4px; display: none; color: var(--accent); font-style: italic;">(${optTrans})</div>` : ''}
          </div>
        `;
        optContainer.appendChild(div);
      });
  }

  // Hide explanation initially
  document.getElementById('explanationCard').classList.remove('active');
  
  // If already answered, show explanation
  if (userAnswers[currentQuestionIndex]) {
    showExplanation();
  }

  updateTranslationVisibility();
}

window.toggleTranslation = () => {
  isTranslationVisible = !isTranslationVisible;
  updateTranslationVisibility();
};

function updateTranslationVisibility() {
  const textTrans = document.getElementById('qTextTranslation');
  const qTrans = document.getElementById('qQuestionTranslation');
  const optTransList = document.querySelectorAll('.opt-trans');
  
  const displayStyle = isTranslationVisible ? 'block' : 'none';
  
  if (textTrans) textTrans.style.display = displayStyle;
  
  if (qTrans && qTrans.innerText.trim() !== "") {
    qTrans.style.display = displayStyle;
  }
  
  optTransList.forEach(el => el.style.display = displayStyle);
}

function selectOption(key) {
  userAnswers[currentQuestionIndex] = key;
  renderQuestion(); // Re-render to show selection and explanation
  renderQuestionNav();
}

function showExplanation() {
  const q = currentQuestions[currentQuestionIndex];
  const selected = userAnswers[currentQuestionIndex];
  const correct = q.jawaban_benar;
  
  const expCard = document.getElementById('explanationCard');
  const expText = document.getElementById('explanationText');
  const options = document.querySelectorAll('.option-item');
  
  expCard.classList.add('active');
  
  if (selected === correct) {
    expCard.className = 'status-card active success';
  } else {
    expCard.className = 'status-card active danger';
  }
  
  expText.innerHTML = `<strong>Jawaban Benar: ${correct}</strong><br><br>${q.penjelasan}`;
  
  // Highlight options
  options.forEach((opt) => {
    const letter = opt.querySelector('.option-letter').innerText;
    opt.classList.remove('selected');
    if (letter === correct) opt.classList.add('correct');
    else if (letter === selected && selected !== correct) opt.classList.add('incorrect');
    opt.style.pointerEvents = 'none'; // Disable changing answer
  });
}

window.prevQuestion = () => {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion();
    renderQuestionNav();
  }
}

window.nextQuestion = () => {
  if (currentQuestionIndex < currentQuestions.length - 1) {
    currentQuestionIndex++;
    renderQuestion();
    renderQuestionNav();
  }
}

function startTimer() {
  const timerEl = document.getElementById('timer');
  const mobileTimerEl = document.getElementById('mobileTimer');
  
  examTimer = setInterval(() => {
    if (timeLeft <= 0) {
      clearInterval(examTimer);
      submitExam();
      return;
    }
    timeLeft--;
    const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const s = (timeLeft % 60).toString().padStart(2, '0');
    const timeStr = `${m}:${s}`;
    
    if (timerEl) timerEl.innerText = timeStr;
    if (mobileTimerEl) mobileTimerEl.innerText = timeStr;
  }, 1000);
}

window.submitExam = () => {
  clearInterval(examTimer);
  
  let correctCount = 0;
  currentQuestions.forEach((q, i) => {
    if (userAnswers[i] === q.jawaban_benar) correctCount++;
  });
  
  const score = Math.round((correctCount / currentQuestions.length) * 100) || 0;
  
  const progress = Storage.get('penmaba_progress');
  // Update score only if it's better or it's the first time
  if (!progress[currentPaket] || score > progress[currentPaket]) {
    progress[currentPaket] = score;
    Storage.set('penmaba_progress', progress);
  }
  
  // Temporary save current result to show on result page
  Storage.set('last_score', score);
  window.location.href = 'result.html';
}

// Result Logic
function initResult() {
  const score = Storage.get('last_score') || 0;
  const paket = Storage.get('current_paket') || 1;
  
  document.getElementById('resScore').innerText = score;
  document.getElementById('resPaket').innerText = paket;
}
