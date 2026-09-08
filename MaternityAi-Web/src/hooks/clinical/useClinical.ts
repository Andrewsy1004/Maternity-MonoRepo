import { useState, useCallback, useEffect } from 'react';
import {
  getDashboard,
  getAlarmSigns,
  getRecommendations,
  reportSymptom,
  getSymptoms,
  registerVitals,
  getVitals,
  getRiskAssessment,
  getRiskHistory,
  registerExam,
  getExams,
  getExamById,
  registerEcography,
  getEcography,
  getEcographyById,
  registerVaccination,
  getVaccination,
  registerMicronutrient,
  getMicronutrients,
  registerReferral,
  getReferrals,
  updateReferral,
  registerPrenatalControl,
  getPrenatalControls,
  getPrenatalControlById,
  getPrenatalAdherence,
  getDailyQuestions,
  submitDailyAnswers,
  getDailyQuestionsHistory,
  registerFetalMovement,
  getFetalMovements,
  getBirthPlan,
  getNearestIps,
  getExamsHistory,
  getVitalsHistory,
  getRisksHistory,
  getControlsHistory,
  getDailyQuestionsHistoryLongitudinal,
  type DashboardResponse,
  type SignoAlarmaResponse,
  type RecomendacionResponse,
  type SintomaCreate,
  type SintomaResponse,
  type SignosVitalesCreate,
  type SignosVitalesResponse,
  type ClasificacionRiesgoResponse,
  type ExamenCreate,
  type ExamenResponse,
  type EcografiaCreate,
  type EcografiaResponse,
  type VacunacionCreate,
  type VacunacionResponse,
  type MicronutrienteCreate,
  type MicronutrienteResponse,
  type RemisionCreate,
  type RemisionUpdate,
  type RemisionResponse,
  type ControlPrenatalCreate,
  type ControlPrenatalResponse,
  type AdherenciaResponse,
  type PreguntaSegResponse,
  type RespuestasRequest,
  type RespuestaResponse,
  type MovimientoFetalCreate,
  type MovimientoFetalResponse,
  type BirthPlanResponse,
  type IpsCercanaResponse,
} from '../../services/clinicalService';

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
// useDashboard
// ---------------------------------------------------------------------------

