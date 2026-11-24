(function () {
  const { CHAPTERS, MEMORIES, calcDays, nextSpecialDate, createGallery, createTimeline, setChapterMemories } = window.Pacu;

/* ===== CHARACTER MODELS: clone single princess/monkey templates into [data-char] ===== */
document.querySelectorAll('[data-char]').forEach((el) => {
  const tpl = document.getElementById(`tpl-${el.dataset.char}`);
  if (tpl) el.prepend(tpl.content.cloneNode(true));
});

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ===== STARS CANVAS ===== */
(function initStars() {
  const canvas = document.getElementById('starsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];
  const COUNT = 160;
  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
  }
  function create() {
    stars = [];
    for (let i = 0; i < COUNT; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.6 + 0.3,
        a: Math.random(),
        da: (Math.random() * 0.015 + 0.003) * (Math.random() < 0.5 ? 1 : -1),
      });
    }
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const s of stars) {
      s.a += s.da;
      if (s.a <= 0.1 || s.a >= 1) s.da *= -1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,220,240,${s.a})`;
      ctx.fill();
    }
    if (!reducedMotion.matches) requestAnimationFrame(draw);
  }
  resize();
  create();
  draw();
  addEventListener('resize', () => {
    resize();
    create();
    if (reducedMotion.matches) draw();
  });
})();

/* ===== DAYS COUNTER & DATES ===== */
const _today = new Date();
const isValentinesDay = _today.getMonth() === 1 && _today.getDate() === 14;
const isWomensDay = _today.getMonth() === 2 && _today.getDate() === 8;
if (isValentinesDay) document.body.classList.add('is-valentines-day');

const selectorDaysEl = document.getElementById('selectorDays');
if (selectorDaysEl) selectorDaysEl.textContent = calcDays();
const daysNumberEl = document.getElementById('daysNumber');
if (daysNumberEl) daysNumberEl.textContent = calcDays();
const currentDateEl = document.getElementById('currentDate');
if (currentDateEl) {
  currentDateEl.textContent = _today.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/* ===== SELECTOR SCREEN & VISITED PROGRESS ===== */
const selectorScreen = document.getElementById('selectorScreen');
const selectorCardsEl = document.getElementById('selectorCards');
const selectorProgressEl = document.getElementById('selectorProgress');

if (selectorCardsEl) {
  selectorCardsEl.innerHTML = CHAPTERS.map(
    (ch) => `
      <button class="selector-card ${ch.cardClass}" id="${ch.buttonId}" type="button" data-chapter="${ch.id}">
        <div class="selector-card-inner">
          <div class="selector-card-emoji" aria-hidden="true">${ch.emoji}</div>
          <div class="selector-card-title">${ch.titleHtml}</div>
          <div class="selector-card-date">${ch.date}</div>
        </div>
      </button>`,
  ).join('');
}

(function highlightTodayCard() {
  const subtitle = document.querySelector('.selector-subtitle');
  if (!subtitle) return;
  if (isValentinesDay) {
    subtitle.textContent = '🌹 ¡Hoy es Día de San Valentín! 🌹';
    subtitle.style.color = 'rgba(255,140,180,.9)';
  } else if (isWomensDay) {
    subtitle.textContent = '💜 ¡Hoy es Día Internacional de la Mujer! 💜';
    subtitle.style.color = 'rgba(200,140,255,.9)';
  }

  const targetId = isValentinesDay ? 'btnValentine' : isWomensDay ? 'btnWomens' : null;
  if (!targetId) return;
  const btn = document.getElementById(targetId);
  if (!btn) return;
  btn.classList.add('today-highlight');
  const badge = document.createElement('div');
  badge.className = 'selector-card-today-badge';
  badge.textContent = '¡Hoy! 🎉';
  btn.appendChild(badge);
})();

/* ===== BACKGROUND MUSIC ===== */
const setReadingAudio = (function initMusic() {
  const audio = document.getElementById('bgMusic');
  const btn = document.getElementById('musicBtn');
  const gate = document.getElementById('introGate');
  const LOUD = 0.6;
  const SOFT = 0.22;
  let target = LOUD;
  let fade = null;
  audio.volume = LOUD;

  const sync = () => {
    const on = !audio.paused;
    btn.classList.toggle('off', !on);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? 'Pausar música' : 'Reproducir música');
  };
  audio.addEventListener('play', sync);
  audio.addEventListener('pause', sync);
  sync();
  btn.addEventListener('click', () => (audio.paused ? audio.play().catch(() => {}) : audio.pause()));

  document.getElementById('introEnter').addEventListener('click', () => {
    audio.currentTime = 0;
    audio.play().catch(() => {});
    gate.classList.add('leaving');
    selectorScreen.inert = false;
    setTimeout(() => gate.remove(), 700);
    document.getElementById('btnValentine')?.focus({ preventScroll: true });
  });

  // Duck smoothly when a reading/memories view is open. ponytail: iOS ignores volume, so no ducking there.
  return (isReading) => {
    const next = isReading ? SOFT : LOUD;
    if (next === target) return;
    target = next;
    clearInterval(fade);
    fade = setInterval(() => {
      if (Math.abs(target - audio.volume) <= 0.02) {
        audio.volume = target;
        clearInterval(fade);
      } else {
        audio.volume += Math.sign(target - audio.volume) * 0.02;
      }
    }, 40);
  };
})();

/* ===== HYDRATE PHOTO GALLERIES FROM DATA ===== */
const galleries = {};
document.querySelectorAll('[data-gallery]').forEach((el) => {
  const key = el.dataset.gallery;
  if (MEMORIES[key]) galleries[key] = createGallery(el, MEMORIES[key]);
});

/* ===== CENTRAL SCENE ROUTER ===== */
const globalBackBtn = document.getElementById('globalBackBtn');
const sceneWomens = document.getElementById('sceneWomens');
const sceneStudy = document.getElementById('sceneStudy');
const sceneTarapoto = document.getElementById('sceneTarapoto');
const sceneHuayhuash = document.getElementById('sceneHuayhuash');
const sceneLawyer = document.getElementById('sceneLawyer');
const scenePapa = document.getElementById('scenePapa');
const sceneFinale = document.getElementById('sceneFinale');
const cover = document.getElementById('cover');
const scene2 = document.getElementById('scene2');
const content = document.getElementById('content');

let sceneTransitionTimer = null;
let sceneMenuTrigger = null;

function openScene(starter) {
  if (selectorScreen.classList.contains('hidden')) return;
  sceneMenuTrigger = document.activeElement;
  selectorScreen.classList.add('hidden');
  selectorScreen.inert = true;
  clearTimeout(sceneTransitionTimer);
  sceneTransitionTimer = setTimeout(() => {
    sceneTransitionTimer = null;
    if (globalBackBtn) globalBackBtn.classList.add('show');
    starter();
    if (globalBackBtn) globalBackBtn.focus({ preventScroll: true });
  }, 450);
}

function returnToSelectorMenu() {
  clearTimeout(sceneTransitionTimer);
  sceneTransitionTimer = null;

  resetValentineScene();
  resetWomensScene();
  resetTarapotoScene();
  resetStudyScene();
  resetHuayhuashScene();
  resetLawyerScene();
  resetPapaScene();

  if (cover) cover.classList.add('hidden');
  if (scene2) {
    scene2.classList.add('hidden');
    scene2.classList.remove('visible');
    scene2.style.display = 'none';
  }
  if (content) content.classList.remove('visible');
  [sceneWomens, sceneTarapoto, sceneStudy, sceneHuayhuash, sceneLawyer, scenePapa, sceneFinale].forEach((s) =>
    s?.classList.remove('visible'),
  );
  sceneTarapoto?.classList.remove('phase-river', 'phase-lagoon', 'phase-rain', 'together');

  setReadingAudio(false);
  document.body.style.overflow = 'hidden';
  globalBackBtn?.classList.remove('show');

  selectorScreen.inert = false;
  selectorScreen.classList.remove('hidden');
  sceneMenuTrigger?.focus({ preventScroll: true });
}

globalBackBtn?.addEventListener('click', returnToSelectorMenu);
document.querySelectorAll('[data-menu-back]').forEach((btn) =>
  btn.addEventListener('click', returnToSelectorMenu),
);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && selectorScreen.classList.contains('hidden')) {
    returnToSelectorMenu();
  }
});

/* ===== 1. VALENTINE'S DAY SCENE ===== */
const valentineTL = createTimeline();
const heartWrapper = document.getElementById('heartWrapper');
const monkeyContainer = document.getElementById('monkeyContainer');
const princessContainer = document.getElementById('princessContainer');
const scene2Narrative = document.getElementById('scene2Narrative');
const scene2NarrativeEnd = document.getElementById('scene2NarrativeEnd');
const deliveryExplosion = document.getElementById('deliveryExplosion');
const scene2Continue = document.getElementById('scene2Continue');
const monkeyHeart = document.getElementById('monkeyHeart');
const monkeySpeech = document.getElementById('monkeySpeech');
const flyingHeart = document.getElementById('flyingHeart');
const princessHeart = document.getElementById('princessHeart');
let coverClicked = false;

function resetValentineScene() {
  valentineTL.clear();
  coverClicked = false;
  document.body.style.overflow = 'hidden';

  if (cover) {
    cover.classList.remove('hidden');
    cover.style.display = '';
  }
  heartWrapper?.classList.remove('exploding');

  if (scene2) {
    scene2.inert = false;
    scene2.classList.remove('visible', 'hidden');
    scene2.style.display = '';
  }
  scene2Narrative?.classList.remove('show');
  scene2NarrativeEnd?.classList.remove('show');
  scene2Continue?.classList.remove('show');
  deliveryExplosion?.classList.remove('boom');
  document.querySelector('.sparkle-ring')?.classList.remove('burst');

  if (monkeyContainer) {
    monkeyContainer.classList.remove('show', 'walking', 'celebrating');
    monkeyContainer.style.cssText = '';
    monkeyContainer.querySelectorAll('.m-arm').forEach((a) => a.classList.remove('carrying'));
    monkeyContainer.querySelectorAll('.m-leg').forEach((l) => (l.style.animation = ''));
    const mb = monkeyContainer.querySelector('.monkey-body');
    if (mb) mb.style.animation = '';
  }
  princessContainer?.classList.remove('show', 'happy');
  if (monkeyHeart) monkeyHeart.style.opacity = '';
  monkeySpeech?.classList.remove('show');
  if (flyingHeart) {
    flyingHeart.getAnimations().forEach((a) => a.cancel());
    flyingHeart.style.opacity = '0';
    flyingHeart.style.left = '';
    flyingHeart.style.top = '';
  }
  princessHeart?.classList.remove('show');
  document.querySelectorAll('.scene2-emoji, .confetti, .valentine-heart-rain').forEach((el) => el.remove());

  content?.classList.remove('visible');
  ['contentHeader', 'photoSection', 'loveLetter', 'contentFooter'].forEach((id) => {
    document.getElementById(id)?.classList.remove('animate');
  });
  document.getElementById('daysCounter')?.classList.remove('show');
}

function initValentinesDay() {
  const messages = [
    '¡Feliz Día de San Valentín!',
    'Mi pispachita',
    'Mi alérgica al agua',
    'Mi pacuchita',
    'La razón de mis canas',
    'Te amo y adoro',
    'Hoy y siempre',
    `Ya van ${calcDays()} días de conocernos`,
  ];
  const container = document.getElementById('valentineMessageContainer');
  container.innerHTML = '';
  messages.forEach((msg, idx) => {
    const el = document.createElement('div');
    el.className = `valentine-element line${idx + 1}`;
    el.textContent = msg;
    container.appendChild(el);
  });

  if (reducedMotion.matches) return;
  valentineTL.every(() => {
    if (cover.classList.contains('hidden')) return;
    const heart = document.createElement('span');
    heart.className = 'valentine-heart-rain';
    heart.textContent = ['💖', '💕', '💗', '💝'][Math.floor(Math.random() * 4)];
    heart.style.left = `${Math.random() * 100}vw`;
    heart.style.top = '-50px';
    heart.style.animationDuration = `${4 + Math.random() * 2}s`;
    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), 6000);
  }, 1000);
}

function createCoverParticles() {
  if (reducedMotion.matches) return;
  const rect = heartWrapper.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const colors = ['#ff4f8b', '#e91e63', '#ff80ab', '#f48fb1', '#ff1744', '#ff6090', '#ffcdd2'];
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (Math.PI * 2 * i) / 30;
    const dist = 80 + Math.random() * 120;
    const sz = 4 + Math.random() * 10;
    const col = colors[~~(Math.random() * colors.length)];
    p.style.cssText = `left:${cx}px;top:${cy}px;width:${sz}px;height:${sz}px;background:${col};box-shadow:0 0 6px ${col};position:fixed;`;
    document.body.appendChild(p);
    p.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(angle) * dist}px,${Math.sin(angle) * dist}px) scale(0)`, opacity: 0 },
      ],
      { duration: 800 + Math.random() * 400, easing: 'cubic-bezier(.25,.46,.45,.94)', fill: 'forwards' },
    ).onfinish = () => p.remove();
  }
}

