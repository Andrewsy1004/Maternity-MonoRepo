import { useState, useCallback } from 'react';
import { getTriage, type TriageResponse } from '../../services/iaService';

export const useTriage = () => {
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTriage = useCallback(async (sintomas: string[], respuestasRecientes: string[] = []) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getTriage(sintomas, respuestasRecientes);
      setResult(response);
      return response;
    } catch (err: any) {
      console.error('Error running triage:', err);
      setError(
        err.response?.data?.detail || 'No se pudo evaluar la urgencia de los síntomas.'
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, isLoading, error, runTriage, clearResult };
};
