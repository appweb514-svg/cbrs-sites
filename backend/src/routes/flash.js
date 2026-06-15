const express = require('express');
const db = require('../db');
const { requireLogin, requireAdmin } = require('../middleware');
const router = express.Router();

router.use(requireLogin, requireAdmin);

router.get('/', (req, res) => {
  res.json({ flash: db.prepare('SELECT * FROM flash_info WHERE id = 1').get() });
});

router.put('/', (req, res) => {
  const b = req.body || {};
  db.prepare(`INSERT INTO flash_info(id, enabled, title, message, cta_label, cta_url, updated_at)
    VALUES(1, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET enabled=excluded.enabled, title=excluded.title, message=excluded.message, cta_label=excluded.cta_label, cta_url=excluded.cta_url, updated_at=CURRENT_TIMESTAMP`).run(
      b.enabled ? 1 : 0, b.title || 'Flash info', b.message || '', b.cta_label || '', b.cta_url || ''
    );
  res.json({ flash: db.prepare('SELECT * FROM flash_info WHERE id = 1').get() });
});

module.exports = router;
