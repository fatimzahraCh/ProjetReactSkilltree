import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import './CustomNode.css';

interface CustomNodeProps {
  data: {
    label: string;
    status: 'completed' | 'unlocked' | 'locked';
  };
}

const STATUS_MAP = {
  completed: { className: 'custom-node--completed', icon: '✅', label: 'Validé', statusClass: 'custom-node-status--completed' },
  unlocked: { className: 'custom-node--unlocked', icon: '🔓', label: 'Disponible', statusClass: 'custom-node-status--unlocked' },
  locked: { className: 'custom-node--locked', icon: '🔒', label: 'Verrouillé', statusClass: 'custom-node-status--locked' },
} as const;

function CustomNodeInner({ data }: CustomNodeProps) {
  const status = STATUS_MAP[data.status];

  return (
    <div className={`custom-node ${status.className}`}>
      <Handle type="target" position={Position.Top} style={{ background: '#64748b', width: 8, height: 8, border: '2px solid var(--bg-card)' }} />
      <div className="custom-node-label">{data.label}</div>
      <div className={`custom-node-status ${status.statusClass}`}>
        {status.icon} {status.label}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#64748b', width: 8, height: 8, border: '2px solid var(--bg-card)' }} />
    </div>
  );
}

export default memo(CustomNodeInner);
