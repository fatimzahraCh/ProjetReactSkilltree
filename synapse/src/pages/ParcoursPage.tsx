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

interface Certificate {
  certificateId: string;
  userName: string;
  email: string;
  totalXp: number;
  completedSkills: number;
  issuedAt: string;
  message: string;
}

const EMOJIS = ['🚀', '🧠', '🌿', '⚡', '🔧', '💡', '🎯', '📚', '🧩', '🎓', '✨', '🔁', '📈', '📝', '✔️', '🌟'];

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
  const generateCertificate = useStore((s) => s.generateCertificate);

  const [visible, setVisible] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateCertificate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const cert = await generateCertificate();
      setCertificate(cert);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la génération du certificat');
    } finally {
      setIsGenerating(false);
    }
  };

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
        {certificate && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }} onClick={() => setCertificate(null)}>
            <div style={{
              background: 'var(--bg-card)',
              padding: '48px 40px',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '600px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 20px 25px rgba(0,0,0,0.15)',
            }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎓</div>
              <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--text-primary)' }}>Certificat de réussite !</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Félicitations pour ton accomplissement</p>
              
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '24px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px',
                textAlign: 'left',
              }}>
                <p style={{ marginBottom: '12px' }}><strong>Nom :</strong> {certificate.userName}</p>
                <p style={{ marginBottom: '12px' }}><strong>Email :</strong> {certificate.email}</p>
                <p style={{ marginBottom: '12px' }}><strong>Compétences complétées :</strong> {certificate.completedSkills}</p>
                <p style={{ marginBottom: '0' }}><strong>XP Total :</strong> {certificate.totalXp}</p>
              </div>
              
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '24px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}>
                <p style={{ marginBottom: '4px' }}>ID Certificat: {certificate.certificateId}</p>
                <p style={{ marginBottom: '0' }}>Délivré le: {new Date(certificate.issuedAt).toLocaleDateString('fr-FR')}</p>
              </div>
              
              <button
                onClick={() => setCertificate(null)}
                style={{
                  padding: '12px 24px',
                  background: 'var(--bg-button)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#991b1b',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '16px',
            border: '1px solid #fecaca',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h1 className="parcours-title">📏 Mes parcours</h1>
            <p className="parcours-subtitle">
              {completedSkills.length === 0
                ? "Tu n'as pas encore terminé de compétence. Continue ton apprentissage !"
                : `Tu as complété ${completedSkills.length} compétence${completedSkills.length > 1 ? 's' : ''} sur ton arbre.`}
            </p>
          </div>
          {completedSkills.length === nodes.length && nodes.length > 0 && (
            <button
              onClick={handleGenerateCertificate}
              disabled={isGenerating}
              style={{
                padding: '10px 16px',
                background: 'var(--bg-button)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                cursor: isGenerating ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                opacity: isGenerating ? 0.6 : 1,
                transition: 'all 0.2s',
              }}
            >
              {isGenerating ? '⋯ Génération...' : '🎓 Générer certificat'}
            </button>
          )}
        </div>

        {completedSkills.length === 0 ? (
          <div className="parcours-empty">
            <div className="parcours-empty-icon">📌</div>
            <p>Commence par débloquer et compléter des compétences depuis ton tableau de bord.</p>
            <button className="parcours-btn" onClick={() => navigate('/dashboard')}>
              Aller au tableau de bord
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
