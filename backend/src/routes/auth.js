import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';

const router = Router();

const SALT_ROUNDS = 10;

function hashPassword(password) {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function userResponse(user) {
  return {
    email: user.email,
    name: user.name,
    darkMode: !!user.dark_mode,
    streakCount: user.streak_count || 0,
    tutorialDone: !!user.tutorial_done,
    createdAt: user.created_at,
  };
}

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Tous les champs sont requis.' });
    if (password.length < 4)
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 4 caractères.' });

    const existing = db.prepare('SELECT email FROM users WHERE email = ?').get(email);
    if (existing) return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });

    const hashed = hashPassword(password);
    db.prepare('INSERT INTO users (email, name, password) VALUES (?, ?, ?)').run(email, name, hashed);
    db.prepare('INSERT INTO trees (email, xp, nodes, edges) VALUES (?, 0, ?, ?)').run(email, '[]', '[]');

    res.status(201).json({ user: userResponse({ email, name, dark_mode: 0, streak_count: 0, tutorial_done: 0 }), message: 'Compte créé avec succès.' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis.' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Aucun compte trouvé avec cet email.' });
    if (!comparePassword(password, user.password)) return res.status(401).json({ error: 'Mot de passe incorrect.' });

    const tree = db.prepare('SELECT * FROM trees WHERE email = ?').get(email);
    const treeData = tree ? { xp: tree.xp, nodes: JSON.parse(tree.nodes), edges: JSON.parse(tree.edges) } : { xp: 0, nodes: [], edges: [] };

    // Track activity for streaks
    const today = new Date().toISOString().slice(0, 10);
    const alreadyLogged = db.prepare('SELECT id FROM activity_log WHERE email = ? AND date = ?').get(email, today);
    if (!alreadyLogged) {
      db.prepare('INSERT INTO activity_log (email, date, action) VALUES (?, ?, ?)').run(email, today, 'login');
    }
    updateStreak(email);

    res.json({ user: userResponse(user), tree: treeData });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

function updateStreak(email) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return;

  if (user.last_active === today) return; // already counted today

  let newStreak = 1;
  if (user.last_active === yesterday) {
    newStreak = (user.streak_count || 0) + 1;
  }
  db.prepare('UPDATE users SET streak_count = ?, last_active = ? WHERE email = ?').run(newStreak, today, email);
}

export default router;
