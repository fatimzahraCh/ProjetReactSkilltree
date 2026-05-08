import api from './axios';
import { type Node, type Edge } from 'reactflow';

export const fetchUserTree = async () => {
  // Appel dynamique pour récupérer l'arbre de l'utilisateur connecté
  const response = await api.get<{ nodes: Node[], edges: Edge[], xp: number }>('/tree');
  return response.data;
};

export const fetchQuizForNode = async (nodeId: string) => {
  // Appel dynamique pour récupérer un quiz généré spécifiquement pour cette compétence
  const response = await api.get(`/skills/${nodeId}/quiz`);
  return response.data;
};

export const validateSkill = async (nodeId: string, score: number) => {
  // On envoie le résultat au serveur, qui nous retournera le nouvel état de l'arbre
  const response = await api.post(`/skills/${nodeId}/validate`, { score });
  return response.data;
};