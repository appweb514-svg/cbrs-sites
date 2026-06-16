/* CBRS Premium – Shared JavaScript */

(function () {
  'use strict';

  /* ===== Menu toggle (mobile) ===== */
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.querySelector('.main-nav');
  if (menuToggle && mainNav) {
    menuToggle.addEventListener('click', () => {
      const open = mainNav.style.display === 'flex';
      mainNav.style.display = open ? '' : 'flex';
      if (!open) {
        mainNav.style.flexDirection = 'column';
        mainNav.style.position = 'absolute';
        mainNav.style.top = '100%';
        mainNav.style.left = '0';
        mainNav.style.right = '0';
        mainNav.style.background = '#fff';
        mainNav.style.padding = '1rem';
        mainNav.style.borderBottom = '1px solid var(--line)';
        mainNav.style.boxShadow = 'var(--shadow)';
        mainNav.style.zIndex = '60';
      }
    });
  }

  /* ===== Font size controls ===== */
  let fontScale = 100;
  document.querySelectorAll('[data-font-plus]').forEach(btn => {
    btn.addEventListener('click', () => {
      fontScale = Math.min(fontScale + 5, 150);
      document.documentElement.style.fontSize = fontScale + '%';
    });
  });
  document.querySelectorAll('[data-font-minus]').forEach(btn => {
    btn.addEventListener('click', () => {
      fontScale = Math.max(fontScale - 5, 80);
      document.documentElement.style.fontSize = fontScale + '%';
    });
  });

  /* ===== High contrast ===== */
  document.querySelectorAll('[data-contrast]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pressed = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', !pressed);
      document.documentElement.classList.toggle('a11y-contrast', !pressed);
    });
  });

  /* ===== Text-to-speech (read page) ===== */
  document.querySelectorAll('[data-listen]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      } else {
        const text = document.querySelector('main')?.innerText || document.body.innerText;
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'fr-FR';
        utter.rate = 0.9;
        window.speechSynthesis.speak(utter);
      }
    });
  });

  /* ===== Auto-read ===== */
  document.querySelectorAll('[data-auto-read]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pressed = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', !pressed);
      if (!pressed) {
        const text = document.querySelector('main')?.innerText || document.body.innerText;
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = 'fr-FR';
        utter.rate = 0.9;
        window.speechSynthesis.speak(utter);
      } else {
        window.speechSynthesis.cancel();
      }
    });
  });

  /* ===== Lightbox (from gallery/data-gallery buttons) ===== */
  const lightbox = document.querySelector('.lightbox');
  if (lightbox) {
    const lbImg = lightbox.querySelector('img');
    const lbFig = lightbox.querySelector('figcaption');
    const lbClose = lightbox.querySelector('.lightbox-close');

    document.querySelectorAll('[data-gallery]').forEach(el => {
      el.addEventListener('click', () => {
        const img = el.querySelector('img');
        if (img && lbImg) {
          lbImg.src = img.src;
          lbImg.alt = img.alt;
          if (lbFig) lbFig.textContent = el.dataset.caption || '';
          lightbox.hidden = false;
          if (lbClose) lbClose.focus();
        }
      });
    });

    if (lbClose) lbClose.addEventListener('click', () => { lightbox.hidden = true; });
    lightbox.addEventListener('click', e => { if (e.target === lightbox) lightbox.hidden = true; });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !lightbox.hidden) lightbox.hidden = true;
    });
  }

  /* ===== Planning view switcher ===== */
  document.querySelectorAll('[data-planning-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-planning-view]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.planningView;
      const calendar = document.querySelector('[data-planning-calendar]');
      const full = document.querySelector('[data-planning-full]');
      const title = document.querySelector('[data-planning-title]');
      if (calendar && full) {
        calendar.hidden = view === 'full';
        full.hidden = view !== 'full';
      }
      if (title) {
        const titles = { week: 'Planning de la semaine', month: 'Planning du mois', full: 'Planning complet' };
        title.textContent = titles[view] || titles.week;
      }
    });
  });

})();
