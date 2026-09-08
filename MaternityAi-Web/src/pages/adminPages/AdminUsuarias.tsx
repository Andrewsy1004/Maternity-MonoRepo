import { useState, useEffect, useCallback } from 'react';
import { HeaderActividad } from '../../components/Headers/HeaderActividad/HeaderActividad';
import styles from '../../components/admin/AdminUsuarias.module.css';
import modalStyles from './StaffModal.module.css';
import { Modal } from '../../components/Modal';
import { FormRegister } from '../../components/info/contenteregister/FormRegister';
import { useAuth } from '../../context/AuthContext';
import {
  createStaffUser,
  getRoles,
  getStaffUsers,
  updateStaffStatus,
  updateStaffUser,
  getGestantes,
  getGestanteExams,
  getGestanteAlarmSigns,
  getGestanteDailyQuestionsHistory,
  createGestanteEmergencyCall,
  getGestanteChecklist,
  createGestanteExam,
  exportGestantes,
  exportIndicators,
  getGestanteVitals,
  getPendingActivations,
  resolveActivationRequest,
  type GestanteResponse,
  type RoleOption,
  type ExamenResponse,
  type AlertaAdminResponse,
  type RespuestaConPreguntaResponse,
  type LlamadaEmergenciaCreate,
  type GestanteChecklistItem,
  type SignosVitalesResponse,
  type SolicitudActivacionResponse,
} from '../../services/adminService';
import { getSecurityQuestion } from '../../services/authService';
import {
  getObstetricFormula,
  updateObstetricFormula,
  getPathologicalHistory,
  createPathologicalHistory,
  updatePathologicalHistory,
  deletePathologicalHistory,
  type ObstetricFormula as IObstetricFormula,
  type PathologicalHistory as IPathologicalHistory,
} from '../../services/m0Service';
import { calculateCurrentWeeks, getFaseOrTrimestre } from '../../utils/gestationalAgeUtils';
import { downloadBlob, buildExportFilename } from '../../utils/exportUtils';

// ─── Toast interno ────────────────────────────────────────────────────────────
interface InternalToast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}
let _toastId = 0;

