const bcrypt = require('bcryptjs');
const db = require('./db');

function publicUser(user) {
  if (!user) return null;
  return { id: user.id, email: user.email, role: user.role, name: user.name };
}

function findUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ? AND active = 1').get(String(email || '').toLowerCase().trim());
}

function findUserById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ? AND active = 1').get(id);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(String(password || ''), hash || '');
}

module.exports = { publicUser, findUserByEmail, findUserById, verifyPassword };
