import { create } from 'zustand';
import type { User } from '../types';
import { authApi } from '../services/endpoints';
import { tokenStore } from '../services/api';

interface AuthState {
  user: User | null;
  loading: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  async initialize() {
    if (typeof window === 'undefined') return;
    if (!tokenStore.getAccess()) {
      set({ loading: false });
      return;
    }
    try {
      const { user } = await authApi.me();
      set({ user, loading: false });
    } catch {
      tokenStore.clear();
      set({ user: null, loading: false });
    }
  },

  async login(email, password) {
    const data = await authApi.login(email, password);
    tokenStore.setBoth(data.accessToken, data.refreshToken);
    set({ user: data.user });
    return data.user;
  },

  async register(name, email, password) {
    const data = await authApi.register(name, email, password);
    tokenStore.setBoth(data.accessToken, data.refreshToken);
    set({ user: data.user });
    return data.user;
  },

  async logout() {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    tokenStore.clear();
    set({ user: null });
  },

  setUser: (user) => set({ user }),
}));
