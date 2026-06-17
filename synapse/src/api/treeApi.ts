import api from './axios';
import { type Node, type Edge } from 'reactflow';

export interface TreeData {
  xp: number;
  nodes: Node[];
  edges: Edge[];
}

export const fetchTree = async (email: string) => {
  const res = await api.get<TreeData>(`/tree/${encodeURIComponent(email)}`);
  return res.data;
};

export const saveTree = async (email: string, data: TreeData) => {
  const res = await api.put(`/tree/${encodeURIComponent(email)}`, data);
  return res.data;
};

export const completeSkillApi = async (email: string, nodeId: string) => {
  const res = await api.post<TreeData>(`/tree/${encodeURIComponent(email)}/complete-skill`, { nodeId });
  return res.data;
};

export const resetTreeApi = async (email: string) => {
  const res = await api.delete(`/tree/${encodeURIComponent(email)}`);
  return res.data;
};
