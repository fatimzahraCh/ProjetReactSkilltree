import { Handle, Position } from 'reactflow';

// On définit le type des données que notre nœud va recevoir
interface CustomNodeProps {
  data: {
    label: string;
    status: 'completed' | 'unlocked' | 'locked';
  };
}

export default function CustomNode({ data }: CustomNodeProps) {
  // Une fonction intelligente pour changer les couleurs selon l'état
  const getStyles = () => {
    switch (data.status) {
      case 'completed': 
        return { border: '2px solid #2ecc71', background: '#e8f8f5', color: '#27ae60' };
      case 'unlocked': 
        return { border: '2px solid #3498db', background: '#ebf5fb', color: '#2980b9', cursor: 'pointer' };
      case 'locked': 
      default: 
        return { border: '2px dashed #bdc3c7', background: '#f8f9fa', color: '#7f8c8d', opacity: 0.7 };
    }
  };

  return (
    <div style={{ 
      ...getStyles(), 
      padding: '10px 15px', 
      borderRadius: '8px', 
      width: '160px', 
      textAlign: 'center', 
      fontWeight: 'bold', 
      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
      transition: 'all 0.3s ease'
    }}>
      {/* Le point d'accroche en haut (pour les connexions entrantes) */}
      <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
      
      <div>{data.label}</div>
      
      {/* L'icône de statut */}
      <div style={{ fontSize: '0.8rem', marginTop: '8px', fontWeight: 'normal' }}>
        {data.status === 'completed' ? '✅ Validé' : data.status === 'unlocked' ? '🔓 Disponible' : '🔒 Verrouillé'}
      </div>

      {/* Le point d'accroche en bas (pour les connexions sortantes) */}
      <Handle type="source" position={Position.Bottom} style={{ background: '#555' }} />
    </div>
  );
}