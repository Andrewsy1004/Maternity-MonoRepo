import { useState, useEffect, useCallback } from 'react';
import { getRiskSummary, type RiskSummaryResponse } from '../../services/iaService';

const getCacheKey = () => {
  const role = localStorage.getItem('role');
  const isStaff = role === 'clinico' || role === 'admin' || role === 'hospital';
  if (isStaff) {
    const selectedGestanteId = localStorage.getItem('selected_gestante_id') || 'none';
    return `gmi_risk_summary_cache_staff_${selectedGestanteId}`;
  }
  const userName = localStorage.getItem('user_name') || 'self';
  return `gmi_risk_summary_cache_gestante_${userName}`;
};

export const useRiskSummary = () => {
  const [cacheKey, setCacheKey] = useState(getCacheKey());
  const [summary, setSummary] = useState<RiskSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar cacheKey cuando cambia el localStorage sin desmontar el hook
  useEffect(() => {
    const currentKey = getCacheKey();
    if (currentKey !== cacheKey) {
      setCacheKey(currentKey);
    }
  });

  const loadSummary = useCallback(async (forceUpdate = false, currentKey = cacheKey) => {
    const cached = sessionStorage.getItem(currentKey);
    if (cached && !forceUpdate) {
      try {
        setSummary(JSON.parse(cached));
        return;
      } catch (e) {
        console.error('Error parsing risk summary cache:', e);
      }
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await getRiskSummary();
      setSummary(response);
      sessionStorage.setItem(currentKey, JSON.stringify(response));
    } catch (err: any) {
      console.error('Error fetching risk summary:', err);
      setError(
        err.response?.data?.detail || 'No se pudo generar el resumen de riesgo.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey]);

  // Carga inicial y cuando cambia el cacheKey (limpia estado anterior)
  useEffect(() => {
    setSummary(null);
    loadSummary(false, cacheKey);
  }, [cacheKey, loadSummary]);

  // Listener para eventos de recarga en tiempo real (ej. desde chat o triage)
  useEffect(() => {
    const handleRefresh = () => {
      sessionStorage.removeItem(cacheKey);
      loadSummary(true, cacheKey);
    };

    window.addEventListener('refresh-risk-summary', handleRefresh);
    return () => {
      window.removeEventListener('refresh-risk-summary', handleRefresh);
    };
  }, [loadSummary, cacheKey]);

  return {
    summary,
    isLoading,
    error,
    updateEvaluation: () => loadSummary(true, cacheKey),
  };
};
