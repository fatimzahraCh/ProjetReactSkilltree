import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Node, type Edge } from 'reactflow';

interface AppState {
  xp: number;
  nodes: Node[];
  edges: Edge[];
  isLoading: boolean;
  setGeneratedTree: (data: { nodes: Node[], edges: Edge[], xp: number }) => void;
  completeSkill: (nodeId: string) => void;
  resetTree: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      xp: 0,
      nodes: [],
      edges: [],
      isLoading: false,

      // 1. Enregistre l'arbre fraîchement généré par Gemini
      setGeneratedTree: (data) => set({
        nodes: data.nodes,
        edges: data.edges,
        xp: data.xp,
        isLoading: false
      }),

      // 2. Valide un nœud (quand tu réussis le Quiz) et donne 50 XP
      completeSkill: (nodeId) => set((state) => {
        const updatedNodes = state.nodes.map(node => 
          node.id === nodeId ? { ...node, data: { ...node.data, status: 'completed' } } : node
        );
        return { 
          nodes: updatedNodes, 
          xp: state.xp + 50 
        };
      }),

      // 3. Efface tout pour recommencer (bouton dans le Header)
      resetTree: () => set({
        xp: 0,
        nodes: [],
        edges: []
      })
    }),
    {
      name: 'synapse-storage', // C'est ici que la magie de la sauvegarde opère !
    }
  )
);