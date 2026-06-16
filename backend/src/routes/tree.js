import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/tree/:email
router.get('/:email', (req, res) => {
  try {
    const { email } = req.params;
    const user = db.prepare('SELECT email FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    const tree = db.prepare('SELECT * FROM trees WHERE email = ?').get(email);
    if (!tree) {
      return res.json({ xp: 0, nodes: [], edges: [] });
    }

    res.json({
      xp: tree.xp,
      nodes: JSON.parse(tree.nodes),
      edges: JSON.parse(tree.edges),
    });
  } catch (err) {
    console.error('GET tree error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// PUT /api/tree/:email
router.put('/:email', (req, res) => {
  try {
    const { email } = req.params;
    const { xp, nodes, edges } = req.body;

    const user = db.prepare('SELECT email FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    db.prepare(`
      INSERT INTO trees (email, xp, nodes, edges, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(email) DO UPDATE SET
        xp = excluded.xp,
        nodes = excluded.nodes,
        edges = excluded.edges,
        updated_at = CURRENT_TIMESTAMP
    `).run(email, xp ?? 0, JSON.stringify(nodes ?? []), JSON.stringify(edges ?? []));

    res.json({ message: 'Arbre sauvegardé.' });
  } catch (err) {
    console.error('PUT tree error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/tree/:email/complete-skill
router.post('/:email/complete-skill', (req, res) => {
  try {
    const { email } = req.params;
    const { nodeId } = req.body;

    if (!nodeId) {
      return res.status(400).json({ error: 'nodeId requis.' });
    }

    const tree = db.prepare('SELECT * FROM trees WHERE email = ?').get(email);
    if (!tree) {
      return res.status(404).json({ error: 'Arbre introuvable.' });
    }

    let nodes = JSON.parse(tree.nodes);
    const edges = JSON.parse(tree.edges);

    // Mark node as completed
    nodes = nodes.map(n => {
      if (n.id === nodeId) return { ...n, data: { ...n.data, status: 'completed' } };
      return n;
    });

    // Find first eligible locked node (all parents completed)
    const completedIds = new Set(
      nodes.filter(n => n.data.status === 'completed').map(n => n.id)
    );

    const eligible = nodes
      .filter(n => n.data.status === 'locked')
      .filter(n => {
        const parentEdges = edges.filter(e => e.target === n.id);
        return parentEdges.length > 0 && parentEdges.every(e => completedIds.has(e.source));
      })
      .sort((a, b) => String(a.id).localeCompare(String(b.id)));

    const finalNodes = eligible.length > 0
      ? nodes.map(n => n.id === eligible[0].id ? { ...n, data: { ...n.data, status: 'unlocked' } } : n)
      : nodes;

    const newXp = (tree.xp || 0) + 50;

    db.prepare(`
      UPDATE trees SET xp = ?, nodes = ?, edges = ?, updated_at = CURRENT_TIMESTAMP
      WHERE email = ?
    `).run(newXp, JSON.stringify(finalNodes), JSON.stringify(edges), email);

    res.json({ xp: newXp, nodes: finalNodes, edges });
  } catch (err) {
    console.error('Complete skill error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/tree/:email
router.delete('/:email', (req, res) => {
  try {
    const { email } = req.params;

    const user = db.prepare('SELECT email FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    db.prepare('UPDATE trees SET xp = 0, nodes = ?, edges = ? WHERE email = ?')
      .run('[]', '[]', email);

    res.json({ message: 'Arbre réinitialisé.' });
  } catch (err) {
    console.error('DELETE tree error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
