import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import treeRoutes from './routes/tree.js';
import profileRoutes from './routes/profile.js';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', db: 'synapse.db' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tree', treeRoutes);
app.use('/api/profile', profileRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route non trouvée.' });
});

app.listen(PORT, () => {
  console.log(`Synapse backend running on http://localhost:${PORT}`);
});