heartWrapper.addEventListener('click', () => {
  if (coverClicked) return;
  coverClicked = true;
  heartWrapper.classList.add('exploding');
  createCoverParticles();
  valentineTL.after(() => {
    cover.classList.add('hidden');
    scene2.classList.add('visible');
    startScene2();
  }, 900);
});

function startScene2() {
  valentineTL.after(() => scene2Narrative.classList.add('show'), 500);
  valentineTL.after(() => princessContainer.classList.add('show'), 2000);
  valentineTL.after(() => {
    monkeyContainer.classList.add('show', 'walking');
    monkeyContainer.querySelectorAll('.m-arm').forEach((a) => a.classList.add('carrying'));
  }, 3200);
  valentineTL.after(deliverHeart, 8700);
}

function deliverHeart() {
  monkeyContainer.classList.remove('walking');
  monkeyContainer.style.left = 'calc(70% - 150px)';
  monkeyContainer.style.opacity = '1';
  monkeyContainer.style.visibility = 'visible';
  monkeyContainer.querySelectorAll('.m-leg').forEach((l) => (l.style.animation = 'none'));
  const mb = monkeyContainer.querySelector('.monkey-body');
  if (mb) mb.style.animation = 'none';

  const monkeyRect = monkeyContainer.getBoundingClientRect();
  const princessRect = princessContainer.getBoundingClientRect();
  const startX = monkeyRect.left + monkeyRect.width / 2;
  const startY = monkeyRect.top;
  const endX = princessRect.left + princessRect.width / 2;
  const endY = princessRect.top;

  monkeySpeech.classList.add('show');
  valentineTL.after(() => monkeySpeech.classList.remove('show'), 2100);

  monkeyHeart.style.transition = 'opacity .3s';
  monkeyHeart.style.opacity = '0';
  flyingHeart.style.left = `${startX}px`;
  flyingHeart.style.top = `${startY}px`;
  flyingHeart.style.opacity = '1';

  const midY = Math.min(startY, endY) - 80;
  flyingHeart.animate(
    [
      { left: `${startX}px`, top: `${startY}px`, transform: 'scale(1)', offset: 0 },
      { left: `${(startX + endX) / 2}px`, top: `${midY}px`, transform: 'scale(1.4)', offset: 0.5 },
      { left: `${endX}px`, top: `${endY}px`, transform: 'scale(1)', offset: 1 },
    ],
    { duration: 1500, easing: 'ease-in-out', fill: 'forwards' },
  ).onfinish = () => {
    flyingHeart.style.opacity = '0';
    princessHeart.classList.add('show');
    princessContainer.classList.add('happy');
    monkeyContainer.classList.add('celebrating');

    valentineTL.after(() => {
      deliveryExplosion.classList.add('boom');
      document.querySelector('.sparkle-ring')?.classList.add('burst');
      spawnExplosionEmojis();
      spawnExplosionParticles();
      spawnConfetti();
      valentineTL.after(() => scene2NarrativeEnd.classList.add('show'), 1500);
      valentineTL.after(() => scene2Continue.classList.add('show'), 3500);
    }, 600);
  };
}

