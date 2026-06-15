const db = require('./db');
const { findUserById } = require('./auth');

function requireLogin(req, res, next) {
  const user = req.session.userId ? findUserById(req.session.userId) : null;
  if (!user) return res.status(401).json({ error: 'Connexion requise' });
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Administrateur uniquement' });
  next();
}

function canEditActivity(req, res, next) {
  if (req.user?.role === 'admin') return next();
  const activityId = req.params.id || req.params.activityId;
  const allowed = db.prepare('SELECT 1 FROM activity_permissions WHERE user_id = ? AND activity_id = ?').get(req.user.id, activityId);
  if (!allowed) return res.status(403).json({ error: 'Activité non autorisée' });
  next();
}

module.exports = { requireLogin, requireAdmin, canEditActivity };
