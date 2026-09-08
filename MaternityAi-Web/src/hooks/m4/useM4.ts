import { useState, useCallback, useEffect } from 'react';
import {
  createBirthRecord,
  getBirthRecord,
  updateBirthRecord,
  createNewborn,
  getNewborns,
  createPostpartum,
  getPostpartum,
  getPostpartumEvolution,
  createContraception,
  getContraception,
  type BirthRecordCreate,
  type BirthRecordResponse,
  type BirthRecordUpdate,
  type NewbornCreate,
  type NewbornResponse,
  type PostpartumCreate,
  type PostpartumResponse,
  type PostpartumEvolutionResponse,
  type ContraceptionCreate,
  type ContraceptionResponse,
} from '../../services/m4Service';

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
  (data: T | null) => void,
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

  const setData = useCallback((data: T | null) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  return [state, run, setData];
}

// ---------------------------------------------------------------------------
// useBirthRecord
// ---------------------------------------------------------------------------

export const useBirthRecord = (enabled = true) => {
  const [state, run] = useAsyncState<BirthRecordResponse | null>(null);

  const fetch = useCallback(() => {
    if (!enabled) return;
    run(getBirthRecord);
  }, [run, enabled]);

  const create = useCallback(
    (payload: BirthRecordCreate) => run(() => createBirthRecord(payload)),
    [run]
  );

  const update = useCallback(
    (payload: BirthRecordUpdate) => run(() => updateBirthRecord(payload)),
    [run]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    create,
    update,
  };
};

// ---------------------------------------------------------------------------
// useNewborns
// ---------------------------------------------------------------------------

export const useNewborns = (enabled = true) => {
  const [state, run] = useAsyncState<NewbornResponse[]>([]);

  const fetch = useCallback(() => {
    if (!enabled) return;
    run(getNewborns);
  }, [run, enabled]);

  const create = useCallback(
    async (payload: NewbornCreate) => {
      await run(async () => {
        await createNewborn(payload);
        return getNewborns();
      });
    },
    [run]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    create,
  };
};

// ---------------------------------------------------------------------------
// usePostpartum
// ---------------------------------------------------------------------------

export const usePostpartum = () => {
  const [evolution, runEvolution] = useAsyncState<PostpartumEvolutionResponse>();
  const [list, runList] = useAsyncState<PostpartumResponse[]>([]);

  const fetchAll = useCallback(() => {
    runEvolution(getPostpartumEvolution);
    runList(getPostpartum);
  }, [runEvolution, runList]);

  const create = useCallback(
    async (payload: PostpartumCreate) => {
      await runList(async () => {
        await createPostpartum(payload);
        // Desencadena actualización de evolución clínico-mental posparto también
        runEvolution(getPostpartumEvolution);
        return getPostpartum();
      });
    },
    [runList, runEvolution]
  );

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    evolution: evolution.data,
    list: list.data ?? [],
    loading: evolution.loading || list.loading,
    error: evolution.error ?? list.error,
    refresh: fetchAll,
    create,
  };
};

// ---------------------------------------------------------------------------
// useContraception
// ---------------------------------------------------------------------------

export const useContraception = () => {
  const [state, run] = useAsyncState<ContraceptionResponse[]>([]);

  const fetch = useCallback(() => run(getContraception), [run]);

  const create = useCallback(
    async (payload: ContraceptionCreate) => {
      await run(async () => {
        await createContraception(payload);
        return getContraception();
      });
    },
    [run]
  );

  useEffect(() => {
    fetch();
  }, [fetch]);

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    create,
  };
};