function spawnExplosionEmojis() {
  if (reducedMotion.matches) return;
  const emojis = ['💖', '💕', '✨', '💗', '🌸', '💝', '🦋', '⭐', '💘', '🌹', '💫', '🎀', '🌺', '💞', '🥰'];
  for (let i = 0; i < 30; i++) {
    valentineTL.after(() => {
      const el = document.createElement('span');
      el.className = 'scene2-emoji';
      el.textContent = emojis[~~(Math.random() * emojis.length)];
      el.style.left = `${15 + Math.random() * 70}vw`;
      el.style.top = `${25 + Math.random() * 35}vh`;
      el.style.animationDuration = `${2.5 + Math.random() * 2}s`;
      el.style.animationDelay = `${Math.random() * 0.4}s`;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 6000);
    }, i * 100);
  }
}

function spawnExplosionParticles() {
  if (reducedMotion.matches) return;
  const cx = innerWidth / 2;
  const cy = innerHeight * 0.38;
  const colors = ['#ff4f8b', '#ffd700', '#ff80ab', '#e91e63', '#ff1744', '#ffeb3b', '#ff6090', '#f48fb1', '#ff69b4', '#ff85c0'];
  for (let i = 0; i < 50; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const angle = (Math.PI * 2 * i) / 50;
    const dist = 50 + Math.random() * 220;
    const sz = 3 + Math.random() * 9;
    const col = colors[~~(Math.random() * colors.length)];
    const rad = Math.random() > 0.4 ? '50%' : '2px';
    p.style.cssText = `left:${cx}px;top:${cy}px;width:${sz}px;height:${sz}px;background:${col};box-shadow:0 0 10px ${col};position:fixed;border-radius:${rad};z-index:22;`;
    document.body.appendChild(p);
    p.animate(
      [
        { transform: 'translate(0,0) scale(1) rotate(0)', opacity: 1 },
        { transform: `translate(${Math.cos(angle) * dist}px,${Math.sin(angle) * dist}px) scale(0) rotate(${Math.random() * 720}deg)`, opacity: 0 },
      ],
      { duration: 1200 + Math.random() * 800, easing: 'cubic-bezier(.25,.46,.45,.94)', fill: 'forwards' },
    ).onfinish = () => p.remove();
  }
}

