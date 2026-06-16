import api from './axios';
import { type Node, type Edge } from 'reactflow';

export interface UserResponse {
  email: string;
  name: string;
  darkMode: boolean;
  streakCount: number;
  tutorialDone: boolean;
  createdAt?: string;
}

export interface LoginResponse {
  user: UserResponse;
  tree: { xp: number; nodes: Node[]; edges: Edge[] };
}

export interface RegisterResponse {
  user: UserResponse;
  message: string;
}

export const loginApi = async (email: string, password: string) => {
  const res = await api.post<LoginResponse>('/auth/login', { email, password });
  return res.data;
};

export const registerApi = async (name: string, email: string, password: string) => {
  const res = await api.post<RegisterResponse>('/auth/register', { name, email, password });
  return res.data;
};
