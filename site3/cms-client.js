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
  // Lien officiel du site (nom du fichier PDF) → valeur « Remplace le lien officiel » du CMS.
  const DOC_RUBRIQUES = [
    ['statut', 'statuts'],
    ['reglement', 'reglement'],
    ['adhesion', 'adhesion'],
    ['assurance', 'assurance'],
    ['federal', 'federal']
  ];
  const DOC_CATEGORIES = [
    ['adhesion', 'Adhésion'],
    ['vie-associative', 'Vie associative'],
    ['formations', 'Formations'],
    ['assurance', 'Assurance'],
    ['autre', 'Autres documents']
  ];
  const THEME_KEY = 'cbrs-theme';
  const THEME_VARS = ['--cbrs-blue', '--cbrs-blue-rgb', '--cbrs-blue-light', '--cbrs-blue-light-rgb', '--cbrs-green',
    '--cbrs-green-rgb', '--cbrs-green-dark', '--cbrs-green-hover-rgb', '--cbrs-teal', '--cbrs-teal-rgb',
    '--cbrs-hero-c1', '--cbrs-hero-c2', '--cbrs-hero-c3', '--cbrs-hero-o',
    '--cbrs-font-h1', '--cbrs-font-h2', '--cbrs-font-body'];
  // Teinte d'en-tête d'origine (bleu du site) : valeurs par défaut de ui-shell.css.
  const TEINTE_EN_TETE_ORIGINE = '#0a3273';

  // Pas d'abandon au bout de TIMEOUT : un CMS lent (démarrage à froid) s'affiche dès qu'il répond,
  // au lieu de laisser le texte de secours d'origine. Seul `ready` est borné par TIMEOUT.
  function getJSON(path) {
    return fetch(base + path).then(function (response) {
      if (!response.ok) throw new Error('http ' + response.status);
      return response.json();
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

  // Lien choisi dans le CMS (page du site, activité, sortie ou adresse externe) → adresse.
  function resolveLien(lien) {
    if (typeof lien === 'string') return resolveUrl(lien);
    if (!lien || typeof lien !== 'object') return '';
    const target = function (value, key) {
      return value && typeof value === 'object' ? value[key] : value;
    };
    switch (lien.type) {
      case 'page':
        return typeof lien.page === 'string' && lien.page.charAt(0) === '/' ? lien.page : '';
      case 'activite': {
        const slug = target(lien.activite, 'slug');
        return slug ? '/activite?id=' + encodeURIComponent(slug) : '';
      }
      case 'sortie': {
        const id = target(lien.sortie, 'id');
        return id ? '/sortie?id=' + encodeURIComponent(id) : '';
      }
      case 'externe':
        return /^https:\/\//i.test(lien.url || '') ? lien.url : '';
      default:
        return '';
    }
  }

  function docRubrique(href) {
    const file = (href || '').split('?')[0].split('/').pop().toLowerCase();
    for (let i = 0; i < DOC_RUBRIQUES.length; i++) {
      if (file.indexOf(DOC_RUBRIQUES[i][0]) !== -1) return DOC_RUBRIQUES[i][1];
    }
    return '';
  }

  // Les documents déposés peuvent être au format PDF, Word, Excel ou OpenDocument :
  // le libellé du lien indique le format réel plutôt qu'un « (PDF) » systématique.
  function libelleTelechargement(item) {
    const source = String(item.filename || item.url || '').split('?')[0];
    const extension = source.indexOf('.') !== -1 ? source.split('.').pop().toLowerCase() : '';
    const noms = {
      pdf: 'PDF',
      doc: 'Word', docx: 'Word',
      xls: 'Excel', xlsx: 'Excel',
      odt: 'OpenDocument', ods: 'OpenDocument'
    };
    return noms[extension] ? 'Télécharger (' + noms[extension] + ')' : 'Télécharger';
  }

  function buildClubCard(item, defaultLink) {
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
    } else {
      const placeholder = el('div', 'cbrs-card-placeholder');
      const logo = document.createElement('img');
      logo.src = 'logo-cbrs.png?v=20261009';
      logo.alt = '';
      logo.loading = 'lazy';
      placeholder.appendChild(logo);
      media.appendChild(placeholder);
    }
    if (image.credit) media.appendChild(el('span', 'cbrs-card-credit', image.credit));
    media.appendChild(el('span', 'absolute bottom-3 left-3 bg-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider text-gray-800', categoryLabel(item.categorie)));

    const body = el('div', 'p-4');
    const date = formatDate(item.date);
    if (date) body.appendChild(el('p', 'text-sm text-gray-500 mb-1', date));
    const heading = el('h3', 'font-bold text-gray-900 group-hover:text-cbrs-blue transition-colors');
    const link = resolveLien(item.lien) || defaultLink || '';
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
    // Sans lien choisi dans le CMS, la carte garde la page de récit de la carte statique de même titre.
    const titleKey = function (text) {
      return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '');
    };
    // Relevé une seule fois : un second rendu (cache puis réseau) ne trouve plus les cartes statiques.
    if (!grid.cbrsStaticLinks) {
      grid.cbrsStaticLinks = {};
      grid.querySelectorAll('a.cbrs-card-link').forEach(function (a) {
        grid.cbrsStaticLinks[titleKey(a.textContent)] = a.getAttribute('href');
      });
    }
    const staticLinks = grid.cbrsStaticLinks;
    grid.textContent = '';
    items.slice(0, 3).forEach(function (item) {
      grid.appendChild(buildClubCard(item, staticLinks[titleKey(item.titre)]));
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
    // Lien officiel : remplacé seulement par un document explicitement choisi pour lui (le plus récent).
    const official = {};
    items.slice().sort(function (x, y) {
      return String(y.updatedAt || '').localeCompare(String(x.updatedAt || ''));
    }).forEach(function (item) {
      const key = item && item.remplaceLienOfficiel;
      if (key && key !== 'aucun' && !official[key]) official[key] = item;
    });
    document.querySelectorAll('a[data-cbrs-doc]').forEach(function (link) {
      const doc = official[docRubrique(link.getAttribute('href'))];
      const url = doc && resolveUrl(doc.url);
      if (url) link.setAttribute('href', url);
    });

    const container = document.getElementById('documents');
    const listed = items.filter(function (item) { return item && item.afficherSurSite !== false && resolveUrl(item.url); });
    if (!container || !listed.length) return;
    let block = document.getElementById('cbrs-cms-documents');
    if (block) block.remove();
    block = el('div', 'mt-6 grid gap-6');
    block.id = 'cbrs-cms-documents';
    DOC_CATEGORIES.forEach(function (category) {
      const group = listed.filter(function (item) { return (item.categorie || 'autre') === category[0]; });
      if (!group.length) return;
      const section = el('section');
      section.appendChild(el('h3', 'text-base font-bold text-cbrs-text mb-3', category[1]));
      const grid = el('div', 'grid grid-cols-1 gap-4 lg:grid-cols-2');
      group.forEach(function (item) {
        const card = el('div', 'cbrs-doc-callout');
        const text = el('div');
        text.appendChild(el('p', 'cbrs-doc-callout-title', item.titre || item.filename || 'Document'));
        if (item.description) text.appendChild(el('p', 'cbrs-doc-callout-text', item.description));
        const link = el('a', 'cbrs-doc-link', libelleTelechargement(item));
        link.href = resolveUrl(item.url);
        link.target = '_blank';
        link.rel = 'noopener';
        card.appendChild(text);
        card.appendChild(link);
        grid.appendChild(card);
      });
      section.appendChild(grid);
      block.appendChild(section);
    });
    container.appendChild(block);
  }

  function renderGallery(items) {
    if (typeof window.cbrsRenderGallery !== 'function') return;
    const photos = items.filter(function (item) {
      return item && item.afficherSurSite !== false;
    }).map(function (item) {
      const photo = item.photo || {};
      const src = resolveUrl((photo.sizes && photo.sizes.large && photo.sizes.large.url) || photo.url);
      if (!src) return null;
      return {
        src: src,
        cat: item.categorie || 'vie',
        year: item.annee,
        caption: item.legende || photo.alt || ('CBRS ' + item.annee),
        activity: item.activite && item.activite !== 'autres' ? item.activite : ''
      };
    }).filter(Boolean);
    if (photos.length) window.cbrsRenderGallery(photos);
  }

  // Activité du CMS → format des données de site3/activite.html.
  function toSiteActivity(item) {
    const lat = item.carte && item.carte.lat;
    const lon = item.carte && item.carte.lon;
    return {
      name: item.nom || '',
      logo: imageUrl(item.icone) || '/logo-cbrs.png',
      desc: item.description || '',
      presentation: item.presentation || '',
      category: item.niveau || '',
      schedule: (item.creneaux || []).map(function (c) { return { day: c.jour, time: c.horaire, location: c.lieu }; }),
      meetingPoint: item.pointRencontre || '',
      map: typeof lat === 'number' && typeof lon === 'number' ? { lat: lat, lon: lon } : null,
      animators: (item.animateurs || []).map(function (a) {
        return { name: a.nom, photo: imageUrl(a.photo) || undefined };
      }),
      info: (item.infos || []).map(function (i) { return i.texte; }).filter(Boolean),
      tips: item.bonASavoir || {},
      photos: [item.photo].concat(item.photos || []).map(function (p) {
        return p && typeof p === 'object' && p.url ? { src: resolveUrl(p.url), alt: p.alt || item.nom || '' } : null;
      }).filter(Boolean)
    };
  }

  // Sans photo saisie sur l'activité : photos de la galerie rattachées à cette activité
  // (valeur « Activité » de la galerie = nom de l'activité sans accents, ex. « Tennis de table » → tennis-de-table).
  function withGalleryPhotos(activity) {
    const key = activity.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    if (activity.photos.length || !key) return Promise.resolve(activity);
    return getJSON('/api/galerie?limit=4&sort=_order&depth=1&where[activite][equals]=' + encodeURIComponent(key) + '&where[afficherSurSite][equals]=true')
      .then(function (data) {
        activity.photos = docs(data).map(function (g) {
          return g.photo && g.photo.url ? { src: resolveUrl(g.photo.url), alt: g.legende || activity.name } : null;
        }).filter(Boolean);
        return activity;
      })
      .catch(function () { return activity; });
  }

  function renderActivityList(items) {
    const grid = document.querySelector('.cbrs-activities-grid');
    if (!grid) return;
    grid.textContent = '';
    items.forEach(function (item) {
      const card = el('a', 'cbrs-activity-card group');
      card.href = '/activite?id=' + encodeURIComponent(item.slug);
      card.setAttribute('aria-label', item.nom || '');
      const icon = el('div', 'cbrs-activity-icon');
      const img = document.createElement('img');
      img.src = imageUrl(item.icone) || '/logo-cbrs.png';
      img.alt = item.nom || '';
      img.className = 'w-full h-full object-contain';
      icon.appendChild(img);
      card.appendChild(icon);
      card.appendChild(el('h3', 'sr-only', item.nom || ''));
      grid.appendChild(card);
    });
  }

  function hexToRgb(hex) {
    return [1, 3, 5].map(function (i) { return parseInt(hex.slice(i, i + 2), 16); });
  }

  // Mélange vers le blanc (amount > 0) ou le noir (amount < 0), au format « r g b ».
  function mix(hex, amount) {
    const target = amount > 0 ? 255 : 0;
    const a = Math.abs(amount);
    return hexToRgb(hex).map(function (c) { return Math.round(c + (target - c) * a); }).join(' ');
  }

  function fontStack(name, fallback) {
    if (!name || name === 'defaut') return '';
    const serif = /Merriweather|Serif/.test(name);
    return '"' + name + '", ' + (serif ? 'Georgia, serif' : fallback);
  }

  function themeFrom(data) {
    const vars = {};
    const color = function (value) { return /^#[0-9a-f]{6}$/i.test(value || '') ? value : ''; };
    const blue = color(data.couleurPrincipale);
    const green = color(data.couleurSecondaire);
    const teal = color(data.couleurAccent);
    if (blue) {
      vars['--cbrs-blue'] = blue;
      vars['--cbrs-blue-rgb'] = mix(blue, 0);
      vars['--cbrs-blue-light-rgb'] = mix(blue, 0.15);
      vars['--cbrs-blue-light'] = 'rgb(' + vars['--cbrs-blue-light-rgb'] + ')';
    }
    if (green) {
      vars['--cbrs-green'] = green;
      vars['--cbrs-green-rgb'] = mix(green, 0);
      vars['--cbrs-green-hover-rgb'] = mix(green, -0.12);
      vars['--cbrs-green-dark'] = 'rgb(' + vars['--cbrs-green-hover-rgb'] + ')';
    }
    if (teal) {
      vars['--cbrs-teal'] = teal;
      vars['--cbrs-teal-rgb'] = mix(teal, 0);
    }
    // Voile du bandeau : teinte choisie (sinon bleu d'origine) et son intensité (0 = image nette).
    const teinte = color(data.teinteEnTete);
    if (teinte && teinte.toLowerCase() !== TEINTE_EN_TETE_ORIGINE) {
      const c1 = mix(teinte, 0).replace(/ /g, ', ');
      vars['--cbrs-hero-c1'] = c1;
      vars['--cbrs-hero-c2'] = mix(teinte, 0.15).replace(/ /g, ', ');
      vars['--cbrs-hero-c3'] = c1;
    }
    const intensite = data.intensiteTeinte;
    if (typeof intensite === 'number' && intensite >= 0 && intensite <= 100) {
      vars['--cbrs-hero-o'] = String(intensite / 100);
    }
    const families = [];
    [['policeTitres', '--cbrs-font-h1'], ['policeSousTitres', '--cbrs-font-h2'], ['policeTexte', '--cbrs-font-body']].forEach(function (pair) {
      const stack = fontStack(data[pair[0]], 'ui-sans-serif, system-ui, sans-serif');
      if (!stack) return;
      vars[pair[1]] = stack;
      if (families.indexOf(data[pair[0]]) === -1) families.push(data[pair[0]]);
    });
    const fonts = families.length
      ? 'https://fonts.googleapis.com/css2?' + families.map(function (f) { return 'family=' + f.replace(/ /g, '+') + ':wght@400;600;700'; }).join('&') + '&display=swap'
      : '';
    return { vars: vars, fonts: fonts };
  }

  function applyTheme(theme) {
    const root = document.documentElement.style;
    THEME_VARS.forEach(function (name) { root.removeProperty(name); });
    Object.keys(theme.vars).forEach(function (name) { root.setProperty(name, theme.vars[name]); });
    const current = document.getElementById('cbrs-theme-fonts');
    if (current && current.getAttribute('href') !== theme.fonts) current.remove();
    if (theme.fonts && !document.getElementById('cbrs-theme-fonts')) {
      const link = document.createElement('link');
      link.id = 'cbrs-theme-fonts';
      link.rel = 'stylesheet';
      link.href = theme.fonts;
      document.head.appendChild(link);
    }
  }

  function currentPage() {
    const path = window.location.pathname.replace(/\.html$/, '').replace(/\/index$/, '/').replace(/\/+$/, '');
    return path || '/';
  }

  function renderHeader(header, imageEnTete) {
    const hero = document.querySelector('.cbrs-hero');
    if (!hero) return;
    if (header) {
      const title = hero.querySelector('h1');
      if (header.titre && title) title.textContent = header.titre;
      const subtitle = title && title.nextElementSibling && title.nextElementSibling.tagName === 'P' ? title.nextElementSibling : null;
      if (header.sousTitre && subtitle) subtitle.textContent = header.sousTitre;
    }
    // Image propre à la page sinon image d'en-tête par défaut du CMS.
    const image = (header && header.image && typeof header.image === 'object' ? header.image : null) ||
      (imageEnTete && typeof imageEnTete === 'object' ? imageEnTete : null);
    const src = image ? resolveUrl(image.url) : '';
    const bg = hero.querySelector('img.cbrs-shared-hero-bg, img.absolute.inset-0') || hero.querySelector('img');
    if (src && bg) bg.src = src;
  }

  function renderApparence(data) {
    if (!data || typeof data !== 'object') return;
    const theme = themeFrom(data);
    applyTheme(theme);
    try {
      if (Object.keys(theme.vars).length) localStorage.setItem(THEME_KEY, JSON.stringify(theme));
      else localStorage.removeItem(THEME_KEY);
    } catch (e) { /* stockage indisponible */ }
    const page = currentPage();
    const header = (data.enTetes || []).filter(function (h) { return h.page === page; })[0];
    renderHeader(header, data.imageEnTete);
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

  function valeur(data, chemin) {
    return chemin.split('.').reduce(function (noeud, cle) {
      return noeud && typeof noeud === 'object' ? noeud[cle] : undefined;
    }, data);
  }

  const ICONE_PDF = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>';
  // Couleurs des étapes, reprises dans l'ordre du gabarit (vert, bleu, sarcelle).
  const TEINTES_ETAPES = [
    { carte: 'border-gray-100 bg-cbrs-gray-100/70', puce: 'bg-cbrs-green', texte: 'text-cbrs-green' },
    { carte: 'border-cbrs-blue/10 bg-blue-50/60', puce: 'bg-cbrs-blue', texte: 'text-cbrs-blue' },
    { carte: 'border-cbrs-teal/10 bg-cbrs-teal/5', puce: 'bg-cbrs-teal', texte: 'text-cbrs-teal' },
  ];

  function texteRempli(valeurTexte) {
    return typeof valeurTexte === 'string' && valeurTexte.trim() !== '';
  }

  // PDF choisi dans le CMS (servi en même origine via /cms-docs), sinon le fichier livré avec le site.
  function lienFiche(ligne) {
    const documentPdf = ligne && ligne.fiche;
    if (documentPdf && typeof documentPdf === 'object' && documentPdf.filename) {
      return '/cms-docs/' + encodeURIComponent(documentPdf.filename);
    }
    return texteRempli(ligne && ligne.ficheSite) ? ligne.ficheSite : '';
  }

  function boutonFiche(lien, titre, className, iconeClass, libelle) {
    const bouton = el('button', className);
    bouton.type = 'button';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', iconeClass);
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = ICONE_PDF;
    bouton.appendChild(svg);
    bouton.appendChild(document.createTextNode(' ' + libelle));
    bouton.onclick = function () { window.openPdf(lien, titre); };
    return bouton;
  }

  function renderEtapes(conteneur, etapes) {
    const ligne = conteneur.querySelector('[aria-hidden="true"]');
    Array.prototype.slice.call(conteneur.children).forEach(function (enfant) {
      if (enfant !== ligne) enfant.remove();
    });
    etapes.forEach(function (etape, index) {
      const teinte = TEINTES_ETAPES[index % TEINTES_ETAPES.length];
      const article = el('article', 'relative flex gap-4 rounded-2xl border p-4 md:gap-5 md:p-5 ' + teinte.carte);
      article.appendChild(el('div', 'z-10 grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl font-bold text-white shadow-sm ring-4 ring-white ' + teinte.puce, String(index + 1)));
      const corps = el('div', 'min-w-0');
      if (texteRempli(etape.surtitre)) corps.appendChild(el('p', 'text-xs font-bold uppercase tracking-[.14em] ' + teinte.texte, etape.surtitre));
      corps.appendChild(el('h3', 'mt-1 text-lg font-bold text-gray-900', etape.titre || ''));
      if (texteRempli(etape.texte)) corps.appendChild(el('p', 'mt-2 text-sm leading-relaxed text-gray-600', etape.texte));
      const lien = lienFiche(etape);
      if (lien) {
        corps.appendChild(boutonFiche(
          lien,
          'Fiche — ' + (etape.titre || ''),
          'mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-cbrs-blue shadow-sm ring-1 ring-cbrs-blue/15 transition hover:-translate-y-0.5 hover:bg-cbrs-blue hover:text-white',
          'h-4 w-4',
          texteRempli(etape.boutonLibelle) ? etape.boutonLibelle : 'Consulter la fiche (PDF)'
        ));
      }
      article.appendChild(corps);
      conteneur.appendChild(article);
    });
    if (ligne) ligne.hidden = etapes.length < 2;
  }

  function renderCartes(conteneur, cartes) {
    conteneur.textContent = '';
    cartes.forEach(function (carte) {
      const bloc = el('div', 'bg-white rounded-xl shadow-card p-5 flex items-center gap-4 hover:shadow-card-hover transition-shadow group');
      const pictogramme = imageUrl(carte.image) || (texteRempli(carte.icone) ? carte.icone + '?v=icons-20261009' : '');
      if (pictogramme) {
        const cadre = el('div', 'w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center p-2 shrink-0');
        const image = el('img', 'w-full h-full object-contain');
        image.src = pictogramme;
        image.alt = carte.titre || '';
        cadre.appendChild(image);
        bloc.appendChild(cadre);
      }
      const corps = el('div', 'flex-1 min-w-0');
      corps.appendChild(el('h3', 'font-bold text-gray-900 text-sm group-hover:text-cbrs-blue transition-colors', carte.titre || ''));
      if (texteRempli(carte.sousTitre)) corps.appendChild(el('p', 'text-xs text-gray-500', carte.sousTitre));
      const lien = lienFiche(carte);
      if (lien) {
        corps.appendChild(boutonFiche(
          lien,
          'Fiche ' + (carte.sousTitre || carte.titre || ''),
          'inline-flex items-center gap-1 text-xs text-cbrs-green font-medium hover:underline mt-1',
          'w-3 h-3',
          'Consulter le PDF'
        ));
      }
      bloc.appendChild(corps);
      conteneur.appendChild(bloc);
    });
  }

  function renderFormation(data) {
    if (!data || typeof data !== 'object') return;
    Array.prototype.slice.call(document.querySelectorAll('[data-cbrs-formation]')).forEach(function (noeud) {
      const texte = valeur(data, noeud.dataset.cbrsFormation);
      if (texteRempli(texte)) noeud.textContent = texte;
    });
    // Une liste vide (ou absente) garde le contenu livré avec le site.
    const etapes = document.querySelector('[data-cbrs-formation-etapes]');
    if (etapes && Array.isArray(data.etapes) && data.etapes.length) renderEtapes(etapes, data.etapes);
    const cartes = document.querySelector('[data-cbrs-formation-cartes]');
    if (cartes && Array.isArray(data.cartes) && data.cartes.length) renderCartes(cartes, data.cartes);
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

  register(function () { return true; },
    '/api/globals/apparence?depth=1',
    renderApparence);

  register(function () { return Boolean(document.querySelector('a[data-cbrs-doc]') || document.getElementById('documents')); },
    '/api/documents?limit=200&sort=ordre',
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

  register(function () { return Boolean(document.querySelector('[data-cbrs-formation]') || document.querySelector('[data-cbrs-formation-etapes]')); },
    '/api/globals/formation?depth=1',
    renderFormation);

  register(function () { return Boolean(document.getElementById('voyages')); },
    '/api/sorties?where[type][equals]=voyage&sort=date&limit=20&depth=1',
    function (data) {
      const items = docs(data);
      if (items.length) renderVoyages(items);
    });

  register(function () { return typeof window.cbrsRenderGallery === 'function'; },
    '/api/galerie?limit=1000&sort=_order&depth=1',
    function (data) { renderGallery(docs(data)); });

  register(function () { return Boolean(document.querySelector('.cbrs-activities-grid')); },
    '/api/activites?limit=100&sort=ordre&depth=1',
    function (data) {
      const items = docs(data).filter(function (item) { return item.slug; });
      if (items.length) renderActivityList(items);
    });

  register(function () { return typeof window.cbrsRenderActivity === 'function' && Boolean(window.cbrsActivityId); },
    '/api/activites?limit=1&depth=1&where[slug][equals]=' + encodeURIComponent(window.cbrsActivityId || ''),
    function (data) {
      const item = docs(data)[0];
      if (item) return withGalleryPhotos(toSiteActivity(item)).then(window.cbrsRenderActivity);
      else window.cbrsActivityMissing(Boolean(window.cbrsActivityKnown));
    });

  const pending = jobs.map(function (job) {
    return Promise.resolve().then(job).catch(function () { return null; });
  });

  const delai = new Promise(function (resolve) { setTimeout(function () { resolve(false); }, TIMEOUT); });
  window.CBRSCms = { ready: Promise.race([Promise.all(pending).then(function () { return true; }), delai]) };
})();