function spawnConfetti() {
  if (reducedMotion.matches) return;
  const colors = ['#ff4f8b', '#ffd700', '#ff80ab', '#e91e63', '#f48fb1', '#ffcdd2', '#ff69b4', '#ffb6c1'];
  for (let i = 0; i < 40; i++) {
    valentineTL.after(() => {
      const c = document.createElement('div');
      c.className = 'confetti';
      const col = colors[~~(Math.random() * colors.length)];
      const w = 4 + Math.random() * 8;
      const h = 4 + Math.random() * 8;
      c.style.cssText = `left:${Math.random() * 100}vw;top:${-10 + Math.random() * 20}px;width:${w}px;height:${h}px;background:${col};border-radius:${Math.random() > 0.5 ? '50%' : '1px'};animation-duration:${2.5 + Math.random() * 2}s;animation-delay:${Math.random() * 0.8}s;`;
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 6000);
    }, i * 80);
  }
}

function showValentineMemories() {
  valentineTL.clear();
  flyingHeart.getAnimations().forEach((a) => a.cancel());
  scene2.inert = true;
  scene2.classList.add('hidden');
  valentineTL.after(() => {
    scene2.style.display = 'none';
    document.body.style.overflow = 'auto';
    content.classList.add('visible');
    setReadingAudio(true);
    valentineTL.after(() => {
      ['contentHeader', 'photoSection', 'loveLetter', 'contentFooter'].forEach((id) =>
        document.getElementById(id)?.classList.add('animate'),
      );
      document.getElementById('daysCounter')?.classList.add('show');
    }, 200);
  }, 450);
}
scene2Continue.addEventListener('click', showValentineMemories);

/* ===== 2. WOMEN'S DAY SCENE ===== */
const womensTL = createTimeline();

function spawnPowerSparks() {
  const emojis = ['✨', '💜', '⭐', '🌸', '💪', '🦋', '💫', '👑'];
  const spark = document.createElement('span');
  spark.className = 'power-spark';
  spark.textContent = emojis[Math.floor(Math.random() * emojis.length)];
  spark.style.setProperty('--tx', `${Math.random() * 180 - 90}px`);
  spark.style.setProperty('--ty', `${Math.random() * -160 - 30}px`);
  spark.style.left = `${10 + Math.random() * 80}%`;
  spark.style.top = `${20 + Math.random() * 60}%`;
  sceneWomens.appendChild(spark);
  setTimeout(() => spark.remove(), 1600);
}

function flyPrincess() {
  const hero = document.getElementById('heroineContainer');
  const screenW = window.innerWidth;
  const duration = 5500;
  if (reducedMotion.matches) {
    hero.style.left = 'calc(50% - 50px)';
    hero.style.top = '35%';
    return;
  }
  function onePass() {
    if (!sceneWomens.classList.contains('visible') || sceneWomens.classList.contains('story-complete')) return;
    hero.style.transition = 'none';
    hero.style.top = `${22 + Math.random() * 30}%`;
    hero.style.left = '-200px';
    hero.style.transform = 'scaleX(1)';
    requestAnimationFrame(() => {
      hero.style.transition = `left ${duration}ms linear`;
      hero.style.left = `${screenW + 60}px`;
      womensTL.after(() => {
        if (!sceneWomens.classList.contains('visible')) return;
        hero.style.transition = 'none';
        hero.style.top = `${22 + Math.random() * 30}%`;
        hero.style.left = `${screenW + 60}px`;
        hero.style.transform = 'scaleX(-1)';
        requestAnimationFrame(() => {
          hero.style.transition = `left ${duration}ms linear`;
          hero.style.left = '-200px';
          womensTL.after(onePass, duration + 300);
        });
      }, duration + 300);
    });
  }
  onePass();
}

function resetWomensScene() {
  womensTL.clear();
  sceneWomens.classList.remove('story-complete');
  document.querySelectorAll('.power-spark').forEach((el) => el.remove());

  const heroineEl = document.getElementById('heroineContainer');
  const phraseTitle = document.getElementById('womensPhraseTitle');
  const tapHint = document.getElementById('womensTapHint');
  const wMonkey = document.getElementById('womensMonkey');
  const wSpeech = document.getElementById('womensMonkeySpeech');

  if (heroineEl) {
    heroineEl.classList.remove('show');
    heroineEl.style.transition = 'none';
    heroineEl.style.left = '-200px';
    heroineEl.style.transform = 'scaleX(1)';
  }
  if (phraseTitle) {
    phraseTitle.classList.remove('show');
    phraseTitle.style.animation = 'none';
    phraseTitle.style.opacity = '0';
    void phraseTitle.offsetWidth;
    phraseTitle.style.animation = '';
  }
  ['womensP1', 'womensP2', 'womensP3', 'womensP4', 'womensP5'].forEach((id) =>
    document.getElementById(id)?.classList.remove('show'),
  );
  wMonkey?.classList.remove('show');
  if (wSpeech) {
    wSpeech.classList.remove('show');
    wSpeech.style.opacity = '';
    wSpeech.textContent = '¡Vuela, mi amor! 💜';
  }
  tapHint?.classList.remove('show');
}

