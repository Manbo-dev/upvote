import { create } from 'zustand';

interface UserInfo {
  name: string;
  email: string;
  plano: string;
}

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  login: (token: string, user: UserInfo) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

// Recupera estado inicial do localStorage
const savedToken = localStorage.getItem('token');
const savedUser = localStorage.getItem('user');

export const useAuthStore = create<AuthState>((set, get) => ({
  token: savedToken,
  user: savedUser ? JSON.parse(savedUser) : null,

  login: (token: string, user: UserInfo) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  },

  isAuthenticated: () => {
    return !!get().token;
  },
}));
