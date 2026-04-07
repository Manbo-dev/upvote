import { create } from 'zustand';

export interface UserInfo {
  name: string;
  email: string;
  plano: string;       // effective plan (owner's plan when in member context)
  ownPlano: string;    // personal plan — always the user's own subscription
  avatar?: string;
  memberRole: 'OWNER' | 'MEMBER';
  workspaceName: string; // effective workspace name
}

type ActiveWorkspace = 'own' | 'member';

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  activeWorkspace: ActiveWorkspace;
  login: (token: string, user: UserInfo) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  updateUser: (partial: Partial<UserInfo>) => void;
  isMember: () => boolean;
  setActiveWorkspace: (ws: ActiveWorkspace) => void;
  canSwitchWorkspace: () => boolean;
}

const savedToken = localStorage.getItem('token');
const savedUser = localStorage.getItem('user');
const savedWorkspace = localStorage.getItem('activeWorkspace') as ActiveWorkspace | null;

function defaultWorkspace(user: UserInfo | null): ActiveWorkspace {
  return user?.memberRole === 'MEMBER' ? 'member' : 'own';
}

const initialUser: UserInfo | null = savedUser ? JSON.parse(savedUser) : null;

export const useAuthStore = create<AuthState>((set, get) => ({
  token: savedToken,
  user: initialUser,
  activeWorkspace: savedWorkspace ?? defaultWorkspace(initialUser),

  login: (token: string, user: UserInfo) => {
    const ws = defaultWorkspace(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('activeWorkspace', ws);
    set({ token, user, activeWorkspace: ws });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeWorkspace');
    set({ token: null, user: null, activeWorkspace: 'own' });
  },

  isAuthenticated: () => {
    return !!get().token;
  },

  isMember: () => {
    const { user, activeWorkspace } = get();
    return user?.memberRole === 'MEMBER' && activeWorkspace === 'member';
  },

  updateUser: (partial: Partial<UserInfo>) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    localStorage.setItem('user', JSON.stringify(updated));
    set({ user: updated });
  },

  setActiveWorkspace: (ws: ActiveWorkspace) => {
    localStorage.setItem('activeWorkspace', ws);
    set({ activeWorkspace: ws });
  },

  // Workspace switcher is available when the user has an active membership (memberRole=MEMBER)
  // AND their personal plan is not FREE (FREE users operate exclusively in the invited workspace)
  canSwitchWorkspace: () => {
    const { user } = get();
    return user?.memberRole === 'MEMBER' && user.ownPlano !== 'FREE';
  },
}));
