import axios from 'axios';
import { useAuthStore } from '../store/authStore';

// Instância do Axios configurada para a API
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token JWT e contexto de workspace em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // When the user switches to their own workspace, tell the backend to skip
  // the team membership proxy (UserContextResolver checks this header).
  const { activeWorkspace } = useAuthStore.getState();
  if (activeWorkspace === 'own') {
    config.headers['X-Workspace-Override'] = 'own';
  }
  return config;
});

// Interceptor para redirecionar ao login em caso de 401 ou 403 (token expirado/inválido)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if ((status === 401 || status === 403) && localStorage.getItem('token')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