function startWomensScene() {
  const heroineContainer = document.getElementById('heroineContainer');
  const womensPhraseTitle = document.getElementById('womensPhraseTitle');
  const phrases = ['womensP1', 'womensP2', 'womensP3', 'womensP4', 'womensP5'].map((id) =>
    document.getElementById(id),
  );
  const tapHint = document.getElementById('womensTapHint');
  const wMonkey = document.getElementById('womensMonkey');
  const wSpeech = document.getElementById('womensMonkeySpeech');

  if (!reducedMotion.matches) {
    womensTL.every(() => {
      if (sceneWomens.classList.contains('visible')) spawnPowerSparks();
    }, 900);
  }

  womensTL.after(() => {
    heroineContainer.classList.add('show');
    flyPrincess();
  }, 400);
  womensTL.after(() => womensPhraseTitle.classList.add('show'), 1000);

  phrases.forEach((el, index) => {
    womensTL.after(() => {
      phrases.forEach((p) => p.classList.remove('show'));
      el.classList.add('show');
    }, 1800 + index * 4300);
  });

  womensTL.after(() => {
    wMonkey.classList.add('show');
    womensTL.after(() => {
      wSpeech.classList.add('show');
      const speeches = ['¡Vuela, mi amor! 💜', '¡Mi superheroína! 👑', '¡Eres increíble! ✨', 'Te amo 🐒💕'];
      let si = 0;
      womensTL.every(() => {
        if (!sceneWomens.classList.contains('visible')) return;
        si = (si + 1) % speeches.length;
        wSpeech.style.opacity = '0';
        womensTL.after(() => {
          wSpeech.textContent = speeches[si];
          wSpeech.style.opacity = '1';
        }, 400);
      }, 3000);
    }, 600);
  }, 2500);

  womensTL.after(() => {
    womensTL.clear();
    tapHint?.classList.add('show');
    wSpeech.classList.remove('show');
    sceneWomens.classList.add('story-complete');
  }, 23000);
}

/* ===== 3. TARAPOTO SCENE ===== */
const tarapotoTL = createTimeline();

function pairGap() {
  return window.innerWidth >= 900 ? 110 : 78;
}

function spawnRainDrops() {
  const rainContainer = document.getElementById('tarapotoRain');
  if (!rainContainer || rainContainer.children.length > 1) return;
  for (let i = 0; i < 120; i++) {
    const drop = document.createElement('div');
    drop.className = 'rain-drop';
    drop.style.cssText = `left:${Math.random() * 100}%;height:${15 + Math.random() * 25}px;animation-duration:${0.4 + Math.random() * 0.5}s;animation-delay:${Math.random() * 2}s;`;
    rainContainer.appendChild(drop);
  }
}

function walkAcross(monkey, princess, duration, onComplete) {
  const endPos = window.innerWidth + 50;
  const gap = pairGap();
  monkey.style.transition = 'none';
  princess.style.transition = 'none';
  monkey.style.left = '-150px';
  princess.style.left = `${-150 + gap}px`;
  monkey.style.bottom = '20%';
  princess.style.bottom = '20%';
  void monkey.offsetWidth;
  monkey.style.transition = `left ${duration}ms linear`;
  princess.style.transition = `left ${duration}ms linear`;
  requestAnimationFrame(() => {
    monkey.style.left = `${endPos}px`;
    princess.style.left = `${endPos + gap}px`;
  });
  tarapotoTL.after(() => onComplete?.(), duration + 300);
}

function resetToCenter(monkey, princess) {
  const cx = window.innerWidth / 2;
  const gap = pairGap();
  monkey.style.transition = 'left 1s ease, bottom 1s ease';
  princess.style.transition = 'left 1s ease, bottom 1s ease';
  monkey.style.left = `${cx - gap}px`;
  princess.style.left = `${cx}px`;
  monkey.style.bottom = '20%';
  princess.style.bottom = '20%';
}

function resetTarapotoScene() {
  tarapotoTL.clear();
  setChapterMemories(sceneTarapoto, false, setReadingAudio);
  galleries.tarapoto?.reset();

  sceneTarapoto.classList.remove('phase-river', 'phase-lagoon', 'phase-rain', 'together');
  const title = document.getElementById('tarapotoTitle');
  const narrative = document.getElementById('tarapotoNarrative');
  const monkey = document.getElementById('tarapotoMonkey');
  const princess = document.getElementById('tarapotoPrincess');
  const monkeySpeech = document.getElementById('tarapotoMonkeySpeech');
  const river = document.getElementById('tarapotoRiver');
  const lagoon = document.getElementById('tarapotoLagoon');
  const moto = document.getElementById('tarapotoMoto');
  const rainContainer = document.getElementById('tarapotoRain');

  if (title) {
    title.classList.remove('show');
    title.style.opacity = '0';
    void title.offsetWidth;
    title.style.animation = '';
  }
  if (narrative) {
    narrative.classList.remove('show');
    narrative.style.opacity = '0';
    narrative.style.animation = 'none';
    narrative.textContent = '';
    void narrative.offsetWidth;
    narrative.style.animation = '';
  }
  if (monkey) {
    monkey.classList.remove('show', 'walking');
    monkey.style.cssText = '';
    monkey.style.transition = 'none';
    monkey.style.left = '-150px';
    monkey.style.bottom = '20%';
  }
  if (monkeySpeech) {
    monkeySpeech.classList.remove('show');
    monkeySpeech.style.opacity = '';
    monkeySpeech.textContent = 'Mi pispachita nos vamos a Tarapoto 🌴💚';
  }
  if (princess) {
    princess.classList.remove('show', 'walking');
    princess.style.cssText = '';
    princess.style.transition = 'none';
    princess.style.left = '-280px';
    princess.style.bottom = '20%';
  }
  river?.classList.remove('show');
  lagoon?.classList.remove('show');
  if (moto) {
    moto.classList.remove('show', 'riding');
    moto.style.left = '-350px';
  }
  rainContainer?.querySelectorAll('.rain-drop').forEach((d) => d.remove());
}

function showTarapotoMemories() {
  tarapotoTL.clear();
  setChapterMemories(sceneTarapoto, true, setReadingAudio);
}

