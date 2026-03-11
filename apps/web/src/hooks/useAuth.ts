import { useAuthStore } from '../store/authStore';

/**
 * Hook para acessar o estado de autenticação
 */
export function useAuth() {
  const { token, user, login, logout, isAuthenticated } = useAuthStore();

  return {
    token,
    user,
    login,
    logout,
    isAuthenticated: isAuthenticated(),
  };
}
