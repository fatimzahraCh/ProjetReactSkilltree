import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import Header from '../components/Header';
import './ProfilePage.css';

export default function ProfilePage() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const darkMode = useStore((s) => s.darkMode);
  const updateProfile = useStore((s) => s.updateProfile);
  const fetchStats = useStore((s) => s.fetchStats);

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalSkills: number; completedSkills: number; unlockedSkills: number;
    lockedSkills: number; percentage: number; xp: number;
    streakCount: number; lastActive: string | null; activityDays: string[];
  } | null>(null);

  useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);

  useEffect(() => {
    fetchStats().then(setStats);
  }, [fetchStats]);

  const handleUpdateName = async () => {
    setError(null); setSuccess(null);
    const err = await updateProfile({ name, darkMode });
    if (err) setError(err); else setSuccess('Nom mis à jour !');
  };

  const handleUpdatePassword = async () => {
    setError(null); setSuccess(null);
    if (!currentPassword || !newPassword) { setError('Remplis les deux champs.'); return; }
    const err = await updateProfile({ currentPassword, newPassword });
    if (err) setError(err); else { setSuccess('Mot de passe mis à jour !'); setCurrentPassword(''); setNewPassword(''); }
  };

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  return (
    <div className="profile-page">
      <Header />
      <div className="profile-content">
        <div className="profile-grid">
          <div className="profile-card">
            <h2 className="profile-card-title">👤 Profil</h2>
            {error && <div className="profile-error">{error}</div>}
            {success && <div className="profile-success">{success}</div>}
            <div className="profile-field">
              <label className="profile-label">Nom</label>
              <input className="profile-input" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="profile-field">
              <label className="profile-label">Email</label>
              <input className="profile-input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
            </div>
            <button className="profile-btn" onClick={handleUpdateName}>Enregistrer</button>
          </div>

          <div className="profile-card">
            <h2 className="profile-card-title">🔒 Mot de passe</h2>
            <div className="profile-field">
              <label className="profile-label">Mot de passe actuel</label>
              <input className="profile-input" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
            </div>
            <div className="profile-field">
              <label className="profile-label">Nouveau mot de passe</label>
              <input className="profile-input" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <button className="profile-btn" onClick={handleUpdatePassword}>Changer le mot de passe</button>
          </div>

          {stats && (
            <>
              <div className="profile-card">
                <h2 className="profile-card-title">📊 Statistiques</h2>
                <div className="stats-grid">
                  <div className="stat-box"><div className="stat-value">{stats.percentage}%</div><div className="stat-label">Complété</div></div>
                  <div className="stat-box"><div className="stat-value">{stats.completedSkills}/{stats.totalSkills}</div><div className="stat-label">Compétences</div></div>
                  <div className="stat-box"><div className="stat-value">{stats.xp}</div><div className="stat-label">XP Total</div></div>
                  <div className="stat-box"><div className="stat-value">{stats.unlockedSkills}</div><div className="stat-label">Disponibles</div></div>
                </div>
              </div>

              <div className="profile-card">
                <h2 className="profile-card-title">🔥 Streak</h2>
                <div className="streak-box">
                  <div className="streak-icon">🔥</div>
                  <div className="streak-info">
                    <h3>{stats.streakCount} jour{stats.streakCount > 1 ? 's' : ''} consécutif{stats.streakCount > 1 ? 's' : ''}</h3>
                    <p>Connecte-toi chaque jour pour maintenir ta série !</p>
                  </div>
                </div>
                <div className="activity-row">
                  {weekDays.map((d, i) => {
                    const dateStr = d.toISOString().slice(0, 10);
                    const isActive = stats.activityDays?.includes(dateStr);
                    const isToday = i === 6;
                    return (
                      <div key={i} className={`activity-dot ${isActive ? 'activity-dot--active' : ''} ${isToday ? 'activity-dot--today' : ''}`} title={`${dayNames[d.getDay()]} ${dateStr}`}>
                        {dayNames[d.getDay()][0]}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          <div className="profile-card profile-card--full" style={{ display: 'flex', gap: 12 }}>
            <button className="profile-btn" onClick={() => navigate('/dashboard')}>🌳 Tableau de bord</button>
            <button className="profile-btn" onClick={() => navigate('/parcours')}>📋 Mes parcours</button>
          </div>
        </div>
      </div>
    </div>
  );
}
