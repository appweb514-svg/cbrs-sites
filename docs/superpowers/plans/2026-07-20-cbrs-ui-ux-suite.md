# CBRS UI/UX Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved CBRS UI/UX recommendations across outings, events, gallery, useful links, contact, activity cards and Flash Info.

**Architecture:** Keep the current static HTML/Tailwind site. Add one local data module for outings/events and two reusable static detail shells driven by URL query parameters. Keep page-specific visual adjustments local to the existing pages, with no new runtime dependency.

**Tech Stack:** Static HTML, Tailwind CDN utilities, vanilla JavaScript, existing `ui-shell.css`/`ui-shell.js`, Node.js built-in assertions, local `python3 -m http.server`.

## Global Constraints

- Preserve CBRS colors, rounded cards, Manrope/Playfair typography and existing sidebar/header.
- Show “Informations à venir” when a date, time or place is not confirmed.
- Use local assets with a documented fallback image.
- Keep external links `target="_blank"` with `rel="noopener"`.
- Keep OSM embeds behind the existing cookie-consent mechanism.
- Verify desktop, mobile, keyboard focus and console errors before completion.

---

### Task 1: Add the shared outings/events data contract

**Files:**
- Create: `site3/sorties-data.js`
- Create: `scripts/check-cbrs-ui.mjs`
- Test: `scripts/check-cbrs-ui.mjs`

**Interfaces:**
- Produces `window.CBRS_OUTINGS` and `window.CBRS_EVENTS`.
- Each record exposes `id`, `title`, `category`, `teaser`, `description`,
  `image`, `fallbackImage`, `location`, `coordinates`, `date`, `schedule`,
  `status`, and `mapLabel`.

- [ ] **Step 1: Write the failing structural test**

Create `scripts/check-cbrs-ui.mjs` with Node’s built-in `assert` module. Before
the data module exists, the test must fail because the required file and
contracts are missing:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';

const dataPath = 'site3/sorties-data.js';
assert(fs.existsSync(dataPath), 'sorties-data.js doit exister');
const data = fs.readFileSync(dataPath, 'utf8');
for (const token of ['CBRS_OUTINGS', 'CBRS_EVENTS', 'fallbackImage', 'coordinates']) {
  assert(data.includes(token), `contrat absent: ${token}`);
}
console.log('PASS — contrat sorties/événements');
```

- [ ] **Step 2: Run the test and confirm RED**

Run:

```bash
rtk node scripts/check-cbrs-ui.mjs
```

Expected: failure stating that `site3/sorties-data.js` does not exist.

- [ ] **Step 3: Add the data module**

Create `site3/sorties-data.js` with the eight current outing records and five
current event records. Use existing local photos where available and
`assets-premium/header-outings.jpg` as the fallback. Unknown practical fields
must contain `null`, not invented values.

The module must expose this shape:

```js
window.CBRS_OUTINGS = [
  {
    id: 'deux-caps',
    title: 'Site des Deux Caps',
    category: 'Sortie à la journée',
    teaser: 'Gris Nez & Blanc Nez — randonnée littorale.',
    description: 'Une journée entre falaises, mer et chemins du littoral.',
    image: 'assets/gallery-marche.jpg',
    fallbackImage: 'assets-premium/header-outings.jpg',
    location: 'Gris-Nez & Blanc-Nez',
    coordinates: null,
    date: null,
    schedule: null,
    status: 'Informations pratiques à venir',
    mapLabel: 'Site des Deux Caps'
  }
];
window.CBRS_EVENTS = [];
```

- [ ] **Step 4: Run the test and confirm GREEN**

Run:

```bash
rtk node scripts/check-cbrs-ui.mjs
```

Expected: `PASS — contrat sorties/événements`.

- [ ] **Step 5: Commit**

```bash
rtk git add site3/sorties-data.js scripts/check-cbrs-ui.mjs
rtk git commit -m "feat: ajouter les donnees des sorties et evenements"
```

### Task 2: Add reusable outing and event detail pages

**Files:**
- Create: `site3/sortie.html`
- Create: `site3/evenement.html`
- Modify: `site3/sorties-voyages.html`
- Test: `scripts/check-cbrs-ui.mjs`

**Interfaces:**
- `sortie.html?id=<id>` resolves against `window.CBRS_OUTINGS`.
- `evenement.html?id=<id>` resolves against `window.CBRS_EVENTS`.
- Unknown ids render a visible not-found panel with a link to
  `sorties-voyages.html`.

- [ ] **Step 1: Extend the failing test with route and fallback assertions**

Append to `scripts/check-cbrs-ui.mjs`:

```js
for (const file of ['site3/sortie.html', 'site3/evenement.html']) {
  assert(fs.existsSync(file), `${file} doit exister`);
  const html = fs.readFileSync(file, 'utf8');
  for (const token of [
    'sorties-data.js',
    'Informations à venir',
    'sorties-voyages.html',
    'data-cookie-src',
    'mapLabel'
  ]) {
    assert(html.includes(token), `${file}: ${token} absent`);
  }
}
console.log('PASS — gabarits sorties/événements');
```

- [ ] **Step 2: Run the test and confirm RED**

Run:

```bash
rtk node scripts/check-cbrs-ui.mjs
```

Expected: failure because the detail shells do not exist.

- [ ] **Step 3: Create both detail shells**

Copy the established shell from `site3/activite.html` and replace the dynamic
content with:

```html
<script src="sorties-data.js"></script>
<main id="contenu">
  <section class="max-w-7xl mx-auto px-6 py-12">
    <div id="detail-state" class="hidden"></div>
    <div id="detail-layout" class="grid grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(19rem,.85fr)] gap-8">
      <article id="detail-main"></article>
      <aside id="detail-aside"></aside>
    </div>
  </section>