function startTarapotoScene() {
  resetTarapotoScene();
  sceneTarapoto.classList.add('visible');

  const title = document.getElementById('tarapotoTitle');
  const narrative = document.getElementById('tarapotoNarrative');
  const monkey = document.getElementById('tarapotoMonkey');
  const princess = document.getElementById('tarapotoPrincess');
  const monkeySpeech = document.getElementById('tarapotoMonkeySpeech');
  const river = document.getElementById('tarapotoRiver');
  const lagoon = document.getElementById('tarapotoLagoon');
  const moto = document.getElementById('tarapotoMoto');

  const revealNarrative = (txt) => {
    narrative.textContent = txt;
    narrative.style.animation = 'none';
    void narrative.offsetWidth;
    narrative.style.animation = '';
    narrative.classList.add('show');
  };

  tarapotoTL.after(() => title.classList.add('show'), 400);

  // Phase 1: Walking through the forest
  tarapotoTL.after(() => {
    monkeySpeech.textContent = 'Mi pispachita nos vamos a Tarapoto 🌴💚';
    monkeySpeech.style.opacity = '1';
    monkeySpeech.classList.add('show');
    revealNarrative('🌿 El mono y la princesa caminan juntos por Tarapoto...');
    monkey.classList.add('show', 'walking');
    princess.classList.add('show', 'walking');

    tarapotoTL.after(() => {
      monkeySpeech.classList.remove('show');
      monkeySpeech.style.opacity = '0';
    }, 4000);

    walkAcross(monkey, princess, 6500, () => {
      narrative.classList.remove('show');
      narrative.style.opacity = '0';
    });
  }, 1200);

  // Phase 2: Crossing the river
  tarapotoTL.after(() => {
    sceneTarapoto.classList.add('phase-river');
    river.classList.add('show');
    revealNarrative('🌊 Cruzando el río Magallanes juntos, de la mano...');
    monkey.classList.remove('walking');
    princess.classList.remove('walking');
    monkey.style.opacity = '1';
    princess.style.opacity = '1';
    resetToCenter(monkey, princess);

    tarapotoTL.after(() => {
      monkey.classList.add('walking');
      princess.classList.add('walking');
      walkAcross(monkey, princess, 5000, () => {
        narrative.classList.remove('show');
        narrative.style.opacity = '0';
      });
    }, 3000);

    tarapotoTL.after(() => {
      river.classList.remove('show');
      sceneTarapoto.classList.remove('phase-river');
    }, 9500);
  }, 9000);

  // Phase 3: Lagoon
  tarapotoTL.after(() => {
    sceneTarapoto.classList.add('phase-lagoon');
    lagoon.classList.add('show');
    revealNarrative('💧 Llegan a una laguna escondida entre la selva...');
    monkey.classList.remove('walking');
    princess.classList.remove('walking');
    monkey.style.opacity = '1';
    princess.style.opacity = '1';
    resetToCenter(monkey, princess);

    tarapotoTL.after(() => {
      narrative.classList.remove('show');
      narrative.style.opacity = '0';
    }, 4500);
    tarapotoTL.after(() => {
      monkeySpeech.textContent = 'Qué linda laguna… pero tú más 💙';
      monkeySpeech.style.opacity = '1';
      monkeySpeech.classList.add('show');
    }, 5000);
    tarapotoTL.after(() => {
      monkeySpeech.classList.remove('show');
      monkeySpeech.style.opacity = '0';
    }, 8200);
    tarapotoTL.after(() => {
      lagoon.classList.remove('show');
      sceneTarapoto.classList.remove('phase-lagoon');
    }, 8500);
  }, 19500);

  // Phase 4: Rain + Motocross
  tarapotoTL.after(() => {
    sceneTarapoto.classList.add('phase-rain');
    spawnRainDrops();
    revealNarrative('🌧️🏍️ ¡Comienza la tormenta... y salen a explorar en moto bajo la lluvia!');
    monkey.classList.remove('show', 'walking');
    princess.classList.remove('show', 'walking');
    monkey.style.opacity = '0';
    princess.style.opacity = '0';

    tarapotoTL.after(() => {
      narrative.classList.remove('show');
      narrative.style.opacity = '0';
    }, 5000);
    tarapotoTL.after(() => {
      moto.classList.add('show');
      tarapotoTL.after(() => moto.classList.add('riding'), 300);
    }, 1500);
    tarapotoTL.after(() => sceneTarapoto.classList.remove('phase-rain'), 7500);
    tarapotoTL.after(() => {
      moto.classList.remove('show', 'riding');
      moto.style.left = '-400px';
    }, 9000);
  }, 29000);

  // Ending before memories
  tarapotoTL.after(() => {
    monkey.style.opacity = '1';
    princess.style.opacity = '1';
    monkey.classList.add('show');
    princess.classList.add('show');
    resetToCenter(monkey, princess);
    sceneTarapoto.classList.add('together');
    monkeySpeech.textContent = 'Gracias por este viaje, mi pispachita 💚';
    monkeySpeech.style.opacity = '1';
    monkeySpeech.classList.add('show');
  }, 38500);

  tarapotoTL.after(showTarapotoMemories, 43000);
}
document.getElementById('tarapotoMemoriesBtn').addEventListener('click', showTarapotoMemories);

/* ===== 4. STUDY SCENE ===== */
const studyTL = createTimeline();

function resetStudyScene() {
  studyTL.clear();
  setChapterMemories(sceneStudy, false, setReadingAudio);
  galleries.study?.reset();

  const title = document.getElementById('studyTitle');
  const princess = document.getElementById('studyPrincess');
  const monkey = document.getElementById('studyMonkey');
  const love = document.getElementById('studyMonkeyLove');
  const kiss = document.getElementById('studyKiss');

  if (title) {
    title.classList.remove('show');
    title.style.animation = 'none';
    void title.offsetWidth;
    title.style.animation = '';
  }
  princess?.classList.remove('show');
  monkey?.classList.remove('show', 'walking', 'kissing');
  love?.classList.remove('show');
  if (kiss) {
    kiss.classList.remove('show');
    kiss.style.animation = 'none';
    void kiss.offsetWidth;
    kiss.style.animation = '';
  }
}

function showStudyMemories() {
  studyTL.clear();
  setChapterMemories(sceneStudy, true, setReadingAudio);
}

function startStudyScene() {
  resetStudyScene();
  sceneStudy.classList.add('visible');

  const title = document.getElementById('studyTitle');
  const princess = document.getElementById('studyPrincess');
  const monkey = document.getElementById('studyMonkey');
  const love = document.getElementById('studyMonkeyLove');
  const kiss = document.getElementById('studyKiss');

  studyTL.after(() => title.classList.add('show'), 350);
  studyTL.after(() => princess.classList.add('show'), 900);
  studyTL.after(() => monkey.classList.add('show', 'walking'), 2600);
  studyTL.after(() => {
    monkey.classList.remove('walking');
    monkey.classList.add('kissing');
    kiss.classList.add('show');
    love.classList.add('show');
  }, 7000);
  studyTL.after(() => love.classList.remove('show'), 8500);
  studyTL.after(showStudyMemories, 9200);
}
document.getElementById('studyMemoriesBtn').addEventListener('click', showStudyMemories);

