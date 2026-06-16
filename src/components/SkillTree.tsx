import { useState } from 'react';
import ReactFlow, { Background, Controls, MiniMap, type Node } from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import CourseModal from './CourseModal';
import { useStore } from '../store/useStore';
import './SkillTree.css';

const nodeTypes = { custom: CustomNode };

export default function SkillTree() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const { nodes, edges } = useStore();

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    if (node.data?.status === 'locked') return;
    setSelectedNode(node);
    setIsModalOpen(true);
  };

  return (
    <div className="skill-tree-wrapper">
      <div className="skill-tree-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          fitView
        >
          <Background color="var(--border)" gap={20} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeStrokeColor="var(--primary)"
            nodeColor={(n) =>
              n.data?.status === 'completed' ? 'var(--success)' :
              n.data?.status === 'unlocked' ? 'var(--primary)' : 'var(--border)'
            }
            maskColor="rgba(0,0,0,0.1)"
            style={{ border: '1px solid var(--border)', borderRadius: 8 }}
          />
        </ReactFlow>
      </div>

      <CourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        node={selectedNode}
      />
    </div>
  );
}
