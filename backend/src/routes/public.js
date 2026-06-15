const express = require('express');
const db = require('../db');
const router = express.Router();

function parseJson(value, fallback) {
  try { return JSON.parse(value || ''); } catch { return fallback; }
}

function hydrateActivity(row) {
  if (!row) return null;
  return {
    ...row,
    practical_info: parseJson(row.practical_info, []),
    animators: db.prepare('SELECT id, name, phone, email, sort_order FROM activity_animators WHERE activity_id = ? ORDER BY sort_order, id').all(row.id),
    schedule: db.prepare('SELECT id, day, time, location, sort_order FROM activity_schedules WHERE activity_id = ? ORDER BY sort_order, id').all(row.id)
  };
}

router.get('/activities', (req, res) => {
  const rows = db.prepare('SELECT * FROM activities WHERE published = 1 ORDER BY id').all();
  res.json({ activities: rows.map(hydrateActivity) });
});

router.get('/activities/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM activities WHERE id = ? AND published = 1').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Activité introuvable' });
  res.json({ activity: hydrateActivity(row) });
});

router.get('/flash-info', (req, res) => {
  const flash = db.prepare('SELECT * FROM flash_info WHERE id = 1').get();
  res.json({ flash });
});

router.get('/planning-home', (req, res) => {
  const items = db.prepare('SELECT * FROM planning_items WHERE visible_home = 1 ORDER BY sort_order, id').all();
  res.json({ items });
});

router.get('/settings', (req, res) => {
  const settings = {};
  for (const row of db.prepare('SELECT key, value FROM site_settings').all()) settings[row.key] = row.value;
  res.json({ settings });
});

router.get('/gallery', (req, res) => {
  const photos = db.prepare('SELECT * FROM gallery_photos ORDER BY sort_order, created_at DESC').all();
  res.json({ photos });
});

module.exports = router;
module.exports.hydrateActivity = hydrateActivity;
