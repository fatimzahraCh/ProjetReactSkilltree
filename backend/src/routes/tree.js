import { Router } from 'express';
import db from '../db.js';

const router = Router();

// GET /api/tree/:email
router.get('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const userRes = await db.query('SELECT email FROM users WHERE email = $1', [email]);
    const user = userRes.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    const treeRes = await db.query('SELECT * FROM trees WHERE email = $1', [email]);
    const tree = treeRes.rows[0];
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
router.put('/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const { xp, nodes, edges } = req.body;

    const userRes = await db.query('SELECT email FROM users WHERE email = $1', [email]);
    const user = userRes.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    await db.query(`
      INSERT INTO trees (email, xp, nodes, edges, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT(email) DO UPDATE SET
        xp = EXCLUDED.xp,
        nodes = EXCLUDED.nodes,
        edges = EXCLUDED.edges,
        updated_at = CURRENT_TIMESTAMP
    `, [email, xp ?? 0, JSON.stringify(nodes ?? []), JSON.stringify(edges ?? [])]);

    res.json({ message: 'Arbre sauvegardé.' });
  } catch (err) {
    console.error('PUT tree error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// POST /api/tree/:email/complete-skill
router.post('/:email/complete-skill', async (req, res) => {
  try {
    const { email } = req.params;
    const { nodeId } = req.body;

    if (!nodeId) {
      return res.status(400).json({ error: 'nodeId requis.' });
    }

    const treeRes = await db.query('SELECT * FROM trees WHERE email = $1', [email]);
    const tree = treeRes.rows[0];
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

    await db.query(`
      UPDATE trees SET xp = $1, nodes = $2, edges = $3, updated_at = CURRENT_TIMESTAMP
      WHERE email = $4
    `, [newXp, JSON.stringify(finalNodes), JSON.stringify(edges), email]);

    res.json({ xp: newXp, nodes: finalNodes, edges });
  } catch (err) {
    console.error('Complete skill error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// DELETE /api/tree/:email
router.delete('/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const userRes = await db.query('SELECT email FROM users WHERE email = $1', [email]);
    const user = userRes.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    await db.query('UPDATE trees SET xp = 0, nodes = $1, edges = $2 WHERE email = $3', ['[]', '[]', email]);

    res.json({ message: 'Arbre réinitialisé.' });
  } catch (err) {
    console.error('DELETE tree error:', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

export default router;
