import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';

const router = Router();

const SALT_ROUNDS = 10;

function hashPassword(password) {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

// GET /api/profile/:email
router.get('/:email', async (req, res) => {
  try {
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [req.params.email]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });
    res.json({
      email: user.email,
      name: user.name,
      darkMode: !!user.dark_mode,
      streakCount: user.streak_count || 0,
      tutorialDone: !!user.tutorial_done,
      createdAt: user.created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/profile/:email — update name, dark_mode, tutorial_done, password
router.put('/:email', async (req, res) => {
  try {
    const { name, darkMode, tutorialDone, currentPassword, newPassword } = req.body;
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [req.params.email]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    if (name !== undefined) await db.query('UPDATE users SET name = $1 WHERE email = $2', [name, req.params.email]);
    if (darkMode !== undefined) await db.query('UPDATE users SET dark_mode = $1 WHERE email = $2', [darkMode ? 1 : 0, req.params.email]);

    if (tutorialDone !== undefined) {
      await db.query('UPDATE users SET tutorial_done = $1 WHERE email = $2', [tutorialDone ? 1 : 0, req.params.email]);
    }

    if (currentPassword && newPassword) {
      if (!bcrypt.compareSync(currentPassword, user.password))
        return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
      if (newPassword.length < 4)
        return res.status(400).json({ error: 'Nouveau mot de passe trop court (min 4).' });
      await db.query('UPDATE users SET password = $1 WHERE email = $2', [hashPassword(newPassword), req.params.email]);
    }

    const updatedRes = await db.query('SELECT * FROM users WHERE email = $1', [req.params.email]);
    const updated = updatedRes.rows[0];
    res.json({
      email: updated.email,
      name: updated.name,
      darkMode: !!updated.dark_mode,
      streakCount: updated.streak_count || 0,
      tutorialDone: !!updated.tutorial_done,
      message: 'Profil mis à jour.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/profile/:email/stats
router.get('/:email/stats', async (req, res) => {
  try {
    const { email } = req.params;
    const treeRes = await db.query('SELECT * FROM trees WHERE email = $1', [email]);
    const tree = treeRes.rows[0];
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userRes.rows[0];
    if (!tree || !user) return res.status(404).json({ error: 'Données introuvables.' });

    const nodes = JSON.parse(tree.nodes);
    const total = nodes.length;
    const completed = nodes.filter(n => n.data?.status === 'completed').length;
    const unlocked = nodes.filter(n => n.data?.status === 'unlocked').length;
    const locked = nodes.filter(n => n.data?.status === 'locked').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Activity for last 7 days
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const activityRes = await db.query('SELECT date FROM activity_log WHERE email = $1 AND date >= $2 ORDER BY date', [email, weekAgo]);
    const activity = activityRes.rows;

    res.json({
      totalSkills: total,
      completedSkills: completed,
      unlockedSkills: unlocked,
      lockedSkills: locked,
      percentage,
      xp: tree.xp,
      streakCount: user.streak_count || 0,
      lastActive: user.last_active,
      activityDays: activity.map(a => {
        if (a.date instanceof Date) {
          return a.date.toISOString().slice(0, 10);
        }
        return String(a.date).slice(0, 10);
      }),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/profile/:email/export
router.get('/:email/export', async (req, res) => {
  try {
    const { email } = req.params;
    const treeRes = await db.query('SELECT * FROM trees WHERE email = $1', [email]);
    const tree = treeRes.rows[0];
    if (!tree) return res.status(404).json({ error: 'Données introuvables.' });

    const nodes = JSON.parse(tree.nodes);
    let csv = 'Compétence,Statut,XP Gagné\n';
    nodes.forEach(n => {
      csv += `"${n.data?.label}",${n.data?.status},${n.data?.status === 'completed' ? 50 : 0}\n`;
    });
    csv += `\nTotal XP,${tree.xp}\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="synapse-${email}-progress.csv"`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/profile/:email/certificate
router.post('/:email/certificate', async (req, res) => {
  try {
    const { email } = req.params;
    const treeRes = await db.query('SELECT * FROM trees WHERE email = $1', [email]);
    const tree = treeRes.rows[0];
    const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userRes.rows[0];
    if (!tree || !user) return res.status(404).json({ error: 'Données introuvables.' });

    const nodes = JSON.parse(tree.nodes);
    const completed = nodes.filter(n => n.data?.status === 'completed').length;
    const total = nodes.length;
    if (completed < total)
      return res.status(400).json({ error: `Complétez d'abord toutes les compétences (${completed}/${total}).` });

    const { v4: uuid } = await import('uuid');
    const certId = uuid();
    const now = new Date().toISOString();
    await db.query('INSERT INTO certificates (id, email, issued_at) VALUES ($1, $2, $3)', [certId, email, now]);

    res.json({
      certificateId: certId,
      userName: user.name,
      email,
      totalXp: tree.xp,
      completedSkills: completed,
      issuedAt: now,
      message: 'Félicitations ! Certificat généré.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
