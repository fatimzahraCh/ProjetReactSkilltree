import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';

const router = Router();

const SALT_ROUNDS = 10;

function hashPassword(password) {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

// GET /api/profile/:email
router.get('/:email', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(req.params.email);
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
router.put('/:email', (req, res) => {
  try {
    const { name, darkMode, tutorialDone, currentPassword, newPassword } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(req.params.email);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable.' });

    if (name !== undefined) db.prepare('UPDATE users SET name = ? WHERE email = ?').run(name, req.params.email);
    if (darkMode !== undefined) db.prepare('UPDATE users SET dark_mode = ? WHERE email = ?').run(darkMode ? 1 : 0, req.params.email);

    if (tutorialDone !== undefined) {
      db.prepare('UPDATE users SET tutorial_done = ? WHERE email = ?').run(tutorialDone ? 1 : 0, req.params.email);
    }

    if (currentPassword && newPassword) {
      if (!bcrypt.compareSync(currentPassword, user.password))
        return res.status(400).json({ error: 'Mot de passe actuel incorrect.' });
      if (newPassword.length < 4)
        return res.status(400).json({ error: 'Nouveau mot de passe trop court (min 4).' });
      db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashPassword(newPassword), req.params.email);
    }

    const updated = db.prepare('SELECT * FROM users WHERE email = ?').get(req.params.email);
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
router.get('/:email/stats', (req, res) => {
  try {
    const { email } = req.params;
    const tree = db.prepare('SELECT * FROM trees WHERE email = ?').get(email);
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!tree || !user) return res.status(404).json({ error: 'Données introuvables.' });

    const nodes = JSON.parse(tree.nodes);
    const edges = JSON.parse(tree.edges);
    const total = nodes.length;
    const completed = nodes.filter(n => n.data?.status === 'completed').length;
    const unlocked = nodes.filter(n => n.data?.status === 'unlocked').length;
    const locked = nodes.filter(n => n.data?.status === 'locked').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Activity for last 7 days
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const activity = db.prepare('SELECT date FROM activity_log WHERE email = ? AND date >= ? ORDER BY date').all(email, weekAgo);

    res.json({
      totalSkills: total,
      completedSkills: completed,
      unlockedSkills: unlocked,
      lockedSkills: locked,
      percentage,
      xp: tree.xp,
      streakCount: user.streak_count || 0,
      lastActive: user.last_active,
      activityDays: activity.map(a => a.date),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/profile/:email/export
router.get('/:email/export', (req, res) => {
  try {
    const { email } = req.params;
    const tree = db.prepare('SELECT * FROM trees WHERE email = ?').get(email);
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
    const tree = db.prepare('SELECT * FROM trees WHERE email = ?').get(email);
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!tree || !user) return res.status(404).json({ error: 'Données introuvables.' });

    const nodes = JSON.parse(tree.nodes);
    const completed = nodes.filter(n => n.data?.status === 'completed').length;
    const total = nodes.length;
    if (completed < total)
      return res.status(400).json({ error: `Complétez d'abord toutes les compétences (${completed}/${total}).` });

    const { v4: uuid } = await import('uuid');
    const certId = uuid();
    const now = new Date().toISOString();
    db.prepare('INSERT INTO certificates (id, email, issued_at) VALUES (?, ?, ?)').run(certId, email, now);

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
