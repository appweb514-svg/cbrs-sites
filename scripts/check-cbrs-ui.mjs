import assert from 'node:assert/strict';
import fs from 'node:fs';

const dataPath = 'site3/sorties-data.js';
assert(fs.existsSync(dataPath), 'sorties-data.js doit exister');

const data = fs.readFileSync(dataPath, 'utf8');
for (const token of ['CBRS_OUTINGS', 'CBRS_EVENTS', 'fallbackImage', 'coordinates']) {
  assert(data.includes(token), `contrat absent: ${token}`);
}

console.log('PASS — contrat sorties/événements');

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

const expectations = [
  ['site3/galerie.html', 'Revivez les moments qui nous rassemblent'],
  ['site3/liens-utiles.html', 'Les partenaires et ressources qui accompagnent'],
  ['site3/liens-utiles.html', 'Visiter le site'],
  ['site3/contact.html', 'contact-panel-card'],
  ['site3/sorties-voyages.html', 'martinelcbrs60@gmail.com'],
  ['site3/statuts.html', 'data-cbrs-doc'],
  ['site3/adhesion.html', 'Club du Beauvaisis de la Retraite Sportive'],
  ['site3/liens-utiles.html', 'Déclaration d’assurance'],
  ['site3/liens-utiles.html', 'Imprimé fédéral']
];

for (const [file, token] of expectations) {
  assert(fs.readFileSync(file, 'utf8').includes(token), `${file}: ${token} absent`);
}

const removed = [
  ['site3/sorties-voyages.html', 'Randonnées du jeudi'],
  ['site3/sorties-voyages.html', 'Envie de participer'],
  ['site3/index.html', 'Cette semaine au'],
  ['site3/index.html', 'activity-showcase'],
  ['site3/planning.html', 'Légende'],
  ['site3/activites.html', 'cbrs-activity-tag'],
  ['site3/adhesion.html', 'Club Beauvaisien']
];

for (const [file, token] of removed) {
  assert(!fs.readFileSync(file, 'utf8').includes(token), `${file}: ${token} doit être supprimé`);
}

const activityNames = [...fs.readFileSync('site3/activites.html', 'utf8').matchAll(/<h3 class="sr-only">([^<]+)<\/h3>/g)].map(m => m[1]);
const sorted = [...activityNames].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
assert.deepEqual(activityNames, sorted, 'activités non triées alphabétiquement');
for (const name of ['Bridge', 'Relaxation / Méditation', 'Tennis de table']) {
  assert(activityNames.includes(name), `activité absente : ${name}`);
}
assert(!activityNames.some(name => /ping/i.test(name)), 'Ping-pong doit être renommé');

for (const file of fs.readdirSync('site3').filter(f => f.endsWith('.html') && !['admin.html', 'connexion.html'].includes(f))) {
  const html = fs.readFileSync(`site3/${file}`, 'utf8');
  assert(html.includes('cbrs-shared-hero-bg'), `${file}: bandeau commun absent`);
  const nav = html.slice(html.indexOf('<aside id="sidebar"'), html.indexOf('</aside>'));
  assert(nav.indexOf('href="adhesion.html"') > nav.indexOf('href="planning.html"')
    && nav.indexOf('href="adhesion.html"') < nav.indexOf('href="formation.html"'), `${file}: Adhérer doit suivre Planning`);
  assert(nav.includes('href="statuts.html"'), `${file}: lien Statuts absent`);
}

console.log('PASS — contenu UI/UX');

const home = fs.readFileSync('site3/index.html', 'utf8');
assert(home.includes('depuis 1993'), 'accroche 1993 absente');
assert(home.includes('id="vie-du-club"'), 'section Vie du club absente');
assert(home.includes('id="bureau"'), 'présentation du bureau absente');
assert(home.includes('width: clamp(6.8rem, 11vw, 9rem)'), 'logo Flash Info non agrandi');
assert(home.includes('width: 6.2rem'), 'taille mobile Flash Info absente');
console.log('PASS — accueil');

const shell = fs.readFileSync('site3/ui-shell.js', 'utf8');
const pageFileSource = shell.match(/function pageFile\(path\) \{[\s\S]*?\n  \}/);
assert(pageFileSource, 'pageFile() absent de ui-shell.js');
const pageFile = new Function(`${pageFileSource[0]}; return pageFile;`)();
for (const [path, expected] of [
  ['/', 'index.html'],
  ['/site3/', 'index.html'],
  ['/activites', 'activites.html'],
  ['/activites/', 'activites.html'],
  ['/site3/planning.html', 'planning.html'],
  ['/activite?id=05', 'activite.html'],
  ['statuts.html#top', 'statuts.html']
]) {
  assert.equal(pageFile(path), expected, `pageFile(${path})`);
}
console.log('PASS — navigation active (URL propres Vercel)');
