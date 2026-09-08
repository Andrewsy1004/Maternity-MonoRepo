import axios from 'axios';
/**
 * Instancia de Axios para maternity
 */
const apiMaternity = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : 'http://127.0.0.1:8000/api/v1',
  timeout: 10000,

  headers: {
    'Content-Type': 'application/json',
  },

  params: {
    api_key: import.meta.env.VITE_API_KEY,
  },
});

/**
 * Interceptor Request
 */
apiMaternity.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Interceptor Response
 */
apiMaternity.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      console.error('No autorizado');
    }

    return Promise.reject(error);
  }
);

export default apiMaternity;
