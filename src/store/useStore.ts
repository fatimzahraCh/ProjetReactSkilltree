import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Node, type Edge } from 'reactflow';
import { loginApi, registerApi } from '../api/auth';
import { saveTree, completeSkillApi, resetTreeApi } from '../api/treeApi';
import api from '../api/axios';

function getNextUnlockable(nodes: Node[], edges: Edge[]): string | null {
  const completedIds = new Set(nodes.filter(n => n.data.status === 'completed').map(n => n.id));
  const eligible = nodes
    .filter(n => n.data.status === 'locked')
    .filter(n => {
      const parentEdges = edges.filter(e => e.target === n.id);
      return parentEdges.length > 0 && parentEdges.every(e => completedIds.has(e.source));
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  return eligible.length > 0 ? eligible[0].id : null;
}

function unlockFirstChildOnly(nodes: Node[], edges: Edge[]): Node[] {
  const completedIds = new Set(nodes.filter(n => n.data.status === 'completed').map(n => n.id));
  const eligible = nodes
    .filter(n => n.data.status !== 'completed')
    .map(n => {
      const parentEdges = edges.filter(e => e.target === n.id);
      const allDone = parentEdges.length > 0 && parentEdges.every(e => completedIds.has(e.source));
      return { id: n.id, allDone, origStatus: n.data.status };
    });
  const eligibleIds = new Set(eligible.filter(e => e.allDone).map(e => e.id));
  const sorted = [...eligibleIds].sort((a, b) => a.localeCompare(b));
  const firstId = sorted.length > 0 ? sorted[0] : null;
  return nodes.map(n => {
    if (n.data.status === 'completed') return n;
    if (eligibleIds.has(n.id)) {
      return { ...n, data: { ...n.data, status: n.id === firstId ? 'unlocked' as const : 'locked' as const } };
    }
    return { ...n, data: { ...n.data, status: 'locked' as const } };
  });
}

function unlockNextChild(nodes: Node[], edges: Edge[], completedNodeId: string): Node[] {
  const updated = nodes.map(n =>
    n.id === completedNodeId ? { ...n, data: { ...n.data, status: 'completed' as const } } : n
  );
  const nextId = getNextUnlockable(updated, edges);
  if (!nextId) return updated;
  return updated.map(n =>
    n.id === nextId ? { ...n, data: { ...n.data, status: 'unlocked' as const } } : n
  );
}

interface User {
  email: string;
  name: string;
}

interface LocalUser extends User {
  password: string;
}

interface UserTree { xp: number; nodes: Node[]; edges: Edge[] }
const EMPTY_TREE: UserTree = { xp: 0, nodes: [], edges: [] };

interface Stats {
  totalSkills: number; completedSkills: number; unlockedSkills: number;
  lockedSkills: number; percentage: number; xp: number;
  streakCount: number; lastActive: string | null; activityDays: string[];
}

interface AppState {
  user: User | null; localUsers: LocalUser[]; trees: Record<string, UserTree>;
  darkMode: boolean; tutorialDone: boolean;
  login: (e: string, p: string) => Promise<string | null>;
  register: (n: string, e: string, p: string) => Promise<string | null>;
  logout: () => void;
  updateProfile: (d: { name?: string; darkMode?: boolean; tutorialDone?: boolean; currentPassword?: string; newPassword?: string }) => Promise<string | null>;
  fetchStats: () => Promise<Stats | null>;
  exportCSV: () => Promise<void>;
  generateCertificate: () => Promise<{ certificateId: string; userName: string; email: string; totalXp: number; completedSkills: number; issuedAt: string; message: string }>;

  xp: number; nodes: Node[]; edges: Edge[]; isLoading: boolean;
  setGeneratedTree: (d: { nodes: Node[]; edges: Edge[]; xp: number }) => void;
  completeSkill: (nodeId: string) => Promise<void>;
  resetTree: () => Promise<void>;
  restoreTree: () => void;
  setDarkMode: (v: boolean) => void;
  setTutorialDone: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null, localUsers: [], trees: {},
      darkMode: false, tutorialDone: false,

      login: async (email, password) => {
        // Try API first
        try {
          const data = await loginApi(email, password);
          document.documentElement.setAttribute('data-theme', data.user.darkMode ? 'dark' : 'light');
          set({
            user: { email: data.user.email, name: data.user.name },
            xp: data.tree.xp, nodes: data.tree.nodes, edges: data.tree.edges,
            darkMode: data.user.darkMode, tutorialDone: data.user.tutorialDone,
          });
          return null;
        } catch (err: unknown) {
          const apiMsg = err && typeof err === 'object' && 'response' in err
            ? (err as { response: { data: { error?: string } } }).response?.data?.error || ''
            : '';
          // If user not in backend yet, migrate from localStorage
          if (apiMsg.includes('Aucun compte trouvé')) {
            const localUsers = get().localUsers;
            const localUser = localUsers.find(u => u.email === email);
            if (localUser && localUser.password === password) {
              try {
                await registerApi(localUser.name, email, password);
              } catch { /* migration may fail silently */ }
              const localTree = get().trees[email] || EMPTY_TREE;
              set({
                user: { email, name: localUser.name },
                xp: localTree.xp, nodes: localTree.nodes, edges: localTree.edges,
                darkMode: false, tutorialDone: false,
              });
              // Save migrated tree to backend
              saveTree(email, localTree).catch(() => {});
              return null;
            }
          }
          const msg = err instanceof Error ? err.message : '';
          return apiMsg || msg || 'Erreur de connexion.';
        }
      },

      register: async (name, email, password) => {
        try {
          await registerApi(name, email, password);
          set({ localUsers: [...get().localUsers, { name, email, password }], user: { name, email }, trees: { ...get().trees, [email]: EMPTY_TREE }, xp: 0, nodes: [], edges: [], darkMode: false, tutorialDone: false });
          document.documentElement.setAttribute('data-theme', 'light');
          return null;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : '';
          const apiErr = err && typeof err === 'object' && 'response' in err
            ? (err as { response: { data: { error?: string } } }).response?.data?.error
            : null;
          return apiErr || msg || "Erreur d'inscription.";
        }
      },

      logout: () => {
        const s = get();
        if (s.user) {
          const t = { ...s.trees, [s.user.email]: { xp: s.xp, nodes: s.nodes, edges: s.edges } };
          set({ user: null, trees: t, xp: 0, nodes: [], edges: [] });
        } else set({ user: null });
      },

      updateProfile: async (data) => {
        const user = get().user;
        if (!user) return 'Non connecté.';
        try {
          const res = await api.put(`/profile/${encodeURIComponent(user.email)}`, data);
          if (res.data.name) set({ user: { ...user, name: res.data.name } });
          if (data.darkMode !== undefined) {
            set({ darkMode: data.darkMode });
            document.documentElement.setAttribute('data-theme', data.darkMode ? 'dark' : 'light');
          }
          if (data.tutorialDone !== undefined) set({ tutorialDone: true });
          return null;
        } catch (err: unknown) {
          const apiErr = err && typeof err === 'object' && 'response' in err
            ? (err as { response: { data: { error?: string } } }).response?.data?.error
            : null;
          return apiErr || 'Erreur de mise à jour.';
        }
      },

      fetchStats: async () => {
        const user = get().user;
        if (!user) return null;
        try {
          const res = await api.get<Stats>(`/profile/${encodeURIComponent(user.email)}/stats`);
          return res.data;
        } catch { return null; }
      },

      exportCSV: async () => {
        const user = get().user;
        if (!user) return;
        try {
          const res = await api.get(`/profile/${encodeURIComponent(user.email)}/export`, { responseType: 'blob' });
          const url = URL.createObjectURL(new Blob([res.data]));
          const a = document.createElement('a'); a.href = url; a.download = `synapse-${user.email}-progress.csv`;
          a.click(); URL.revokeObjectURL(url);
        } catch { /* ignore */ }
      },

      generateCertificate: async () => {
        const user = get().user;
        if (!user) return null;
        try {
          const res = await api.post(`/profile/${encodeURIComponent(user.email)}/certificate`);
          return res.data;
        } catch (err: unknown) {
          const apiErr = err && typeof err === 'object' && 'response' in err
            ? (err as { response: { data: { error?: string } } }).response?.data?.error
            : null;
          throw new Error(apiErr || 'Erreur certificat.');
        }
      },

      setDarkMode: (v) => { set({ darkMode: v }); document.documentElement.setAttribute('data-theme', v ? 'dark' : 'light'); },
      setTutorialDone: () => set({ tutorialDone: true }),

      xp: 0, nodes: [], edges: [], isLoading: false,

      setGeneratedTree: (data) => set((state) => {
        const normalizedNodes = unlockFirstChildOnly(data.nodes, data.edges);
        const patch = { nodes: normalizedNodes, edges: data.edges, xp: data.xp, isLoading: false };
        if (state.user) {
          const key = state.user.email;
          saveTree(key, { xp: data.xp, nodes: normalizedNodes, edges: data.edges }).catch(() => {});
          return { ...patch, trees: { ...state.trees, [key]: { xp: data.xp, nodes: normalizedNodes, edges: data.edges } } };
        }
        return patch;
      }),

      completeSkill: async (nodeId) => {
        const state = get();
        const finalNodes = unlockNextChild(state.nodes, state.edges, nodeId);
        const newXp = state.xp + 50;
        if (state.user) {
          try {
            const backend = await completeSkillApi(state.user.email, nodeId);
            const normalizedBackend = { ...backend, nodes: unlockNextChild(backend.nodes, backend.edges, nodeId) };
            set({ nodes: normalizedBackend.nodes, edges: normalizedBackend.edges, xp: normalizedBackend.xp, trees: { ...state.trees, [state.user.email]: normalizedBackend } });
          } catch {
            set({ nodes: finalNodes, xp: newXp, trees: { ...state.trees, [state.user.email]: { xp: newXp, nodes: finalNodes, edges: state.edges } } });
          }
        } else set({ nodes: finalNodes, xp: newXp });
      },

      restoreTree: () => {
        const state = get();
        if (!state.user || state.nodes.length > 0) return;
        const saved = state.trees[state.user.email];
        if (saved?.nodes?.length) {
          set({ nodes: saved.nodes, edges: saved.edges, xp: saved.xp });
        }
      },

      resetTree: async () => {
        const state = get();
        if (state.user) {
          try { await resetTreeApi(state.user.email); } catch { /* ignore */ }
          set({ xp: 0, nodes: [], edges: [], trees: { ...state.trees, [state.user.email]: EMPTY_TREE } });
        } else set({ xp: 0, nodes: [], edges: [] });
      },
    }),
    { name: 'synapse-storage' }
  )
);
