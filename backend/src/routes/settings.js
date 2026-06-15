const express = require('express');
const db = require('../db');
const { requireLogin, requireAdmin } = require('../middleware');
const router = express.Router();

router.use(requireLogin, requireAdmin);

router.get('/', (req, res) => {
  const settings = {};
  for (const row of db.prepare('SELECT key, value FROM site_settings').all()) settings[row.key] = row.value;
  res.json({ settings });
});

router.put('/', (req, res) => {
  const allowed = ['site_name','primary_color','secondary_color','accent_color','logo_path','hero_title','hero_subtitle','contact_email','contact_phone','contact_address'];
  const upsert = db.prepare(`INSERT INTO site_settings(key,value,updated_at) VALUES(?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP`);
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, key)) upsert.run(key, String(req.body[key] ?? ''));
  }
  res.json({ ok: true });
});

module.exports = router;