export const useDashboard = (module_id?: number) => {
  const [state, run] = useAsyncState<DashboardResponse>();

  const fetch = useCallback(
    () => run(() => getDashboard(module_id)),
    [run, module_id],
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
// useAlarmSigns
// ---------------------------------------------------------------------------

export const useAlarmSigns = (module_id?: number) => {
  const [state, run] = useAsyncState<SignoAlarmaResponse[]>([]);

  const fetch = useCallback(
    () => run(() => getAlarmSigns(module_id)),
    [run, module_id],
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
// useRecommendations
// ---------------------------------------------------------------------------

export const useRecommendations = () => {
  const [state, run] = useAsyncState<RecomendacionResponse>();

  const fetch = useCallback(() => run(getRecommendations), [run]);

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refresh: fetch,
  };
};

// ---------------------------------------------------------------------------
// useSymptoms
// ---------------------------------------------------------------------------

export const useSymptoms = () => {
  const [state, run] = useAsyncState<SintomaResponse[]>([]);

  const fetch = useCallback(() => run(getSymptoms), [run]);

  const report = useCallback(
    async (payload: SintomaCreate) => {
      await run(() => reportSymptom(payload).then(() => getSymptoms()));
    },
    [run],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    report,
  };
};

// ---------------------------------------------------------------------------
// useVitals
// ---------------------------------------------------------------------------

export const useVitals = () => {
  const [state, run] = useAsyncState<SignosVitalesResponse[]>([]);

  const fetch = useCallback(() => run(getVitals), [run]);

  const register = useCallback(
    async (payload: SignosVitalesCreate) => {
      await run(() => registerVitals(payload).then(() => getVitals()));
    },
    [run],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    register,
  };
};

// ---------------------------------------------------------------------------
// useRiskAssessment
// ---------------------------------------------------------------------------

export const useRiskAssessment = () => {
  const [current, runCurrent] = useAsyncState<ClasificacionRiesgoResponse>();
  const [history, runHistory] = useAsyncState<ClasificacionRiesgoResponse[]>([]);

  const fetchCurrent = useCallback(() => runCurrent(getRiskAssessment), [runCurrent]);
  const fetchHistory = useCallback(() => runHistory(getRiskHistory), [runHistory]);

  useEffect(() => {
    fetchCurrent();
    fetchHistory();
  }, [fetchCurrent, fetchHistory]);

  return {
    current: current.data,
    history: history.data ?? [],
    loading: current.loading || history.loading,
    error: current.error ?? history.error,
    refresh: () => { fetchCurrent(); fetchHistory(); },
  };
};

// ---------------------------------------------------------------------------
// useExams
// ---------------------------------------------------------------------------

export const useExams = () => {
  const [state, run] = useAsyncState<ExamenResponse[]>([]);

  const fetch = useCallback(() => run(getExams), [run]);

  const register = useCallback(
    async (payload: ExamenCreate) => {
      await run(() => registerExam(payload).then(() => getExams()));
    },
    [run],
  );

  const getById = useCallback(
    (id: string) => getExamById(id),
    [],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    register,
    getById,
  };
};

// ---------------------------------------------------------------------------
// useEcography
// ---------------------------------------------------------------------------

export const useEcography = () => {
  const [state, run] = useAsyncState<EcografiaResponse[]>([]);

  const fetch = useCallback(() => run(getEcography), [run]);

  const register = useCallback(
    async (payload: EcografiaCreate) => {
      await run(() => registerEcography(payload).then(() => getEcography()));
    },
    [run],
  );

  const getById = useCallback(
    (id: string) => getEcographyById(id),
    [],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    register,
    getById,
  };
};

// ---------------------------------------------------------------------------
// useVaccination
// ---------------------------------------------------------------------------

export const useVaccination = () => {
  const [state, run] = useAsyncState<VacunacionResponse[]>([]);

  const fetch = useCallback(() => run(getVaccination), [run]);

  const register = useCallback(
    async (payload: VacunacionCreate) => {
      await run(() => registerVaccination(payload).then(() => getVaccination()));
    },
    [run],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    register,
  };
};

// ---------------------------------------------------------------------------
// useMicronutrients
// ---------------------------------------------------------------------------

export const useMicronutrients = () => {
  const [state, run] = useAsyncState<MicronutrienteResponse[]>([]);

  const fetch = useCallback(() => run(getMicronutrients), [run]);

  const register = useCallback(
    async (payload: MicronutrienteCreate) => {
      await run(() => registerMicronutrient(payload).then(() => getMicronutrients()));
    },
    [run],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    register,
  };
};

// ---------------------------------------------------------------------------
// useReferrals
// ---------------------------------------------------------------------------

export const useReferrals = () => {
  const [state, run] = useAsyncState<RemisionResponse[]>([]);

  const fetch = useCallback(() => run(getReferrals), [run]);

  const register = useCallback(
    async (payload: RemisionCreate) => {
      await run(() => registerReferral(payload).then(() => getReferrals()));
    },
    [run],
  );

  const update = useCallback(
    async (id: string, payload: RemisionUpdate) => {
      await run(() => updateReferral(id, payload).then(() => getReferrals()));
    },
    [run],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    register,
    update,
  };
};

// ---------------------------------------------------------------------------
// usePrenatalControls
// ---------------------------------------------------------------------------

export const usePrenatalControls = () => {
  const [state, run] = useAsyncState<ControlPrenatalResponse[]>([]);
  const [adherencia, runAdherencia] = useAsyncState<AdherenciaResponse>();

  const fetch = useCallback(() => {
    run(getPrenatalControls);
    runAdherencia(getPrenatalAdherence);
  }, [run, runAdherencia]);

  const register = useCallback(
    async (payload: ControlPrenatalCreate) => {
      await run(() => registerPrenatalControl(payload).then(() => getPrenatalControls()));
      await runAdherencia(getPrenatalAdherence);
    },
    [run, runAdherencia],
  );

  const getById = useCallback(
    (id: string) => getPrenatalControlById(id),
    [],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data ?? [],
    adherencia: adherencia.data,
    loading: state.loading || adherencia.loading,
    error: state.error ?? adherencia.error,
    refresh: fetch,
    register,
    getById,
  };
};

// ---------------------------------------------------------------------------
// useDailyQuestions
// ---------------------------------------------------------------------------

export const useDailyQuestions = (module_id?: number) => {
  const [questions, runQuestions] = useAsyncState<PreguntaSegResponse[]>([]);
  const [answers, runAnswers] = useAsyncState<RespuestaResponse[]>([]);

  const fetchQuestions = useCallback(
    () => runQuestions(() => getDailyQuestions(module_id)),
    [runQuestions, module_id],
  );

  const fetchHistory = useCallback(
    () => runAnswers(getDailyQuestionsHistory),
    [runAnswers],
  );

  const submit = useCallback(
    async (payload: RespuestasRequest) => {
      await runAnswers(() => submitDailyAnswers(payload));
    },
    [runAnswers],
  );

  useEffect(() => {
    fetchQuestions();
    fetchHistory();
  }, [fetchQuestions, fetchHistory]);

  return {
    questions: questions.data ?? [],
    history: answers.data ?? [],
    loading: questions.loading || answers.loading,
    error: questions.error ?? answers.error,
    refresh: () => { fetchQuestions(); fetchHistory(); },
    submit,
  };
};

// ---------------------------------------------------------------------------
// useFetalMovements
// ---------------------------------------------------------------------------

export const useFetalMovements = () => {
  const [state, run] = useAsyncState<MovimientoFetalResponse[]>([]);

  const fetch = useCallback(() => run(getFetalMovements), [run]);

  const register = useCallback(
    async (payload: MovimientoFetalCreate) => {
      await run(() => registerFetalMovement(payload).then(() => getFetalMovements()));
    },
    [run],
  );

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data ?? [],
    loading: state.loading,
    error: state.error,
    refresh: fetch,
    register,
  };
};

// ---------------------------------------------------------------------------
// useBirthPlan
// ---------------------------------------------------------------------------

export const useBirthPlan = () => {
  const [state, run] = useAsyncState<BirthPlanResponse>();

  const fetch = useCallback(() => run(getBirthPlan), [run]);

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refresh: fetch,
  };
};

// ---------------------------------------------------------------------------
// useNearestIps
// ---------------------------------------------------------------------------

export const useNearestIps = () => {
  const [state, run] = useAsyncState<IpsCercanaResponse>();

  const fetch = useCallback(() => run(getNearestIps), [run]);

  useEffect(() => { fetch(); }, [fetch]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refresh: fetch,
  };
};

// ---------------------------------------------------------------------------
// useClinicalHistory — vistas longitudinales agrupadas
// ---------------------------------------------------------------------------

export const useClinicalHistory = () => {
  const [exams, runExams] = useAsyncState<ExamenResponse[]>([]);
  const [vitals, runVitals] = useAsyncState<SignosVitalesResponse[]>([]);
  const [risks, runRisks] = useAsyncState<ClasificacionRiesgoResponse[]>([]);
  const [controls, runControls] = useAsyncState<ControlPrenatalResponse[]>([]);
  const [dailyQs, runDailyQs] = useAsyncState<RespuestaResponse[]>([]);

  const fetchAll = useCallback(() => {
    runExams(getExamsHistory);
    runVitals(getVitalsHistory);
    runRisks(getRisksHistory);
    runControls(getControlsHistory);
    runDailyQs(getDailyQuestionsHistoryLongitudinal);
  }, [runExams, runVitals, runRisks, runControls, runDailyQs]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return {
    exams: exams.data ?? [],
    vitals: vitals.data ?? [],
    risks: risks.data ?? [],
    controls: controls.data ?? [],
    dailyQuestions: dailyQs.data ?? [],
    loading: exams.loading || vitals.loading || risks.loading || controls.loading || dailyQs.loading,
    error: exams.error ?? vitals.error ?? risks.error ?? controls.error ?? dailyQs.error,
    refresh: fetchAll,
  };
};