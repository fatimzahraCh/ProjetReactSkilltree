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
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Tous les champs sont requis.' });
    if (password.length < 4)
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 4 caractères.' });

    const existingRes = await db.query('SELECT email FROM users WHERE email = $1', [email]);
    const existing = existingRes.rows[0];
    if (existing) return res.status(409).json({ error: 'Un compte existe déjà avec cet email.' });

    const hashed = hashPassword(password);
    await db.query('INSERT INTO users (email, name, password) VALUES ($1, $2, $3)', [email, name, hashed]);
    await db.query('INSERT INTO trees (email, xp, nodes, edges) VALUES ($1, 0, $2, $3)', [email, '[]', '[]']);

    res.status(201).json({ user: userResponse({ email, name, dark_mode: 0, streak_count: 0, tutorial_done: 0 }), message: 'Compte créé avec succès.' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email et mot de passe requis.' });

    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userRes.rows[0];
    if (!user) return res.status(401).json({ error: 'Aucun compte trouvé avec cet email.' });
    if (!comparePassword(password, user.password)) return res.status(401).json({ error: 'Mot de passe incorrect.' });

    const treeRes = await db.query('SELECT * FROM trees WHERE email = $1', [email]);
    const tree = treeRes.rows[0];
    const treeData = tree ? { xp: tree.xp, nodes: JSON.parse(tree.nodes), edges: JSON.parse(tree.edges) } : { xp: 0, nodes: [], edges: [] };

    // Track activity for streaks
    const today = new Date().toISOString().slice(0, 10);
    const alreadyLoggedRes = await db.query('SELECT id FROM activity_log WHERE email = $1 AND date = $2', [email, today]);
    const alreadyLogged = alreadyLoggedRes.rows[0];
    if (!alreadyLogged) {
      await db.query('INSERT INTO activity_log (email, date, action) VALUES ($1, $2, $3)', [email, today, 'login']);
    }
    await updateStreak(email);

    res.json({ user: userResponse(user), tree: treeData });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

async function updateStreak(email) {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  const user = userRes.rows[0];
  if (!user) return;

  let lastActiveStr = null;
  if (user.last_active) {
    lastActiveStr = user.last_active instanceof Date 
      ? user.last_active.toISOString().slice(0, 10) 
      : String(user.last_active).slice(0, 10);
  }

  if (lastActiveStr === today) return; // already counted today

  let newStreak = 1;
  if (lastActiveStr === yesterday) {
    newStreak = (user.streak_count || 0) + 1;
  }
  await db.query('UPDATE users SET streak_count = $1, last_active = $2 WHERE email = $3', [newStreak, today, email]);
}

export default router;
