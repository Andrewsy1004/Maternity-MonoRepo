import { useState } from 'react';
import { loginService, type LoginRequest } from '../../services/auth/auth';

const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (data: LoginRequest) => {
    try {
      setLoading(true);
      setError(null);

      const response = await loginService(data);
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      return response;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const message =
        error?.response?.data?.detail ?? 'Error al iniciar sesión';

      setError(message);

      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    loading,
    error,
  };
};

export default useLogin;