/* ===== 5. HUAYHUASH SCENE ===== */
const huayTL = createTimeline();

function resetHuayhuashScene() {
  huayTL.clear();
  sceneHuayhuash.classList.remove('at-snow', 'walking');
  setChapterMemories(sceneHuayhuash, false, setReadingAudio);
  galleries.huayhuash?.reset();
  document.getElementById('huayCaption').textContent = 'Vamos despacito, mi pispachita.';
}

function showHuayMemories() {
  huayTL.clear();
  sceneHuayhuash.classList.remove('walking');
  setChapterMemories(sceneHuayhuash, true, setReadingAudio);
}

function startHuayhuashScene() {
  resetHuayhuashScene();
  sceneHuayhuash.classList.add('visible', 'walking');
  huayTL.after(() => {
    document.getElementById('huayCaption').textContent = 'Un ratito junto a la laguna, tú y yo. ♡';
  }, 3500);
  huayTL.after(() => {
    sceneHuayhuash.classList.remove('walking');
    sceneHuayhuash.classList.add('at-snow');
    document.getElementById('huayCaption').textContent = 'Mira ese nevado, mi amor. ¡Hasta aquí llegamos juntos!';
  }, 8500);
  huayTL.after(showHuayMemories, 15000);
}
document.getElementById('huayMemoriesBtn').addEventListener('click', showHuayMemories);

/* ===== 6. LAWYER SCENE ===== */
const lawyerTL = createTimeline();

function spawnLawyerConfetti() {
  if (reducedMotion.matches) return;
  const wrap = document.getElementById('lawyerConfetti');
  if (!wrap) return;
  wrap.innerHTML = '';
  const colors = ['#ffd700', '#ff4081', '#00e5ff', '#76ff03', '#ffffff', '#e040fb'];
  for (let i = 0; i < 45; i++) {
    const piece = document.createElement('div');
    piece.className = 'lawyer-confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = `${Math.random() * 2}s`;
    piece.style.animationDuration = `${2 + Math.random() * 1.5}s`;
    piece.style.width = `${6 + Math.random() * 6}px`;
    piece.style.height = `${10 + Math.random() * 8}px`;
    wrap.appendChild(piece);
  }
}

function resetLawyerScene() {
  lawyerTL.clear();
  const confetti = document.getElementById('lawyerConfetti');
  if (confetti) confetti.innerHTML = '';
  setChapterMemories(sceneLawyer, false, setReadingAudio);
  galleries.lawyer?.reset();

  document.getElementById('lawyerDiploma')?.classList.remove('show');
  document.getElementById('lawyerMonkeySpeech')?.classList.remove('show');
  document.getElementById('lawyerFlash')?.classList.remove('flash');
  document.getElementById('lawyerPrincess')?.classList.remove('triumph');
  document.getElementById('lawyerPrincessSpeech')?.classList.remove('show');
  document.getElementById('monkeyBouquet')?.classList.remove('show');
  const monkey = document.getElementById('lawyerMonkey');
  if (monkey) {
    monkey.classList.remove('walking', 'cheering');
    monkey.style.transform = '';
  }
}

function showLawyerMemories() {
  lawyerTL.clear();
  setChapterMemories(sceneLawyer, true, setReadingAudio);
}

function startLawyerScene() {
  resetLawyerScene();
  sceneLawyer.classList.add('visible');
  sceneLawyer.scrollTop = 0;

  const diploma = document.getElementById('lawyerDiploma');
  const monkeySpeech = document.getElementById('lawyerMonkeySpeech');
  const camFlash = document.getElementById('lawyerFlash');
  const princess = document.getElementById('lawyerPrincess');
  const princessSpeech = document.getElementById('lawyerPrincessSpeech');
  const monkey = document.getElementById('lawyerMonkey');
  const bouquet = document.getElementById('monkeyBouquet');

  lawyerTL.after(() => {
    monkey?.classList.add('cheering');
    if (monkeySpeech) {
      monkeySpeech.textContent = '¡Esa es mi abogada! ⚖️❤️👏';
      monkeySpeech.classList.add('show');
    }
    camFlash?.classList.add('flash');
  }, 1000);

  lawyerTL.after(() => {
    princess?.classList.add('triumph');
    if (princessSpeech) {
      princessSpeech.textContent = '¡Sustentación aprobada! 🎓✨';
      princessSpeech.classList.add('show');
    }
  }, 2400);

  lawyerTL.after(() => {
    diploma?.classList.add('show');
    princessSpeech?.classList.remove('show');
    spawnLawyerConfetti();
    if (camFlash) {
      camFlash.classList.remove('flash');
      void camFlash.offsetWidth;
      camFlash.classList.add('flash');
    }
  }, 4800);

  lawyerTL.after(() => {
    bouquet?.classList.add('show');
    if (monkey) {
      monkey.classList.remove('cheering');
      monkey.classList.add('walking');
    }
    if (monkeySpeech) {
      monkeySpeech.textContent = '¡Orgulloso de ti, mi doctora hermosa! 💐👑';
      monkeySpeech.classList.add('show');
    }
  }, 5500);

  lawyerTL.after(() => {
    monkeySpeech?.classList.remove('show');
    if (princessSpeech) {
      princessSpeech.textContent = '¡Gracias por creer en mí, monito! 💕';
      princessSpeech.classList.add('show');
    }
  }, 7500);

  lawyerTL.after(showLawyerMemories, 11500);
}
document.getElementById('lawyerMemoriesBtn').addEventListener('click', showLawyerMemories);

/* ===== 7. PAPA LEÓN XIV EN PIMENTEL ===== */
const papaTL = createTimeline();

function spawnHolySparks() {
  if (reducedMotion.matches) return;
  const wrap = document.getElementById('papaHolySparks');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (let i = 0; i < 25; i++) {
    const spark = document.createElement('div');
    spark.className = 'holy-spark';
    spark.style.left = `${20 + Math.random() * 60}%`;
    spark.style.top = `${40 + Math.random() * 40}%`;
    spark.style.animationDelay = `${Math.random() * 1.5}s`;
    wrap.appendChild(spark);
  }
}

