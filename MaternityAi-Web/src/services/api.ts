import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const USE_MOCKS = false; // Cambiar a false para usar el backend real

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Inyectar automáticamente gestante_id si el usuario es de staff y hay un paciente seleccionado
    const role = localStorage.getItem('role');
    const selectedGestanteId = localStorage.getItem('selected_gestante_id');
    if (
      (role === 'clinico' || role === 'admin' || role === 'hospital') &&
      selectedGestanteId
    ) {
      // Evitar auto-inyectar gestante_id en endpoints de administración general o de listados globales
      const isGeneralAdminEndpoint =
        config.url?.includes('/api/v1/admin/appointments') ||
        config.url?.includes('/api/v1/admin/gestantes') ||
        config.url?.includes('/api/v1/admin/users');

      if (!isGeneralAdminEndpoint) {
        config.params = {
          ...config.params,
          gestante_id: selectedGestanteId,
        };
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Interceptor para manejar errores 401 y refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no hemos intentado reintentar
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject: (err: any) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('role');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }

      return new Promise((resolve, reject) => {
        axios
          .post(`${API_BASE_URL}/api/v1/auth/refresh-token`, {
            refresh_token: refreshToken,
          })
          .then((response) => {
            const {
              access_token,
              refresh_token: new_refresh_token,
              role,
            } = response.data;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', new_refresh_token);
            localStorage.setItem('role', role);

            originalRequest.headers['Authorization'] = `Bearer ${access_token}`;
            processQueue(null, access_token);
            resolve(api(originalRequest));
          })
          .catch((refreshError) => {
            processQueue(refreshError, null);
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('role');
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            reject(refreshError);
          })
          .finally(() => {
            isRefreshing = false;
          });
      });
    }

    return Promise.reject(error);
  }
);

export default api;