</main>
<script>
  const source = location.pathname.endsWith('evenement.html')
    ? window.CBRS_EVENTS
    : window.CBRS_OUTINGS;
  const record = source.find((item) => item.id === new URLSearchParams(location.search).get('id'));
  const fallback = 'sorties-voyages.html';
  const main = document.getElementById('detail-main');
  const aside = document.getElementById('detail-aside');
  const state = document.getElementById('detail-state');
  if (!record) {
    state.className = 'bg-white rounded-3xl shadow-card p-8 text-center';
    state.innerHTML = '<h1 class="text-2xl font-bold text-cbrs-blue">Fiche introuvable</h1><p class="mt-3 text-gray-600">Cette sortie n’est pas disponible.</p><a class="inline-flex mt-6 rounded-full bg-cbrs-green px-5 py-3 font-semibold text-white" href="' + fallback + '">Retour aux sorties</a>';
    document.getElementById('detail-layout').classList.add('hidden');
  } else {
    const image = record.image || record.fallbackImage;
    main.innerHTML = `
      <article class="overflow-hidden rounded-3xl bg-white shadow-card">
        <img class="h-64 w-full object-cover md:h-80" src="${image}" alt="${record.title}">
        <div class="p-6 md:p-8">
          <p class="text-sm font-bold uppercase tracking-[.16em] text-cbrs-green">${record.category}</p>
          <h1 class="mt-2 text-3xl font-bold text-cbrs-blue">${record.title}</h1>
          <p class="mt-4 text-lg leading-relaxed text-gray-600">${record.teaser}</p>
          <div class="mt-8 rounded-2xl bg-cbrs-gray-100 p-5">
            <h2 class="text-xl font-bold text-cbrs-blue">Présentation</h2>
            <p class="mt-3 leading-relaxed text-gray-700">${record.description}</p>
          </div>
          <a class="mt-8 inline-flex rounded-full border border-cbrs-blue px-5 py-3 font-semibold text-cbrs-blue" href="${fallback}">← Retour aux sorties</a>
        </div>
      </article>`;
    const map = record.coordinates
      ? `<iframe title="${record.mapLabel}" class="h-64 w-full rounded-2xl" loading="lazy" data-cookie-src="${record.coordinates}" style="border:0"></iframe>`
      : '<div class="flex h-64 items-center justify-center rounded-2xl bg-cbrs-gray-100 p-6 text-center text-sm text-gray-500">Carte disponible dès que le lieu est confirmé.</div>';
    aside.innerHTML = `
      <aside class="space-y-5">
        <div class="rounded-3xl bg-white p-6 shadow-card">
          <p class="text-xs font-bold uppercase tracking-[.14em] text-cbrs-green">Informations pratiques</p>
          <dl class="mt-5 space-y-4 text-sm">
            <div><dt class="font-semibold text-cbrs-blue">Lieu</dt><dd class="mt-1 text-gray-600">${record.location || 'Informations à venir'}</dd></div>
            <div><dt class="font-semibold text-cbrs-blue">Date</dt><dd class="mt-1 text-gray-600">${record.date || 'Informations à venir'}</dd></div>
            <div><dt class="font-semibold text-cbrs-blue">Horaires</dt><dd class="mt-1 text-gray-600">${record.schedule || 'Informations à venir'}</dd></div>
          </dl>
        </div>
        <div class="rounded-3xl bg-white p-4 shadow-card">${map}</div>
      </aside>`;
  }
