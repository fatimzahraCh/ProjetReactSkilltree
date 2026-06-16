import { useStore } from '../store/useStore';

export default function Header() {
  const xp = useStore((state) => state.xp);
  const resetTree = useStore((state) => state.resetTree); // On récupère la fonction

  return (
    <header style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '15px 30px', backgroundColor: '#2c3e50', color: 'white',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)', zIndex: 10, position: 'relative'
    }}>
      <h1 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '1px' }}>🧠 Synapse</h1>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Bouton de réinitialisation */}
        <button 
          onClick={resetTree}
          style={{
            background: 'transparent', border: '1px solid #7f8c8d', color: '#ecf0f1',
            padding: '5px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem'
          }}
        >
          🔄 Recommencer
        </button>

        <div style={{
          background: '#f39c12', padding: '8px 20px', borderRadius: '20px',
          fontWeight: 'bold', fontSize: '1.1rem', color: '#fff',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
        }}>
          ⭐ {xp} XP
        </div>
      </div>
    </header>
  );
}