import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import SkillTree from '../components/SkillTree';
import TutorialOverlay from '../components/TutorialOverlay';
import { useStore } from '../store/useStore';
import './Dashboard.css';

export default function Dashboard() {
  const nodes = useStore((s) => s.nodes);
  const navigate = useNavigate();
  const tutorialDone = useStore((s) => s.tutorialDone);
  const restoreTree = useStore((s) => s.restoreTree);

  useEffect(() => { restoreTree(); }, [restoreTree]);

  if (nodes.length === 0) {
    return (
      <div className="dashboard">
        <Header />
        <div className="dashboard-empty">
          <div className="dashboard-empty-icon">🌱</div>
          <h2 className="dashboard-empty-title">Aucun parcours pour l'instant</h2>
          <p className="dashboard-empty-text">Génère ton premier arbre de compétences pour voir ton tableau de bord.</p>
          <button className="dashboard-empty-btn" onClick={() => navigate('/onboarding')}>
            Créer mon parcours
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Header />
      <div className="dashboard-content">
        <SkillTree />
      </div>
      {!tutorialDone && <TutorialOverlay />}
    </div>
  );
}
