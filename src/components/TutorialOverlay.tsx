import { useState } from 'react';
import { useStore } from '../store/useStore';

const STEPS = [
  { emoji: '🧠', title: 'Bienvenue sur Synapse !', desc: 'Ton assistant d\'apprentissage par IA. Crée des parcours sur mesure et progresse étape par étape.' },
  { emoji: '📝', title: 'Décris ton niveau', desc: 'Indique ce que tu sais déjà et ton objectif. L\'IA génère un arbre de compétences personnalisé.' },
  { emoji: '🌳', title: 'Explore l\'arbre', desc: 'Chaque nœud est une compétence. Clique sur un nœud déverrouillé pour voir le cours et passer le quiz.' },
  { emoji: '✅', title: 'Valide & Progresse', desc: 'Réussis le quiz pour gagner de l\'XP et débloquer les compétences suivantes. À toi de jouer !' },
];

export default function TutorialOverlay() {
  const [step, setStep] = useState(0);
  const setTutorialDone = useStore((s) => s.setTutorialDone);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      setTutorialDone();
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, animation: 'fadeIn 0.3s ease-out',
    }}>
      <div style={{
        background: 'var(--bg-card)', padding: '36px 32px',
        borderRadius: 'var(--radius-lg)', width: 420, maxWidth: '90vw',
        textAlign: 'center', boxShadow: 'var(--shadow-xl)',
        animation: 'slideUp 0.4s ease-out',
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>{current.emoji}</div>
        <h2 style={{ margin: '0 0 8px', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>{current.title}</h2>
        <p style={{ margin: '0 0 24px', color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>{current.desc}</p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%',
              background: i === step ? 'var(--primary)' : 'var(--border)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={() => setTutorialDone()}
            style={{
              padding: '8px 16px', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', background: 'transparent',
              color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer',
            }}
          >
            Passer
          </button>
          <button
            onClick={handleNext}
            style={{
              padding: '8px 24px', border: 'none',
              borderRadius: 'var(--radius)', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
              color: 'white', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}
          >
            {isLast ? 'C\'est parti ! 🚀' : 'Suivant →'}
          </button>
        </div>
      </div>
    </div>
  );
}
