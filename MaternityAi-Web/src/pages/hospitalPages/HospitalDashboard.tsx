import { useState, useEffect, useRef, useCallback } from 'react';
import { HeaderActividad } from '../../components/Headers/HeaderActividad/HeaderActividad';
import {
  getGestantes,
  getGestanteAlarmSigns,
  getGestanteExams,
  getGestanteVitals,
  createGestanteEmergencyCall,
  type AlertaAdminResponse,
  type ExamenResponse,
  type SignosVitalesResponse,
} from '../../services/adminService';
import {
  getObstetricFormula,
  getPathologicalHistory,
  type ObstetricFormula as IObstetricFormula,
  type PathologicalHistory as IPathologicalHistory,
} from '../../services/m0Service';
import styles from './HospitalDashboard.module.css';
import { resolveAlerta } from '../../services/iaService';
import { calculateCurrentWeeks } from '../../utils/gestationalAgeUtils';

// Interface representing an active consolidated alert card on the hospital side
interface ActiveHospitalAlert {
  id: string;
  patientId: string;
  codigoGmi: string;
  descripcion: string;
  estado: string;
  prioridad: 'Crítica' | 'Moderada' | 'Informativa';
  nivelRiesgo: 'Alto' | 'Medio' | 'Bajo';
  semanaGestacion: number;
  tipoAlerta: string;
  createdAt: string;
  moduloOrigen?: string;
  assessmentId?: string;
}

// Preset simulation alerts
const SIMULATION_ALERTS = [
  {
    codigoGmi: 'GMI-9821',
    descripcion: 'Pérdida de líquido amniótico y contracciones uterinas regulares en semana 32.',
    prioridad: 'Crítica' as const,
    nivelRiesgo: 'Alto' as const,
    semanaGestacion: 32,
    tipoAlerta: 'Ruptura Prematura de Membranas',
  },
  {
    codigoGmi: 'GMI-5412',
    descripcion: 'Paciente reporta sangrado vaginal de moderada intensidad con dolor abdominal continuo.',
    prioridad: 'Crítica' as const,
    nivelRiesgo: 'Alto' as const,
    semanaGestacion: 26,
    tipoAlerta: 'Sangrado Vaginal / Desprendimiento',
  },
  {
    codigoGmi: 'GMI-1290',
    descripcion: 'Cefalea intensa constante que no cede con analgésicos más fosfenos y zumbido de oídos.',
    prioridad: 'Crítica' as const,
    nivelRiesgo: 'Alto' as const,
    semanaGestacion: 35,
    tipoAlerta: 'Sospecha de Preeclampsia',
  },
  {
    codigoGmi: 'GMI-4378',
    descripcion: 'Disminución marcada de movimientos fetales (menos de 6 movimientos en 2 horas).',
    prioridad: 'Crítica' as const,
    nivelRiesgo: 'Alto' as const,
    semanaGestacion: 29,
    tipoAlerta: 'Alteración de Bienestar Fetal',
  },
  {
    codigoGmi: 'GMI-7843',
    descripcion: 'Reporte diario: Fiebre mayor a 38.3 °C acompañada de escalofríos y malestar general.',
    prioridad: 'Moderada' as const,
    nivelRiesgo: 'Medio' as const,
    semanaGestacion: 19,
    tipoAlerta: 'Síndrome Febril',
  },
];

