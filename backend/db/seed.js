const fs = require('fs');
const path = require('path');
const vm = require('vm');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');

const root = path.join(__dirname, '..', '..');
const dbPath = path.join(__dirname, 'cbrs.sqlite');
const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
const db = new Database(dbPath);
db.exec(schema);

function slugify(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function extractActivities() {
  const html = fs.readFileSync(path.join(root, 'site3', 'activite.html'), 'utf8');
  const match = html.match(/const activities = (\{[\s\S]*?\n\});\n\nfunction getParam/);
  if (!match) throw new Error('Impossible d’extraire les activités depuis site3/activite.html');
  const ctx = {};
  vm.runInNewContext('activities = ' + match[1], ctx);
  return ctx.activities;
}

const adminPassword = process.env.CBRS_ADMIN_PASSWORD || 'admin1234';
const adminHash = bcrypt.hashSync(adminPassword, 10);
db.prepare(`INSERT INTO users(email,password_hash,role,name,active) VALUES(?,?,?,?,1)
  ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash, role='admin', active=1`).run('admin@cbrs.local', adminHash, 'admin', 'Administrateur CBRS');

const formateurHash = bcrypt.hashSync(process.env.CBRS_FORMATEUR_PASSWORD || 'formateur1234', 10);
db.prepare(`INSERT INTO users(email,password_hash,role,name,active) VALUES(?,?,?,?,1)
  ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash, role='formateur', active=1`).run('formateur@cbrs.local', formateurHash, 'formateur', 'Formateur Gymnastique');
const formateur = db.prepare('SELECT id FROM users WHERE email = ?').get('formateur@cbrs.local');

const activities = extractActivities();
const upsertActivity = db.prepare(`INSERT INTO activities(id,name,slug,category,logo,short_description,presentation,meeting_point,level,practical_info,map_lat,map_lon,published)
VALUES(@id,@name,@slug,@category,@logo,@short_description,@presentation,@meeting_point,@level,@practical_info,@map_lat,@map_lon,1)
ON CONFLICT(id) DO UPDATE SET name=excluded.name, slug=excluded.slug, category=excluded.category, logo=excluded.logo, short_description=excluded.short_description, presentation=excluded.presentation, meeting_point=excluded.meeting_point, level=excluded.level, practical_info=excluded.practical_info, updated_at=CURRENT_TIMESTAMP`);

const insertAnimator = db.prepare('INSERT INTO activity_animators(activity_id,name,phone,email,sort_order) VALUES(?,?,?,?,?)');
const insertSchedule = db.prepare('INSERT INTO activity_schedules(activity_id,day,time,location,sort_order) VALUES(?,?,?,?,?)');
const insertPlan = db.prepare('INSERT INTO planning_items(activity_id,day,time,title,location,visible_home,sort_order) VALUES(?,?,?,?,?,1,?)');

const tx = db.transaction(() => {
  db.prepare('DELETE FROM activity_animators').run();
  db.prepare('DELETE FROM activity_schedules').run();
  db.prepare('DELETE FROM planning_items').run();
  for (const [id, a] of Object.entries(activities)) {
    upsertActivity.run({
      id,
      name: a.name,
      slug: slugify(a.name),
      category: a.category || 'Activité',
      logo: a.logo || '',
      short_description: a.desc || '',
      presentation: a.presentation || '',
      meeting_point: a.meetingPoint || '',
      level: a.level || 'Tous niveaux',
      practical_info: JSON.stringify(a.info || []),
      map_lat: null,
      map_lon: null
    });
    (a.animators || []).forEach((m, i) => insertAnimator.run(id, m.name || '', m.phone || '', m.email || '', i));
    (a.schedule || []).forEach((s, i) => insertSchedule.run(id, s.day || '', s.time || '', s.location || '', i));
  }
  const home = [
    ['09','Lundi','9h30','Gym douce','Salle Carnot'],
    ['05','Lundi','14h00','Tennis de Table','Salle Carnot'],
    ['12','Lundi','14h00','Échecs','Salle de réunion'],
    ['08','Mardi','8h30','Marche Nordique','Stade Brisson'],
    ['02','Mardi','14h00','Pétanque','Plan d’eau'],
    ['11','Mercredi','9h00','Tai Chi Chuan','Salle Beauvoir'],
    ['03','Jeudi','9h00','Cyclisme','Place Hachette'],
    ['04','Jeudi','13h30','Tir à l’arc','Salle Jean Moulin'],
    ['13','Jeudi','14h00','Jeux de cartes','Salle de réunion'],
    ['07','Vendredi','9h00','Randonnée','Beauvaisis'],
    ['01','Vendredi','Voir planning','Aquagym','Piscine Bellier']
  ];
  home.forEach((x, i) => insertPlan.run(...x, i));
  db.prepare(`INSERT INTO flash_info(id,enabled,title,message,cta_label,cta_url) VALUES(1,1,'Flash info','Inscriptions saison 2025-2026 ouvertes — contactez le club ou consultez la page adhésion.','Adhérer','adhesion.html') ON CONFLICT(id) DO NOTHING`).run();
  const set = db.prepare(`INSERT INTO site_settings(key,value) VALUES(?,?) ON CONFLICT(key) DO NOTHING`);
  set.run('site_name','CBRS'); set.run('primary_color','#0a3273'); set.run('accent_color','#58a01a'); set.run('logo_path','logo-cbrs.png');
  db.prepare('INSERT OR IGNORE INTO activity_permissions(user_id, activity_id) VALUES(?, ?)').run(formateur.id, '09');
  const galleryHtml = fs.readFileSync(path.join(root, 'site3', 'galerie.html'), 'utf8');
  const galleryMatch = galleryHtml.match(/const scrapedPhotos = (\[[\s\S]*?\n\]);/);
  if (galleryMatch) {
    const gctx = {};
    vm.runInNewContext('scrapedPhotos = ' + galleryMatch[1], gctx);
    const insertPhoto = db.prepare('INSERT OR IGNORE INTO gallery_photos(filename,year,category,caption) VALUES(?,?,?,?)');
    for (const p of gctx.scrapedPhotos) {
      insertPhoto.run(p.file, p.year, p.cat, 'CBRS ' + p.year);
    }
  }
});

tx();
console.log('Base initialisée:', dbPath);
console.log('Admin: admin@cbrs.local /', adminPassword);
console.log('Formateur: formateur@cbrs.local /', process.env.CBRS_FORMATEUR_PASSWORD || 'formateur1234');
