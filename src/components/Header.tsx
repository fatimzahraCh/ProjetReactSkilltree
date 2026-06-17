import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const xp = useStore((s) => s.xp);
  const user = useStore((s) => s.user);
  const darkMode = useStore((s) => s.darkMode);
  const logout = useStore((s) => s.logout);
  const setDarkMode = useStore((s) => s.setDarkMode);
  const resetTree = useStore((s) => s.resetTree);
  const nodes = useStore((s) => s.nodes);
  const [showMenu, setShowMenu] = useState(false);

  const handleReset = () => {
    if (window.confirm('R├®initialiser votre arbre de comp├®tences ? Cette action est irr├®versible.')) {
      resetTree();
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className="header">
      <div className="header-left">
        <div className="header-logo-icon" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>­ƒºá</div>
        <h1 className="header-title" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Synapse</h1>
      </div>

      <div className="header-center">
        <div className="header-xp-badge">Ô¡É {xp} XP</div>
      </div>

      <div className="header-right">
        {nodes.length > 0 && (
          <button onClick={handleReset} className="header-reset-btn" title="R├®initialiser l'arbre">
            R├®initialiser
          </button>
        )}
        <button onClick={() => setDarkMode(!darkMode)} className="header-icon-btn" title={darkMode ? 'Mode clair' : 'Mode sombre'}>
          {darkMode ? 'ÔÿÇ´©Å' : '­ƒîÖ'}
        </button>

        {user && (
          <div className="header-user" onClick={() => setShowMenu(!showMenu)} style={{ cursor: 'pointer', position: 'relative' }}>
            <span className="header-user-avatar">{user.name.charAt(0).toUpperCase()}</span>
            <span className="header-user-name">{user.name}</span>
            {showMenu && (
              <div className="header-dropdown">
                <button onClick={() => { navigate('/profile'); setShowMenu(false); }} className="header-dropdown-item">­ƒæñ Profil</button>
                <button onClick={() => { navigate('/parcours'); setShowMenu(false); }} className="header-dropdown-item">­ƒôï Mes parcours</button>
                <div className="header-dropdown-divider" />
                <button onClick={handleLogout} className="header-dropdown-item header-dropdown-item--danger">­ƒÜ¬ D├®connexion</button>
              </div>
            )}
          </div>
        )}

      </div>
    </header>
  );
}
