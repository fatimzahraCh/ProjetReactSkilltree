import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import treeRoutes from './routes/tree.js';
import profileRoutes from './routes/profile.js';

const app = express();

const PORT = process.env.PORT || 5000;

// Configuration CORS renforcée
const allowedOrigins = [
  'https://projet-react-skilltree.vercel.app',
  'https://projet-react-skilltree-git-master-fatimzahrachs-projects.vercel.app',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // Permet les requêtes sans origine (ex: Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('CORS non autorisé'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Route de santé pour vérifier que le backend répond
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', db: 'supabase' });
});

// Vos routes API
app.use('/api/auth', authRoutes);
app.use('/api/tree', treeRoutes);
app.use('/api/profile', profileRoutes);

// Gestion des routes 404 (doit être après toutes les autres routes)
app.use((_req, res) => {
  res.status(404).json({ error: 'Route non trouvée.' });
});

// Écoute sur 0.0.0.0 pour Railway
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Synapse backend running on port ${PORT}`);
});