const express = require('express');
const { findUserByEmail, verifyPassword, publicUser, findUserById } = require('../auth');
const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = findUserByEmail(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }
  req.session.userId = user.id;
  res.json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', (req, res) => {
  const user = req.session.userId ? findUserById(req.session.userId) : null;
  res.json({ user: publicUser(user) });
});

module.exports = router;
