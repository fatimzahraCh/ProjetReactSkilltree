import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SkillTree from '../components/SkillTree';
import { useStore } from '../store/useStore';

export default function Dashboard() {
  const nodes = useStore((state) => state.nodes);
  const navigate = useNavigate();

  // Redirection de sécurité : si aucun arbre n'est en mémoire, on retourne à l'accueil
  useEffect(() => {
    if (nodes.length === 0) {
      navigate('/');
    }
  }, [nodes, navigate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <Header />
      <div style={{ flex: 1, position: 'relative' }}>
        <SkillTree />
      </div>
    </div>
  );
}