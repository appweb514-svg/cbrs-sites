(function () {
  const isEvent = document.body.dataset.detailType === 'event';
  const records = isEvent ? window.CBRS_EVENTS : window.CBRS_OUTINGS;
  const id = new URLSearchParams(window.location.search).get('id');
  const staticRecord = records.find((item) => item.id === id);
  const fallbackImage = window.CBRS_OUTINGS_FALLBACK || 'assets-premium/header-outings-realistic-v1.png';

  const byId = (value) => document.getElementById(value);
  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const missing = byId('detail-state');
  const layout = byId('detail-layout');

  // Fiche ajoutée dans le CMS (lien « cms-<id> » posé par cms-client.js) : chargée depuis l'API.
  const cmsMatch = !staticRecord && /^cms-(\w+)$/.exec(id || '');
  const meta = document.querySelector('meta[name="cbrs-cms-url"]');
  const base = meta ? (meta.getAttribute('content') || '').trim().replace(/\/+$/, '') : '';
  if (cmsMatch && base) {
    layout.hidden = true;
    fetch(`${base}/api/sorties/${cmsMatch[1]}?depth=1`)
      .then((response) => { if (!response.ok) throw new Error(); return response.json(); })
      .then((doc) => {
        const photo = doc.image || {};
        const src = (photo.sizes && photo.sizes.large && photo.sizes.large.url) || photo.url || '';
        const date = doc.date ? new Date(doc.date) : null;
        layout.hidden = false;
        render({
          title: doc.titre || '',
          category: { sortie: 'Sortie', voyage: 'Voyage', manifestation: 'Manifestation' }[doc.type] || 'Sortie',
          teaser: doc.resume || '',
          description: doc.description || doc.resume || '',
          date: date && !isNaN(date) ? date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }) : '',
          location: doc.lieu || '',
          image: src ? (src.charAt(0) === '/' ? base + src : src) : ''
        });
      })
      .catch(() => render(null));
    return;
  }
  render(staticRecord);

  function render(record) {
  if (!record) {
    document.title = 'Fiche introuvable - CBRS';
    layout.hidden = true;
    missing.hidden = false;
    missing.innerHTML = [
      '<div class="rounded-3xl bg-white p-8 text-center shadow-card">',
      '<p class="text-sm font-bold uppercase tracking-[.16em] text-cbrs-green">CBRS</p>',
      '<h1 class="mt-3 text-3xl font-bold text-cbrs-blue">Fiche introuvable</h1>',
      '<p class="mx-auto mt-3 max-w-xl text-gray-600">Cette fiche n’est pas disponible ou a été déplacée.</p>',
      '<a class="mt-7 inline-flex rounded-full bg-cbrs-green px-5 py-3 font-semibold text-white" href="/sorties-voyages">Retour aux sorties</a>',
      '</div>'
    ].join('');
    return;
  }

  document.title = `${record.title} - CBRS`;
  byId('detail-kicker').textContent = record.category;
  byId('detail-title').textContent = record.title;
  byId('detail-teaser').textContent = record.teaser;
  byId('detail-description').textContent = record.description;
  byId('detail-date').textContent = record.date || 'Informations à venir';
  byId('detail-schedule').textContent = record.schedule || 'Informations à venir';
  byId('detail-location').textContent = record.location || 'Informations à venir';
  byId('detail-status').textContent = record.status || 'Informations à venir';

  const image = byId('detail-main-image');
  image.src = record.image || record.fallbackImage || fallbackImage;
  image.alt = record.title;
  image.addEventListener('error', function () {
    if (image.src.endsWith(fallbackImage)) return;
    image.src = record.fallbackImage || fallbackImage;
  });

  const credit = byId('detail-photo-credit');
  if (record.photoCredit) {
    credit.innerHTML = [
      `Photo&nbsp;: <a class="underline decoration-dotted underline-offset-2 hover:text-gray-500" href="${escapeHtml(record.photoCredit.commons)}" target="_blank" rel="noopener">${escapeHtml(record.photoCredit.artist)}</a>`,
      ` — ${escapeHtml(record.photoCredit.license)} — via Wikimedia Commons`
    ].join('');
  } else {
    credit.textContent = '';
  }

  const itinerary = byId('detail-itinerary-link');
  if (record.coordinates) {
    const mapUrl = `https://www.openstreetmap.org/?mlat=${record.coordinates.lat}&mlon=${record.coordinates.lng}#map=14/${record.coordinates.lat}/${record.coordinates.lng}`;
    // Cadre élargi de 60 % autour du point pour mieux situer le lieu.
    const [w, so, e, n] = decodeURIComponent(record.coordinates.bbox).split(',').map(Number);
    const dx = (e - w) * 0.3, dy = (n - so) * 0.3;
    const bbox = [w - dx, so - dy, e + dx, n + dy].map((v) => v.toFixed(5)).join('%2C');
    const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${record.coordinates.lat}%2C${record.coordinates.lng}`;
    const frame = byId('detail-map-frame');
    frame.dataset.cookieSrc = embedUrl;
    frame.title = `Carte de ${record.mapLabel}`;
    frame.hidden = false;
    // Classes Tailwind « flex » / « hidden » : l'attribut hidden seul ne suffit pas.
    byId('detail-map-empty').classList.replace('flex', 'hidden');
    itinerary.href = mapUrl;
    itinerary.classList.replace('hidden', 'flex');
  }

  const detailTypeLabel = isEvent ? 'événement' : 'sortie';
  byId('detail-breadcrumb').textContent = 'Sorties & Voyages';
  byId('detail-back-link').href = '/sorties-voyages';

  const canonical = byId('detail-canonical-description');
  canonical.innerHTML = [
    `<span class="font-semibold text-cbrs-blue">${escapeHtml(record.mapLabel || record.location || 'CBRS')}</span>`,
    '<span class="text-gray-500"> — une expérience à vivre avec le club.</span>'
  ].join('');
  }
})();
