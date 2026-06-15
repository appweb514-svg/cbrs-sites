const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');
const db = require('../db');
const { requireLogin } = require('../middleware');
const router = express.Router();

const photosDir = path.join(__dirname, '..', '..', '..', 'site3', 'photos');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, photosDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const prefix = 'gallery_';
    const timestamp = Date.now();
    cb(null, prefix + timestamp + ext);
  }
});
const upload = multer({ storage, fileFilter: (req, file, cb) => {
  const ok = ['.jpg','.jpeg','.png','.webp','.gif'].includes(path.extname(file.originalname).toLowerCase());
  cb(ok ? null : new Error('Format non supporté'), ok);
}, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', (req, res) => {
  const photos = db.prepare('SELECT * FROM gallery_photos ORDER BY sort_order, created_at DESC').all();
  res.json({ photos });
});

router.post('/', requireLogin, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier requis' });
  const filename = req.file.filename;
  const year = req.body.year || '2024';
  const category = req.body.category || 'sport';
  const caption = req.body.caption || '';
  db.prepare('INSERT INTO gallery_photos(filename,year,category,caption) VALUES(?,?,?,?)').run(filename, year, category, caption);
  const photo = db.prepare('SELECT * FROM gallery_photos WHERE filename = ?').get(filename);
  res.status(201).json({ photo });
});

router.put('/:id', requireLogin, (req, res) => {
  const b = req.body || {};
  db.prepare('UPDATE gallery_photos SET year=?, category=?, caption=?, sort_order=? WHERE id=?').run(
    b.year || '2024', b.category || 'sport', b.caption || '', b.sort_order ?? 0, req.params.id
  );
  const photo = db.prepare('SELECT * FROM gallery_photos WHERE id = ?').get(req.params.id);
  if (!photo) return res.status(404).json({ error: 'Photo introuvable' });
  res.json({ photo });
});

router.delete('/:id', requireLogin, (req, res) => {
  const photo = db.prepare('SELECT * FROM gallery_photos WHERE id = ?').get(req.params.id);
  if (!photo) return res.status(404).json({ error: 'Photo introuvable' });
  const filePath = path.join(photosDir, photo.filename);
  try { fs.unlinkSync(filePath); } catch (_) {}
  db.prepare('DELETE FROM gallery_photos WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
