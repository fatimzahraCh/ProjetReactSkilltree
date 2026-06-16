import { Routes, Route } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <Routes>
      {/* La page d'accueil par défaut */}
      <Route path="/" element={<Onboarding />} />
      
      {/* La page de l'arbre de compétences */}
      <Route path="/dashboard" element={<Dashboard />} />
    </Routes>
  );
}