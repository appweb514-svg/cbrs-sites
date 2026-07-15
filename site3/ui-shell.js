(function () {
  'use strict';

  const PUBLIC_PAGES = new Set([
    'index.html',
    'activite.html',
    'activites.html',
    'adhesion.html',
    'contact.html',
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

  function setupPlanningImage() {
    const image = document.querySelector('img[onclick*="window.open"]');
    if (!image || image.closest('a')) return;

    const link = document.createElement('a');
    link.href = image.currentSrc || image.src;
    link.target = '_blank';
    link.rel = 'noopener';
    link.className = 'cbrs-planning-zoom';
    link.setAttribute('aria-label', 'Agrandir le planning officiel');
    image.removeAttribute('onclick');
    image.parentNode.insertBefore(link, image);
    link.appendChild(image);
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
      if (label === 'Vidéos' || label === 'Videos' || label === 'Mentions légales') {
        const item = link.closest('li');
        if (item) item.remove();
        else link.remove();
      }
      if (label === 'Inscriptions') link.textContent = 'Adhérer';
    });

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
    setupMobileMenu();
    setupGallery();
    setupFilters();
    setupPlanningImage();
    setupMembershipForm();
    cleanupEditorialLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
