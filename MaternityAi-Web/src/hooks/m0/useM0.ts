import { useState, useCallback, useEffect } from 'react';
import {
  registerGestante,
  getClinicalProfile,
  updateClinicalProfile,
  getObstetricFormula,
  updateObstetricFormula,
  getPathologicalHistory,
  createPathologicalHistory,
  updatePathologicalHistory,
  deletePathologicalHistory,
  getConsent,
  registerConsent,
  revokeConsent,
  getConsentDocument,
  getGestationalAge,
  getActiveModule,
  getModuleHistory,
  updateSecurityQuestion,
  deleteAccount,
  type GestanteRegisterRequest,
  type GestanteRegisterResponse,
  type ClinicalProfile,
  type ObstetricFormula,
  type PathologicalHistory,
  type PathologicalHistoryRequest,
  type ConsentRequest,
  type ConsentResponse,
  type GestationalAge,
  type ActiveModule,
  type ModuleHistoryEntry,
  type SecurityQuestionRequest,
  type DetailResponse,
} from '../../services/m0Service';

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
// useRegisterGestante
// ---------------------------------------------------------------------------

export const useRegisterGestante = () => {
  const [state, run] = useAsyncState<GestanteRegisterResponse>();

  const register = useCallback(
    (data: GestanteRegisterRequest) => run(() => registerGestante(data)),
    [run],
  );

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    register,
  };
};

// ---------------------------------------------------------------------------
// useClinicalProfile
// ---------------------------------------------------------------------------

export const useClinicalProfile = () => {
  const [state, run] = useAsyncState<ClinicalProfile>();

  const fetch = useCallback(() => run(getClinicalProfile), [run]);

  const update = useCallback(
    async (payload: Partial<ClinicalProfile>) => {
      await run(() => updateClinicalProfile(payload));
    },
    [run],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    update,
  };
};

// ---------------------------------------------------------------------------
// useObstetricFormula
// ---------------------------------------------------------------------------

export const useObstetricFormula = () => {
  const [state, run] = useAsyncState<ObstetricFormula>();

  const fetch = useCallback(() => run(getObstetricFormula), [run]);

  const update = useCallback(
    (payload: ObstetricFormula) => run(() => updateObstetricFormula(payload)),
    [run],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    update,
  };
};

// ---------------------------------------------------------------------------
// usePathologicalHistory
// ---------------------------------------------------------------------------

export const usePathologicalHistory = () => {
  const [state, run, setData] = useAsyncState<PathologicalHistory[]>([]);

  const fetch = useCallback(() => run(getPathologicalHistory), [run]);

  const create = useCallback(
    async (payload: PathologicalHistoryRequest) => {
      await run(() =>
        createPathologicalHistory(payload).then(async () => {
          // Refresca la lista completa tras crear
          return getPathologicalHistory();
        }),
      );
    },
    [run],
  );

  const update = useCallback(
    async (id: string, payload: Partial<PathologicalHistoryRequest>) => {
      await run(() =>
        updatePathologicalHistory(id, payload).then(() => getPathologicalHistory()),
      );
    },
    [run],
  );

  const remove = useCallback(
    async (id: string) => {
      await deletePathologicalHistory(id);
      setData((state.data ?? []).filter(item => item.id !== id));
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
    update,
    remove,
  };
};

// ---------------------------------------------------------------------------
// useConsent
// ---------------------------------------------------------------------------

export const useConsent = () => {
  const [state, run] = useAsyncState<ConsentResponse>();

  const fetch = useCallback(() => run(getConsent), [run]);

  const register = useCallback(
    (payload: ConsentRequest) => run(() => registerConsent(payload)),
    [run],
  );

  const revoke = useCallback(
    () => run(() => revokeConsent().then(() => getConsent())),
    [run],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    register,
    revoke,
  };
};

// ---------------------------------------------------------------------------
// useConsentDocument
// ---------------------------------------------------------------------------

export const useConsentDocument = () => {
  const [state, run] = useAsyncState<unknown>();

  const fetch = useCallback(() => run(getConsentDocument), [run]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    fetch,
  };
};

// ---------------------------------------------------------------------------
// useGestationalAge
// ---------------------------------------------------------------------------

export const useGestationalAge = () => {
  const [state, run] = useAsyncState<GestationalAge>();

  const fetch = useCallback(() => run(getGestationalAge), [run]);

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refresh: fetch,
  };
};

// ---------------------------------------------------------------------------
// useActiveModule
// ---------------------------------------------------------------------------

export const useActiveModule = () => {
  const [state, run] = useAsyncState<ActiveModule>();

  const fetch = useCallback(() => run(getActiveModule), [run]);

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refresh: fetch,
  };
};

// ---------------------------------------------------------------------------
// useModuleHistory
// ---------------------------------------------------------------------------

export const useModuleHistory = () => {
  const [state, run] = useAsyncState<ModuleHistoryEntry[]>([]);

  const fetch = useCallback(() => run(getModuleHistory), [run]);

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh: fetch,
  };
};

// ---------------------------------------------------------------------------
// useSecurityQuestion
// ---------------------------------------------------------------------------

export const useSecurityQuestion = () => {
  const [state, run] = useAsyncState<DetailResponse>();

  const update = useCallback(
    (payload: SecurityQuestionRequest) => run(() => updateSecurityQuestion(payload)),
    [run],
  );

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    update,
  };
};

// ---------------------------------------------------------------------------
// useDeleteAccount
// ---------------------------------------------------------------------------

export const useDeleteAccount = () => {
  const [state, run] = useAsyncState<DetailResponse>();

  const deleteAcc = useCallback(
    () => run(deleteAccount),
    [run],
  );

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    deleteAccount: deleteAcc,
  };
};