export const HospitalDashboard = () => {
  const [alerts, setAlerts] = useState<ActiveHospitalAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'moderate' | 'informative'>('all');
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Drawer states
  const [selectedAlert, setSelectedAlert] = useState<ActiveHospitalAlert | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [patientExams, setPatientExams] = useState<ExamenResponse[]>([]);
  const [patientVitals, setPatientVitals] = useState<SignosVitalesResponse[]>([]);
  const [patientFormula, setPatientFormula] = useState<IObstetricFormula | null>(null);
  const [patientPathology, setPatientPathology] = useState<IPathologicalHistory[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [resolutionObservations, setResolutionObservations] = useState('');
  // Audio configuration ref
  const audioContextRef = useRef<AudioContext | null>(null);

  // Sound chime synthesizer using Web Audio API
  const playEmergencyChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Digital double-beep
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(920, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc1.start(now);
      osc1.stop(now + 0.35);

      setTimeout(() => {
        const now2 = ctx.currentTime;
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1100, now2);
        gain2.gain.setValueAtTime(0, now2);
        gain2.gain.linearRampToValueAtTime(0.18, now2 + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now2 + 0.35);
        osc2.start(now2);
        osc2.stop(now2 + 0.35);
      }, 160);

    } catch (err) {
      console.error('Failed to synthesize emergency chime:', err);
    }
  }, [soundEnabled]);

  // Load and consolidate alerts from backend
  const loadAlerts = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const gestantes = await getGestantes();
      const activeAlertList: ActiveHospitalAlert[] = [];

      // Filter gestantes with active alerts and load details
      const patientPromises = gestantes.map(async (g) => {
        // If gestante is active and either has level of risk high, or active alerts
        if (g.ultimo_estado_alerta === 'activa' || g.nivel_riesgo === 'alto' || (g.ultima_prioridad_alerta_id && g.ultima_prioridad_alerta_id >= 3)) {
          let alarmSigns: AlertaAdminResponse[] = [];
          try {
            alarmSigns = await getGestanteAlarmSigns(g.id);
          } catch {
            // Fallback mock alarm sign if none in database but patient is in risk
            alarmSigns = [{
              id: `alert-fallback-${g.id}`,
              descripcion: g.ultimo_estado_alerta ? 'Paciente reporta signo de alarma en monitoreo diario.' : 'Embarazo clasificado de alto riesgo obstétrico.',
              estado: 'activa',
              prioridad: g.nivel_riesgo === 'alto' ? 'Alta' : 'Media',
              created_at: g.created_at || new Date().toISOString()
            }];
          }

          alarmSigns.forEach((sign) => {
            const mappedPrio: 'Crítica' | 'Moderada' | 'Informativa' =
              sign.prioridad === 'Alta' || sign.prioridad === 'Critica' || g.nivel_riesgo === 'alto' ? 'Crítica' :
                sign.prioridad === 'Media' || sign.prioridad === 'Moderada' ? 'Moderada' : 'Informativa';

            activeAlertList.push({
              id: sign.id || `alert-${g.id}`,
              patientId: g.id,
              codigoGmi: g.codigo_gmi,
              descripcion: sign.descripcion || 'Sin descripción',
              estado: sign.estado || 'activa',
              prioridad: mappedPrio,
              nivelRiesgo: g.nivel_riesgo === 'alto' ? 'Alto' : g.nivel_riesgo === 'medio' ? 'Medio' : 'Bajo',
              semanaGestacion: calculateCurrentWeeks(g.fecha_ultima_menstruacion) || 12,
              tipoAlerta: sign.tipo_alerta || 'Alerta Obstétrica',
              createdAt: sign.created_at || new Date().toISOString(),
              moduloOrigen: (sign as any).modulo_origen || 'seguimiento',
              assessmentId: (sign as any).clasificacion_riesgo_id || (sign as any).assessment_id,
            });
          });
        }
      });

      await Promise.all(patientPromises);

      // Sort by date desc
      activeAlertList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setAlerts((prevAlerts) => {
        // Check if there are new alerts to trigger sound
        const newSimsCount = prevAlerts.filter(a => a.id.startsWith('sim-')).length;
        const realCount = activeAlertList.length;
        const prevRealCount = prevAlerts.length - newSimsCount;

        if (realCount > prevRealCount && prevRealCount > 0) {
          playEmergencyChime();
          showToast('¡Nueva Alerta Obstétrica Recibida!');
        }

        // Merge simulated alerts that aren't resolved yet
        const simulatedList = prevAlerts.filter(a => a.id.startsWith('sim-'));
        const merged = [...simulatedList, ...activeAlertList];
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return merged;
      });

    } catch (err) {
      console.error('Failed to load alert monitoring feed:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [playEmergencyChime]);

  // Initial load
  useEffect(() => {
    loadAlerts();

    // Immediate reception simulation - poll backend every 8 seconds
    const interval = setInterval(() => {
      loadAlerts(true);
    }, 8000);

    return () => clearInterval(interval);
  }, [loadAlerts]);

  // Handle Toast notification popup
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Enable sound listener interaction helper
  const handleToggleSound = () => {
    setSoundEnabled(prev => {
      const next = !prev;
      if (next) {
        // Initialize AudioContext on first user interaction
        try {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          audioContextRef.current = new AudioContextClass();
          // Synthesize short test sound so user knows it's active
          const osc = audioContextRef.current.createOscillator();
          const gain = audioContextRef.current.createGain();
          osc.connect(gain);
          gain.connect(audioContextRef.current.destination);
          gain.gain.setValueAtTime(0.08, audioContextRef.current.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, audioContextRef.current.currentTime + 0.15);
          osc.start();
          osc.stop(audioContextRef.current.currentTime + 0.15);
        } catch (e) {
          console.error(e);
        }
      }
      return next;
    });
  };

  // Simulate alert injector (client side demo)
  const handleSimulateAlert = () => {
    const randomIndex = Math.floor(Math.random() * SIMULATION_ALERTS.length);
    const mock = SIMULATION_ALERTS[randomIndex];

    const newSimAlert: ActiveHospitalAlert = {
      id: `sim-${Date.now()}`,
      patientId: `sim-patient-${Date.now()}`,
      codigoGmi: mock.codigoGmi,
      descripcion: mock.descripcion,
      estado: 'activa',
      prioridad: mock.prioridad,
      nivelRiesgo: mock.nivelRiesgo,
      semanaGestacion: mock.semanaGestacion,
      tipoAlerta: mock.tipoAlerta,
      createdAt: new Date().toISOString(),
    };

    setAlerts(prev => [newSimAlert, ...prev]);
    playEmergencyChime();
    showToast(`Alerta Crítica Recibida: Paciente ${mock.codigoGmi}`);
  };

  // Open side drawer details for selected patient
  const handleOpenDetails = async (alert: ActiveHospitalAlert) => {
    setSelectedAlert(alert);
    setDrawerOpen(true);
    setLoadingDetails(true);

    // Save patient ID to local storage so standard hooks/services query it automatically
    localStorage.setItem('selected_gestante_gmi', alert.codigoGmi);
    localStorage.setItem('selected_gestante_id', alert.patientId);

    try {
      const [examsData, formulaData, pathologyData, vitalsData] = await Promise.all([
        getGestanteExams(alert.patientId).catch(() => [] as ExamenResponse[]),
        getObstetricFormula().catch(() => null),
        getPathologicalHistory().catch(() => [] as IPathologicalHistory[]),
        getGestanteVitals(alert.patientId).catch(() => [] as SignosVitalesResponse[]),
      ]);

      setPatientExams(examsData);
      setPatientFormula(formulaData);
      setPatientPathology(pathologyData);
      setPatientVitals(vitalsData);
    } catch (err) {
      console.error('Failed to load patient clinical file details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Mark alert as Attended / Resolved
  const handleResolveAlert = async () => {
    if (!selectedAlert) return;
    try {
      // Call mock or real backend resolve
      if (!selectedAlert.id.startsWith('sim-')) {
        try {
          if (selectedAlert.moduloOrigen === 'IA') {
            await resolveAlerta(selectedAlert.id, resolutionObservations);
          } else {
            // Acknowledge in clinical/m6 services
            const m6Service = await import('../../services/m6Service');
            await m6Service.acknowledgeAlerta(selectedAlert.id);
          }
        } catch (e) {
          console.warn('Backend resolution endpoint failed, resolving in client interface:', e);
        }
      }

      // Remove alert from current dashboard state list
      setAlerts(prev => prev.filter(a => a.id !== selectedAlert.id));
      setDrawerOpen(false);
      setSelectedAlert(null);
      setResolutionObservations('');
      showToast('✅ Alerta Obstétrica marcada como Atendida.');
    } catch (err) {
      console.error(err);
    }
  };

  // Filter alerts by search query and category tab selection
  const filteredAlerts = alerts.filter(a => {
    const matchesSearch =
      a.codigoGmi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tipoAlerta.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.descripcion.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      activeFilter === 'all' ? true :
        activeFilter === 'critical' ? a.prioridad === 'Crítica' :
          activeFilter === 'moderate' ? a.prioridad === 'Moderada' :
            a.prioridad === 'Informativa';

    return matchesSearch && matchesFilter;
  });

  // Count summaries
  const criticalCount = alerts.filter(a => a.prioridad === 'Crítica').length;
  const moderateCount = alerts.filter(a => a.prioridad === 'Moderada').length;
  const totalCount = alerts.length;

  const getPriorityClass = (prio: string) => {
    if (prio === 'Crítica') return styles.prioCritica;
    if (prio === 'Moderada') return styles.prioModerada;
    return styles.prioInformativa;
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const min = d.getMinutes().toString().padStart(2, '0');
    const hr = d.getHours().toString().padStart(2, '0');
    return `${hr}:${min}`;
  };

  return (
    <div className={styles.root}>
      <HeaderActividad rol="hospital" tabActivo="Alertas" />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={styles.toastNotification}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className={styles.container}>

        {/* Metric widgets */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ color: '#ff4b72' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div className={styles.metricInfo}>
              <h3>Alertas Totales</h3>
              <p className={styles.metricValue}>{totalCount}</p>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ color: '#ff4b72' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className={styles.metricInfo}>
              <h3>Alertas Críticas</h3>
              <p className={styles.metricValue}>{criticalCount}</p>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ color: '#f59e0b' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className={styles.metricInfo}>
              <h3>Alertas Moderadas</h3>
              <p className={styles.metricValue}>{moderateCount}</p>
            </div>
          </div>
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{ color: '#0284c7' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div className={styles.metricInfo}>
              <h3>En Canal de Escucha</h3>
              <p className={styles.metricValue}>Hospital Puerto Colombia</p>
            </div>
          </div>
        </div>

        {/* Dashboard Control Bar */}
        <div className={styles.controlRow}>
          <div className={styles.titleSection}>
            <h2>
              <span className={styles.liveDot}></span>
              Monitoreo Inmediato de Alertas Obstétricas
            </h2>
            <p>Canal exclusivo de recepción inmediata y despacho de ambulancias en Soledad / Puerto Colombia</p>
          </div>
          <div className={styles.actionsSection}>
            <button
              className={`${styles.soundBtn} ${soundEnabled ? styles.soundBtnActive : ''}`}
              onClick={handleToggleSound}
            >
              {soundEnabled ? (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                  <span>Sonido Activado</span>
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                  <span>Sonido Silenciado</span>
                </>
              )}
            </button>
            <button
              className={styles.simulateBtn}
              onClick={handleSimulateAlert}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>Simular Alerta de Emergencia</span>
            </button>
          </div>
        </div>

        {/* Dashboard core grid */}
        <div className={styles.dashboardGrid}>

          {/* Filters Sidebar */}
          <div className={styles.sidebarFilter}>
            <div className={styles.filterGroup}>
              <h4 className={styles.filterTitle}>Buscar Paciente</h4>
              <div className={styles.searchWrapper}>
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="ID-GMI o síntoma..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <svg className={styles.searchIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
            </div>

            <div className={styles.filterGroup}>
              <h4 className={styles.filterTitle}>Filtrar por Prioridad</h4>
              <button
                className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.filterBtnActive : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                <span>Todas las Alertas</span>
                <span className={styles.filterBadge}>{alerts.length}</span>
              </button>
              <button
                className={`${styles.filterBtn} ${activeFilter === 'critical' ? styles.filterBtnActive : ''}`}
                onClick={() => setActiveFilter('critical')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#ff4b72" stroke="none">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  Críticas
                </span>
                <span className={styles.filterBadge}>{criticalCount}</span>
              </button>
              <button
                className={`${styles.filterBtn} ${activeFilter === 'moderate' ? styles.filterBtnActive : ''}`}
                onClick={() => setActiveFilter('moderate')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  Moderadas
                </span>
                <span className={styles.filterBadge}>{moderateCount}</span>
              </button>
            </div>
          </div>

          {/* Active alerts feed list */}
          <div className={styles.alertsFeed}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: '#ff4b72', fontSize: '18px', fontWeight: 600 }}>
                Cargando feed de monitoreo...
              </div>
            ) : filteredAlerts.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon} style={{ color: '#10b981', display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h3>Sin alertas activas</h3>
                <p>Todas las pacientes gestantes se encuentran estables en este momento.</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const isCritica = alert.prioridad === 'Crítica';
                const isModerada = alert.prioridad === 'Moderada';
                let styleClass = styles.alertInformativa;
                if (isCritica) styleClass = styles.alertCritica;
                else if (isModerada) styleClass = styles.alertModerada;

                const isSelected = selectedAlert?.id === alert.id;

                return (
                  <div
                    key={alert.id}
                    className={`${styles.alertCard} ${styleClass} ${isSelected ? styles.alertSelected : ''}`}
                    onClick={() => handleOpenDetails(alert)}
                  >
                    <div className={styles.alertCardHeader}>
                      <span className={styles.patientCode}>{alert.codigoGmi}</span>
                      <div className={styles.badgeGroup}>
                        <span className={`${styles.prioTag} ${getPriorityClass(alert.prioridad)}`}>
                          {alert.prioridad}
                        </span>
                        <span className={styles.gestationInfo}>Semana {alert.semanaGestacion} EG</span>
                      </div>
                    </div>

                    <p className={styles.cardBody}>
                      <strong>{alert.tipoAlerta}</strong>: {alert.descripcion}
                    </p>

                    <div className={styles.cardFooter}>
                      <span className={styles.timeAgo}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', display: 'inline-block', verticalAlign: 'middle' }}>
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        Recibida a las {formatTime(alert.createdAt)}
                      </span>
                      <span style={{
                        color: alert.nivelRiesgo === 'Alto' ? '#ff4b72' : alert.nivelRiesgo === 'Medio' ? '#f59e0b' : '#10b981',
                        fontWeight: 600,
                        fontSize: '11px'
                      }}>
                        Riesgo Obstetrico: {alert.nivelRiesgo}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Side Slide-in Clinical Drawer */}
      <div
        className={`${styles.drawerOverlay} ${drawerOpen ? styles.drawerOverlayOpen : ''}`}
        onClick={() => setDrawerOpen(false)}
      />

      <div className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.drawerHeader}>
          {selectedAlert && (
            <div className={styles.drawerHeaderTitle}>
              <h2>Expediente: {selectedAlert.codigoGmi}</h2>
              <p>Monitoreo Clínico en Curso</p>
            </div>
          )}
          <button className={styles.closeBtn} onClick={() => setDrawerOpen(false)}>✕</button>
        </div>

        <div className={styles.drawerContent}>
          {loadingDetails ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px', color: '#ff4b72' }}>
              Cargando historial clínico...
            </div>
          ) : selectedAlert ? (
            <>
              {/* Alert overview */}
              <div className={styles.sectionCard} style={{ borderLeft: '4px solid #ff4b72', background: 'rgba(255, 75, 114, 0.03)' }}>
                <h4 className={styles.sectionTitle} style={{ color: '#ff4b72', margin: 0 }}>Alerta Activa</h4>
                <p style={{ margin: '8px 0 0 0', fontSize: '13px', lineHeight: 1.5 }}>
                  <strong>{selectedAlert.tipoAlerta}</strong>: {selectedAlert.descripcion}
                </p>
                <div style={{ marginTop: '10px', fontSize: '11px', color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Recibida: {new Date(selectedAlert.createdAt).toLocaleString()}</span>
                  <span style={{ color: '#ff4b72', fontWeight: 600 }}>Prioridad: {selectedAlert.prioridad}</span>
                </div>
              </div>

              {/* Patient general data */}
              <div className={styles.sectionCard}>
                <h4 className={styles.sectionTitle}>Ficha General</h4>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <label>Semanas de Gestación</label>
                    <span>{selectedAlert.semanaGestacion} semanas (EG)</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>Riesgo Obstétrico</label>
                    <span style={{ color: selectedAlert.nivelRiesgo === 'Alto' ? '#ff4b72' : '#f59e0b' }}>
                      {selectedAlert.nivelRiesgo}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>IPS Asignada</label>
                    <span>Ese Hospital Local</span>
                  </div>
                  <div className={styles.infoItem}>
                    <label>ID Paciente</label>
                    <span style={{ fontSize: '12px', wordBreak: 'break-all' }}>{selectedAlert.patientId}</span>
                  </div>
                </div>
              </div>

              {/* Obstetric formula */}
              <div className={styles.sectionCard}>
                <h4 className={styles.sectionTitle}>Fórmula Obstétrica</h4>
                <div className={styles.obstetricGrid}>
                  <div className={styles.obstetricItem}>
                    <span className={styles.obsValue}>{patientFormula?.gestaciones ?? 1}</span>
                    <span className={styles.obsLabel}>G (Gest)</span>
                  </div>
                  <div className={styles.obstetricItem}>
                    <span className={styles.obsValue}>{patientFormula?.partos ?? 1}</span>
                    <span className={styles.obsLabel}>P (Part)</span>
                  </div>
                  <div className={styles.obstetricItem}>
                    <span className={styles.obsValue}>{patientFormula?.cesareas ?? 0}</span>
                    <span className={styles.obsLabel}>C (Ces)</span>
                  </div>
                  <div className={styles.obstetricItem}>
                    <span className={styles.obsValue}>{patientFormula?.abortos ?? 0}</span>
                    <span className={styles.obsLabel}>A (Ab)</span>
                  </div>
                  <div className={styles.obstetricItem}>
                    <span className={styles.obsValue}>{patientFormula?.vivos ?? 1}</span>
                    <span className={styles.obsLabel}>V (Viv)</span>
                  </div>
                  <div className={styles.obstetricItem}>
                    <span className={styles.obsValue}>{patientFormula?.mortinatos ?? 0}</span>
                    <span className={styles.obsLabel}>M (Mort)</span>
                  </div>
                </div>
              </div>

              {/* Pathological history */}
              <div className={styles.sectionCard}>
                <h4 className={styles.sectionTitle}>Antecedentes Clínicos</h4>
                {patientPathology.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>No registra antecedentes patológicos de riesgo.</p>
                ) : (
                  <div className={styles.pathologyList}>
                    {patientPathology.map((p) => (
                      <div key={p.id} className={styles.pathologyItem}>
                        <div className={styles.pathologyItemHeader}>
                          <span>{p.tipo_condicion}</span>
                          <span style={{ color: p.controlada ? '#10b981' : '#f59e0b' }}>
                            {p.controlada ? 'Controlada' : 'Sin Control'}
                          </span>
                        </div>
                        {p.descripcion && <p className={styles.pathologyDesc}>{p.descripcion}</p>}
                        {p.tratamiento_actual && (
                          <p className={styles.pathologyDesc} style={{ color: '#444', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--rose-vibrant)' }}>
                              <path d="m10.5 20.5 10-10a4.95 4.95 0 0 0-7-7l-10 10a4.95 4.95 0 0 0 7 7Z" />
                              <path d="m8.5 8.5 7 7" />
                            </svg>
                            Tratamiento: {p.tratamiento_actual}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Signos Vitales */}
              <div className={styles.sectionCard}>
                <h4 className={styles.sectionTitle}>Signos Vitales Recientes</h4>
                {patientVitals.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>No registra controles de signos vitales en el expediente.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {patientVitals.slice(0, 3).map((v) => (
                      <div key={v.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px', marginBottom: '6px', color: '#ff4b72' }}>
                          <span>Control: {v.fecha_control ? new Date(v.fecha_control).toLocaleDateString() : 'N/A'}</span>
                          <span>IMC: {v.imc ?? '--'}</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px', color: '#9ca3af' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <strong>P. Arterial:</strong> <span style={{ color: '#f3f4f6' }}>{v.presion_sistolica && v.presion_diastolica ? `${v.presion_sistolica}/${v.presion_diastolica}` : '--'}</span>
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <strong>FC Fetal:</strong> <span style={{ color: '#f3f4f6' }}>{v.fcf ? `${v.fcf} lpm` : '--'}</span>
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <strong>Peso:</strong> <span style={{ color: '#f3f4f6' }}>{v.peso_kg ? `${v.peso_kg} kg` : '--'}</span>
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <strong>Alt. Uterina:</strong> <span style={{ color: '#f3f4f6' }}>{v.altura_uterina ? `${v.altura_uterina} cm` : '--'}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Exámenes de Laboratorio */}
              <div className={styles.sectionCard}>
                <h4 className={styles.sectionTitle}>Exámenes de Laboratorio</h4>
                {patientExams.length === 0 ? (
                  <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>No registra exámenes cargados en el expediente.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {patientExams.slice(0, 3).map((e) => (
                      <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '12px' }}>
                        <span style={{ fontWeight: 600 }}>{(e.tipo_examen_nombre || 'Examen').toUpperCase()}</span>
                        <span style={{ color: '#10b981' }}>{e.resultado}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Observaciones de Resolución */}
              <div className={styles.sectionCard} style={{ marginTop: '16px', borderLeft: '4px solid #10b981', background: 'rgba(16, 185, 129, 0.03)' }}>
                <h4 className={styles.sectionTitle} style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Resolución Clínica / Observaciones
                </h4>
                <textarea
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    marginTop: '10px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    background: '#ffffff',
                    color: '#1f2937',
                    fontSize: '13px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Escribe aquí las observaciones clínicas sobre la resolución de esta alerta (ej: Se contactó con la paciente para seguimiento, se programó cita urgente)..."
                  value={resolutionObservations}
                  onChange={(e) => setResolutionObservations(e.target.value)}
                />
              </div>
            </>
          ) : null}
        </div>

        {selectedAlert && (
          <div className={styles.drawerFooter}>
            <button className={styles.resolveBtn} onClick={handleResolveAlert}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Marcar Atendida</span>
            </button>
            <button
              className={styles.dispatchBtn}
              onClick={async () => {
                try {
                  showToast(`Iniciando despacho de ambulancia para ${selectedAlert.codigoGmi}...`);
                  await createGestanteEmergencyCall(selectedAlert.patientId, {
                    motivo: `Despacho de emergencia por alerta: ${selectedAlert.tipoAlerta}. ${selectedAlert.descripcion}`,
                    destino: "Hospital Local de Soledad",
                    resultado: "Despachada"
                  });
                  showToast(`✅ Unidad móvil despachada al Hospital Local de Soledad para paciente ${selectedAlert.codigoGmi}`);
                  handleResolveAlert();
                } catch (error) {
                  console.error("Error al registrar llamada de emergencia:", error);
                  showToast(`⚠️ Despacho registrado sin base de datos local (Modo demostración).`);
                  setDrawerOpen(false);
                }
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>Despachar Ambulancia</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
