import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import Header from '../components/Header';
import './ParcoursPage.css';

interface CompletedSkill {
  id: string;
  label: string;
  description?: string;
  xp: number;
}

const EMOJIS = ['🎯', '💡', '⚡', '🧩', '🔧', '📚', '🌐', '🎨', '📊', '🤖', '🔬', '🎮', '🏗️', '🛠️', '📈', '💻'];

function hashEmoji(label: string): string {
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = ((hash << 5) - hash) + label.charCodeAt(i);
    hash |= 0;
  }
  return EMOJIS[Math.abs(hash) % EMOJIS.length];
}

export default function ParcoursPage() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const nodes = useStore((s) => s.nodes);

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const completedSkills: CompletedSkill[] = nodes
    .filter((n) => n.data.status === 'completed')
    .map((n) => ({
      id: n.id,
      label: n.data.label,
      description: n.data.description,
      xp: n.data.xp || 50,
    }));

  return (
    <div className="parcours-page">
      <Header />
      <div className="parcours-content">
        <h1 className="parcours-title">📋 Mes parcours</h1>
        <p className="parcours-subtitle">
          {completedSkills.length === 0
            ? "Tu n'as pas encore terminé de compétence. Continue ton apprentissage !"
            : `Tu as complété ${completedSkills.length} compétence${completedSkills.length > 1 ? 's' : ''} sur ton arbre.`}
        </p>

        {completedSkills.length === 0 ? (
          <div className="parcours-empty">
            <div className="parcours-empty-icon">🌱</div>
            <p>Commence par débloquer et compléter des compétences depuis ton tableau de bord.</p>
            <button className="parcours-btn" onClick={() => navigate('/dashboard')}>
              🌳 Aller au tableau de bord
            </button>
          </div>
        ) : (
          <div className={`parcours-grid ${visible ? 'parcours-grid--visible' : ''}`}>
            {completedSkills.map((skill, index) => (
              <div
                key={skill.id}
                className="parcours-card"
                style={{ animationDelay: `${index * 0.08}s` }}
              >
                <div className="parcours-card-emoji">{hashEmoji(skill.label)}</div>
                <h3 className="parcours-card-title">{skill.label}</h3>
                {skill.description && (
                  <p className="parcours-card-desc">{skill.description}</p>
                )}
                <div className="parcours-card-footer">
                  <span className="parcours-card-xp">+{skill.xp} XP</span>
                  <span className="parcours-card-badge">✅ Complété</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