</script>
```

The implementation must keep the complete DOM markup shown above. Images must include meaningful `alt` text and
the OSM iframe must use `data-cookie-src`.

- [ ] **Step 4: Turn list entries into links**

Update the outing cards and event cards in `site3/sorties-voyages.html` to use:

```html
<a href="sortie.html?id=deux-caps" class="...">
  ...
  <span class="inline-flex items-center gap-1 text-cbrs-blue">Voir la fiche ↗</span>
</a>
```

Use `evenement.html?id=<event-id>` for event records and retain the existing
titles/dates.

- [ ] **Step 5: Run the test and confirm GREEN**

Run:

```bash
rtk node scripts/check-cbrs-ui.mjs
```

Expected: both contract and detail-template checks pass.

- [ ] **Step 6: Commit**

```bash
rtk git add site3/sorties-data.js site3/sortie.html site3/evenement.html site3/sorties-voyages.html scripts/check-cbrs-ui.mjs
rtk git commit -m "feat: ajouter les fiches detaillees sorties et evenements"
```

### Task 3: Polish outings, gallery, useful links and contact

**Files:**
- Modify: `site3/sorties-voyages.html`
- Modify: `site3/galerie.html`
- Modify: `site3/liens-utiles.html`
- Modify: `site3/contact.html`
- Test: `scripts/check-cbrs-ui.mjs`

**Interfaces:**
- Existing routes remain unchanged.
- Existing external URLs remain unchanged.
- Existing cookie/map behavior remains unchanged.

- [ ] **Step 1: Add failing content and style assertions**

Append to `scripts/check-cbrs-ui.mjs`:

```js
const expectations = [
  ['site3/galerie.html', 'Revivez les moments qui nous rassemblent'],
  ['site3/liens-utiles.html', 'Les partenaires et ressources qui accompagnent'],
  ['site3/liens-utiles.html', 'Visiter le site'],
  ['site3/contact.html', 'contact-panel-card'],
  ['site3/sorties-voyages.html', 'Randonnées du jeudi']
];
for (const [file, token] of expectations) {
  assert(fs.readFileSync(file, 'utf8').includes(token), `${file}: ${token} absent`);
}
console.log('PASS — contenu UI/UX');
```

- [ ] **Step 2: Run the test and confirm RED**

Run:

```bash
rtk node scripts/check-cbrs-ui.mjs
```

Expected: at least one missing-copy/style assertion.

- [ ] **Step 3: Apply the gallery and Thursday-hike copy/layout**

Replace the technical gallery subtitle with:

```html
<p class="gallery-filter-description">Revivez les moments qui nous rassemblent : sorties, activités, sourires et souvenirs partagés.</p>
```

Give the Thursday section a semantic icon, a subtle green surface and stronger
heading hierarchy while keeping the existing text.

- [ ] **Step 4: Rebuild the useful-links content hierarchy**

Keep the existing URLs and descriptions, but add category headings, larger
logo containers and an explicit CTA on every card:

```html
<span class="inline-flex items-center gap-1 text-xs font-bold text-cbrs-blue">
  Visiter le site ↗
</span>
```

Use white cards, `focus-visible` outlines, three columns from `lg` upward and
one column below `md`.

- [ ] **Step 5: Separate the contact heading from its white card**

Add `contact-panel-card` to the white wrapper containing e-mail, Sorties &
Voyages and permanence. Move the `Nous contacter` heading immediately before
the wrapper, leaving it on the page background:

```html
<h2 class="text-2xl font-bold text-cbrs-text mb-4">Nous <span class="text-cbrs-blue font-serif-italic">contacter</span></h2>
<div class="contact-panel-card bg-white rounded-2xl shadow-card p-6 md:p-8">
  ...
