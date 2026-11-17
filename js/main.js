/* ===== CHARACTER MODELS: clone the single princess/monkey template into every [data-char] ===== */
    document.querySelectorAll('[data-char]').forEach(el => {
      el.prepend(document.getElementById('tpl-' + el.dataset.char).content.cloneNode(true));
    });

/* ===== STARS CANVAS ===== */
    (function initStars() {
      const canvas = document.getElementById('starsCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let stars = [];
      const COUNT = 180;
      function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
      function create() {
        stars = [];
        for (let i = 0; i < COUNT; i++)
          stars.push({ x:Math.random()*canvas.width, y:Math.random()*canvas.height,
            r:Math.random()*1.6+.3, a:Math.random(),
            da:(Math.random()*.015+.003)*(Math.random()<.5?1:-1) });
      }
      function draw() {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        stars.forEach(s => {
          s.a += s.da; if(s.a<=.1||s.a>=1) s.da*=-1;
          ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
          ctx.fillStyle=`rgba(255,220,240,${s.a})`; ctx.fill();
        });
        requestAnimationFrame(draw);
      }
      resize(); create(); draw();
      addEventListener('resize',()=>{resize();create();});
    })();

    /* ===== DAYS COUNTER (shared) ===== */
    const START_DATE = new Date(2024, 10, 23); // Nov 23, 2024
    function calcDays() {
      return Math.floor(Math.abs(new Date() - START_DATE) / 86400000);
    }
    // Update selector badge
    const selectorDaysEl = document.getElementById('selectorDays');
    if (selectorDaysEl) selectorDaysEl.textContent = calcDays();

    /* ===== DATE CONDITION ===== */
    const _today = new Date();
    const isValentinesDay = _today.getMonth() === 1 && _today.getDate() === 14;
    const isWomensDay     = _today.getMonth() === 2 && _today.getDate() === 8;
    if (isValentinesDay) document.body.classList.add('is-valentines-day');

    /* ===== SELECTOR SCREEN LOGIC ===== */
    const selectorScreen  = document.getElementById('selectorScreen');
    const sceneWomens     = document.getElementById('sceneWomens');
    const sceneStudy      = document.getElementById('sceneStudy');
    const cover           = document.getElementById('cover');

    // Highlight today's occasion on the selector
    (function highlightTodayCard() {
      // Dynamic subtitle
      const subtitle = document.querySelector('.selector-subtitle');
      if (isValentinesDay) {
        subtitle.textContent = '🌹 ¡Hoy es Día de San Valentín! 🌹';
        subtitle.style.color = 'rgba(255,140,180,.85)';
      } else if (isWomensDay) {
        subtitle.textContent = '💜 ¡Hoy es Día Internacional de la Mujer! 💜';
        subtitle.style.color = 'rgba(200,140,255,.85)';
      }

      if (isValentinesDay) {
        const btn = document.getElementById('btnValentine');
        btn.classList.add('today-highlight');
        const badge = document.createElement('div');
        badge.className = 'selector-card-today-badge';
        badge.textContent = '¡Hoy! 🎉';
        btn.appendChild(badge);
      } else if (isWomensDay) {
        const btn = document.getElementById('btnWomens');
        btn.classList.add('today-highlight');
        const badge = document.createElement('div');
        badge.className = 'selector-card-today-badge';
        badge.textContent = '¡Hoy! 🎉';
        btn.appendChild(badge);
      }
    })();

    /* ===== CENTRAL SCENE ROUTER & GLOBAL NAVIGATION ===== */
    const globalBackBtn = document.getElementById('globalBackBtn');
    let heartRainInterval = null;
    let valentineTimers = [];
    let womensTimers = [];
    let womensSparksInterval = null;
    let womensSpeechInterval = null;
    let womensCanTapToExit = false;
    let sceneTransitionTimer = null;
    let sceneMenuTrigger = null;

    function scheduleValentine(fn, delay) {
      const timer = setTimeout(fn, delay);
      valentineTimers.push(timer);
      return timer;
    }

    function scheduleWomens(fn, delay) {
      const timer = setTimeout(fn, delay);
      womensTimers.push(timer);
      return timer;
    }

    function hideSelector() {
      selectorScreen.classList.add('hidden');
      selectorScreen.inert = true;
    }

    function openScene(starter) {
      if (selectorScreen.classList.contains('hidden')) return;
      sceneMenuTrigger = document.activeElement;
      hideSelector();
      clearTimeout(sceneTransitionTimer);
      sceneTransitionTimer = setTimeout(() => {
        sceneTransitionTimer = null;
        if (globalBackBtn) globalBackBtn.classList.add('show');
        starter();
        if (globalBackBtn) globalBackBtn.focus({ preventScroll: true });
      }, 500);
    }

    function returnToSelectorMenu() {
      clearTimeout(sceneTransitionTimer);
      sceneTransitionTimer = null;
      // 1. Reset all scenes and cancel active timers
      resetValentineScene();
      resetWomensScene();
      resetTarapotoScene();
      resetStudyScene();
      if (typeof resetLawyerScene === 'function') resetLawyerScene();
      if (typeof resetPapaScene === 'function') resetPapaScene();

      // 2. Hide all scene screens
      if (cover) cover.classList.add('hidden');
      if (scene2) {
        scene2.classList.add('hidden');
        scene2.classList.remove('visible');
        scene2.style.display = 'none';
      }
      if (content) content.classList.remove('visible');
      if (sceneWomens) sceneWomens.classList.remove('visible');
      if (sceneTarapoto) {
        sceneTarapoto.classList.remove('phase-river', 'phase-lagoon', 'phase-rain', 'visible');
      }
      if (sceneStudy) sceneStudy.classList.remove('visible');
      const sLawyer = document.getElementById('sceneLawyer'); if (sLawyer) sLawyer.classList.remove('visible');
      const sPapa = document.getElementById('scenePapa'); if (sPapa) sPapa.classList.remove('visible');

      // 3. Reset document scroll & navigation button
      document.body.style.overflow = 'hidden';
      if (globalBackBtn) globalBackBtn.classList.remove('show');

      // 4. Reveal selector screen
      if (selectorScreen) {
        selectorScreen.inert = false;
        selectorScreen.classList.remove('hidden');
      }
      if (sceneMenuTrigger) sceneMenuTrigger.focus({ preventScroll: true });
    }

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && selectorScreen.classList.contains('hidden')) {
        returnToSelectorMenu();
      }
    });

    function resetValentineScene() {
      valentineTimers.forEach(clearTimeout);
      valentineTimers = [];
      if (heartRainInterval) {
        clearInterval(heartRainInterval);
        heartRainInterval = null;
      }
      coverClicked = false;
      document.body.style.overflow = 'hidden';

      // Reset Cover
      if (cover) {
        cover.classList.remove('hidden');
        cover.style.display = '';
      }
      if (heartWrapper) {
        heartWrapper.classList.remove('exploding');
      }

      // Reset Scene 2
      if (scene2) {
        scene2.classList.remove('visible', 'hidden');
        scene2.style.display = '';
      }
      if (scene2Narrative) scene2Narrative.classList.remove('show');
      if (scene2NarrativeEnd) scene2NarrativeEnd.classList.remove('show');
      if (scene2Continue) scene2Continue.classList.remove('show');
      if (deliveryExplosion) deliveryExplosion.classList.remove('boom');
      const ring = document.querySelector('.sparkle-ring');
      if (ring) ring.classList.remove('burst');

      // Reset monkey & princess in Scene 2
      if (monkeyContainer) {
        monkeyContainer.classList.remove('show', 'walking', 'celebrating');
        monkeyContainer.style.cssText = '';
        monkeyContainer.querySelectorAll('.m-arm').forEach(a => a.classList.remove('carrying'));
        monkeyContainer.querySelectorAll('.m-leg').forEach(l => l.style.animation = '');
        const mb = monkeyContainer.querySelector('.monkey-body');
        if (mb) mb.style.animation = '';
      }
      if (princessContainer) {
        princessContainer.classList.remove('show', 'happy');
      }
      if (monkeyHeart) monkeyHeart.style.opacity = '';
      if (monkeySpeech) monkeySpeech.classList.remove('show');
      if (flyingHeart) {
        flyingHeart.style.opacity = '0';
        flyingHeart.style.left = '';
        flyingHeart.style.top = '';
      }
      if (princessHeart) princessHeart.classList.remove('show');

      // Clean scene2 particles / emojis
      document.querySelectorAll('.scene2-emoji, .confetti').forEach(el => el.remove());

      // Reset Content section
      if (content) {
        content.classList.remove('visible');
      }
      ['contentHeader', 'photoSection', 'loveLetter', 'reasons', 'contentFooter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('animate');
      });
      const daysC = document.getElementById('daysCounter');
      if (daysC) daysC.classList.remove('show');
    }

    if (globalBackBtn) {
      globalBackBtn.addEventListener('click', returnToSelectorMenu);
    }

    // Button: Valentine's Day
    document.getElementById('btnValentine').addEventListener('click', () => {
      openScene(() => {
        resetValentineScene();
        cover.classList.remove('hidden');
        initValentinesDay();
      });
    });

    // Button: Women's Day
    document.getElementById('btnWomens').addEventListener('click', () => {
      openScene(() => {
        resetWomensScene();
        sceneWomens.classList.add('visible');
        startWomensScene();
      });
    });

    // Button: Tarapoto Trip
    document.getElementById('btnTarapoto').addEventListener('click', () => {
      openScene(() => {
        resetTarapotoScene();
        sceneTarapoto.classList.add('visible');
        startTarapotoScene();
      });
    });

    // Button: Study
    document.getElementById('btnStudy').addEventListener('click', () => {
      openScene(() => {
        resetStudyScene();
        sceneStudy.classList.add('visible');
        startStudyScene();
      });
    });

    /* ===== VALENTINE'S DAY MESSAGE — always shown on cover ===== */
    function initValentinesDay() {
      const messages = [
        '¡Feliz Día de San Valentín!',
        'Mi pispachita',
        'Mi alérgica al agua',
        'Mi pacuchita',
        'La razón de mis canas',
        'Te amo y adoro',
        'Hoy y siempre',
        'Ya van ' + calcDays() + ' días de conocernos'
      ];

      const container = document.getElementById('valentineMessageContainer');
      container.innerHTML = '';

      messages.forEach((msg, idx) => {
        const el = document.createElement('div');
        el.className = `valentine-element line${idx + 1}`;
        el.textContent = msg;
        container.appendChild(el);
      });

      // Heart rain while cover is visible
      if (heartRainInterval) clearInterval(heartRainInterval);
      heartRainInterval = setInterval(() => {
        if (cover.classList.contains('hidden')) {
          clearInterval(heartRainInterval);
          heartRainInterval = null;
          return;
        }
        const heart = document.createElement('span');
        heart.className = 'valentine-heart-rain';
        heart.textContent = ['💖','💕','💗','💝'][Math.floor(Math.random()*4)];
        heart.style.left = Math.random() * 100 + 'vw';
        heart.style.top = '-50px';
        heart.style.animationDuration = (4 + Math.random() * 2) + 's';
        document.body.appendChild(heart);
        setTimeout(() => heart.remove(), 6000);
      }, 1000);
    }

    /* ===== WOMENS DAY SCENE ===== */
    function startWomensScene() {
      const heroineContainer  = document.getElementById('heroineContainer');
      const womensPhraseTitle = document.getElementById('womensPhraseTitle');
      const p1 = document.getElementById('womensP1');
      const p2 = document.getElementById('womensP2');
      const p3 = document.getElementById('womensP3');
      const p4 = document.getElementById('womensP4');
      const p5 = document.getElementById('womensP5');
      const tapHint    = document.getElementById('womensTapHint');
      const wMonkey    = document.getElementById('womensMonkey');
      const wSpeech    = document.getElementById('womensMonkeySpeech');

      womensCanTapToExit = false;

      // Spawn power sparks periodically
      if (womensSparksInterval) clearInterval(womensSparksInterval);
      womensSparksInterval = setInterval(() => {
        if (!sceneWomens.classList.contains('visible')) {
          clearInterval(womensSparksInterval);
          womensSparksInterval = null;
          return;
        }
        spawnPowerSparks();
      }, 900);

      // Reveal sequence
      scheduleWomens(() => { heroineContainer.classList.add('show'); flyPrincess(); }, 400);
      scheduleWomens(() => { womensPhraseTitle.classList.add('show'); }, 1000);

      // Phrases appear staggered
      [[p1,1800],[p2,2900],[p3,4000],[p4,5100],[p5,6200]].forEach(([el,delay]) => {
        scheduleWomens(() => {
          if (el) {
            el.style.animation = 'phraseReveal 1s ease forwards';
            el.style.opacity   = '1';
          }
        }, delay);
      });

      // Monkey appears after phrases start
      scheduleWomens(() => {
        wMonkey.classList.add('show');
        // Show speech bubble after a beat
        scheduleWomens(() => {
          wSpeech.classList.add('show');
          // Cycle speech bubbles
          const speeches = [
            '¡Vuela, mi amor! 💜',
            '¡Mi superheroína! 👑',
            '¡Eres increíble! ✨',
            'Te amo 🐒💕'
          ];
          let si = 0;
          if (womensSpeechInterval) clearInterval(womensSpeechInterval);
          womensSpeechInterval = setInterval(() => {
            if (!sceneWomens.classList.contains('visible')) return;
            si = (si + 1) % speeches.length;
            wSpeech.style.opacity = '0';
            scheduleWomens(() => {
              wSpeech.textContent = speeches[si];
              wSpeech.style.opacity = '1';
            }, 400);
          }, 3000);
        }, 600);
      }, 2500);

      scheduleWomens(() => {
        if (tapHint) tapHint.classList.add('show');
        womensCanTapToExit = true;
      }, 7200);
    }

    // Princess flies across the screen repeatedly
    function flyPrincess() {
      const hero = document.getElementById('heroineContainer');
      const screenW = window.innerWidth;
      const duration = 5500; // ms per pass

      function onePass() {
        if (!sceneWomens.classList.contains('visible')) return;
        // random vertical lane (20–65% from top)
        const topPct = 20 + Math.random() * 45;
        hero.style.transition = 'none';
        hero.style.top  = topPct + '%';
        hero.style.left = '-200px';
        // flip to face right (default)
        hero.style.transform = 'scaleX(1)';

        requestAnimationFrame(() => {
          hero.style.transition = `left ${duration}ms linear`;
          hero.style.left = (screenW + 60) + 'px';
          scheduleWomens(() => {
            if (!sceneWomens.classList.contains('visible')) return;
            // come back from right to left (flipped)
            const topPct2 = 20 + Math.random() * 45;
            hero.style.transition = 'none';
            hero.style.top  = topPct2 + '%';
            hero.style.left = (screenW + 60) + 'px';
            hero.style.transform = 'scaleX(-1)';
            requestAnimationFrame(() => {
              hero.style.transition = `left ${duration}ms linear`;
              hero.style.left = '-200px';
              scheduleWomens(onePass, duration + 300);
            });
          }, duration + 300);
        });
      }
      onePass();
    }

    function spawnPowerSparks() {
      const emojis = ['✨','💜','⭐','🌸','💪','🦋','💫','👑'];
      const spark = document.createElement('span');
      spark.className = 'power-spark';
      spark.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      const tx = (Math.random() * 180 - 90) + 'px';
      const ty = (Math.random() * -160 - 30) + 'px';
      spark.style.setProperty('--tx', tx);
      spark.style.setProperty('--ty', ty);
      spark.style.left = (10 + Math.random() * 80) + '%';
      spark.style.top  = (20 + Math.random() * 60) + '%';
      sceneWomens.appendChild(spark);
      setTimeout(() => spark.remove(), 1600);
    }

    // Tap on womens scene → back to selector once hint is active
    sceneWomens.addEventListener('click', () => {
      if (!sceneWomens.classList.contains('visible') || !womensCanTapToExit) return;
      returnToSelectorMenu();
    });

    function resetWomensScene() {
      womensTimers.forEach(clearTimeout);
      womensTimers = [];
      if (womensSparksInterval) { clearInterval(womensSparksInterval); womensSparksInterval = null; }
      if (womensSpeechInterval) { clearInterval(womensSpeechInterval); womensSpeechInterval = null; }
      womensCanTapToExit = false;
      document.querySelectorAll('.power-spark').forEach(el => el.remove());

      const heroineEl = document.getElementById('heroineContainer');
      const phraseTitle = document.getElementById('womensPhraseTitle');
      const tapHint   = document.getElementById('womensTapHint');
      const wMonkey   = document.getElementById('womensMonkey');
      const wSpeech   = document.getElementById('womensMonkeySpeech');

      // Reset heroine position
      if (heroineEl) {
        heroineEl.classList.remove('show');
        heroineEl.style.transition = 'none';
        heroineEl.style.left = '-200px';
        heroineEl.style.transform = 'scaleX(1)';
      }

      // Reset title
      if (phraseTitle) {
        phraseTitle.classList.remove('show');
        phraseTitle.style.animation = 'none';
        phraseTitle.style.opacity = '0';
        void phraseTitle.offsetWidth; // reflow
        phraseTitle.style.animation = '';
      }

      // Reset phrases
      ['womensP1','womensP2','womensP3','womensP4','womensP5'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.style.animation = 'none'; el.style.opacity = '0'; void el.offsetWidth; el.style.animation = ''; }
      });

      // Reset monkey & bubble
      if (wMonkey) wMonkey.classList.remove('show');
      if (wSpeech) {
        wSpeech.classList.remove('show');
        wSpeech.style.opacity = '';
        wSpeech.textContent = '¡Vuela, mi amor! 💜';
      }

      // Reset hint
      if (tapHint) tapHint.classList.remove('show');
    }

    /* ===== ELEMENTS ===== */
    const heartWrapper = document.getElementById('heartWrapper');
    const scene2 = document.getElementById('scene2');
    const content = document.getElementById('content');
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

    /* ===== COVER → SCENE 2 ===== */
    function createCoverParticles() {
      const rect = heartWrapper.getBoundingClientRect();
      const cx = rect.left+rect.width/2, cy = rect.top+rect.height/2;
      const colors = ['#ff4f8b','#e91e63','#ff80ab','#f48fb1','#ff1744','#ff6090','#ffcdd2'];
      for (let i = 0; i < 30; i++) {
        const p = document.createElement('div'); p.classList.add('particle');
        const angle=(Math.PI*2*i)/30, dist=80+Math.random()*120, sz=4+Math.random()*10;
        const col=colors[~~(Math.random()*colors.length)];
        p.style.cssText=`left:${cx}px;top:${cy}px;width:${sz}px;height:${sz}px;background:${col};box-shadow:0 0 6px ${col};position:fixed;`;
        document.body.appendChild(p);
        p.animate([
          {transform:'translate(0,0) scale(1)',opacity:1},
          {transform:`translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px) scale(0)`,opacity:0}
        ],{duration:800+Math.random()*400,easing:'cubic-bezier(.25,.46,.45,.94)',fill:'forwards'}).onfinish=()=>p.remove();
      }
    }

    let coverClicked = false;
    heartWrapper.addEventListener('click', () => {
      if (coverClicked) return;
      coverClicked = true;
      heartWrapper.classList.add('exploding');
      createCoverParticles();
      scheduleValentine(() => {
        cover.classList.add('hidden');
        scene2.classList.add('visible');
        startScene2();
      }, 900);
    });

    /* ===== SCENE 2 — ANIMATION ===== */
    function startScene2() {
      // 1) Narrative
      scheduleValentine(() => scene2Narrative.classList.add('show'), 500);
      // 2) Princess appears
      scheduleValentine(() => princessContainer.classList.add('show'), 2000);
      // 3) Monkey walks
      scheduleValentine(() => {
        monkeyContainer.classList.add('show', 'walking');
        monkeyContainer.querySelectorAll('.m-arm').forEach(a => a.classList.add('carrying'));
      }, 3200);
      // 4) Monkey arrives → deliver
      scheduleValentine(() => deliverHeart(), 8700);
    }

    function deliverHeart() {
      // Stop walking animation but keep monkey visible
      monkeyContainer.classList.remove('walking');
      
      // Explicitly set final position to keep monkey visible
      monkeyContainer.style.left = 'calc(70% - 150px)';
      monkeyContainer.style.opacity = '1';
      monkeyContainer.style.visibility = 'visible';
      
      monkeyContainer.querySelectorAll('.m-leg').forEach(l => l.style.animation='none');
      const mb = monkeyContainer.querySelector('.monkey-body');
      if(mb) mb.style.animation='none';

      // Get positions for flying heart
      const monkeyRect = monkeyContainer.getBoundingClientRect();
      const princessRect = princessContainer.getBoundingClientRect();

      const startX = monkeyRect.left + monkeyRect.width/2;
      const startY = monkeyRect.top;
      const endX = princessRect.left + princessRect.width/2;
      const endY = princessRect.top;

      // Monkey says phrase while delivering the heart
      monkeySpeech.classList.add('show');
      scheduleValentine(() => monkeySpeech.classList.remove('show'), 2100);

      // Hide monkey's heart
      monkeyHeart.style.transition = 'opacity .3s';
      monkeyHeart.style.opacity = '0';

      // Show flying heart at monkey position
      flyingHeart.style.left = startX + 'px';
      flyingHeart.style.top = startY + 'px';
      flyingHeart.style.opacity = '1';

      // Animate heart flying in an arc to the princess
      const midY = Math.min(startY, endY) - 80;
      flyingHeart.animate([
        { left: startX+'px', top: startY+'px', transform:'scale(1)', offset:0 },
        { left: ((startX+endX)/2)+'px', top: midY+'px', transform:'scale(1.4)', offset:0.5 },
        { left: endX+'px', top: endY+'px', transform:'scale(1)', offset:1 }
      ], {
        duration: 1500,
        easing: 'ease-in-out',
        fill: 'forwards'
      }).onfinish = () => {
        // Heart arrived! Hide flying heart
        flyingHeart.style.opacity = '0';

        // Show heart above princess
        princessHeart.classList.add('show');

        // Princess happy!
        princessContainer.classList.add('happy');

        // Monkey celebrates!
        monkeyContainer.classList.add('celebrating');

        // EXPLOSION after a beat
        scheduleValentine(() => {
          deliveryExplosion.classList.add('boom');
          const ring = document.querySelector('.sparkle-ring');
          if (ring) ring.classList.add('burst');
          spawnExplosionEmojis();
          spawnExplosionParticles();
          spawnConfetti();

          scheduleValentine(() => scene2NarrativeEnd.classList.add('show'), 1500);
          scheduleValentine(() => scene2Continue.classList.add('show'), 3500);
        }, 600);
      };
    }

    function spawnExplosionEmojis() {
      const emojis = ['💖','💕','✨','💗','🌸','💝','🦋','⭐','💘','🌹','💫','🎀','🌺','💞','🥰'];
      for (let i = 0; i < 30; i++) {
        setTimeout(() => {
          const el = document.createElement('span');
          el.className='scene2-emoji';
          el.textContent=emojis[~~(Math.random()*emojis.length)];
          el.style.left=(15+Math.random()*70)+'vw';
          el.style.top=(25+Math.random()*35)+'vh';
          el.style.animationDuration=(2.5+Math.random()*2)+'s';
          el.style.animationDelay=(Math.random()*.4)+'s';
          document.body.appendChild(el);
          setTimeout(()=>el.remove(),6000);
        }, i*100);
      }
    }

    function spawnExplosionParticles() {
      const cx=innerWidth/2, cy=innerHeight*.38;
      const colors=['#ff4f8b','#ffd700','#ff80ab','#e91e63','#ff1744','#ffeb3b','#ff6090','#f48fb1','#ff69b4','#ff85c0'];
      for (let i=0;i<50;i++) {
        const p=document.createElement('div');
        p.classList.add('particle');
        const angle=(Math.PI*2*i)/50,dist=50+Math.random()*220,sz=3+Math.random()*9;
        const col=colors[~~(Math.random()*colors.length)];
        const rad=Math.random()>.4?'50%':'2px';
        p.style.cssText=`left:${cx}px;top:${cy}px;width:${sz}px;height:${sz}px;background:${col};box-shadow:0 0 10px ${col};position:fixed;border-radius:${rad};z-index:22;`;
        document.body.appendChild(p);
        p.animate([
          {transform:'translate(0,0) scale(1) rotate(0)',opacity:1},
          {transform:`translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px) scale(0) rotate(${Math.random()*720}deg)`,opacity:0}
        ],{duration:1200+Math.random()*800,easing:'cubic-bezier(.25,.46,.45,.94)',fill:'forwards'}).onfinish=()=>p.remove();
      }
    }

    function spawnConfetti() {
      const colors=['#ff4f8b','#ffd700','#ff80ab','#e91e63','#f48fb1','#ffcdd2','#ff69b4','#ffb6c1'];
      for (let i=0;i<40;i++) {
        setTimeout(()=>{
          const c=document.createElement('div');
          c.className='confetti';
          const col=colors[~~(Math.random()*colors.length)];
          const w=4+Math.random()*8,h=4+Math.random()*8;
          const shape=Math.random()>.5?'50%':'1px';
          c.style.cssText=`left:${Math.random()*100}vw;top:${-10+Math.random()*20}px;width:${w}px;height:${h}px;background:${col};border-radius:${shape};animation-duration:${2.5+Math.random()*2}s;animation-delay:${Math.random()*.8}s;`;
          document.body.appendChild(c);
          setTimeout(()=>c.remove(),6000);
        },i*80);
      }
    }

    /* ===== SCENE 2 → CONTENT ===== */
    scene2Continue.addEventListener('click', () => {
      scene2.classList.add('hidden');
      setTimeout(() => {
        scene2.style.display='none';
        document.body.style.overflow='auto';
        content.classList.add('visible');
        setTimeout(() => {
          document.getElementById('contentHeader').classList.add('animate');
          document.getElementById('photoSection').classList.add('animate');
          document.getElementById('loveLetter').classList.add('animate');
          document.getElementById('reasons').classList.add('animate');
          document.getElementById('contentFooter').classList.add('animate');
          document.getElementById('daysCounter').classList.add('show');
          spawnFloatingHearts();
        }, 250);
      }, 1000);
    });

    /* ===== STUDY CHAPTER SCENE ===== */
    let studyPhotosIndex = 0;
    const totalStudyPhotos = 4;
    let studyTimers = [];

    function scheduleStudy(fn, delay) {
      const timer = setTimeout(fn, delay);
      studyTimers.push(timer);
      return timer;
    }

    function startStudyScene() {
      const title = document.getElementById('studyTitle');
      const princess = document.getElementById('studyPrincess');
      const monkey = document.getElementById('studyMonkey');
      const love = document.getElementById('studyMonkeyLove');
      const kiss = document.getElementById('studyKiss');
      const panel = document.getElementById('studyMessagePanel');
      const photos = document.getElementById('studyPhotos');

      scheduleStudy(() => title.classList.add('show'), 350);
      scheduleStudy(() => princess.classList.add('show'), 900);
      scheduleStudy(() => {
        monkey.classList.add('show', 'walking');
      }, 2600);
      scheduleStudy(() => {
        monkey.classList.remove('walking');
        monkey.classList.add('kissing');
        kiss.classList.add('show');
        love.classList.add('show');
      }, 7000);
      scheduleStudy(() => {
        love.classList.remove('show');
      }, 8500);
      scheduleStudy(() => {
        panel.classList.add('show');
      }, 8800);
      scheduleStudy(() => {
        photos.classList.add('visible');
        studyPhotosIndex = 0;
        showStudyPhotoSlide(0);
      }, 15000);
    }

    function resetStudyScene() {
      studyTimers.forEach(clearTimeout);
      studyTimers = [];

      const title = document.getElementById('studyTitle');
      const princess = document.getElementById('studyPrincess');
      const monkey = document.getElementById('studyMonkey');
      const love = document.getElementById('studyMonkeyLove');
      const kiss = document.getElementById('studyKiss');
      const panel = document.getElementById('studyMessagePanel');
      const photos = document.getElementById('studyPhotos');

      if (title) { title.classList.remove('show'); title.style.animation = 'none'; void title.offsetWidth; title.style.animation = ''; }
      if (princess) princess.classList.remove('show');
      if (monkey) monkey.classList.remove('show', 'walking', 'kissing');
      if (love) love.classList.remove('show');
      if (kiss) { kiss.classList.remove('show'); kiss.style.animation = 'none'; void kiss.offsetWidth; kiss.style.animation = ''; }
      if (panel) panel.classList.remove('show');
      if (photos) photos.classList.remove('visible');
      showStudyPhotoSlide(0);
    }

    function showStudyPhotoSlide(idx) {
      for (let i = 1; i <= totalStudyPhotos; i++) {
        const slide = document.getElementById('studyPhotoSlide' + i);
        if (slide) {
          slide.classList.toggle('active', i === idx + 1);
          if (i === idx + 1) {
            slide.style.animation = 'none';
            void slide.offsetWidth;
            slide.style.animation = '';
          }
        }
      }
      const counter = document.getElementById('studyPhotosCounter');
      if (counter) counter.textContent = `${idx + 1} / ${totalStudyPhotos}`;
    }

    document.getElementById('studyPhotosNext').addEventListener('click', (e) => {
      e.stopPropagation();
      if (studyPhotosIndex < totalStudyPhotos - 1) {
        studyPhotosIndex++;
        showStudyPhotoSlide(studyPhotosIndex);
      }
    });

    document.getElementById('studyPhotosPrev').addEventListener('click', (e) => {
      e.stopPropagation();
      if (studyPhotosIndex > 0) {
        studyPhotosIndex--;
        showStudyPhotoSlide(studyPhotosIndex);
      }
    });

    document.getElementById('studyPhotosBackBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      resetStudyScene();
      sceneStudy.classList.remove('visible');
      selectorScreen.classList.remove('hidden');
    });

    /* ===== TARAPOTO SCENE ===== */
    const sceneTarapoto = document.getElementById('sceneTarapoto');
    let tarapotoTimers = [];

    function scheduleTarapoto(fn, delay) {
      const timer = setTimeout(fn, delay);
      tarapotoTimers.push(timer);
      return timer;
    }

    // Generate rain drops
    function spawnRainDrops() {
      const rainContainer = document.getElementById('tarapotoRain');
      if (!rainContainer || rainContainer.children.length > 1) return; // already spawned
      for (let i = 0; i < 120; i++) {
        const drop = document.createElement('div');
        drop.className = 'rain-drop';
        const left = Math.random() * 100;
        const height = 15 + Math.random() * 25;
        const duration = 0.4 + Math.random() * 0.5;
        const delay = Math.random() * 2;
        drop.style.cssText = `
          left: ${left}%;
          height: ${height}px;
          animation-duration: ${duration}s;
          animation-delay: ${delay}s;
        `;
        rainContainer.appendChild(drop);
      }
    }

    function startTarapotoScene() {
      const title = document.getElementById('tarapotoTitle');
      const narrative = document.getElementById('tarapotoNarrative');
      const monkey = document.getElementById('tarapotoMonkey');
      const princess = document.getElementById('tarapotoPrincess');
      const monkeySpeech = document.getElementById('tarapotoMonkeySpeech');
      const river = document.getElementById('tarapotoRiver');
      const lagoon = document.getElementById('tarapotoLagoon');
      const moto = document.getElementById('tarapotoMoto');
      const finalMsg = document.getElementById('tarapotoFinalMsg');

      // Show title
      scheduleTarapoto(() => title.classList.add('show'), 400);

      // ── PHASE 1: Walking through the forest (sunny) ──
      scheduleTarapoto(() => {
        // Monkey says something at the start
        monkeySpeech.textContent = 'Mi pispachita nos vamos a Tarapoto 🌴💚';
        monkeySpeech.style.opacity = '1';
        monkeySpeech.classList.add('show');

        narrative.textContent = '🌿 El mono y la princesa caminan juntos por Tarapoto...';
        narrative.style.top = '12%';
        narrative.classList.add('show');

        monkey.classList.add('show');
        princess.classList.add('show');
        monkey.classList.add('walking');
        princess.classList.add('walking');

        // Hide speech bubble after a few seconds - no more cycling
        scheduleTarapoto(() => {
          monkeySpeech.classList.remove('show');
          monkeySpeech.style.opacity = '0';
        }, 4000);

        walkAcross(monkey, princess, 6500, () => {
          narrative.classList.remove('show');
          narrative.style.opacity = '0';
        });
      }, 1200);

      // ── PHASE 2: Crossing the river ──
      scheduleTarapoto(() => {
        sceneTarapoto.classList.add('phase-river');
        river.classList.add('show');
        narrative.textContent = '🌊 Cruzando el río  Magallanes juntos, de la mano...';
        narrative.style.animation = 'none'; void narrative.offsetWidth; narrative.style.animation = '';
        narrative.style.top = '12%';
        narrative.classList.add('show');

        monkey.classList.remove('walking');
        princess.classList.remove('walking');
        monkey.style.opacity = '1'; princess.style.opacity = '1';
        resetToCenter(monkey, princess);

        scheduleTarapoto(() => {
          monkey.classList.add('walking');
          princess.classList.add('walking');
          walkAcross(monkey, princess, 5000, () => {
            narrative.classList.remove('show');
            narrative.style.opacity = '0';
          });
        }, 3000);

        scheduleTarapoto(() => { river.classList.remove('show'); sceneTarapoto.classList.remove('phase-river'); }, 9500);
      }, 9000);

      // ── PHASE 3: Lagoon ──
      scheduleTarapoto(() => {
        sceneTarapoto.classList.add('phase-lagoon');
        lagoon.classList.add('show');
        narrative.textContent = '💧 Llegan a una laguna escondida entre la selva...';
        narrative.style.animation = 'none'; void narrative.offsetWidth; narrative.style.animation = '';
        narrative.style.top = '12%';
        narrative.classList.add('show');

        monkey.classList.remove('walking');
        princess.classList.remove('walking');
        monkey.style.opacity = '1'; princess.style.opacity = '1';
        resetToCenter(monkey, princess);

        scheduleTarapoto(() => {
          narrative.classList.remove('show');
          narrative.style.opacity = '0';
        }, 4500);

        scheduleTarapoto(() => { lagoon.classList.remove('show'); sceneTarapoto.classList.remove('phase-lagoon'); }, 8500);
      }, 19500);

      // ── PHASE 4+5: Rain + Motorcycle combined! ──
      scheduleTarapoto(() => {
        sceneTarapoto.classList.add('phase-rain');
        spawnRainDrops();
        narrative.textContent = '🌧️🏍️ ¡Comienza la tormenta... y el mono y la princesa salen a explorar en moto bajo la lluvia!';
        narrative.style.animation = 'none'; void narrative.offsetWidth; narrative.style.animation = '';
        narrative.style.top = '12%';
        narrative.classList.add('show');

        // Hide walking characters immediately (with explicit opacity)
        monkey.classList.remove('show', 'walking');
        princess.classList.remove('show', 'walking');
        monkey.style.opacity = '0';
        princess.style.opacity = '0';

        scheduleTarapoto(() => {
          narrative.classList.remove('show');
          narrative.style.opacity = '0';
        }, 5000);

        // Moto appears while rain is active
        scheduleTarapoto(() => {
          moto.classList.add('show');
          scheduleTarapoto(() => moto.classList.add('riding'), 300);
        }, 1500);

        // Rain clears just as moto exits
        scheduleTarapoto(() => {
          sceneTarapoto.classList.remove('phase-rain');
        }, 7500);

        // Moto finishes ride
        scheduleTarapoto(() => {
          moto.classList.remove('show', 'riding');
          moto.style.left = '-400px';
        }, 9000);
      }, 29000);

      // ── PHASE 6: Photo slideshow (final phase — stays open) ──
      scheduleTarapoto(() => {
        const photosEl = document.getElementById('tarapotoPhotos');
        photosEl.classList.add('visible');
        photosIndex = 0;
        showPhotoSlide(0);
      }, 40000);
    }

    // Walk monkey and princess across the screen together
    function walkAcross(monkey, princess, duration, onComplete) {
      const screenW = window.innerWidth;
      const startPos = -150;
      const endPos = screenW + 50;

      monkey.style.transition = 'none';
      princess.style.transition = 'none';
      monkey.style.left = startPos + 'px';
      princess.style.left = (startPos + 140) + 'px';
      monkey.style.bottom = '20%';
      princess.style.bottom = '20%';
      monkey.style.top = '';
      princess.style.top = '';
      monkey.style.position = '';
      princess.style.position = '';
      monkey.style.transform = '';
      princess.style.transform = '';

      void monkey.offsetWidth;

      monkey.style.transition = `left ${duration}ms linear`;
      princess.style.transition = `left ${duration}ms linear`;

      requestAnimationFrame(() => {
        monkey.style.left = endPos + 'px';
        princess.style.left = (endPos - 140) + 'px';
      });

      setTimeout(() => {
        if (onComplete) onComplete();
      }, duration + 300);
    }

    // Reset characters to center, standing
    function resetToCenter(monkey, princess) {
      const screenW = window.innerWidth;
      const cx = screenW / 2;

      monkey.style.transition = 'left 1s ease, bottom 1s ease';
      princess.style.transition = 'left 1s ease, bottom 1s ease';
      monkey.style.position = '';
      princess.style.position = '';
      monkey.style.top = '';
      princess.style.top = '';
      monkey.style.transform = '';
      princess.style.transform = '';
      monkey.style.left = (cx - 180) + 'px';
      princess.style.left = (cx + 50) + 'px';
      monkey.style.bottom = '20%';
      princess.style.bottom = '20%';
    }

    function resetTarapotoScene() {
      tarapotoTimers.forEach(clearTimeout);
      tarapotoTimers = [];

      const title = document.getElementById('tarapotoTitle');
      const narrative = document.getElementById('tarapotoNarrative');
      const monkey = document.getElementById('tarapotoMonkey');
      const princess = document.getElementById('tarapotoPrincess');
      const monkeySpeech = document.getElementById('tarapotoMonkeySpeech');
      const river = document.getElementById('tarapotoRiver');
      const lagoon = document.getElementById('tarapotoLagoon');
      const moto = document.getElementById('tarapotoMoto');
      const photos = document.getElementById('tarapotoPhotos');
      const finalMsg = document.getElementById('tarapotoFinalMsg');
      const rainContainer = document.getElementById('tarapotoRain');

      sceneTarapoto.classList.remove('phase-river', 'phase-lagoon', 'phase-rain');

      if (title) { title.classList.remove('show'); title.style.opacity = '0'; void title.offsetWidth; title.style.animation = ''; }

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
        monkey.style.position = '';
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
        princess.style.position = '';
        princess.style.transition = 'none';
        princess.style.left = '-280px';
        princess.style.bottom = '20%';
      }

      if (river) river.classList.remove('show');
      if (lagoon) lagoon.classList.remove('show');
      if (moto) { moto.classList.remove('show', 'riding'); moto.style.left = '-350px'; }

      // Clean rain drops
      if (rainContainer) {
        const drops = rainContainer.querySelectorAll('.rain-drop');
        drops.forEach(d => d.remove());
      }

      if (photos) { photos.classList.remove('visible'); }
      if (finalMsg) { finalMsg.classList.remove('show'); finalMsg.style.opacity = '0'; void finalMsg.offsetWidth; finalMsg.style.animation = ''; }
    }

    // No tap-to-return for Tarapoto scene (disabled)

    /* ===== TARAPOTO PHOTO SLIDESHOW ===== */
    let photosIndex = 0;
    const totalPhotos = 8;

    function showPhotoSlide(idx) {
      for (let i = 1; i <= totalPhotos; i++) {
        const slide = document.getElementById('photoSlide' + i);
        if (slide) {
          slide.classList.toggle('active', i === idx + 1);
          if (i === idx + 1) {
            slide.style.animation = 'none';
            void slide.offsetWidth;
            slide.style.animation = '';
          }
        }
      }
      const counter = document.getElementById('photosCounter');
      counter.textContent = `${idx + 1} / ${totalPhotos}`;
    }

    document.getElementById('photosNext').addEventListener('click', (e) => {
      e.stopPropagation();
      if (photosIndex < totalPhotos - 1) {
        photosIndex++;
        showPhotoSlide(photosIndex);
      }
    });

    document.getElementById('photosPrev').addEventListener('click', (e) => {
      e.stopPropagation();
      if (photosIndex > 0) {
        photosIndex--;
        showPhotoSlide(photosIndex);
      }
    });

    document.getElementById('photosBackBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      const photosEl = document.getElementById('tarapotoPhotos');
      photosEl.classList.remove('visible');
      resetTarapotoScene();
      sceneTarapoto.classList.remove('visible');
      selectorScreen.classList.remove('hidden');
    });

    /* ===== FLOATING HEARTS ===== */
    function spawnFloatingHearts() {
      const h=['♥','♡','💕','💗'];
      setInterval(()=>{
        const el=document.createElement('span');
        el.classList.add('floating-heart');
        el.textContent=h[~~(Math.random()*h.length)];
        el.style.left=Math.random()*100+'vw';
        el.style.fontSize=(1+Math.random()*1.5)+'rem';
        el.style.animationDuration=(8+Math.random()*8)+'s';
        document.body.appendChild(el);
        setTimeout(()=>el.remove(),16000);
      },2500);
    }

    /* ===== DAYS COUNTER (content page) ===== */
    document.getElementById('daysNumber').textContent = calcDays();

    /* ===== DATE ===== */
    document.getElementById('currentDate').textContent =
      new Date().toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'});


        /* ==========================================================
       ===== LAWYER SCENE LOGIC (MI ABOGADA FAVORITA) =====
       ========================================================== */
    const sceneLawyer = document.getElementById('sceneLawyer');
    const btnLawyer = document.getElementById('btnLawyer');
    const lawyerPhotosBackBtn = document.getElementById('lawyerPhotosBackBtn');
    let lawyerTimers = [];
    let lawyerPhotoIndex = 0;
    const totalLawyerPhotos = document.querySelectorAll('#lawyerPhotosSlider .photo-slide').length;

    function scheduleLawyer(fn, delay) {
      const id = setTimeout(fn, delay);
      lawyerTimers.push(id);
      return id;
    }

    function clearLawyerTimers() {
      lawyerTimers.forEach(id => clearTimeout(id));
      lawyerTimers = [];
      const confetti = document.getElementById('lawyerConfetti');
      if (confetti) confetti.innerHTML = '';
    }

    function spawnLawyerConfetti() {
      const wrap = document.getElementById('lawyerConfetti');
      if (!wrap) return;
      wrap.innerHTML = '';
      const colors = ['#ffd700', '#ff4081', '#00e5ff', '#76ff03', '#ffffff', '#e040fb'];
      for (let i = 0; i < 45; i++) {
        const piece = document.createElement('div');
        piece.className = 'lawyer-confetti-piece';
        piece.style.left = (Math.random() * 100) + '%';
        piece.style.background = colors[Math.floor(Math.random() * colors.length)];
        piece.style.animationDelay = (Math.random() * 2) + 's';
        piece.style.animationDuration = (2 + Math.random() * 1.5) + 's';
        piece.style.width = (6 + Math.random() * 6) + 'px';
        piece.style.height = (10 + Math.random() * 8) + 'px';
        wrap.appendChild(piece);
      }
    }

    function setLawyerPhotoSlide(idx) {
      for (let i = 1; i <= totalLawyerPhotos; i++) {
        const slide = document.getElementById(`lawyerPhotoSlide${i}`);
        if (slide) {
          if (i - 1 === idx) {
            slide.classList.add('active');
          } else {
            slide.classList.remove('active');
          }
        }
      }
      const counter = document.getElementById('lawyerPhotosCounter');
      if (counter) counter.textContent = `${idx + 1} / ${totalLawyerPhotos}`;
      document.getElementById('lawyerPhotosPrev').disabled = idx === 0;
      document.getElementById('lawyerPhotosNext').disabled = idx === totalLawyerPhotos - 1;
    }

    function resetLawyerScene() {
      clearLawyerTimers();
      const diploma = document.getElementById('lawyerDiploma');
      const monkeySpeech = document.getElementById('lawyerMonkeySpeech');
      const camFlash = document.getElementById('lawyerFlash');
      const princess = document.getElementById('lawyerPrincess');
      const princessSpeech = document.getElementById('lawyerPrincessSpeech');
      const monkey = document.getElementById('lawyerMonkey');
      const bouquet = document.getElementById('monkeyBouquet');

      if (diploma) diploma.classList.remove('show');
      if (monkeySpeech) monkeySpeech.classList.remove('show');
      if (camFlash) camFlash.classList.remove('flash');
      if (princess) princess.classList.remove('triumph');
      if (princessSpeech) princessSpeech.classList.remove('show');
      if (bouquet) bouquet.classList.remove('show');
      if (monkey) {
        monkey.classList.remove('walking', 'cheering');
        monkey.style.transform = '';
      }
      lawyerPhotoIndex = 0;
      setLawyerPhotoSlide(0);
    }

    function startLawyerScene() {
      resetLawyerScene();
      sceneLawyer.scrollTop = 0;
      const diploma = document.getElementById('lawyerDiploma');
      const monkeySpeech = document.getElementById('lawyerMonkeySpeech');
      const camFlash = document.getElementById('lawyerFlash');
      const princess = document.getElementById('lawyerPrincess');
      const princessSpeech = document.getElementById('lawyerPrincessSpeech');
      const monkey = document.getElementById('lawyerMonkey');
      const bouquet = document.getElementById('monkeyBouquet');

      // Step 1: Monito enthusiastically cheering and taking photos
      scheduleLawyer(() => {
        if (monkey) monkey.classList.add('cheering');
        if (monkeySpeech) {
          monkeySpeech.textContent = '¡Esa es mi abogada! ⚖️❤️👏';
          monkeySpeech.classList.add('show');
        }
        if (camFlash) camFlash.classList.add('flash');
      }, 1000);

      // Step 2: Princess triumphs at the podium
      scheduleLawyer(() => {
        if (princess) princess.classList.add('triumph');
        if (princessSpeech) {
          princessSpeech.textContent = '¡Sustentación aprobada! 🎓✨';
          princessSpeech.classList.add('show');
        }
      }, 2400);

      // Step 3: Diploma reveals with fanfare & confetti rain
      scheduleLawyer(() => {
        if (diploma) diploma.classList.add('show');
        if (princessSpeech) princessSpeech.classList.remove('show');
        spawnLawyerConfetti();
        if (camFlash) {
          camFlash.classList.remove('flash');
          void camFlash.offsetWidth;
          camFlash.classList.add('flash');
        }
      }, 4800);

      // Step 4: Monito approaches with flowers to congratulate her
      scheduleLawyer(() => {
        if (bouquet) bouquet.classList.add('show');
        if (monkey) {
          monkey.classList.remove('cheering');
          monkey.classList.add('walking');
        }
        if (monkeySpeech) {
          monkeySpeech.textContent = '¡Orgulloso de ti, mi doctora hermosa! 💐👑';
          monkeySpeech.classList.add('show');
        }
      }, 5500);

      // Step 5: Princess responds lovingly
      scheduleLawyer(() => {
        if (monkeySpeech) monkeySpeech.classList.remove('show');
        if (princessSpeech) {
          princessSpeech.textContent = '¡Gracias por creer en mí, monito! 💕';
          princessSpeech.classList.add('show');
        }
      }, 7500);
    }

    if (btnLawyer) {
      btnLawyer.addEventListener('click', () => {
        openScene(() => {
          if (sceneLawyer) sceneLawyer.classList.add('visible');
          startLawyerScene();
        });
      });
    }

    if (lawyerPhotosBackBtn) {
      lawyerPhotosBackBtn.addEventListener('click', () => {
        returnToSelectorMenu();
      });
    }

    const lawyerPrevBtn = document.getElementById('lawyerPhotosPrev');
    const lawyerNextBtn = document.getElementById('lawyerPhotosNext');
    if (lawyerPrevBtn) {
      lawyerPrevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (lawyerPhotoIndex > 0) {
          lawyerPhotoIndex--;
          setLawyerPhotoSlide(lawyerPhotoIndex);
        }
      });
    }
    if (lawyerNextBtn) {
      lawyerNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (lawyerPhotoIndex < totalLawyerPhotos - 1) {
          lawyerPhotoIndex++;
          setLawyerPhotoSlide(lawyerPhotoIndex);
        }
      });
    }


    /* ==========================================================
       ===== PAPA LEÓN XIV EN PIMENTEL LOGIC =====
       ========================================================== */
    const scenePapa = document.getElementById('scenePapa');
    const btnPapa = document.getElementById('btnPapa');
    const papaPhotosBackBtn = document.getElementById('papaPhotosBackBtn');
    let papaTimers = [];
    let papaPhotoIndex = 0;
    const totalPapaPhotos = document.querySelectorAll('#papaPhotosSlider .photo-slide').length;

    function schedulePapa(fn, delay) {
      const id = setTimeout(fn, delay);
      papaTimers.push(id);
      return id;
    }

    function clearPapaTimers() {
      papaTimers.forEach(id => clearTimeout(id));
      papaTimers = [];
      const sparks = document.getElementById('papaHolySparks');
      if (sparks) sparks.innerHTML = '';
    }

    function spawnHolySparks() {
      const wrap = document.getElementById('papaHolySparks');
      if (!wrap) return;
      wrap.innerHTML = '';
      for (let i = 0; i < 25; i++) {
        const spark = document.createElement('div');
        spark.className = 'holy-spark';
        spark.style.left = (20 + Math.random() * 60) + '%';
        spark.style.top = (40 + Math.random() * 40) + '%';
        spark.style.animationDelay = (Math.random() * 1.5) + 's';
        wrap.appendChild(spark);
      }
    }

    function setPapaPhotoSlide(idx) {
      for (let i = 1; i <= totalPapaPhotos; i++) {
        const slide = document.getElementById(`papaPhotoSlide${i}`);
        if (slide) {
          if (i - 1 === idx) {
            slide.classList.add('active');
          } else {
            slide.classList.remove('active');
          }
        }
      }
      const counter = document.getElementById('papaPhotosCounter');
      if (counter) counter.textContent = `${idx + 1} / ${totalPapaPhotos}`;
      document.getElementById('papaPhotosPrev').disabled = idx === 0;
      document.getElementById('papaPhotosNext').disabled = idx === totalPapaPhotos - 1;
    }

    function resetPapaScene() {
      clearPapaTimers();
      document.getElementById('papaPilgrims').classList.remove('carrying-princess');
      const papaSpeech = document.getElementById('papaSpeechBubble');
      const princessSpeech = document.getElementById('papaPrincessSpeech');
      const monkeySpeech = document.getElementById('papaMonkeySpeech');
      const popemobile = document.getElementById('papaPopemobile');

      if (papaSpeech) papaSpeech.classList.remove('show');
      if (princessSpeech) princessSpeech.classList.remove('show');
      if (monkeySpeech) monkeySpeech.classList.remove('show');
      if (popemobile) {
        popemobile.style.transform = '';
        popemobile.classList.remove('advancing');
      }

      papaPhotoIndex = 0;
      setPapaPhotoSlide(0);
    }

    function startPapaScene() {
      resetPapaScene();
      scenePapa.scrollTop = 0;
      const papaSpeech = document.getElementById('papaSpeechBubble');
      const princessSpeech = document.getElementById('papaPrincessSpeech');
      const monkeySpeech = document.getElementById('papaMonkeySpeech');
      const popemobile = document.getElementById('papaPopemobile');

      // Step 1: Popemobile advances in the coastal breeze of Pimentel
      schedulePapa(() => {
        if (popemobile) {
          popemobile.classList.add('advancing');
        }
        if (monkeySpeech) {
          monkeySpeech.textContent = '¡Ahí viene el Papamóvil! 🐒✨';
          monkeySpeech.classList.add('show');
        }
      }, 1200);

      // Step 2: She cannot see over the crowd yet.
      schedulePapa(() => {
        if (monkeySpeech) monkeySpeech.classList.remove('show');
        if (princessSpeech) {
          princessSpeech.textContent = '¡Monito, no alcanzo a ver al Papa! 🥺';
          princessSpeech.classList.add('show');
        }
      }, 2800);

      // Step 3: He lifts her onto his shoulders before the blessing.
      schedulePapa(() => {
        if (princessSpeech) princessSpeech.classList.remove('show');
        document.getElementById('papaPilgrims').classList.add('carrying-princess');
        monkeySpeech.textContent = '¡A mis hombros, princesa, para que lo veas! ❤️';
        monkeySpeech.classList.add('show');
      }, 4500);

      // Step 4: Pope León XIV gives his apostolic blessing with golden light.
      schedulePapa(() => {
        monkeySpeech.classList.remove('show');
        if (papaSpeech) {
          papaSpeech.textContent = '¡La paz esté con ustedes! 🕊️✨';
          papaSpeech.classList.add('show');
        }
        spawnHolySparks();
      }, 6500);

      // Step 5: From his shoulders she can finally see the Pope.
      schedulePapa(() => {
        if (papaSpeech) papaSpeech.classList.remove('show');
        if (princessSpeech) {
          princessSpeech.textContent = '¡Ahora sí lo veo! Gracias, mi monito. 🕊️❤️';
          princessSpeech.classList.add('show');
        }
      }, 8500);

      // Step 6: They keep sharing the moment together.
      schedulePapa(() => {
        if (monkeySpeech) monkeySpeech.classList.remove('show');
        if (princessSpeech) {
          princessSpeech.textContent = 'Un momento que nunca olvidaré... ✨🕊️';
          princessSpeech.classList.add('show');
        }
      }, 11000);
    }

    if (btnPapa) {
      btnPapa.addEventListener('click', () => {
        openScene(() => {
          if (scenePapa) scenePapa.classList.add('visible');
          startPapaScene();
        });
      });
    }

    if (papaPhotosBackBtn) {
      papaPhotosBackBtn.addEventListener('click', () => {
        returnToSelectorMenu();
      });
    }

    const papaPrevBtn = document.getElementById('papaPhotosPrev');
    const papaNextBtn = document.getElementById('papaPhotosNext');
    if (papaPrevBtn) {
      papaPrevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (papaPhotoIndex > 0) {
          papaPhotoIndex--;
          setPapaPhotoSlide(papaPhotoIndex);
        }
      });
    }
    if (papaNextBtn) {
      papaNextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (papaPhotoIndex < totalPapaPhotos - 1) {
          papaPhotoIndex++;
          setPapaPhotoSlide(papaPhotoIndex);
        }
      });
    }
