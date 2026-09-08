import { useState, useCallback, useEffect } from 'react';
import {
  getContentByModule,
  getCategories,
  getContentsByCategory,
  getContentById,
  getProgress,
  markContentCompleted,
  getChecklist,
  updateChecklistItem,
  createTamizaje,
  getTamizajesHistory,
  getMentalHealthRecommendations,
  getAutoevaluaciones,
  createAutoevaluacion,
  type ContenidoEducativoResponse,
  type ContenidoEducativoDetalleResponse,
  type CategoriaResponse,
  type ProgresoResponse,
  type ChecklistResponse,
  type ChecklistItemResponse,
  type CompletadoUpdate,
  type TamizajeCreate,
  type TamizajeResponse,
  type RecommendationsResponse,
  type AutoevaluacionCreate,
  type AutoevaluacionResponse,
  type AutoevaluacionDetalleResponse,
} from '../../services/m5Service';
import { getActiveModule, type ActiveModule } from '../../services/m0Service';

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
// useEducationalContent
// ---------------------------------------------------------------------------

export const useEducationalContent = () => {
  const [state, run] = useAsyncState<ContenidoEducativoResponse[]>([]);
  const [activeModule, setActiveModule] = useState<ActiveModule | null>(null);

  const fetch = useCallback(async () => {
    // 1. Sincronizar módulo activo desde FUM (actualiza modulo_activo_id en BD)
    let moduloId: number | undefined;
    try {
      const modulo = await getActiveModule();
      setActiveModule(modulo);
      moduloId = modulo.modulo_id;
    } catch {
      // Si falla, igual intentamos traer el contenido sin filtro de módulo
    }
    // 2. Traer contenido filtrado por el módulo activo real (pasado explícitamente)
    await run(() => getContentByModule(moduloId));
  }, [run]);

  useEffect(() => {
    fetch();
    const handleModuleChange = () => {
      fetch();
    };
    window.addEventListener('maternity-active-module-changed', handleModuleChange);
    return () => {
      window.removeEventListener('maternity-active-module-changed', handleModuleChange);
    };
  }, [fetch]);

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    activeModule,
    refresh: fetch,
  };
};

// ---------------------------------------------------------------------------
// useContentDetail
// ---------------------------------------------------------------------------

export const useContentDetail = (content_id: number) => {
  const [state, run] = useAsyncState<ContenidoEducativoDetalleResponse>();

  const fetch = useCallback(
    () => run(() => getContentById(content_id)),
    [run, content_id],
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
// useCategories
// ---------------------------------------------------------------------------

export const useCategories = () => {
  const [state, run] = useAsyncState<CategoriaResponse[]>([]);

  const fetch = useCallback(() => run(getCategories), [run]);

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh: fetch,
  };
};

// ---------------------------------------------------------------------------
// useContentsByCategory
// ---------------------------------------------------------------------------

export const useContentsByCategory = (category_id: number) => {
  const [state, run] = useAsyncState<ContenidoEducativoResponse[]>([]);

  const fetch = useCallback(
    () => run(() => getContentsByCategory(category_id)),
    [run, category_id],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh: fetch,
  };
};

// ---------------------------------------------------------------------------
// useProgress
// ---------------------------------------------------------------------------

export const useProgress = () => {
  const [state, run] = useAsyncState<ProgresoResponse[]>([]);

  const fetch = useCallback(() => run(getProgress), [run]);

  const markCompleted = useCallback(
    async (content_id: number) => {
      await run(() => markContentCompleted(content_id).then(() => getProgress()));
    },
    [run],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    markCompleted,
  };
};

// ---------------------------------------------------------------------------
// useChecklist
// ---------------------------------------------------------------------------

export const useChecklist = () => {
  const [state, run, setData] = useAsyncState<ChecklistResponse>();

  const fetch = useCallback(() => run(getChecklist), [run]);

  const updateItem = useCallback(
    async (item_id: number, payload: CompletadoUpdate) => {
      const updated: ChecklistItemResponse = await updateChecklistItem(item_id, payload);
      // Actualiza optimistamente el ítem dentro del checklist
      setData({
        ...(state.data!),
        completados: state.data
          ? state.data.items.filter(i =>
              i.id === item_id ? payload.completado : i.completado
            ).length
          : 0,
        items: (state.data?.items ?? []).map(i =>
          i.id === item_id ? updated : i
        ),
      });
    },
    [state.data, setData],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    updateItem,
  };
};

// ---------------------------------------------------------------------------
// useMentalHealthScreening
// ---------------------------------------------------------------------------

export const useMentalHealthScreening = () => {
  const [history, runHistory] = useAsyncState<TamizajeResponse[]>([]);
  const [recommendations, runRecommendations] = useAsyncState<RecommendationsResponse[]>([]);

  const fetchAll = useCallback(() => {
    runHistory(getTamizajesHistory);
    runRecommendations(getMentalHealthRecommendations);
  }, [runHistory, runRecommendations]);

  const create = useCallback(
    async (payload: TamizajeCreate) => {
      await runHistory(() => createTamizaje(payload).then(() => getTamizajesHistory()));
      await runRecommendations(getMentalHealthRecommendations);
    },
    [runHistory, runRecommendations],
  );

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return {
    history: history.data ?? [],
    recommendations: recommendations.data ?? [],
    loading: history.loading || recommendations.loading,
    error: history.error ?? recommendations.error,
    refresh: fetchAll,
    create,
  };
};

// ---------------------------------------------------------------------------
// useSelfAssessment
// ---------------------------------------------------------------------------

export const useSelfAssessment = () => {
  const [state, run] = useAsyncState<AutoevaluacionDetalleResponse[]>([]);

  const fetch = useCallback(() => run(getAutoevaluaciones), [run]);

  const create = useCallback(
    async (payload: AutoevaluacionCreate): Promise<AutoevaluacionResponse> => {
      const result = await createAutoevaluacion(payload);
      await fetch();
      return result;
    },
    [fetch],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    create,
  };
};