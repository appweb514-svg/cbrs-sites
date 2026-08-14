(function () {
  'use strict';

  const PUBLIC_PAGES = new Set([
    'index.html',
    'activite.html',
    'activites.html',
    'adhesion.html',
    'contact.html',
    'mentions-legales.html',
    'conditions-utilisation.html',
    'formation.html',
    'galerie.html',
    'liens-utiles.html',
    'planning.html',
    'sorties-voyages.html'
  ]);

  function currentPage() {
    const file = window.location.pathname.split('/').pop() || 'index.html';
    return PUBLIC_PAGES.has(file) ? file : 'index.html';
  }

  function targetPage(href) {
    if (!href || href.startsWith('#') || href.startsWith('mailto:')) return '';
    return href.split('/').pop().split('?')[0].split('#')[0] || 'index.html';
  }

  function setActiveNavigation() {
    const page = currentPage();
    const activePage = page === 'activite.html' ? 'activites.html' : page;

    document.querySelectorAll('#sidebar a[href], #mobile-menu a[href]').forEach(function (link) {
      const isActive = targetPage(link.getAttribute('href')) === activePage;
      link.classList.toggle('cbrs-nav-active', isActive);
      link.classList.toggle('bg-cbrs-green', isActive);
      link.classList.toggle('text-white', isActive);
      link.classList.toggle('text-white/80', !isActive);
      if (isActive) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  function syncHeroHeight() {
    const hero = document.querySelector('body > .cbrs-hero');
    if (!hero) return;

    const update = function () {
      document.documentElement.style.setProperty('--cbrs-hero-height', hero.offsetHeight + 'px');
    };

    update();
    if (window.ResizeObserver) {
      const observer = new ResizeObserver(update);
      observer.observe(hero);
    } else {
      window.addEventListener('resize', update, { passive: true });
    }
  }

  function setupShell() {
    document.body.classList.add('cbrs-ui');
    if (
      typeof document.startViewTransition !== 'function'
      && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      document.body.classList.add('cbrs-page-fallback');
    }

    const hero = document.querySelector('body > section.relative');
    if (hero) {
      hero.classList.add('cbrs-hero');
      const logo = hero.querySelector('img[alt="CBRS"]');
      if (logo && !logo.closest('.cbrs-logo-frame')) {
        const frame = document.createElement('div');
        frame.className = 'cbrs-logo-frame';
        logo.className = 'cbrs-logo-image';
        logo.parentNode.insertBefore(frame, logo);
        frame.appendChild(logo);
      }
    }

    const layout = document.querySelector('body > .flex.flex-1');
    if (layout) layout.classList.add('cbrs-layout');

    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.add('cbrs-sidebar');

    const content = document.getElementById('contenu');
    if (content) content.classList.add('cbrs-content');

    const mobileHeader = document.querySelector('header.md\\:hidden');
    if (mobileHeader) mobileHeader.classList.add('cbrs-mobile-header');

    syncHeroHeight();

    document.querySelectorAll('#sidebar .sidebar-link, #mobile-menu a').forEach(function (link) {
      if (!link.title) {
        const label = link.querySelector('.sidebar-label, span') || link;
        link.title = label.textContent.trim();
      }
    });

    // The activity icons are binary assets whose background may change while
    // the static site is being reviewed. Bust a browser/CDN cache that could
    // otherwise keep serving the previous opaque PNG at the same URL.
    document.querySelectorAll('img[src]').forEach(function (image) {
      const src = image.getAttribute('src') || '';
      if (/(^|\/)\d{2}_[^/?#]+\.png(?:\?[^#]*)?$/i.test(src) && !/[?&]v=/.test(src)) {
        image.setAttribute('src', src + '?v=transparent-icons-20260814-v3');
      }
    });

    const flashBar = document.getElementById('flash-bar');
    if (flashBar) {
      flashBar.setAttribute('role', 'status');
      flashBar.setAttribute('aria-live', 'polite');
    }

    setActiveNavigation();
  }

  function setupMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const button = document.querySelector('button[aria-controls="mobile-menu"]');
    if (!menu || !button) return;

    function setOpen(open) {
      menu.classList.toggle('open', open);
      menu.classList.toggle('hidden', !open);
      document.body.classList.toggle('cbrs-mobile-menu-open', open);
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    }

    window.toggleMobileMenu = function (force) {
      const open = typeof force === 'boolean' ? force : !menu.classList.contains('open');
      setOpen(open);
    };

    setOpen(menu.classList.contains('open'));

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menu.classList.contains('open')) {
        setOpen(false);
        button.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (menu.classList.contains('open') && !button.closest('header').contains(event.target)) {
        setOpen(false);
      }
    });

    menu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        setOpen(false);
      });
    });
  }

  function setupCookieConsent() {
    const consentKey = 'cbrs-cookie-consent-v1';
    const externalFrames = Array.from(document.querySelectorAll('[data-cookie-src]'));
    let stored = null;

    try {
      stored = JSON.parse(window.localStorage.getItem(consentKey) || 'null');
    } catch (_) {
      stored = null;
    }

    const root = document.createElement('div');
    root.id = 'cbrs-cookie-consent';
    root.innerHTML = [
      '<section class="cbrs-cookie-banner" role="region" aria-label="Préférences de confidentialité">',
      '<div class="cbrs-cookie-copy">',
      '<p class="cbrs-cookie-eyebrow">Confidentialité</p>',
      '<h2>Votre vie privée compte</h2>',
      '<p>Le CBRS mémorise uniquement votre choix et bloque les cartes externes tant que vous ne les avez pas autorisées.</p>',
      '<a href="mentions-legales.html#cookies">En savoir plus</a>',
      '</div>',
      '<div class="cbrs-cookie-actions">',
      '<button type="button" data-cookie-action="reject" class="cbrs-cookie-button cbrs-cookie-button-secondary">Refuser</button>',
      '<button type="button" data-cookie-action="customize" class="cbrs-cookie-button cbrs-cookie-button-quiet">Personnaliser</button>',
      '<button type="button" data-cookie-action="accept" class="cbrs-cookie-button cbrs-cookie-button-primary">Tout accepter</button>',
      '</div>',
      '</section>',
      '<section class="cbrs-cookie-dialog" hidden role="dialog" aria-modal="true" aria-labelledby="cbrs-cookie-title">',
      '<div class="cbrs-cookie-dialog-card">',
      '<div class="cbrs-cookie-dialog-header"><div><p class="cbrs-cookie-eyebrow">Vos choix</p><h2 id="cbrs-cookie-title">Gérer les cookies</h2></div><button type="button" class="cbrs-cookie-close" data-cookie-action="close" aria-label="Fermer">×</button></div>',
      '<p class="cbrs-cookie-dialog-intro">Les éléments nécessaires restent actifs. Les contenus externes sont désactivés par défaut et peuvent être réactivés à tout moment.</p>',
      '<div class="cbrs-cookie-options">',
      '<div class="cbrs-cookie-option"><div><strong>Fonctionnement nécessaire</strong><small>Préférence de consentement et aides d’accessibilité.</small></div><span class="cbrs-cookie-status">Toujours actif</span></div>',
      '<label class="cbrs-cookie-option cbrs-cookie-option-toggle"><span><strong>Cartes et contenus externes</strong><small>Charge les cartes OpenStreetMap sur les pages Contact et Activité.</small></span><input type="checkbox" data-cookie-toggle="external"><span class="cbrs-cookie-switch" aria-hidden="true"></span></label>',
      '</div>',
      '<p class="cbrs-cookie-note">Aucun outil de mesure d’audience ni publicité n’est activé dans cette version du site.</p>',
      '<div class="cbrs-cookie-dialog-actions"><button type="button" data-cookie-action="close" class="cbrs-cookie-button cbrs-cookie-button-secondary">Annuler</button><button type="button" data-cookie-action="save" class="cbrs-cookie-button cbrs-cookie-button-primary">Enregistrer mes choix</button></div>',
      '</div>',
      '</section>',
      '<button type="button" class="cbrs-cookie-manage" data-cookie-open hidden>Cookies</button>'
    ].join('');
    document.body.appendChild(root);

    const banner = root.querySelector('.cbrs-cookie-banner');
    const dialog = root.querySelector('.cbrs-cookie-dialog');
    const toggle = root.querySelector('[data-cookie-toggle="external"]');
    const manage = root.querySelector('.cbrs-cookie-manage');
    let lastFocus = null;
    let current = stored && stored.version === 1
      ? { necessary: true, external: stored.external === true }
      : { necessary: true, external: false };

    function applyExternalConsent() {
      externalFrames.forEach(function (frame, index) {
        let placeholder = frame._cbrsCookiePlaceholder;
        if (!placeholder) {
          placeholder = document.createElement('div');
          placeholder.className = 'cbrs-external-placeholder';
          placeholder.innerHTML = '<strong>Carte externe désactivée</strong><span>Autorisez les contenus externes pour afficher la carte.</span><button type="button" class="cbrs-cookie-button cbrs-cookie-button-secondary">Autoriser les contenus externes</button>';
          placeholder.querySelector('button').addEventListener('click', openPreferences);
          frame.insertAdjacentElement('beforebegin', placeholder);
          frame._cbrsCookiePlaceholder = placeholder;
          frame.dataset.cookieIndex = String(index);
        }

        const enabled = current.external === true;
        if (enabled) {
          if (!frame.getAttribute('src')) frame.setAttribute('src', frame.dataset.cookieSrc);
          frame.hidden = false;
          frame.removeAttribute('aria-hidden');
          placeholder.hidden = true;
        } else {
          frame.removeAttribute('src');
          frame.hidden = true;
          frame.setAttribute('aria-hidden', 'true');
          placeholder.hidden = false;
        }
      });
    }

    function closeDialog(restoreFocus) {
      dialog.hidden = true;
      document.body.classList.remove('cbrs-cookie-dialog-open');
      if (restoreFocus && lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    }

    function openPreferences(event) {
      if (event) event.preventDefault();
      lastFocus = document.activeElement;
      toggle.checked = current.external === true;
      dialog.hidden = false;
      document.body.classList.add('cbrs-cookie-dialog-open');
      const close = dialog.querySelector('.cbrs-cookie-close');
      if (close) close.focus();
    }

    function saveConsent(external) {
      current = { necessary: true, external: external === true };
      try {
        window.localStorage.setItem(consentKey, JSON.stringify({
          version: 1,
          necessary: true,
          external: current.external,
          updatedAt: new Date().toISOString()
        }));
      } catch (_) {}
      applyExternalConsent();
      banner.hidden = true;
      manage.hidden = false;
      closeDialog(false);
      window.dispatchEvent(new CustomEvent('cbrs-consent-change', { detail: current }));
    }

    root.querySelectorAll('[data-cookie-action="accept"]').forEach(function (button) {
      button.addEventListener('click', function () { saveConsent(true); });
    });
    root.querySelectorAll('[data-cookie-action="reject"]').forEach(function (button) {
      button.addEventListener('click', function () { saveConsent(false); });
    });
    root.querySelectorAll('[data-cookie-action="customize"], [data-cookie-open]').forEach(function (button) {
      button.addEventListener('click', openPreferences);
    });
    root.querySelectorAll('[data-cookie-action="close"]').forEach(function (button) {
      button.addEventListener('click', function () { closeDialog(true); });
    });
    const save = root.querySelector('[data-cookie-action="save"]');
    if (save) save.addEventListener('click', function () { saveConsent(toggle.checked); });

    document.querySelectorAll('[data-cookie-open]').forEach(function (button) {
      if (!root.contains(button)) button.addEventListener('click', openPreferences);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !dialog.hidden) closeDialog(true);
    });

    applyExternalConsent();
    if (stored && stored.version === 1) {
      banner.hidden = true;
      manage.hidden = false;
    } else {
      banner.hidden = false;
      manage.hidden = true;
    }

    window.CBRSConsent = {
      open: openPreferences,
      reset: function () {
        try { window.localStorage.removeItem(consentKey); } catch (_) {}
        window.location.reload();
      }
    };
  }

  function setupSidebarToggle() {
    const sidebar = document.getElementById('sidebar');
    const button = sidebar && sidebar.querySelector('.sidebar-toggle');
    if (!sidebar || !button) return;

    function sync() {
      const collapsed = sidebar.classList.contains('collapsed');
      const label = collapsed ? 'Ouvrir la barre latérale' : 'Réduire la barre latérale';
      button.setAttribute('aria-label', label);
      button.setAttribute('title', label);
      button.setAttribute('aria-controls', 'sidebar');
      button.setAttribute('aria-expanded', String(!collapsed));
    }

    sync();
    if (window.MutationObserver) {
      const observer = new MutationObserver(sync);
      observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });
    }
  }

  function setupAccessibilityPanel() {
    const panel = document.getElementById('accessibility-panel');
    if (!panel || panel.querySelector('[data-a11y-audio="read"]')) return;

    const heading = panel.querySelector('h2');
    if (heading && !panel.querySelector('.a11y-intro')) {
      const intro = document.createElement('p');
      intro.className = 'a11y-intro';
      intro.textContent = 'Activez une aide puis réinitialisez les options à tout moment.';
      heading.insertAdjacentElement('afterend', intro);
    }

    const audio = document.createElement('section');
    audio.className = 'a11y-audio';
    audio.innerHTML = [
      '<div class="a11y-audio-heading"><span>Lecture audio</span><small>Voix française</small></div>',
      '<p class="a11y-audio-description">Écoutez le contenu principal de la page avec la synthèse vocale de votre navigateur.</p>',
      '<div class="a11y-audio-actions">',
      '<button type="button" data-a11y-audio="read" aria-pressed="false" aria-label="Lire la page">',
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"></path></svg><span>Lire la page</span>',
      '</button>',
      '<button type="button" data-a11y-audio="stop" aria-label="Arrêter la lecture" disabled>',
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h12v12H6z"></path></svg><span>Arrêter</span>',
      '</button>',
      '</div>',
      '<p class="a11y-audio-status" aria-live="polite"></p>'
    ].join('');

    const close = panel.querySelector('.close');
    panel.insertBefore(audio, close || null);

    const read = audio.querySelector('[data-a11y-audio="read"]');
    const stop = audio.querySelector('[data-a11y-audio="stop"]');
    const status = audio.querySelector('.a11y-audio-status');
    const supported = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
    let utterance = null;

    function setState(state, message) {
      const speaking = state === 'speaking' || state === 'paused';
      read.setAttribute('aria-pressed', String(speaking));
      read.setAttribute('aria-label', state === 'speaking' ? 'Mettre en pause la lecture' : state === 'paused' ? 'Reprendre la lecture' : 'Lire la page');
      read.querySelector('span').textContent = state === 'speaking' ? 'Pause' : state === 'paused' ? 'Reprendre' : 'Lire la page';
      read.querySelector('svg').innerHTML = state === 'speaking'
        ? '<path d="M7 5h3v14H7zM14 5h3v14h-3z"></path>'
        : '<path d="M8 5v14l11-7z"></path>';
      stop.disabled = !speaking;
      status.textContent = message || '';
    }

    function pageText() {
      const main = document.querySelector('main#contenu, main');
      if (!main) return '';
      const clone = main.cloneNode(true);
      clone.querySelectorAll('script, style, nav, .accessibility-panel, .accessibility-fab, button').forEach(function (node) {
        node.remove();
      });
      return (clone.innerText || clone.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 7000);
    }

    function stopReading() {
      if (supported) window.speechSynthesis.cancel();
      utterance = null;
      setState('idle', '');
    }

    read.addEventListener('click', function () {
      if (!supported) {
        setState('idle', 'La lecture audio n’est pas disponible dans ce navigateur.');
        return;
      }
      if (window.speechSynthesis.speaking) {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setState('speaking', 'Lecture en cours…');
        } else {
          window.speechSynthesis.pause();
          setState('paused', 'Lecture en pause.');
        }
        return;
      }
      const text = pageText();
      if (!text) {
        setState('idle', 'Aucun contenu principal à lire.');
        return;
      }
      utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.onstart = function () { setState('speaking', 'Lecture en cours…'); };
      utterance.onend = function () { setState('idle', 'Lecture terminée.'); };
      utterance.onerror = function () { setState('idle', 'La lecture audio a été interrompue.'); };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });

    stop.addEventListener('click', stopReading);
    if (!supported) {
      read.disabled = true;
      status.textContent = 'La lecture audio n’est pas disponible dans ce navigateur.';
    } else {
      setState('idle', '');
    }
  }

  function setupGallery() {
    const items = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    if (!items.length && !lightbox) return;

    const noResults = document.getElementById('no-results');
    if (noResults) noResults.setAttribute('role', 'status');

    items.forEach(function (item) {
      item.tabIndex = 0;
      item.setAttribute('role', 'button');
      const caption = item.querySelector('figcaption');
      if (caption) item.setAttribute('aria-label', 'Ouvrir : ' + caption.textContent.trim());
      item.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          item.click();
        }
      });
    });

    if (lightbox) {
      lightbox.setAttribute('role', 'dialog');
      lightbox.setAttribute('aria-modal', 'true');
      lightbox.setAttribute('aria-hidden', 'true');
      const close = lightbox.querySelector('.lightbox-close');
      const image = lightbox.querySelector('img');
      const caption = lightbox.querySelector('.lightbox-caption');
      [close, image, caption].filter(Boolean).forEach(function (node) {
        node.addEventListener('click', function (event) {
          event.stopPropagation();
        });
      });
      if (close) close.setAttribute('aria-label', 'Fermer la photo');

      let lastFocus = null;
      const open = window.openLightbox;
      const closeLightbox = window.closeLightbox;
      if (typeof open === 'function' && typeof closeLightbox === 'function') {
        window.openLightbox = function () {
          lastFocus = document.activeElement;
          open.apply(this, arguments);
          lightbox.setAttribute('aria-hidden', 'false');
          if (close) close.focus();
        };
        window.closeLightbox = function () {
          closeLightbox.apply(this, arguments);
          lightbox.setAttribute('aria-hidden', 'true');
          if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
        };
      }
    }
  }

  function setupFilters() {
    const buttons = document.querySelectorAll('.filter-btn, .year-btn');
    if (!buttons.length) return;

    function sync() {
      buttons.forEach(function (button) {
        const active = button.classList.contains('bg-cbrs-green') || button.classList.contains('bg-cbrs-blue');
        button.setAttribute('aria-pressed', String(active));
      });
    }

    buttons.forEach(function (button) {
      button.addEventListener('click', sync);
    });
    sync();
  }

  function setupMembershipForm() {
    const form = document.querySelector('form[onsubmit="return false;"]');
    if (!form) return;

    const note = form.previousElementSibling && form.previousElementSibling.tagName === 'P'
      ? form.previousElementSibling
      : form.querySelector('p');
    if (note) {
      note.textContent = '';
      note.append(
        'Ce formulaire est préparé pour être imprimé ou envoyé par email. ',
        'Les informations saisies seront reprises dans le message.'
      );
    }

    ['nom', 'prenom'].forEach(function (id) {
      const field = document.getElementById(id);
      if (field) field.required = true;
    });

    const emailLink = form.querySelector('a[href^="mailto:"]');
    if (!emailLink) return;
    emailLink.addEventListener('click', function () {
      const values = [];
      new FormData(form).forEach(function (value, key) {
        if (value) values.push(key + ' : ' + value);
      });
      const body = values.join('\n') || 'Je souhaite adhérer au CBRS.';
      emailLink.href = 'mailto:cbrs@cbrs60.fr?subject='
        + encodeURIComponent('Demande d’adhésion CBRS')
        + '&body=' + encodeURIComponent(body);
    });
  }

  function cleanupEditorialLinks() {
    document.querySelectorAll('footer a').forEach(function (link) {
      const label = link.textContent.trim();
      if (label === 'Vidéos' || label === 'Videos') {
        const item = link.closest('li');
        if (item) item.remove();
        else link.remove();
      }
      if (label === 'Mentions légales') link.href = 'mentions-legales.html';
      if (label === 'Inscriptions') link.textContent = 'Adhérer';
    });

    const infoList = Array.from(document.querySelectorAll('footer ul')).find(function (list) {
      return Array.from(list.querySelectorAll('a')).some(function (link) {
        return link.getAttribute('href') === 'adhesion.html';
      });
    });
    if (infoList && !infoList.querySelector('a[href="conditions-utilisation.html"]')) {
      const item = document.createElement('li');
      item.innerHTML = '<a class="hover:text-cbrs-blue" href="conditions-utilisation.html">Conditions d’utilisation</a>';
      infoList.appendChild(item);
    }

    document.querySelectorAll('#sidebar span, #mobile-menu span').forEach(function (node) {
      if (node.textContent.includes('Sorties - Voyages')) {
        node.textContent = node.textContent.replace('Sorties - Voyages', 'Sorties & Voyages');
      }
    });

    document.querySelectorAll('.year-btn').forEach(function (button) {
      button.textContent = button.textContent.replace('Toutes les annees', 'Toutes les années');
    });
  }

  function init() {
    setupShell();
    setupSidebarToggle();
    setupCookieConsent();
    setupAccessibilityPanel();
    setupMobileMenu();
    setupGallery();
    setupFilters();
    setupMembershipForm();
    cleanupEditorialLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