</div>
```

- [ ] **Step 6: Run the test and confirm GREEN**

Run:

```bash
rtk node scripts/check-cbrs-ui.mjs
```

Expected: all content and layout checks pass.

- [ ] **Step 7: Commit**

```bash
rtk git add site3/sorties-voyages.html site3/galerie.html site3/liens-utiles.html site3/contact.html scripts/check-cbrs-ui.mjs
rtk git commit -m "uiux: harmoniser les pages editoriales"
```

### Task 4: Polish the home activity cards and Flash Info

**Files:**
- Modify: `site3/index.html`
- Test: `scripts/check-cbrs-ui.mjs`

**Interfaces:**
- Preserve the existing activity drag behavior and reduced-motion behavior.
- Preserve the scrolling Flash Info text.

- [ ] **Step 1: Add failing assertions**

Append to `scripts/check-cbrs-ui.mjs`:

```js
const home = fs.readFileSync('site3/index.html', 'utf8');
assert(home.includes('.cbrs-activity-art {'), 'cadre activité absent');
assert(home.includes('background: #fff'), 'cadre blanc absent');
assert(home.includes('width: clamp(6.8rem, 11vw, 9rem)'), 'logo Flash Info non agrandi');
assert(home.includes('width: 6.2rem'), 'taille mobile Flash Info absente');
console.log('PASS — accueil');
```

- [ ] **Step 2: Run the test and confirm RED**

Run:

```bash
rtk node scripts/check-cbrs-ui.mjs
```

Expected: failure on the current activity-frame or Flash Info size.

- [ ] **Step 3: Apply the home visual changes**

Use a white image frame and retain the image zoom:

```css
.cbrs-activity-art {
  display: grid;
  min-height: 10rem;
  place-items: center;
  overflow: hidden;
  border: 1px solid rgba(10, 50, 115, .08);
  border-radius: 17px;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.8);
}
```

Increase the Flash Info logo rules to:

```css
.flash-news-logo { width: clamp(6.8rem, 11vw, 9rem); height: clamp(6.8rem, 11vw, 9rem); }
@media (max-width: 767px) {
  .flash-news-logo { width: 6.2rem; height: 6.2rem; }
}
```

- [ ] **Step 4: Run the test and confirm GREEN**

Run:

```bash
rtk node scripts/check-cbrs-ui.mjs
```

Expected: all assertions pass.

- [ ] **Step 5: Commit**

```bash
rtk git add site3/index.html scripts/check-cbrs-ui.mjs
rtk git commit -m "uiux: affiner les cartes activites et flash info"
```

### Task 5: Browser verification and final review

**Files:**
- Modify: none
- Test: `scripts/check-cbrs-ui.mjs`

- [ ] **Step 1: Run the complete static checks**

Run:

```bash
rtk node scripts/check-cbrs-ui.mjs
rtk git diff --check
```

Expected: all checks pass and `git diff --check` is silent.

- [ ] **Step 2: Serve the site locally**

Run:

```bash
rtk python3 -m http.server 4180
```

Open `/site3/index.html`, `/site3/sorties-voyages.html`,
`/site3/sortie.html?id=deux-caps`, `/site3/evenement.html?id=repas-touquet`,
`/site3/galerie.html`, `/site3/liens-utiles.html` and `/site3/contact.html`.

- [ ] **Step 3: Verify required UI states**

Check:

- the outing card opens its matching detail page;
- a missing detail id shows the not-found state;
- the map remains blocked before cookie consent;
- gallery copy is visible;
- useful-link cards expose their external CTA;
- contact heading is outside the white contact card;
- activity image frames are white;
- Flash Info logo is larger without overlapping the ticker;
- mobile pages do not introduce horizontal overflow;
- console error list is empty.

- [ ] **Step 4: Stop the server and record final status**

Run:

```bash
rtk git status --short
```

Expected: no uncommitted files and all implementation commits visible in
`rtk git log --oneline -8`.
