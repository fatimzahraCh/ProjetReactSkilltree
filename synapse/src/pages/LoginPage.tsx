import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import './LoginPage.css';

type Mode = 'login' | 'register';

const SUCCESS_REACTIONS = [
  { emoji: '✨', text: 'Prêt à apprendre !', sub: 'Bienvenue sur Synapse' },
  { emoji: '🎉', text: 'Compte créé avec succès !', sub: 'Ton aventure commence maintenant' },
  { emoji: '👋', text: 'Heureux de te revoir !', sub: 'Reprends ton apprentissage' },
  { emoji: '✅', text: 'Connexion réussie !', sub: 'Prêt à explorer de nouveaux sommets' },
  { emoji: '🚀', text: 'Bienvenue dans Synapse !', sub: 'Le savoir est à portée de main' },
];

function pickReaction(mode: Mode) {
  if (mode === 'register') {
    return SUCCESS_REACTIONS[1];
  }
  return SUCCESS_REACTIONS[Math.floor(Math.random() * SUCCESS_REACTIONS.length)];
}

function getPasswordStrength(password: string): { level: 'weak' | 'medium' | 'strong'; label: string } {
  if (password.length < 4) return { level: 'weak', label: 'Trop court' };
  if (password.length < 6) return { level: 'weak', label: 'Faible' };
  if (password.length < 8) return { level: 'medium', label: 'Moyen' };
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  if (hasUpper && hasNumber) return { level: 'strong', label: 'Fort' };
  if (hasUpper || hasNumber) return { level: 'medium', label: 'Moyen' };
  return { level: 'weak', label: 'Faible' };
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, login, register } = useStore();

  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showReaction, setShowReaction] = useState(false);
  const [reaction, setReaction] = useState(pickReaction('login'));

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'login') {
      const err = await login(email, password);
      if (err) {
        setError(err);
        return;
      }
      setReaction(pickReaction('login'));
    } else {
      const err = await register(name, email, password);
      if (err) {
        setError(err);
        return;
      }
      setReaction(pickReaction('register'));
    }

    setShowReaction(true);
    setTimeout(() => navigate('/dashboard'), 1400);
  };

  const switchMode = (newMode: Mode) => {
    setMode(newMode);
    setError(null);
  };

  const strength = password ? getPasswordStrength(password) : null;

  if (showReaction) {
    return (
      <div className="login-page">
        <div className="login-grid" />
        <div className="login-card" style={{ position: 'relative', minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="login-reaction-overlay">
            <div className="login-reaction-emoji">{reaction.emoji}</div>
            <div className="login-reaction-text">{reaction.text}</div>
            <div className="login-reaction-sub">{reaction.sub}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-grid" />
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🧠</div>
        </div>
        <h1 className="login-title">Synapse</h1>
        <p className="login-subtitle">Connecte-toi pour accéder à ton parcours</p>

        <div className="login-tabs">
          <button
            className={`login-tab ${mode === 'login' ? 'login-tab--active' : ''}`}
            onClick={() => switchMode('login')}
            type="button"
          >
            Connexion
          </button>
          <button
            className={`login-tab ${mode === 'register' ? 'login-tab--active' : ''}`}
            onClick={() => switchMode('register')}
            type="button"
          >
            Inscription
          </button>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="login-field">
              <label className="login-label">Nom d'utilisateur</label>
              <div className="login-input-wrapper">
                <span className="login-input-icon">🧑</span>
                <input
                  required
                  type="text"
                  className={`login-input ${error ? 'login-input--error' : ''}`}
                  placeholder="Jean Dupont"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="login-field">
            <label className="login-label">Email</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">📧</span>
              <input
                required
                type="email"
                className={`login-input ${error ? 'login-input--error' : ''}`}
                placeholder="jean@exemple.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label">Mot de passe</label>
            <div className="login-input-wrapper">
              <span className="login-input-icon">🔒</span>
              <input
                required
                type="password"
                className={`login-input ${error ? 'login-input--error' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {mode === 'register' && strength && (
              <>
                <div className="login-strength">
                  <div className={`login-strength-bar ${strength.level === 'weak' ? 'login-strength-bar--weak' : ''} ${strength.level === 'medium' ? 'login-strength-bar--medium' : ''} ${strength.level === 'strong' ? 'login-strength-bar--strong' : ''}`} style={strength.level !== 'weak' ? { background: 'var(--border)' } : {}} />
                  <div className={`login-strength-bar ${strength.level === 'medium' ? 'login-strength-bar--medium' : ''} ${strength.level === 'strong' ? 'login-strength-bar--strong' : ''}`} style={strength.level === 'weak' ? { background: 'var(--border)' } : {}} />
                  <div className={`login-strength-bar ${strength.level === 'strong' ? 'login-strength-bar--strong' : ''}`} style={strength.level !== 'strong' ? { background: 'var(--border)' } : {}} />
                </div>
                <span className={`login-strength-text login-strength-text--${strength.level}`}>
                  {strength.label}
                </span>
              </>
            )}
          </div>

          {error && (
            <div className="login-message login-message--error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="login-submit">
            {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
          </button>
        </form>
      </div>
    </div>
  );
}
