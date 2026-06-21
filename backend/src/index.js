import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import treeRoutes from './routes/tree.js';
import profileRoutes from './routes/profile.js';

const app = express();

// 1. Utilisez process.env.PORT fourni par Railway, sinon 5000 par défaut
const PORT = process.env.PORT || 5000;

// 2. Configurez CORS pour autoriser uniquement votre frontend Vercel
// Remplacez l'URL ci-dessous par l'URL réelle de votre projet Vercel
app.use(cors({
  origin: ['https://projet-react-skilltree.vercel.app', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', db: 'supabase' }); // Mise à jour pour refléter la réalité
});

app.use('/api/auth', authRoutes);
app.use('/api/tree', treeRoutes);
app.use('/api/profile', profileRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route non trouvée.' });
});

// 3. Écoutez sur '0.0.0.0' pour que Railway puisse exposer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Synapse backend running on port ${PORT}`);
});