function resetPapaScene() {
  papaTL.clear();
  const sparks = document.getElementById('papaHolySparks');
  if (sparks) sparks.innerHTML = '';
  setChapterMemories(scenePapa, false, setReadingAudio);
  galleries.papa?.reset();

  document.getElementById('papaPilgrims')?.classList.remove('carrying-princess');
  document.getElementById('papaSpeechBubble')?.classList.remove('show');
  document.getElementById('papaPrincessSpeech')?.classList.remove('show');
  document.getElementById('papaMonkeySpeech')?.classList.remove('show');
  const popemobile = document.getElementById('papaPopemobile');
  if (popemobile) {
    popemobile.style.transform = '';
    popemobile.classList.remove('advancing');
  }
}

function showPapaMemories() {
  papaTL.clear();
  setChapterMemories(scenePapa, true, setReadingAudio);
}

function startPapaScene() {
  resetPapaScene();
  scenePapa.classList.add('visible');
  scenePapa.scrollTop = 0;

  const papaSpeech = document.getElementById('papaSpeechBubble');
  const princessSpeech = document.getElementById('papaPrincessSpeech');
  const monkeySpeech = document.getElementById('papaMonkeySpeech');
  const popemobile = document.getElementById('papaPopemobile');

  papaTL.after(() => {
    popemobile?.classList.add('advancing');
    if (monkeySpeech) {
      monkeySpeech.textContent = '¡Ahí viene el Papamóvil! 🐒✨';
      monkeySpeech.classList.add('show');
    }
  }, 1200);

  papaTL.after(() => {
    monkeySpeech?.classList.remove('show');
    if (princessSpeech) {
      princessSpeech.textContent = '¡Monito, no alcanzo a ver al Papa! 🥺';
      princessSpeech.classList.add('show');
    }
  }, 2800);

  papaTL.after(() => {
    princessSpeech?.classList.remove('show');
    document.getElementById('papaPilgrims')?.classList.add('carrying-princess');
    if (monkeySpeech) {
      monkeySpeech.textContent = '¡A mis hombros, princesa, para que lo veas! ❤️';
      monkeySpeech.classList.add('show');
    }
  }, 4500);

  papaTL.after(() => {
    monkeySpeech?.classList.remove('show');
    if (papaSpeech) {
      papaSpeech.textContent = '¡La paz esté con ustedes! 🕊️✨';
      papaSpeech.classList.add('show');
    }
    spawnHolySparks();
  }, 8000);

  papaTL.after(() => {
    papaSpeech?.classList.remove('show');
    if (princessSpeech) {
      princessSpeech.textContent = '¡Ahora sí lo veo! Gracias, mi monito. 🕊️❤️';
      princessSpeech.classList.add('show');
    }
  }, 10000);

  papaTL.after(() => {
    monkeySpeech?.classList.remove('show');
    if (princessSpeech) {
      princessSpeech.textContent = 'Un momento que nunca olvidaré... ✨🕊️';
      princessSpeech.classList.add('show');
    }
  }, 12500);

  papaTL.after(showPapaMemories, 16000);
}
document.getElementById('papaMemoriesBtn').addEventListener('click', showPapaMemories);

/* ===== 8. FINALE ===== */
function showFinale() {
  document.getElementById('finaleDays').textContent = calcDays();
  const next = nextSpecialDate(new Date());
  const when = next.d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });
  document.getElementById('finaleNext').textContent =
    next.days === 0
      ? `¡Hoy es ${next.name}! 🎉`
      : `Próximo capítulo: ${next.name}, el ${when}. Faltan ${next.days} ${next.days === 1 ? 'día' : 'días'}.`;
  sceneFinale.classList.add('visible');
  setReadingAudio(true);
  document.getElementById('finaleBackBtn').focus({ preventScroll: true });
}

document.getElementById('papaFinaleBtn').addEventListener('click', () => {
  resetPapaScene();
  scenePapa.classList.remove('visible');
  showFinale();
});

/* ===== CHAPTER LAUNCHERS & REPLAYS ===== */
const STARTERS = {
  valentine: () => {
    resetValentineScene();
    cover.classList.remove('hidden');
    initValentinesDay();
  },
  womens: () => {
    resetWomensScene();
    sceneWomens.classList.add('visible');
    startWomensScene();
  },
  tarapoto: startTarapotoScene,
  study: startStudyScene,
  huayhuash: startHuayhuashScene,
  lawyer: startLawyerScene,
  papa: startPapaScene,
  finale: showFinale,
};

document.querySelectorAll('.selector-card[data-chapter]').forEach((card) => {
  card.addEventListener('click', () => {
    const starter = STARTERS[card.dataset.chapter];
    if (starter) openScene(starter);
  });
});

document.querySelectorAll('[data-replay]').forEach((button) => {
  button.addEventListener('click', () => {
    const starter = STARTERS[button.dataset.replay];
    if (starter) starter();
    globalBackBtn?.focus({ preventScroll: true });
  });
});

/* ===== VISITED CHAPTERS & PROGRESS COUNTER ===== */
(function initVisited() {
  const KEY = 'pispachita-visited';
  let seen = [];
  try {
    seen = JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    seen = [];
  }

  const updateProgress = () => {
    if (!selectorProgressEl) return;
    const valid = new Set(seen.filter((id) => document.getElementById(id)));
    selectorProgressEl.textContent = `${valid.size} / ${CHAPTERS.length} capítulos`;
  };

  const mark = (id) => document.getElementById(id)?.classList.add('visited');
  seen.forEach(mark);
  updateProgress();

  document.querySelectorAll('.selector-card').forEach((card) => {
    card.addEventListener('click', () => {
      mark(card.id);
      if (!seen.includes(card.id)) seen.push(card.id);
      try {
        localStorage.setItem(KEY, JSON.stringify(seen));
      } catch {
        /* ignore storage quota/private mode errors */
      }
      updateProgress();
    });
  });
})();
})();
