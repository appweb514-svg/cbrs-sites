const express = require('express');
const db = require('../db');
const { requireLogin, canEditActivity } = require('../middleware');
const { hydrateActivity } = require('./public');
const router = express.Router();

router.use(requireLogin);

function allowedActivities(user) {
  if (user.role === 'admin') return db.prepare('SELECT * FROM activities ORDER BY id').all();
  return db.prepare(`SELECT a.* FROM activities a JOIN activity_permissions p ON p.activity_id = a.id WHERE p.user_id = ? ORDER BY a.id`).all(user.id);
}

router.get('/', (req, res) => {
  res.json({ activities: allowedActivities(req.user).map(hydrateActivity) });
});

router.get('/:id', canEditActivity, (req, res) => {
  const row = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Activité introuvable' });
  res.json({ activity: hydrateActivity(row) });
});

router.put('/:id', canEditActivity, (req, res) => {
  const b = req.body || {};
  const info = JSON.stringify(Array.isArray(b.practical_info) ? b.practical_info : []);
  db.prepare(`UPDATE activities SET name=?, category=?, short_description=?, presentation=?, meeting_point=?, level=?, practical_info=?, map_lat=?, map_lon=?, published=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(
    b.name, b.category || '', b.short_description || '', b.presentation || '', b.meeting_point || '', b.level || 'Tous niveaux', info,
    b.map_lat || null, b.map_lon || null, req.user.role === 'admin' ? (b.published ? 1 : 0) : 1, req.params.id
  );
  db.prepare('DELETE FROM activity_animators WHERE activity_id = ?').run(req.params.id);
  (b.animators || []).forEach((a, i) => db.prepare('INSERT INTO activity_animators(activity_id,name,phone,email,sort_order) VALUES(?,?,?,?,?)').run(req.params.id, a.name || '', a.phone || '', a.email || '', i));
  db.prepare('DELETE FROM activity_schedules WHERE activity_id = ?').run(req.params.id);
  (b.schedule || []).forEach((s, i) => db.prepare('INSERT INTO activity_schedules(activity_id,day,time,location,sort_order) VALUES(?,?,?,?,?)').run(req.params.id, s.day || '', s.time || '', s.location || '', i));
  res.json({ activity: hydrateActivity(db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id)) });
});

module.exports = router;
