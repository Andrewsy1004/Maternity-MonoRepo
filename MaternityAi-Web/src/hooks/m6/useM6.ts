import { useState, useCallback, useEffect } from 'react';
import {
  getAlertas,
  getAlertaById,
  acknowledgeAlerta,
  getCitas,
  createCita,
  reprogramarCita,
  confirmarCita,
  cancelarCita,
  getRecordatorios,
  getNotificaciones,
  markNotificacionRead,
  createLlamadaEmergencia,
  getHistorialLlamadas,
  type AlertaResponse,
  type AlertaDetalleResponse,
  type CitaMedicaCreate,
  type CitaMedicaUpdate,
  type CitaMedicaResponse,
  type RecordatorioResponse,
  type NotificacionResponse,
  type LlamadaEmergenciaCreate,
  type LlamadaEmergenciaResponse,
} from '../../services/m6Service';

// ---------------------------------------------------------------------------
// Hook base genérico interno
// ---------------------------------------------------------------------------

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useAsyncState<T>(initialData: T | null = null): [
  AsyncState<T>,
  (fn: () => Promise<T>) => Promise<void>,
  (data: T) => void,
] {
  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const run = useCallback(async (fn: () => Promise<T>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fn();
      setState({ data, loading: false, error: null });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error inesperado';
      setState(prev => ({ ...prev, loading: false, error: message }));
    }
  }, []);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  return [state, run, setData];
}

// ---------------------------------------------------------------------------
// useAlertas
// ---------------------------------------------------------------------------

export const useAlertas = () => {
  const [state, run, setData] = useAsyncState<AlertaResponse[]>([]);

  const fetch = useCallback(() => run(getAlertas), [run]);

  const acknowledge = useCallback(
    async (alert_id: string) => {
      const updated = await acknowledgeAlerta(alert_id);
      setData((state.data ?? []).map(a => a.id === alert_id ? updated : a));
    },
    [state.data, setData],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    acknowledge,
  };
};

// ---------------------------------------------------------------------------
// useAlertaDetalle
// ---------------------------------------------------------------------------

export const useAlertaDetalle = (alert_id: string) => {
  const [state, run] = useAsyncState<AlertaDetalleResponse>();

  const fetch = useCallback(
    () => run(() => getAlertaById(alert_id)),
    [run, alert_id],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refresh: fetch,
  };
};

// ---------------------------------------------------------------------------
// useCitas
// ---------------------------------------------------------------------------

export const useCitas = () => {
  const [state, run, setData] = useAsyncState<CitaMedicaResponse[]>([]);

  const fetch = useCallback(() => run(getCitas), [run]);

  // No usa `run`: un fallo al crear no debe pisar el `error`/`data`
  // compartido que usa la lista para renderizar (dejaría la lista
  // completa oculta detrás de un mensaje de error aunque siga intacta).
  const create = useCallback(
    async (payload: CitaMedicaCreate) => {
      await createCita(payload);
      const refreshed = await getCitas();
      setData(refreshed);
    },
    [setData],
  );

  const reprogramar = useCallback(
    async (id: string, payload: CitaMedicaUpdate) => {
      const updated = await reprogramarCita(id, payload);
      setData((state.data ?? []).map(c => c.id === id ? updated : c));
    },
    [state.data, setData],
  );

  const confirmar = useCallback(
    async (id: string) => {
      const updated = await confirmarCita(id);
      setData((state.data ?? []).map(c => c.id === id ? updated : c));
    },
    [state.data, setData],
  );

  const cancelar = useCallback(
    async (id: string) => {
      await cancelarCita(id);
      setData((state.data ?? []).filter(c => c.id !== id));
    },
    [state.data, setData],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    create,
    reprogramar,
    confirmar,
    cancelar,
  };
};

// ---------------------------------------------------------------------------
// useRecordatorios
// ---------------------------------------------------------------------------

export const useRecordatorios = () => {
  const [state, run] = useAsyncState<RecordatorioResponse[]>([]);

  const fetch = useCallback(() => run(getRecordatorios), [run]);

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh: fetch,
  };
};

// ---------------------------------------------------------------------------
// useNotificaciones
// ---------------------------------------------------------------------------

export const useNotificaciones = () => {
  const [state, run, setData] = useAsyncState<NotificacionResponse[]>([]);

  const fetch = useCallback(() => run(getNotificaciones), [run]);

  const markRead = useCallback(
    async (notification_id: string) => {
      const updated = await markNotificacionRead(notification_id);
      setData((state.data ?? []).map(n => n.id === notification_id ? updated : n));
    },
    [state.data, setData],
  );

  // Cantidad de notificaciones no leídas — útil para badges
  const unreadCount = (state.data ?? []).filter(
    n => n.estado_entrega !== 'leida'
  ).length;

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data ?? [],
    unreadCount,
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    markRead,
  };
};

// ---------------------------------------------------------------------------
// useEmergencyCall
// ---------------------------------------------------------------------------

export const useEmergencyCall = () => {
  const [state, run] = useAsyncState<LlamadaEmergenciaResponse[]>([]);

  const fetch = useCallback(() => run(getHistorialLlamadas), [run]);

  const register = useCallback(
    async (payload: LlamadaEmergenciaCreate): Promise<LlamadaEmergenciaResponse> => {
      const result = await createLlamadaEmergencia(payload);
      await fetch();
      return result;
    },
    [fetch],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return {
    history: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    register,
  };
};