// ─── Modal de confirmación custom ────────────────────────────────────────────
interface ConfirmState {
  open: boolean;
  message: string;
  onConfirm: () => void;
}

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const BellIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const ClockIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const AlertTriangleIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CheckCircleIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const XCircleIcon = ({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

// ─── Modal de creación de staff ──────────────────────────────────────────────

const EMPTY_FORM: any = {
  nombre: '',
  email: '',
  password: '',
  rol_id: 2,
};

const StaffCreateModal = ({ onClose }: { onClose: () => void }) => {
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
      getRoles()
      .then((data) => {
        // Solo mostrar Admin, Clínico y Hospital en el selector de staff
        setRoles(data.filter((r) => r.nombre !== 'gestante'));
      })
      .catch(() => {
        // Fallback con roles estáticos si el backend no responde
        setRoles([
          { id: 2, nombre: 'clinico' },
          { id: 3, nombre: 'admin' },
          { id: 4, nombre: 'hospital' },
        ]);
      });
  }, []);

  const handleChange = (
    key: string,
    value: string | number | null
  ) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Por favor completa todos los campos obligatorios.');
      return;
    }
    setIsLoading(true);
    try {
      await createStaffUser(form);
      setSuccess(true);
      setTimeout(() => {
        setForm(EMPTY_FORM);
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      const backendError = err.response?.data?.detail;
      setError(typeof backendError === 'string' ? backendError : 'No se pudo crear el usuario. Verifica los datos e intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  const rolSeleccionado = roles.find((r) => r.id === form.rol_id);

  return (
    <form onSubmit={handleSubmit} className={modalStyles.form}>
      {success && (
        <div className={modalStyles.successBanner}>
          ✅ Usuario creado exitosamente
        </div>
      )}

      <div className={modalStyles.field}>
        <label className={modalStyles.label}>Nombre completo *</label>
        <input
          className={modalStyles.input}
          type="text"
          placeholder="Ej. Dra. Ana García"
          value={form.nombre}
          onChange={(e) => handleChange('nombre', e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className={modalStyles.field}>
        <label className={modalStyles.label}>Correo electrónico *</label>
        <input
          className={modalStyles.input}
          type="email"
          placeholder="correo@hospital.com"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className={modalStyles.field}>
        <label className={modalStyles.label}>Contraseña *</label>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            className={modalStyles.input}
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            value={form.password}
            onChange={(e) => handleChange('password', e.target.value)}
            disabled={isLoading}
            style={{ width: '100%', paddingRight: '40px', margin: 0 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            style={{
              position: 'absolute',
              right: '12px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#888',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          >
            {showPassword ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        </div>
      </div>

      <div className={modalStyles.field}>
        <label className={modalStyles.label}>Rol *</label>
        <select
          className={modalStyles.select}
          value={form.rol_id}
          onChange={(e) => handleChange('rol_id', Number(e.target.value))}
          disabled={isLoading}
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre.charAt(0).toUpperCase() + r.nombre.slice(1)}
            </option>
          ))}
        </select>
        {rolSeleccionado && (
          <span className={modalStyles.rolBadge}>
            {rolSeleccionado.nombre === 'admin' && '🛡️ Administrador del sistema'}
            {rolSeleccionado.nombre === 'clinico' && '🩺 Profesional de salud'}
            {rolSeleccionado.nombre === 'hospital' && '🏥 Personal Hospitalario (Alertas)'}
          </span>
        )}
      </div>

      {error && (
        <p className={modalStyles.error}>{error}</p>
      )}

      <div className={modalStyles.actions}>
        <button
          type="button"
          className={modalStyles.cancelBtn}
          onClick={onClose}
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className={modalStyles.submitBtn}
          disabled={isLoading}
        >
          {isLoading ? 'Creando...' : 'Crear Usuario'}
        </button>
      </div>
    </form>
  );
};

const getRiesgoColor = (riesgo?: string | null) => {
  if (!riesgo) return '#CA436E';
  const r = riesgo.toLowerCase();
  if (r.includes('rojo') || r.includes('alto')) return '#dc2626'; // rojo
  if (r.includes('amarillo') || r.includes('medio')) return '#d97706'; // amarillo/ámbar
  if (r.includes('verde') || r.includes('bajo')) return '#16a34a'; // verde
  return '#CA436E';
};

// ─── Página principal ─────────────────────────────────────────────────────────

export const AdminUsuarias = () => {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';

  const [busqueda, setBusqueda] = useState('');
  const [selPaciente, setSelPaciente] = useState(() => {
    return localStorage.getItem('selected_gestante_gmi') || 'XYZ1002';
  });
  const [gestantes, setGestantes] = useState<GestanteResponse[]>([]);
  const [paginaMaternas, setPaginaMaternas] = useState(1);
  const MATERNAS_POR_PAGINA = 10;

  // --- Estados de Activación de Login ---
  const [loginStatusMap, setLoginStatusMap] = useState<Record<string, boolean>>({});
  const [pendingActivations, setPendingActivations] = useState<SolicitudActivacionResponse[]>([]);
  const [showActivationsModal, setShowActivationsModal] = useState(false);
  const [isResolvingId, setIsResolvingId] = useState<string | null>(null);

  // Cargar solicitudes pendientes al iniciar
  const fetchPendingActivations = async () => {
    try {
      const data = await getPendingActivations();
      setPendingActivations(data);
    } catch (e) {
      console.warn("No se pudieron cargar solicitudes de activación pendientes:", e);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPendingActivations();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selPaciente && selPaciente !== 'XYZ1002') {
      localStorage.setItem('selected_gestante_gmi', selPaciente);
      const g = gestantes.find(p => p.codigo_gmi === selPaciente);
      if (g) {
        localStorage.setItem('selected_gestante_id', g.id);
      }
    }
  }, [selPaciente, gestantes]);
  const [activeList, setActiveList] = useState<'maternas' | 'staff'>('maternas');

  // --- Estados de Fórmula Obstétrica ---
  const [formula, setFormula] = useState<IObstetricFormula | null>(null);
  const [editingFormula, setEditingFormula] = useState(false);
  const [formulaForm, setFormulaForm] = useState<IObstetricFormula>({
    gestaciones: 0,
    partos: 0,
    cesareas: 0,
    abortos: 0,
    vivos: 0,
    mortinatos: 0
  });

  // --- Estados de Antecedentes Patológicos ---
  const [antecedentes, setAntecedentes] = useState<IPathologicalHistory[]>([]);
  const [loadingClinico, setLoadingClinico] = useState(false);
  const [editingAntecedenteId, setEditingAntecedenteId] = useState<string | null>(null);
  const [antecedenteForm, setAntecedenteForm] = useState({
    tipo_condicion: '',
    descripcion: '',
    fecha_diagnostico: '',
    controlada: true,
    tratamiento_actual: ''
  });

  // --- Efecto para Cargar Datos Clínicos ---
  useEffect(() => {
    if (activeList === 'maternas' && selPaciente && selPaciente !== 'XYZ1002') {
      const fetchClinicalData = async () => {
        setLoadingClinico(true);
        try {
          const [formulaData, antecedentesData] = await Promise.all([
            getObstetricFormula(),
            getPathologicalHistory()
          ]);
          setFormula(formulaData);
          setAntecedentes(antecedentesData);
        } catch (error) {
          console.error("Error fetching clinical patient details:", error);
          setFormula(null);
          setAntecedentes([]);
        } finally {
          setLoadingClinico(false);
        }
      };
      fetchClinicalData();
    }
  }, [selPaciente, activeList]);

  // --- Handlers de Acciones ---
  const handleSaveFormula = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await updateObstetricFormula(formulaForm);
      setFormula(updated);
      setEditingFormula(false);
      addToast("Fórmula obstétrica actualizada correctamente.", "success");
    } catch (error: any) {
      addToast(error.response?.data?.detail || "Error al actualizar la fórmula obstétrica", "error");
    }
  };

  const handleSaveAntecedente = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAntecedenteId === 'new') {
        const nuevo = await createPathologicalHistory({
          tipo_condicion: antecedenteForm.tipo_condicion,
          descripcion: antecedenteForm.descripcion || null,
          fecha_diagnostico: antecedenteForm.fecha_diagnostico || null,
          controlada: antecedenteForm.controlada,
          tratamiento_actual: antecedenteForm.tratamiento_actual || null
        });
        setAntecedentes(prev => [...prev, nuevo]);
        addToast("Antecedente patológico creado correctamente.", "success");
      } else if (editingAntecedenteId) {
        const modificado = await updatePathologicalHistory(editingAntecedenteId, {
          tipo_condicion: antecedenteForm.tipo_condicion,
          descripcion: antecedenteForm.descripcion || null,
          fecha_diagnostico: antecedenteForm.fecha_diagnostico || null,
          controlada: antecedenteForm.controlada,
          tratamiento_actual: antecedenteForm.tratamiento_actual || null
        });
        setAntecedentes(prev => prev.map(a => a.id === editingAntecedenteId ? modificado : a));
        addToast("Antecedente patológico actualizado correctamente.", "success");
      }
      setEditingAntecedenteId(null);
    } catch (error: any) {
      addToast(error.response?.data?.detail || "Error al guardar el antecedente patológico", "error");
    }
  };

  const handleDeleteAntecedente = (id: string) => {
    showConfirm("¿Está seguro de que desea eliminar este antecedente patológico?", async () => {
      try {
        await deletePathologicalHistory(id);
        setAntecedentes(prev => prev.filter(a => a.id !== id));
        addToast("Antecedente eliminado correctamente.", "success");
      } catch (error: any) {
        addToast(error.response?.data?.detail || "Error al eliminar el antecedente", "error");
      }
    });
  };

  // Controla qué modal está abierto: 'gestante' | 'staff' | null
  const [modalOpen, setModalOpen] = useState<'gestante' | 'staff' | null>(null);

  // ── Panel médico (exámenes, alertas, cuestionario, emergencia) ──
  const [exams, setExams] = useState<ExamenResponse[]>([]);
  const [vitals, setVitals] = useState<SignosVitalesResponse[]>([]);
  const [alarmSigns, setAlarmSigns] = useState<AlertaAdminResponse[]>([]);
  const [dailyHistory, setDailyHistory] = useState<RespuestaConPreguntaResponse[]>([]);
  const [selectedExam, setSelectedExam] = useState<ExamenResponse | null>(null);
  const [showAlertas, setShowAlertas] = useState(false);
  const [showCuestionario, setShowCuestionario] = useState(false);
  const [showVitals, setShowVitals] = useState(false);
  const [showEmergencia, setShowEmergencia] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistItems, setChecklistItems] = useState<GestanteChecklistItem[]>([]);
  const [loadingChecklist, setLoadingChecklist] = useState(false);
  const [emergenciaForm, setEmergenciaForm] = useState<LlamadaEmergenciaCreate>({ motivo: '', destino: '', resultado: '' });
  const [emergenciaLoading, setEmergenciaLoading] = useState(false);
  const [emergenciaError, setEmergenciaError] = useState<string | null>(null);
  const [emergenciaSuccess, setEmergenciaSuccess] = useState(false);
  // ─── Toast & Confirm internos ───────────────────────────────────────────────
  const [toasts, setToasts] = useState<InternalToast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmState>({ open: false, message: '', onConfirm: () => {} });

  const addToast = useCallback((message: string, type: InternalToast['type'] = 'info') => {
    const id = ++_toastId;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const showConfirm = useCallback((message: string, onConfirm: () => void) => {
    setConfirmState({ open: true, message, onConfirm });
  }, []);

  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [selStaff, setSelStaff] = useState<any>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  // States for exporting and registering exams
  const [exporting, setExporting] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);
  const [addExamLoading, setAddExamLoading] = useState(false);
  const [addExamError, setAddExamError] = useState<string | null>(null);
  const [addExamForm, setAddExamForm] = useState({
    tipo_examen_id: 1,
    fecha_toma: new Date().toISOString().split('T')[0],
    resultado: '',
    resultado_numerico: '',
    unidad: '',
    semana_gestacion: '',
    observaciones: '',
  });

  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [editForm, setEditForm] = useState({ nombre: '', rol_id: 0 });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  useEffect(() => {
    getRoles().then(setRoles).catch(() => {
      setRoles([
        { id: 1, nombre: 'admin' },
        { id: 2, nombre: 'gestante' },
        { id: 3, nombre: 'clinico' },
        { id: 4, nombre: 'hospital' },
      ]);
    });
  }, []);

  const getRolNombre = (rol_id: number | string): string => {
    if (!roles || roles.length === 0) return 'Cargando...';
    const rol = roles.find(r => String(r.id) === String(rol_id));
    if (!rol) return `Rol ${rol_id}`;
    return rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1);
  };

  useEffect(() => {
    setStatusError(null);
    setIsEditingStaff(false);
    setEditError(null);
    setEditSuccess(false);
    if (selStaff) {
      setEditForm({ nombre: selStaff.nombre || '', rol_id: Number(selStaff.rol_id) });
    }
  }, [selStaff]);

  useEffect(() => {
    if (activeList === 'maternas') {
      getGestantes().then(data => {
        setGestantes(data);
        if (data.length > 0 && selPaciente === 'XYZ1002') {
          setSelPaciente(data[0].codigo_gmi);
        }
      }).catch(console.error);
    } else if (activeList === 'staff' && isAdmin) {
      setLoadingStaff(true);
      getStaffUsers().then(data => {
        setStaffUsers(data);
      }).catch(console.error).finally(() => setLoadingStaff(false));
    }
  }, [activeList, isAdmin]);

  const filtrados = gestantes
    .filter(p => (p.codigo_gmi || p.id).toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => {
      const aAlerta = a.ultimo_estado_alerta === 'activa' ? 1 : 0;
      const bAlerta = b.ultimo_estado_alerta === 'activa' ? 1 : 0;
      return bAlerta - aAlerta;
    });

  const totalPaginasMaternas = Math.max(1, Math.ceil(filtrados.length / MATERNAS_POR_PAGINA));
  const paginaMaternasClamped = Math.min(paginaMaternas, totalPaginasMaternas);
  const maternasPagina = filtrados.slice(
    (paginaMaternasClamped - 1) * MATERNAS_POR_PAGINA,
    paginaMaternasClamped * MATERNAS_POR_PAGINA
  );

  // Efecto para consultar si tienen pregunta de seguridad configurada (login activo)
  useEffect(() => {
    if (maternasPagina.length === 0) return;

    // Filtrar códigos que aún no han sido validados
    const codesToFetch = maternasPagina
      .map(p => p.codigo_gmi)
      .filter(code => loginStatusMap[code] === undefined);

    if (codesToFetch.length === 0) return;

    // Marcar como true temporalmente para no duplicar peticiones en paralelo
    setLoginStatusMap(prev => {
      const next = { ...prev };
      codesToFetch.forEach(code => {
        next[code] = true; // Por defecto asumimos activa hasta que falle
      });
      return next;
    });

    const checkSecurityQuestions = async () => {
      const results = await Promise.all(
        codesToFetch.map(async (code) => {
          try {
            await getSecurityQuestion(code);
            return { code, hasQuestion: true };
          } catch (e: any) {
            // Si retorna 404, no tiene pregunta
            if (e?.status === 404) {
              return { code, hasQuestion: false };
            }
            return { code, hasQuestion: true }; // En caso de otro error, no marcar alerta
          }
        })
      );

      setLoginStatusMap(prev => {
        const next = { ...prev };
        results.forEach(res => {
          next[res.code] = res.hasQuestion;
        });
        return next;
      });
    };

    checkSecurityQuestions();
  }, [maternasPagina]);

  const handleResolveActivation = async (id: string, code: string, aprobar: boolean) => {
    setIsResolvingId(id);
    try {
      await resolveActivationRequest(id, aprobar);
      addToast(
        aprobar ? '✅ Solicitud aprobada. Login activado.' : '✅ Solicitud rechazada.',
        aprobar ? 'success' : 'info'
      );
      // Actualizar mapa
      setLoginStatusMap(prev => ({ ...prev, [code]: aprobar }));
      // Refrescar lista de solicitudes
      fetchPendingActivations();
      // Refrescar listado de gestantes
      getGestantes().then(setGestantes).catch(console.error);
    } catch (err: any) {
      addToast('Error al resolver la solicitud: ' + (err.response?.data?.detail || err.message), 'error');
    } finally {
      setIsResolvingId(null);
    }
  };

  useEffect(() => {
    setPaginaMaternas(1);
  }, [busqueda, activeList]);

  const gestanteSeleccionada = gestantes.find(g => g.codigo_gmi === selPaciente);

  useEffect(() => {
    if (!gestanteSeleccionada?.id) {
      setExams([]);
      setVitals([]);
      setAlarmSigns([]);
      setDailyHistory([]);
      setChecklistItems([]);
      return;
    }
    const gestanteId = gestanteSeleccionada.id;
    setSelectedExam(null);
    getGestanteExams(gestanteId).then(setExams).catch(() => setExams([]));
    getGestanteVitals(gestanteId).then(setVitals).catch(() => setVitals([]));
    getGestanteAlarmSigns(gestanteId).then(setAlarmSigns).catch(() => setAlarmSigns([]));
    getGestanteDailyQuestionsHistory(gestanteId).then(setDailyHistory).catch(() => setDailyHistory([]));
    setLoadingChecklist(true);
    getGestanteChecklist(gestanteId)
      .then(setChecklistItems)
      .catch(() => setChecklistItems([]))
      .finally(() => setLoadingChecklist(false));
  }, [gestanteSeleccionada?.id]);

  const abrirEmergencia = () => {
    setEmergenciaForm({ motivo: '', destino: '', resultado: '' });
    setEmergenciaError(null);
    setEmergenciaSuccess(false);
    setShowEmergencia(true);
  };

  const enviarEmergencia = async () => {
    if (!gestanteSeleccionada?.id) return;
    setEmergenciaLoading(true);
    setEmergenciaError(null);
    try {
      await createGestanteEmergencyCall(gestanteSeleccionada.id, emergenciaForm);
      setEmergenciaSuccess(true);
      setTimeout(() => setShowEmergencia(false), 1500);
    } catch (err: any) {
      const backendError = err.response?.data?.detail;
      setEmergenciaError(typeof backendError === 'string' ? backendError : 'No se pudo registrar la llamada de emergencia.');
    } finally {
      setEmergenciaLoading(false);
    }
  };

  const handleExportData = async (format: 'xlsx' | 'csv') => {
    setExporting(true);
    try {
      const blob = await exportGestantes(format);
      downloadBlob(blob, buildExportFilename('gestantes', format));
    } catch (err: any) {
      console.error(err);
      addToast('Error al exportar datos de gestantes.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleExportIndicatorsData = async () => {
    setExporting(true);
    try {
      const blob = await exportIndicators('xlsx');
      downloadBlob(blob, buildExportFilename('indicadores', 'xlsx'));
    } catch (err: any) {
      console.error(err);
      addToast('Error al exportar indicadores.', 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gestanteSeleccionada?.id) return;
    setAddExamLoading(true);
    setAddExamError(null);
    try {
      const payload: any = {
        gestante_id: gestanteSeleccionada.id,
        tipo_examen_id: Number(addExamForm.tipo_examen_id),
        fecha_toma: addExamForm.fecha_toma,
        resultado: addExamForm.resultado,
      };
      if (addExamForm.resultado_numerico !== '') {
        payload.resultado_numerico = Number(addExamForm.resultado_numerico);
      }
      if (addExamForm.unidad !== '') {
        payload.unidad = addExamForm.unidad;
      }
      if (addExamForm.semana_gestacion !== '') {
        payload.semana_gestacion = Number(addExamForm.semana_gestacion);
      }
      if (addExamForm.observaciones !== '') {
        payload.observaciones = addExamForm.observaciones;
      }

      await createGestanteExam(gestanteSeleccionada.id, payload);
      
      // Refrescar exámenes
      const updatedExams = await getGestanteExams(gestanteSeleccionada.id);
      setExams(updatedExams);
      
      // Cerrar y resetear
      setShowAddExam(false);
      setAddExamForm({
        tipo_examen_id: 1,
        fecha_toma: new Date().toISOString().split('T')[0],
        resultado: '',
        resultado_numerico: '',
        unidad: '',
        semana_gestacion: '',
        observaciones: '',
      });
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.detail || 'Error al registrar el examen.';
      setAddExamError(typeof msg === 'string' ? msg : 'Error al registrar el examen.');
    } finally {
      setAddExamLoading(false);
    }
  };

  const formatFecha = (iso?: string | null) => {
    if (!iso) return 'N/A';
    return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatRespuesta = (r: RespuestaConPreguntaResponse) => {
    if (r.respuesta_texto != null) return r.respuesta_texto;
    if (r.respuesta_booleana != null) return r.respuesta_booleana ? 'Sí' : 'No';
    if (r.respuesta_numerica != null) return String(r.respuesta_numerica);
    return 'Sin respuesta';
  };

  const staffFiltrados = staffUsers.filter(u =>
    (u.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className={styles.root}>

      {/* ── Toast Layer ── */}
      <div style={{
        position: 'fixed', top: '20px', right: '20px', zIndex: 99999,
        display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'none'
      }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            background: t.type === 'success' ? '#16a34a' : t.type === 'error' ? '#dc2626' : '#CA436E',
            animation: 'fadeInRight 0.3s ease-out',
            pointerEvents: 'auto',
            minWidth: '240px',
          }}>
            {t.message}
          </div>
        ))}
      </div>

      {/* ── Modal de confirmación custom ── */}
      <Modal
        isOpen={confirmState.open}
        onClose={() => setConfirmState(s => ({ ...s, open: false }))}
        title="Confirmar acción"
      >
        <div style={{ padding: '10px 0' }}>
          <p style={{ fontSize: '14px', color: '#333', marginBottom: '20px', lineHeight: '1.5' }}>
            {confirmState.message}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setConfirmState(s => ({ ...s, open: false }))}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                confirmState.onConfirm();
                setConfirmState(s => ({ ...s, open: false }));
              }}
              style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: '#CA436E', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}
            >
              Confirmar
            </button>
          </div>
        </div>
      </Modal>

      {/*tabs*/}
      <HeaderActividad rol="medico" tabActivo="Usuarias" />

      {/* ── MAIN GRID ── */}
      <div className={styles.grid}>

        {/*parte izquierda ls lista*/}
        <div className={styles.panel}>
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p className={styles.panelTitle} style={{ margin: 0 }}>Lista</p>
          </div>

          {isAdmin && pendingActivations.length > 0 && (
            <div 
              onClick={() => setShowActivationsModal(true)}
              style={{
                backgroundColor: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
              }}
              title="Revisar solicitudes de activación de cuenta"
            >
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BellIcon size={14} color="#d97706" /> {pendingActivations.length} Solicitud{pendingActivations.length > 1 ? 'es' : ''} de Activación
              </span>
              <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 600, textDecoration: 'underline' }}>Revisar</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            {isAdmin && (
              <button
                className={styles.addPacienteBtn}
                style={{ flex: 1 }}
                onClick={() => setModalOpen('gestante')}
              >
                + Materna
              </button>
            )}
            {isAdmin && (
              <button
                className={styles.addPacienteBtn}
                style={{ flex: 1, background: '#7C3AED' }}
                onClick={() => setModalOpen('staff')}
                title="Crear usuario de staff (clínico, admin, hospital)"
              >
                + Staff
              </button>
            )}
          </div>

          {isAdmin && (
            <div className={styles.tabContainer}>
              <button
                className={`${styles.tabBtn} ${activeList === 'maternas' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveList('maternas')}
              >
                Maternas
              </button>
              <button
                className={`${styles.tabBtn} ${activeList === 'staff' ? styles.tabBtnActive : ''}`}
                onClick={() => setActiveList('staff')}
              >
                Staff
              </button>
            </div>
          )}

          {activeList === 'maternas' && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              <button
                className={styles.exportBtn}
                onClick={() => handleExportData('xlsx')}
                disabled={exporting}
                title="Exportar base de datos de gestantes (Excel)"
              >
                Excel
              </button>
              <button
                className={styles.exportBtn}
                onClick={() => handleExportData('csv')}
                disabled={exporting}
                title="Exportar base de datos de gestantes (CSV)"
              >
                CSV
              </button>
              <button
                className={styles.exportBtn}
                onClick={handleExportIndicatorsData}
                disabled={exporting}
                title="Exportar indicadores del programa (Excel)"
              >
                Indicadores
              </button>
            </div>
          )}

          <div className={styles.searchWrap}>
            <input
              className={styles.searchInput}
              placeholder={activeList === 'maternas' ? "Buscar por codigo" : "Buscar por nombre o email"}
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
            <svg className={styles.searchIcon} width="14" height="14"
              viewBox="0 0 24 24" fill="none" stroke="#CA436E"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          <div className={styles.pList}>
            {activeList === 'maternas' ? (
              maternasPagina.map((p, i) => {
                const currentWeeks = calculateCurrentWeeks(p.fecha_ultima_menstruacion);
                return (
                <div
                  key={p.id || i}
                  className={`${styles.pItem} ${p.codigo_gmi === selPaciente ? styles.pItemSel : ''}`}
                  onClick={() => setSelPaciente(p.codigo_gmi)}
                >
                  <span className={styles.pId}>
                    {p.codigo_gmi}
                    {p.ultimo_estado_alerta === 'activa' && (
                      <svg 
                        width="14" 
                        height="14" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="#ff4b72" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"
                        style={{ marginLeft: '8px', display: 'inline-block', verticalAlign: 'middle' }}
                      >
                        <title>Alerta Activa</title>
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </svg>
                    )}
                    {pendingActivations.some(act => act.codigo_gmi === p.codigo_gmi) && (
                      <span style={{ marginLeft: '8px', display: 'inline-block', fontSize: '10px', backgroundColor: '#fef3c7', color: '#d97706', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold', verticalAlign: 'middle' }} title="Solicitud de activación de login pendiente">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><ClockIcon size={10} color="#d97706" /> Solicitado</span>
                      </span>
                    )}
                    {!pendingActivations.some(act => act.codigo_gmi === p.codigo_gmi) && loginStatusMap[p.codigo_gmi] === false && (
                      <span style={{ marginLeft: '8px', display: 'inline-block', fontSize: '10px', backgroundColor: '#fee2e2', color: '#dc2626', padding: '1px 6px', borderRadius: '4px', fontWeight: 'bold', verticalAlign: 'middle' }} title="Login no activado (sin pregunta de seguridad)">
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><AlertTriangleIcon size={10} color="#dc2626" /> Sin Login</span>
                      </span>
                    )}
                  </span>
                  <div>
                    <div className={styles.pDetail}>Nro Semana · {currentWeeks}</div>
                    <div className={styles.pDetail}>Fase · {getFaseOrTrimestre(currentWeeks)}</div>
                  </div>
                </div>
              )})
            ) : loadingStaff ? (
              /* Skeleton de carga para lista staff */
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ padding: '10px 12px', borderRadius: '12px', border: '1px solid #f0f0f0', marginBottom: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ height: '12px', width: '60%', background: '#f0f0f0', borderRadius: '6px', animation: 'pulse 1.5s infinite' }} />
                    <div style={{ height: '12px', width: '16%', background: '#f0f0f0', borderRadius: '6px' }} />
                  </div>
                  <div style={{ height: '10px', width: '80%', background: '#f5f5f5', borderRadius: '6px', marginBottom: '4px' }} />
                  <div style={{ height: '10px', width: '30%', background: '#f5f5f5', borderRadius: '6px' }} />
                </div>
              ))
            ) : staffFiltrados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 16px', color: '#bbb' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '8px' }}>
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <p style={{ fontSize: '12px', margin: 0 }}>No hay usuarios de staff</p>
              </div>
            ) : (
              staffFiltrados.map((u, i) => (
                <div
                  key={u.id || i}
                  className={`${styles.pItem} ${selStaff?.id === u.id ? styles.pItemSel : ''}`}
                  onClick={() => setSelStaff(u)}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: '#333' }}>{u.nombre}</span>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        background: u.activo ? '#d1fae5' : '#fee2e2',
                        color: u.activo ? '#065f46' : '#991b1b'
                      }}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>{u.email}</span>
                    <span style={{
                      fontSize: '10px',
                      marginTop: '4px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      alignSelf: 'flex-start',
                      background: getRolNombre(u.rol_id).toLowerCase() === 'admin' ? '#fce8ef' : '#e0f2fe',
                      color: getRolNombre(u.rol_id).toLowerCase() === 'admin' ? '#CA436E' : '#0284c7'
                    }}>
                      {getRolNombre(u.rol_id)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {activeList === 'maternas' && (
            <div className={styles.paginacion}>
              <button
                type="button"
                className={styles.paginacionBtn}
                onClick={() => setPaginaMaternas(p => Math.max(1, p - 1))}
                disabled={paginaMaternasClamped <= 1}
              >
                Anterior
              </button>
              <span className={styles.paginacionInfo}>
                Página {paginaMaternasClamped} de {totalPaginasMaternas}
              </span>
              <button
                type="button"
                className={styles.paginacionBtn}
                onClick={() => setPaginaMaternas(p => Math.min(totalPaginasMaternas, p + 1))}
                disabled={paginaMaternasClamped >= totalPaginasMaternas}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {/*parte central los detalles*/}
        {activeList === 'maternas' ? (
          <div className={`${styles.panel} ${styles.panelScroll}`}>
            <h1 className={styles.nombrePaciente}>{selPaciente}</h1>
            <p className={styles.diagnostico}>
              {gestanteSeleccionada?.diagnostico_ingreso?.toUpperCase() || 'EMBARAZO DE ALTO RIESGO'}
            </p>

            {/* Aviso de Login Inactivo / Solicitud Pendiente */}
            {loginStatusMap[selPaciente] === false && (() => {
              const solicitud = pendingActivations.find(s => s.codigo_gmi === selPaciente);
              if (solicitud) {
                return (
                  <div style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fef3c7',
                    borderLeft: '5px solid #d97706',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px',
                  }}>
                    <h4 style={{ margin: '0 0 8px 0', color: '#d97706', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ClockIcon size={16} color="#d97706" /> Solicitud de Activación Pendiente
                    </h4>
                    <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#6b7280', lineHeight: '1.5' }}>
                      La gestante ha solicitado activar su cuenta con la siguiente pregunta de seguridad:
                      <br />
                      <strong style={{ color: '#374151' }}>"{solicitud.pregunta}"</strong>
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => handleResolveActivation(solicitud.id, solicitud.codigo_gmi, false)}
                        disabled={isResolvingId === solicitud.id}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          borderRadius: '6px',
                          border: '1px solid #d1d5db',
                          background: 'white',
                          color: '#374151',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => handleResolveActivation(solicitud.id, solicitud.codigo_gmi, true)}
                        disabled={isResolvingId === solicitud.id}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#CA436E',
                          color: 'white',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        {isResolvingId === solicitud.id ? (
                          'Aprobando...'
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            Aprobar Activación <CheckCircleIcon size={12} color="white" />
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fee2e2',
                    borderLeft: '5px solid #ef4444',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                  }}>
                    <h4 style={{ margin: '0 0 4px 0', color: '#991b1b', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangleIcon size={14} color="#ef4444" /> Cuenta Inactiva (Sin Login)
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#7f1d1d', lineHeight: '1.4' }}>
                      Esta gestante no tiene una pregunta de seguridad registrada (posiblemente importada de Excel). 
                      Debe ingresar al portal de gestantes en la pantalla de Login con su código para configurar su pregunta y enviar la solicitud de activación.
                    </p>
                  </div>
                );
              }
            })()}

            <p className={styles.infoRow}><strong>Nro Semana</strong> · {gestanteSeleccionada ? calculateCurrentWeeks(gestanteSeleccionada.fecha_ultima_menstruacion) : 'N/A'}</p>
            <p className={styles.infoRow}><strong>Fecha posible parto</strong>  {gestanteSeleccionada?.fecha_probable_parto || 'N/A'}</p>
            <p className={styles.infoRow}><strong>Ultima menstruacion</strong>  {gestanteSeleccionada?.fecha_ultima_menstruacion || 'N/A'}</p>
            <p className={styles.infoRow}>
              <strong>Nivel de riesgo</strong>
              &nbsp;<span className={styles.sobrepeso} style={{ color: getRiesgoColor(gestanteSeleccionada?.nivel_riesgo) }}>{gestanteSeleccionada?.nivel_riesgo?.toUpperCase() || 'N/A'}</span>
            </p>

            {gestanteSeleccionada?.ips_atencion && (
              <p className={styles.ipsText}>
                IPS DE ATENCIÓN <strong>{gestanteSeleccionada.ips_atencion}</strong>
              </p>
            )}
            <button className={styles.emergenciaBtn} onClick={abrirEmergencia}>
              Generar llamada de emergencia
            </button>

            {/* --- FÓRMULA OBSTÉTRICA --- */}
            <div className={styles.formulaContainer}>
              <div className={styles.formulaHeader}>
                <h3>Fórmula Obstétrica</h3>
                {!editingFormula && (
                  <button 
                    className={styles.editBtn}
                    onClick={() => {
                      setFormulaForm(formula || { gestaciones: 0, partos: 0, cesareas: 0, abortos: 0, vivos: 0, mortinatos: 0 });
                      setEditingFormula(true);
                    }}
                  >
                    ✏️ Editar
                  </button>
                )}
              </div>

              {editingFormula ? (
                <form onSubmit={handleSaveFormula} className={styles.inlineForm}>
                  <div className={styles.formGrid}>
                    <div className={styles.formField}>
                      <label>Gestaciones (G)</label>
                      <input 
                        type="number" min="0" required
                        value={formulaForm.gestaciones}
                        onChange={e => setFormulaForm({...formulaForm, gestaciones: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Partos (P)</label>
                      <input 
                        type="number" min="0" required
                        value={formulaForm.partos}
                        onChange={e => setFormulaForm({...formulaForm, partos: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Cesáreas (C)</label>
                      <input 
                        type="number" min="0" required
                        value={formulaForm.cesareas}
                        onChange={e => setFormulaForm({...formulaForm, cesareas: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Abortos (A)</label>
                      <input 
                        type="number" min="0" required
                        value={formulaForm.abortos}
                        onChange={e => setFormulaForm({...formulaForm, abortos: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Vivos (V)</label>
                      <input 
                        type="number" min="0" required
                        value={formulaForm.vivos}
                        onChange={e => setFormulaForm({...formulaForm, vivos: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Mortinatos (M)</label>
                      <input 
                        type="number" min="0" required
                        value={formulaForm.mortinatos}
                        onChange={e => setFormulaForm({...formulaForm, mortinatos: parseInt(e.target.value) || 0})}
                      />
                    </div>
                  </div>
                  <div className={styles.formActions}>
                    <button type="button" className={styles.btnCancel} onClick={() => setEditingFormula(false)}>Cancelar</button>
                    <button type="submit" className={styles.btnSave}>Guardar</button>
                  </div>
                </form>
              ) : (
                <div className={styles.formulaGrid}>
                  <div className={styles.formulaItem}>
                    <span className={styles.formulaCount}>{formula?.gestaciones ?? 0}</span>
                    <span className={styles.formulaLabel}>G</span>
                  </div>
                  <div className={styles.formulaItem}>
                    <span className={styles.formulaCount}>{formula?.partos ?? 0}</span>
                    <span className={styles.formulaLabel}>P</span>
                  </div>
                  <div className={styles.formulaItem}>
                    <span className={styles.formulaCount}>{formula?.cesareas ?? 0}</span>
                    <span className={styles.formulaLabel}>C</span>
                  </div>
                  <div className={styles.formulaItem}>
                    <span className={styles.formulaCount}>{formula?.abortos ?? 0}</span>
                    <span className={styles.formulaLabel}>A</span>
                  </div>
                  <div className={styles.formulaItem}>
                    <span className={styles.formulaCount}>{formula?.vivos ?? 0}</span>
                    <span className={styles.formulaLabel}>V</span>
                  </div>
                  <div className={styles.formulaItem}>
                    <span className={styles.formulaCount}>{formula?.mortinatos ?? 0}</span>
                    <span className={styles.formulaLabel}>M</span>
                  </div>
                </div>
              )}
            </div>

            {/* --- ANTECEDENTES PATOLÓGICOS --- */}
            <div className={styles.antecedentesContainer}>
              <div className={styles.antecedentesHeader}>
                <h3>Antecedentes Patológicos</h3>
                {!editingAntecedenteId && (
                  <button 
                    className={styles.editBtn}
                    onClick={() => {
                      setAntecedenteForm({
                        tipo_condicion: '',
                        descripcion: '',
                        fecha_diagnostico: new Date().toISOString().split('T')[0],
                        controlada: true,
                        tratamiento_actual: ''
                      });
                      setEditingAntecedenteId('new');
                    }}
                  >
                    ➕ Agregar
                  </button>
                )}
              </div>

              {editingAntecedenteId ? (
                <form onSubmit={handleSaveAntecedente} className={styles.inlineForm}>
                  <div className={styles.formGrid}>
                    <div className={`${styles.formField} ${styles.formFieldFull}`}>
                      <label>Tipo de Condición *</label>
                      <input 
                        type="text" required placeholder="Ej. Diabetes Gestacional, Hipertensión"
                        value={antecedenteForm.tipo_condicion}
                        onChange={e => setAntecedenteForm({...antecedenteForm, tipo_condicion: e.target.value})}
                      />
                    </div>
                    <div className={`${styles.formField} ${styles.formFieldFull}`}>
                      <label>Descripción</label>
                      <textarea 
                        placeholder="Detalles sobre el diagnóstico..."
                        value={antecedenteForm.descripcion}
                        onChange={e => setAntecedenteForm({...antecedenteForm, descripcion: e.target.value})}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Fecha de Diagnóstico</label>
                      <input 
                        type="date"
                        value={antecedenteForm.fecha_diagnostico}
                        onChange={e => setAntecedenteForm({...antecedenteForm, fecha_diagnostico: e.target.value})}
                      />
                    </div>
                    <div className={styles.formField}>
                      <label>Estado de Control</label>
                      <select 
                        value={antecedenteForm.controlada ? 'true' : 'false'}
                        onChange={e => setAntecedenteForm({...antecedenteForm, controlada: e.target.value === 'true'})}
                      >
                        <option value="true">Controlada</option>
                        <option value="false">No controlada</option>
                      </select>
                    </div>
                    <div className={`${styles.formField} ${styles.formFieldFull}`}>
                      <label>Tratamiento Actual</label>
                      <input 
                        type="text" placeholder="Ej. Insulina, Dieta, Medicamentos..."
                        value={antecedenteForm.tratamiento_actual}
                        onChange={e => setAntecedenteForm({...antecedenteForm, tratamiento_actual: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className={styles.formActions}>
                    <button type="button" className={styles.btnCancel} onClick={() => setEditingAntecedenteId(null)}>Cancelar</button>
                    <button type="submit" className={styles.btnSave}>Guardar</button>
                  </div>
                </form>
              ) : (
                <div className={styles.antecedentesList}>
                  {loadingClinico ? (
                    <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>Cargando datos clínicos...</p>
                  ) : antecedentes.length === 0 ? (
                    <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>No hay antecedentes registrados.</p>
                  ) : (
                    antecedentes.map(ant => (
                      <div key={ant.id} className={styles.antecedenteCard}>
                        <div className={styles.antecedenteTitleRow}>
                          <h4 className={styles.antecedenteTitle}>{ant.tipo_condicion}</h4>
                          <div className={styles.antecedenteBadges}>
                            <span className={`${styles.badge} ${ant.controlada ? styles.badgeControlled : styles.badgeNotControlled}`}>
                              {ant.controlada ? 'Controlada' : 'No controlada'}
                            </span>
                          </div>
                        </div>
                        {ant.descripcion && <p className={styles.antecedenteDesc}>{ant.descripcion}</p>}
                        
                        <div className={styles.antecedenteMeta}>
                          {ant.fecha_diagnostico && <span>📅 Diagnóstico: {ant.fecha_diagnostico}</span>}
                          {ant.tratamiento_actual && <span>💊 Tratamiento: {ant.tratamiento_actual}</span>}
                        </div>

                        <div className={styles.antecedenteActions}>
                          <button 
                            type="button"
                            className={styles.actionIconBtn} 
                            title="Editar"
                            onClick={() => {
                              setAntecedenteForm({
                                tipo_condicion: ant.tipo_condicion,
                                descripcion: ant.descripcion || '',
                                fecha_diagnostico: ant.fecha_diagnostico || '',
                                controlada: !!ant.controlada,
                                tratamiento_actual: ant.tratamiento_actual || ''
                              });
                              setEditingAntecedenteId(ant.id);
                            }}
                          >
                            ✏️
                          </button>
                          <button 
                            type="button"
                            className={styles.actionIconBtn} 
                            title="Eliminar"
                            onClick={() => handleDeleteAntecedente(ant.id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>


          </div>
        ) : (
          <div className={`${styles.panel} ${styles.panelScroll}`}>
            {selStaff ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h1 className={styles.nombrePaciente}>{selStaff.nombre}</h1>
                    <p className={styles.diagnostico}>
                      {getRolNombre(selStaff.rol_id).toLowerCase() === 'admin' ? 'Administrador' : 
                       getRolNombre(selStaff.rol_id).toLowerCase() === 'hospital' ? 'Personal Hospitalario' : 
                       'Personal Clínico'}
                    </p>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setIsEditingStaff(!isEditingStaff)}
                      style={{
                        padding: '6px 12px', borderRadius: '20px', border: '1px solid #CA436E',
                        background: isEditingStaff ? '#CA436E' : 'transparent',
                        color: isEditingStaff ? 'white' : '#CA436E', cursor: 'pointer', fontSize: '12px'
                      }}
                    >
                      {isEditingStaff ? 'Cancelar' : 'Editar'}
                    </button>
                  )}
                </div>

                {isEditingStaff && isAdmin ? (
                  <form
                    style={{ marginTop: '20px', padding: '16px', background: '#f9f9f9', borderRadius: '12px', border: '1px solid #eee' }}
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setEditLoading(true);
                      setEditError(null);
                      setEditSuccess(false);
                      try {
                        await updateStaffUser(selStaff.id, editForm);
                        setEditSuccess(true);
                        const updatedUsers = await getStaffUsers();
                        setStaffUsers(updatedUsers);
                        const updatedSel = updatedUsers.find((u: any) => u.id === selStaff.id);
                        if (updatedSel) setSelStaff(updatedSel);
                        setTimeout(() => setIsEditingStaff(false), 1500);
                      } catch (err: any) {
                        setEditError(err.response?.data?.detail || 'Error al actualizar el usuario');
                      } finally {
                        setEditLoading(false);
                      }
                    }}
                  >
                    <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#333' }}>Editar Usuario</h3>

                    {editSuccess && (
                      <div style={{ padding: '10px', background: '#d1fae5', color: '#065f46', borderRadius: '6px', marginBottom: '15px', fontSize: '13px' }}>
                        ✅ Usuario actualizado
                      </div>
                    )}
                    {editError && (
                      <div style={{ padding: '10px', background: '#fee2e2', color: '#991b1b', borderRadius: '6px', marginBottom: '15px', fontSize: '13px' }}>
                        ❌ {typeof editError === 'string' ? editError : 'Error'}
                      </div>
                    )}

                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '4px' }}>Nombre completo</label>
                      <input
                        type="text"
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                        value={editForm.nombre}
                        onChange={(e) => setEditForm(prev => ({ ...prev, nombre: e.target.value }))}
                        disabled={editLoading}
                        required
                      />
                    </div>

                    <div style={{ marginBottom: '15px' }}>
                      <label style={{ display: 'block', fontSize: '13px', color: '#555', marginBottom: '4px' }}>Rol</label>
                      <select
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                        value={editForm.rol_id}
                        onChange={(e) => setEditForm(prev => ({ ...prev, rol_id: Number(e.target.value) }))}
                        disabled={editLoading}
                      >
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.nombre.charAt(0).toUpperCase() + r.nombre.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={editLoading}
                      style={{
                        background: '#CA436E', color: 'white', border: 'none', padding: '8px 16px',
                        borderRadius: '20px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, width: '100%'
                      }}
                    >
                      {editLoading ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                  </form>
                ) : (
                  <div style={{ marginTop: '20px' }}>
                    <p className={styles.infoRow}><strong>Email:</strong> {selStaff.email}</p>
                    <p className={styles.infoRow}><strong>Fecha de creación:</strong> {selStaff.created_at ? new Date(selStaff.created_at).toLocaleDateString() : 'N/A'}</p>
                  </div>
                )}

                <div style={{ marginTop: '30px', padding: '16px', background: '#f9f9f9', borderRadius: '12px', border: '1px solid #eee' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}>Estado del Usuario</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '13px', color: '#555' }}>
                      El usuario actualmente está <strong>{selStaff.activo ? 'Activo' : 'Inactivo'}</strong>.
                    </span>
                    <button
                      onClick={async () => {
                        try {
                          setStatusError(null);
                          const updated = await updateStaffStatus(selStaff.id, !selStaff.activo);
                          setStaffUsers(prev => prev.map(u => u.id === selStaff.id ? { ...u, activo: updated.activo ?? !u.activo } : u));
                          setSelStaff((prev: any) => ({ ...prev, activo: updated.activo ?? !prev.activo }));
                        } catch (err: any) {
                          const errorMsg = err.response?.data?.detail || 'Error al actualizar el estado';
                          setStatusError(typeof errorMsg === 'string' ? errorMsg : 'Error al actualizar el estado');
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                        background: selStaff.activo ? '#fee2e2' : '#d1fae5',
                        color: selStaff.activo ? '#991b1b' : '#065f46',
                        marginLeft: 'auto'
                      }}
                    >
                      {selStaff.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                  {statusError && <p style={{ color: '#dc2626', fontSize: '12px', margin: '10px 0 0 0' }}>{statusError}</p>}
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999', fontSize: '14px' }}>
                Seleccione un usuario de staff para ver sus detalles
              </div>
            )}
          </div>
        )}

        {/* Columna derecha: Reporte diario y Análisis actual */}
        {activeList === 'maternas' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%', minHeight: 0 }}>
            {/* Tarjeta 1: Reporte diario */}
            <div className={`${styles.panel} ${styles.reportePanel}`}>
              <h2 className={styles.panelTitle}>Reporte diario</h2>
              <p className={styles.secDesc}>
                En el siguiente panel podrá consultar la información diaria de la paciente.
                Haga clic en cada opción para ver el detalle.
              </p>

              <button className={styles.alertaBtn} onClick={() => setShowAlertas(true)}>
                Signos de alerta ⚠️ {alarmSigns.length > 0 ? `(${alarmSigns.length})` : ''}
              </button>
              <button className={styles.cuestionarioBtn} onClick={() => setShowCuestionario(true)}>
                Revisar cuestionario diario
              </button>
              <button className={styles.cuestionarioBtn} onClick={() => setShowChecklist(true)}>
                Revisar checklist de preparación
              </button>
              <button className={styles.cuestionarioBtn} onClick={() => setShowVitals(true)}>
                Ver signos vitales registrados 🩺
              </button>
            </div>

            {/* Tarjeta 2: Análisis actual */}
            <div className={styles.panel} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h2 className={styles.panelTitle} style={{ margin: 0 }}>Análisis actual</h2>
                <button
                  className={styles.addBtn}
                  style={{ position: 'static' }}
                  onClick={() => setShowAddExam(true)}
                  title="Registrar nuevo examen"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="#CA436E" strokeWidth="2"
                    strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </button>
              </div>
              <p className={styles.secDesc} style={{ marginBottom: '12px' }}>
                Haga clic en un examen para ver su detalle.
              </p>

              <div className={styles.analisisBox} style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                {exams.length === 0 ? (
                  <p className={styles.secDesc} style={{ margin: 0 }}>
                    Sin análisis registrados para esta paciente.
                  </p>
                ) : (
                  <div className={styles.analisisGrid} style={{ gridTemplateColumns: '1fr' }}>
                    {exams.map((e) => (
                      <button
                        key={e.id}
                        className={`${styles.analisisBtn} ${selectedExam?.id === e.id ? styles.analisisBtnOn : ''}`}
                        onClick={() => setSelectedExam(e)}
                      >
                        {(e.tipo_examen_nombre || `Examen #${e.tipo_examen_id}`).toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.panel}>
            <h2 className={styles.panelTitle} style={{ marginBottom: '16px' }}>Resumen del Equipo</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#f9f9f9', borderRadius: '12px', padding: '14px', textAlign: 'center', border: '1px solid #f0f0f0' }}>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#CA436E' }}>{staffUsers.length}</div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Total Staff</div>
              </div>
              <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '14px', textAlign: 'center', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '26px', fontWeight: 700, color: '#16a34a' }}>{staffUsers.filter(u => u.activo).length}</div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>Activos</div>
              </div>
            </div>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#555', marginBottom: '10px' }}>Por Rol</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['admin', 'clinico', 'hospital'].map(rol => {
                const count = staffUsers.filter(u => getRolNombre(u.rol_id).toLowerCase() === rol).length;
                if (count === 0) return null;
                return (
                  <div key={rol} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #f0f0f0' }}>
                    <span style={{ fontSize: '12px', color: '#444', fontWeight: 500, textTransform: 'capitalize' }}>
                      {rol === 'admin' ? '🛡️ Administrador' : rol === 'clinico' ? '🩺 Clínico' : '🏥 Hospital'}
                    </span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#CA436E' }}>{count}</span>
                  </div>
                );
              })}
            </div>
            {!selStaff && staffUsers.length > 0 && (
              <p style={{ fontSize: '12px', color: '#bbb', textAlign: 'center', marginTop: '20px' }}>
                Selecciona un usuario de la lista para ver sus detalles
              </p>
            )}
          </div>
        )}

      </div>

      {/* Modal: registrar nueva materna */}
      <Modal
        isOpen={modalOpen === 'gestante'}
        onClose={() => setModalOpen(null)}
        title="Registrar Nueva Materna"
      >
        <FormRegister />
      </Modal>

      {/* Modal: crear usuario staff */}
      <Modal
        isOpen={modalOpen === 'staff'}
        onClose={() => setModalOpen(null)}
        title="Crear Usuario de Staff"
      >
        <StaffCreateModal onClose={() => setModalOpen(null)} />
      </Modal>

      {/* Modal: detalle de examen/análisis */}
      <Modal
        isOpen={!!selectedExam}
        onClose={() => setSelectedExam(null)}
        title={selectedExam?.tipo_examen_nombre?.toUpperCase() || 'Detalle del Análisis'}
      >
        {selectedExam && (
          <div className={modalStyles.form}>
            <p className={styles.infoRow}><strong>Fecha de toma</strong> · {formatFecha(selectedExam.fecha_toma)}</p>
            <p className={styles.infoRow}><strong>Resultado</strong> · {selectedExam.resultado}</p>
            {selectedExam.resultado_numerico != null && (
              <p className={styles.infoRow}>
                <strong>Valor</strong> · {selectedExam.resultado_numerico} {selectedExam.unidad || ''}
              </p>
            )}
            {selectedExam.semana_gestacion != null && (
              <p className={styles.infoRow}><strong>Semana de gestación</strong> · {selectedExam.semana_gestacion}</p>
            )}
            {selectedExam.trimestre != null && (
              <p className={styles.infoRow}><strong>Trimestre</strong> · {selectedExam.trimestre}</p>
            )}
            {selectedExam.observaciones && (
              <p className={styles.infoRow}><strong>Observaciones</strong> · {selectedExam.observaciones}</p>
            )}
            <p className={styles.infoRow}><strong>Registrado</strong> · {formatFecha(selectedExam.created_at)}</p>
          </div>
        )}
      </Modal>

      {/* Modal: signos de alerta */}
      <Modal
        isOpen={showAlertas}
        onClose={() => setShowAlertas(false)}
        title="Signos de Alerta"
      >
        <div className={modalStyles.form}>
          {alarmSigns.length === 0 ? (
            <p className={styles.secDesc} style={{ margin: 0 }}>
              No hay signos de alerta activos para esta paciente.
            </p>
          ) : (
            alarmSigns.map((a) => (
              <div key={a.id} style={{ padding: '12px', background: '#fdeded', borderRadius: '12px', border: '1px solid #f9c0cf' }}>
                <p className={styles.infoRow} style={{ margin: 0 }}><strong>{a.descripcion || 'Sin descripción'}</strong></p>
                <p className={styles.infoRow}><strong>Estado</strong> · {a.estado}</p>
                {a.tipo_alerta && <p className={styles.infoRow}><strong>Tipo</strong> · {a.tipo_alerta}</p>}
                {a.prioridad && <p className={styles.infoRow}><strong>Prioridad</strong> · {a.prioridad}</p>}
                {a.modulo_origen && <p className={styles.infoRow}><strong>Módulo</strong> · {a.modulo_origen}</p>}
                <p className={styles.infoRow}><strong>Fecha</strong> · {formatFecha(a.created_at)}</p>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Modal: signos vitales */}
      <Modal
        isOpen={showVitals}
        onClose={() => setShowVitals(false)}
        title="Historial de Signos Vitales"
      >
        <div className={modalStyles.form} style={{ maxHeight: '70vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {vitals.length === 0 ? (
            <p className={styles.secDesc} style={{ margin: 0 }}>
              No hay registros de signos vitales para esta paciente.
            </p>
          ) : (
            vitals.map((v) => (
              <div key={v.id} style={{ padding: '14px', background: '#fcfcfc', borderRadius: '12px', border: '1px solid #eaeaea', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f0f0f0', paddingBottom: '6px', marginBottom: '8px', color: '#CA436E', fontWeight: 600, fontSize: '13px' }}>
                  <span>Control: {formatFecha(v.fecha_control)}</span>
                  <span>IMC: {v.imc ?? '--'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                  <p className={styles.infoRow} style={{ margin: 0 }}><strong>Tensión Arterial:</strong> {v.presion_sistolica && v.presion_diastolica ? `${v.presion_sistolica}/${v.presion_diastolica} mmHg` : '--'}</p>
                  <p className={styles.infoRow} style={{ margin: 0 }}><strong>FC Fetal (FCF):</strong> {v.fcf ? `${v.fcf} lpm` : '--'}</p>
                  <p className={styles.infoRow} style={{ margin: 0 }}><strong>Peso:</strong> {v.peso_kg ? `${v.peso_kg} kg` : '--'}</p>
                  <p className={styles.infoRow} style={{ margin: 0 }}><strong>Talla:</strong> {v.talla_cm ? `${v.talla_cm} cm` : '--'}</p>
                  <p className={styles.infoRow} style={{ margin: 0 }}><strong>Altura Uterina:</strong> {v.altura_uterina ? `${v.altura_uterina} cm` : '--'}</p>
                  <p className={styles.infoRow} style={{ margin: 0 }}><strong>Est. Nutricional:</strong> {v.estado_nutricional_id ? `ID ${v.estado_nutricional_id}` : '--'}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Modal: historial de cuestionario diario */}
      <Modal
        isOpen={showCuestionario}
        onClose={() => setShowCuestionario(false)}
        title="Cuestionario Diario"
      >
        <div className={modalStyles.form}>
          {dailyHistory.length === 0 ? (
            <p className={styles.secDesc} style={{ margin: 0 }}>
              No hay respuestas registradas para esta paciente.
            </p>
          ) : (
            dailyHistory.map((r) => (
              <div key={r.id} style={{ padding: '12px', background: '#f9f9f9', borderRadius: '12px', border: '1px solid #eee' }}>
                <p className={styles.infoRow} style={{ margin: 0 }}><strong>{r.pregunta_texto}</strong></p>
                <p className={styles.infoRow}><strong>Respuesta</strong> · {formatRespuesta(r)}</p>
                {r.semana_gestacion != null && (
                  <p className={styles.infoRow}><strong>Semana</strong> · {r.semana_gestacion}</p>
                )}
                <p className={styles.infoRow}><strong>Fecha</strong> · {formatFecha(r.created_at)}</p>
              </div>
            ))
          )}
        </div>
      </Modal>

      {/* Modal: checklist de preparación para el parto */}
      <Modal
        isOpen={showChecklist}
        onClose={() => setShowChecklist(false)}
        title="Checklist de Preparación para el Parto"
      >
        <div className={modalStyles.form}>
          {loadingChecklist ? (
            <p className={styles.secDesc} style={{ margin: 0 }}>
              Cargando checklist de la paciente...
            </p>
          ) : checklistItems.length === 0 ? (
            <p className={styles.secDesc} style={{ margin: 0 }}>
              No hay ítems registrados en el checklist de esta paciente.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
              {checklistItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: item.completado ? '#f0fdf4' : '#f9f9f9',
                    borderRadius: '12px',
                    border: item.completado ? '1px solid #bbf7d0' : '1px solid #eee',
                  }}
                >
                  <span
                    style={{
                      fontSize: '18px',
                      color: item.completado ? '#16a34a' : '#ccc',
                      fontWeight: 'bold',
                    }}
                  >
                    {item.completado ? '✓' : '○'}
                  </span>
                  <div style={{ flex: 1 }}>
                    <p className={styles.infoRow} style={{ margin: 0, fontWeight: 500, color: item.completado ? '#14532d' : '#333' }}>
                      {item.texto}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '11px', color: '#666' }}>
                      {item.semana_eg && <span>Semana {item.semana_eg}</span>}
                      {item.fecha_completado && (
                        <span>• Completado el: {formatFecha(item.fecha_completado)}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Modal: generar llamada de emergencia */}
      <Modal
        isOpen={showEmergencia}
        onClose={() => setShowEmergencia(false)}
        title="Generar Llamada de Emergencia"
      >
        <div className={modalStyles.form}>
          {emergenciaSuccess && (
            <div className={modalStyles.successBanner}>
              ✅ Llamada de emergencia registrada
            </div>
          )}

          <div className={modalStyles.field}>
            <label className={modalStyles.label}>Motivo</label>
            <input
              className={modalStyles.input}
              type="text"
              placeholder="Ej. Sangrado abundante"
              value={emergenciaForm.motivo || ''}
              onChange={(e) => setEmergenciaForm(prev => ({ ...prev, motivo: e.target.value }))}
              disabled={emergenciaLoading}
            />
          </div>

          <div className={modalStyles.field}>
            <label className={modalStyles.label}>Destino</label>
            <input
              className={modalStyles.input}
              type="text"
              placeholder="Ej. Hospital de Puerto Colombia"
              value={emergenciaForm.destino || ''}
              onChange={(e) => setEmergenciaForm(prev => ({ ...prev, destino: e.target.value }))}
              disabled={emergenciaLoading}
            />
          </div>

          <div className={modalStyles.field}>
            <label className={modalStyles.label}>Resultado</label>
            <input
              className={modalStyles.input}
              type="text"
              placeholder="Ej. Atendida, en camino..."
              value={emergenciaForm.resultado || ''}
              onChange={(e) => setEmergenciaForm(prev => ({ ...prev, resultado: e.target.value }))}
              disabled={emergenciaLoading}
            />
          </div>

          {emergenciaError && (
            <p className={modalStyles.error}>{emergenciaError}</p>
          )}

          <div className={modalStyles.actions}>
            <button
              type="button"
              className={modalStyles.cancelBtn}
              onClick={() => setShowEmergencia(false)}
              disabled={emergenciaLoading}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={modalStyles.submitBtn}
              onClick={enviarEmergencia}
              disabled={emergenciaLoading}
            >
              {emergenciaLoading ? 'Enviando...' : 'Generar llamada'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal: Registrar Examen */}
      <Modal
        isOpen={showAddExam}
        onClose={() => setShowAddExam(false)}
        title="Registrar Resultado de Examen"
      >
        <form onSubmit={handleCreateExam} className={modalStyles.form}>
          <div className={modalStyles.field}>
            <label className={modalStyles.label}>Tipo de Examen</label>
            <select
              value={addExamForm.tipo_examen_id}
              onChange={e => setAddExamForm({ ...addExamForm, tipo_examen_id: Number(e.target.value) })}
              required
              className={modalStyles.input}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
            >
              <option value={1}>Hemograma</option>
              <option value={2}>Uroanálisis</option>
              <option value={3}>Glucosa en ayunas</option>
              <option value={4}>Serología (VDRL)</option>
              <option value={5}>VIH (Prueba rápida)</option>
              <option value={6}>Toxoplasmosis IgG/IgM</option>
              <option value={7}>Frotis vaginal</option>
              <option value={8}>Cultivo rectal (Estreptococo)</option>
              <option value={9}>Otros laboratorios</option>
            </select>
          </div>

          <div className={modalStyles.field} style={{ marginTop: '12px' }}>
            <label className={modalStyles.label}>Fecha de Toma</label>
            <input
              type="date"
              value={addExamForm.fecha_toma}
              onChange={e => setAddExamForm({ ...addExamForm, fecha_toma: e.target.value })}
              required
              className={modalStyles.input}
            />
          </div>

          <div className={modalStyles.field} style={{ marginTop: '12px' }}>
            <label className={modalStyles.label}>Resultado cualitativo</label>
            <input
              type="text"
              value={addExamForm.resultado}
              onChange={e => setAddExamForm({ ...addExamForm, resultado: e.target.value })}
              required
              placeholder="Ej: Normal, Negativo, Reactivo"
              className={modalStyles.input}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <div className={modalStyles.field} style={{ flex: 1 }}>
              <label className={modalStyles.label}>Valor numérico (opcional)</label>
              <input
                type="number"
                step="any"
                value={addExamForm.resultado_numerico}
                onChange={e => setAddExamForm({ ...addExamForm, resultado_numerico: e.target.value })}
                placeholder="Ej: 12.5"
                className={modalStyles.input}
              />
            </div>
            <div className={modalStyles.field} style={{ flex: 1 }}>
              <label className={modalStyles.label}>Unidad (opcional)</label>
              <input
                type="text"
                value={addExamForm.unidad}
                onChange={e => setAddExamForm({ ...addExamForm, unidad: e.target.value })}
                placeholder="Ej: g/dL, mg/dL"
                className={modalStyles.input}
              />
            </div>
          </div>

          <div className={modalStyles.field} style={{ marginTop: '12px' }}>
            <label className={modalStyles.label}>Semana de Gestación (opcional)</label>
            <input
              type="number"
              min="0"
              max="50"
              value={addExamForm.semana_gestacion}
              onChange={e => setAddExamForm({ ...addExamForm, semana_gestacion: e.target.value })}
              placeholder="Ej: 12"
              className={modalStyles.input}
            />
          </div>

          <div className={modalStyles.field} style={{ marginTop: '12px' }}>
            <label className={modalStyles.label}>Observaciones (opcional)</label>
            <textarea
              value={addExamForm.observaciones}
              onChange={e => setAddExamForm({ ...addExamForm, observaciones: e.target.value })}
              placeholder="Detalles adicionales..."
              rows={3}
              className={modalStyles.input}
              style={{ height: 'auto', fontFamily: 'inherit' }}
            />
          </div>

          {addExamError && (
            <p className={modalStyles.error} style={{ marginTop: '10px' }}>{addExamError}</p>
          )}

          <div className={modalStyles.actions} style={{ marginTop: '18px' }}>
            <button
              type="button"
              onClick={() => setShowAddExam(false)}
              className={modalStyles.cancelBtn}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={addExamLoading}
              className={modalStyles.submitBtn}
              style={{ background: '#CA436E' }}
            >
              {addExamLoading ? 'Registrando...' : 'Registrar Examen'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Solicitudes de Activación de Login Pendientes */}
      <Modal
        isOpen={showActivationsModal}
        onClose={() => setShowActivationsModal(false)}
        title="Solicitudes de Activación de Login Pendientes"
      >
        <div style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '5px' }}>
          {pendingActivations.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#666', margin: '20px 0' }}>
              No hay solicitudes de activación pendientes en este momento.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pendingActivations.map((sol) => (
                <div 
                  key={sol.id} 
                  style={{
                    padding: '14px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '10px',
                    background: '#f9fafb',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', color: '#CA436E', fontSize: '14px' }}>
                      {sol.codigo_gmi}
                    </span>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>
                      {new Date(sol.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#4b5563' }}>
                    <strong>Pregunta:</strong> "{sol.pregunta}"
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '6px', alignSelf: 'flex-end' }}>
                    <button
                      type="button"
                      disabled={isResolvingId === sol.id}
                      onClick={() => handleResolveActivation(sol.id, sol.codigo_gmi, false)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                        background: 'white',
                        color: '#374151',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        Rechazar <XCircleIcon size={12} color="#374151" />
                      </span>
                    </button>
                    <button
                      type="button"
                      disabled={isResolvingId === sol.id}
                      onClick={() => handleResolveActivation(sol.id, sol.codigo_gmi, true)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: '#CA436E',
                        color: 'white',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      {isResolvingId === sol.id ? (
                        'Procesando...'
                      ) : (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          Aprobar <CheckCircleIcon size={12} color="white" />
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => setShowActivationsModal(false)}
              className={modalStyles.cancelBtn}
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};