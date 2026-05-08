import { useState } from 'react';
import ReactFlow, { Background, Controls, type Node } from 'reactflow';
import 'reactflow/dist/style.css';
import CustomNode from './CustomNode';
import CourseModal from './CourseModal';
import { useStore } from '../store/useStore'; // 1. On importe le Store

const nodeTypes = { custom: CustomNode };

export default function SkillTree() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  // 2. On récupère les données directement depuis Zustand
  const { nodes, edges } = useStore();

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setIsModalOpen(true);
  };

  return (
    <div style={{ width: '100%', height: '100%', backgroundColor: '#f4f6f8' }}>
      <ReactFlow 
        nodes={nodes} 
        edges={edges} 
        nodeTypes={nodeTypes} 
        onNodeClick={handleNodeClick} 
        fitView
      >
        <Background color="#ccc" gap={16} />
        <Controls />
      </ReactFlow>

      <CourseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        node={selectedNode} // On passe le nœud entier maintenant
      />
    </div>
  );
}