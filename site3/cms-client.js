(function () {
  'use strict';

  const meta = document.querySelector('meta[name="cbrs-cms-url"]');
  const base = meta ? (meta.getAttribute('content') || '').trim().replace(/\/+$/, '') : '';

  if (!base) {
    window.CBRSCms = { ready: Promise.resolve(false) };
    return;
  }

  const TIMEOUT = 3000;
  const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  const CATEGORIES = { club: 'Club', sortie: 'Sortie', evenement: 'Événement' };
  const DOC_RUBRIQUES = [
    ['statut', 'statuts'],
    ['reglement', 'reglement'],
    ['adhesion', 'adhesion'],
    ['assurance', 'assurance'],
    ['federal', 'federal']
  ];

  function getJSON(path) {
    return new Promise(function (resolve, reject) {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timer = setTimeout(function () {
        if (controller) controller.abort();
        reject(new Error('timeout'));
      }, TIMEOUT);
      fetch(base + path, controller ? { signal: controller.signal } : {})
        .then(function (response) {
          if (!response.ok) throw new Error('http ' + response.status);
          return response.json();
        })
        .then(function (data) {
          clearTimeout(timer);
          resolve(data);
        })
        .catch(function (error) {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  function resolveUrl(value) {
    if (typeof value !== 'string') return '';
    const url = value.trim();
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    if (/^[/\\]{2}/.test(url)) return '';
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return '';
    if (url.charAt(0) === '/') return base + url;
    return url;
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function docs(data) {
    return data && Array.isArray(data.docs) ? data.docs : [];
  }

  function formatDate(value) {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return '';
    return date.getUTCDate() + ' ' + MONTHS[date.getUTCMonth()] + ' ' + date.getUTCFullYear();
  }

  function imageUrl(image) {
    if (!image) return '';
    if (image.sizes && image.sizes.vignette && image.sizes.vignette.url) return resolveUrl(image.sizes.vignette.url);
    return resolveUrl(image.url);
  }

  function categoryLabel(value) {
    const key = String(value || '').toLowerCase();
    return CATEGORIES[key] || String(value || '');
  }

  function docRubrique(href) {
    const file = (href || '').split('?')[0].split('/').pop().toLowerCase();
    for (let i = 0; i < DOC_RUBRIQUES.length; i++) {
      if (file.indexOf(DOC_RUBRIQUES[i][0]) !== -1) return DOC_RUBRIQUES[i][1];
    }
    return '';
  }

  function buildClubCard(item) {
    const article = el('article', 'relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group');
    const media = el('div', 'relative h-44 overflow-hidden');
    const image = item.image || {};
    const src = imageUrl(image);
    if (src) {
      const img = document.createElement('img');
      img.className = 'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300';
      img.src = src;
      img.alt = image.alt || item.titre || '';
      img.width = 800;
      img.height = 450;
      img.loading = 'lazy';
      media.appendChild(img);
    }
    if (image.credit) media.appendChild(el('span', 'cbrs-card-credit', image.credit));
    media.appendChild(el('span', 'absolute bottom-3 left-3 bg-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider text-gray-800', categoryLabel(item.categorie)));

    const body = el('div', 'p-4');
    const date = formatDate(item.date);
    if (date) body.appendChild(el('p', 'text-sm text-gray-500 mb-1', date));
    const heading = el('h3', 'font-bold text-gray-900 group-hover:text-cbrs-blue transition-colors');
    const link = resolveUrl(item.lien);
    if (link) {
      const anchor = el('a', 'cbrs-card-link', item.titre || '');
      anchor.href = link;
      heading.appendChild(anchor);
    } else {
      heading.textContent = item.titre || '';
    }
    body.appendChild(heading);
    if (item.resume) body.appendChild(el('p', 'text-sm text-gray-600 mt-2 line-clamp-2', item.resume));

    article.appendChild(media);
    article.appendChild(body);
    return article;
  }

  function renderVieDuClub(items) {
    const section = document.getElementById('vie-du-club');
    if (!section) return;
    const first = section.querySelector('article');
    const grid = first ? first.parentNode : section.querySelector('.grid');
    if (!grid) return;
    grid.textContent = '';
    items.slice(0, 3).forEach(function (item) {
      grid.appendChild(buildClubCard(item));
    });
  }

  function buildBoardCard(member) {
    const card = el('li', 'cbrs-board-card');
    const photo = el('div', 'cbrs-board-photo');
    const src = imageUrl(member.photo);
    if (src) {
      const img = document.createElement('img');
      img.src = src;
      img.alt = (member.photo && member.photo.alt) || member.nom || '';
      photo.appendChild(img);
    } else {
      photo.setAttribute('aria-hidden', 'true');
    }
    card.appendChild(photo);
    card.appendChild(el('p', 'cbrs-board-name', member.nom || ''));
    card.appendChild(el('p', 'cbrs-board-role', member.fonction || ''));
    return card;
  }

  function renderBureau(members) {
    const list = document.querySelector('ul.cbrs-board-grid');
    if (!list) return;
    list.textContent = '';
    members.forEach(function (member) {
      list.appendChild(buildBoardCard(member));
    });
  }

  function renderFlash(info) {
    const bar = document.getElementById('flash-bar');
    if (!bar || !info || typeof info !== 'object') return;
    if (info.actif === false) {
      bar.style.display = 'none';
      return;
    }
    const text = document.getElementById('flash-text');
    if (!text) return;
    text.textContent = info.message || '';
    const clone = bar.querySelector('[data-flash-clone]');
    if (clone) clone.textContent = text.textContent;
    if (window.CBRSFlash && typeof window.CBRSFlash.refresh === 'function') window.CBRSFlash.refresh();
  }

  function renderFigures(values) {
    const list = document.querySelector('.cbrs-key-figures');
    if (!list || !values) return;
    const map = {
      'depuis': values.depuis,
      'adhérents': values.adherents,
      'adherents': values.adherents,
      'activités': values.activites,
      'activites': values.activites
    };
    list.querySelectorAll('div').forEach(function (row) {
      const label = row.querySelector('dt');
      const value = row.querySelector('dd');
      if (!label || !value) return;
      const next = map[label.textContent.trim().toLowerCase()];
      if (next !== undefined && next !== null && next !== '') value.textContent = String(next);
    });
  }

  function renderDocuments(items) {
    const byRubrique = {};
    items.forEach(function (item) {
      if (item && item.rubrique && !byRubrique[item.rubrique]) byRubrique[item.rubrique] = item;
    });
    document.querySelectorAll('a[data-cbrs-doc]').forEach(function (link) {
      const doc = byRubrique[docRubrique(link.getAttribute('href'))];
      if (!doc) return;
      const url = resolveUrl(doc.url);
      if (url) link.setAttribute('href', url);
    });
  }

  function renderTarifs(lignes) {
    const grid = document.querySelector('.cbrs-price-grid');
    if (!grid) return;
    grid.textContent = '';
    lignes.forEach(function (ligne) {
      const item = document.createElement('li');
      item.appendChild(el('strong', null, ligne.montant || ''));
      item.appendChild(el('span', null, ligne.libelle || ''));
      grid.appendChild(item);
    });
  }

  function renderVoyages(items) {
    const container = document.getElementById('voyages');
    if (!container) return;
    const heading = container.querySelector('h2');
    Array.prototype.slice.call(container.children).forEach(function (child) {
      if (child !== heading) child.remove();
    });
    const list = el('div', 'grid gap-4');
    items.forEach(function (item) {
      const card = el('div', 'flex items-start gap-4 rounded-xl bg-cbrs-gray-100 p-4');
      const body = el('div', 'min-w-0');
      body.appendChild(el('h3', 'font-semibold text-gray-900', item.titre || ''));
      const meta = [formatDate(item.date), item.lieu].filter(Boolean).join(' — ');
      if (meta) body.appendChild(el('p', 'text-xs text-gray-500', meta));
      if (item.resume) body.appendChild(el('p', 'text-sm text-gray-600 mt-2', item.resume));
      card.appendChild(body);
      list.appendChild(card);
    });
    container.appendChild(list);
  }

  const jobs = [];

  function register(needed, path, apply) {
    if (!needed()) return;
    jobs.push(function () {
      return getJSON(path).then(apply);
    });
  }

  register(function () { return Boolean(document.getElementById('vie-du-club')); },
    '/api/vie-du-club?limit=3&sort=-date&depth=1',
    function (data) {
      const items = docs(data);
      if (items.length) renderVieDuClub(items);
    });

  register(function () { return Boolean(document.querySelector('ul.cbrs-board-grid')); },
    '/api/membres-bureau?sort=ordre&limit=50&depth=1',
    function (data) {
      const items = docs(data);
      if (items.length) renderBureau(items);
    });

  register(function () { return Boolean(document.getElementById('flash-bar')); },
    '/api/globals/flash-info',
    renderFlash);

  register(function () { return Boolean(document.querySelector('.cbrs-key-figures')); },
    '/api/globals/parametres',
    renderFigures);

  register(function () { return Boolean(document.querySelector('a[data-cbrs-doc]')); },
    '/api/documents?limit=100',
    function (data) {
      const items = docs(data);
      if (items.length) renderDocuments(items);
    });

  register(function () { return Boolean(document.querySelector('.cbrs-price-grid')); },
    '/api/globals/tarifs',
    function (data) {
      const lignes = data && Array.isArray(data.lignes) ? data.lignes : [];
      if (lignes.length) renderTarifs(lignes);
    });

  register(function () { return Boolean(document.getElementById('voyages')); },
    '/api/sorties?where[type][equals]=voyage&sort=date&limit=20&depth=1',
    function (data) {
      const items = docs(data);
      if (items.length) renderVoyages(items);
    });

  const pending = jobs.map(function (job) {
    return Promise.resolve().then(job).catch(function () { return null; });
  });

  window.CBRSCms = { ready: Promise.all(pending).then(function () { return true; }) };
})();
