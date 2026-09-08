import { useState, useEffect } from 'react';
import { HeaderActividad } from '../../components/Headers/HeaderActividad/HeaderActividad';
import { Modal } from '../../components/Modal';
import styles from '../../components/admin/AdminCitas.module.css';
import modalStyles from './StaffModal.module.css';
import {
  getGestantes,
  getAppointments,
  createAppointment,
  reprogramarAppointment,
  confirmarAppointment,
  cancelarAppointment,
  type GestanteResponse,
  type CitaAdminResponse,
} from '../../services/adminService';

import { calculateCurrentWeeks, getFaseOrTrimestre } from '../../utils/gestationalAgeUtils';

const DIAS_SEMANA = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const TIPOS_CITA = [
  'Control Prenatal',
  'Ecografía Obstétrica',
  'Monitoreo Fetal',
  'Consulta Nutricional',
  'Laboratorios',
  'Otro',
];

const pad = (n: number) => String(n).padStart(2, '0');

const toISODate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const toDatetimeLocal = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatHora = (iso: string) => {
  const d = new Date(iso);
  let h = d.getHours();
  const m = pad(d.getMinutes());
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${pad(h)}:${m} ${ampm}`;
};

const formatFechaCorta = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`;
};

const ESTADOS_SOLICITUD = ['pendiente', 'programada'];

const estadoLabel = (estado: string) => {
  switch (estado) {
    case 'pendiente':
    case 'programada':
      return 'Pendiente';
    case 'confirmada':
      return 'Confirmada';
    case 'cancelada':
      return 'Cancelada';
    default:
      return estado;
  }
};

const estadoBadgeClass = (estado: string) => {
  switch (estado) {
    case 'pendiente':
    case 'programada':
      return `${styles.estadoBadge} ${styles.estadoPendiente}`;
    case 'confirmada':
      return `${styles.estadoBadge} ${styles.estadoConfirmada}`;
    case 'cancelada':
      return `${styles.estadoBadge} ${styles.estadoCancelada}`;
    default:
      return styles.estadoBadge;
  }
};

interface DiaCalendario {
  date: Date;
  enMes: boolean;
}

const buildMonthGrid = (year: number, month: number): DiaCalendario[][] => {
  const firstOfMonth = new Date(year, month, 1);
  const firstDayIndex = (firstOfMonth.getDay() + 6) % 7; // Lunes = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = firstDayIndex + daysInMonth;
  const weeksCount = Math.ceil(totalCells / 7);

  const startDate = new Date(year, month, 1 - firstDayIndex);
  const weeks: DiaCalendario[][] = [];

  for (let w = 0; w < weeksCount; w++) {
    const week: DiaCalendario[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + w * 7 + d);
      week.push({ date, enMes: date.getMonth() === month });
    }
    weeks.push(week);
  }

  return weeks;
};

const MATERNAS_POR_PAGINA = 10;

const EMPTY_NUEVA_CITA = {
  gestante_id: '',
  fecha: '',
  hora: '',
  tipo_cita: TIPOS_CITA[0],
};

export const AdminCitas = () => {
  const [gestantes, setGestantes] = useState<GestanteResponse[]>([]);
  const [citas, setCitas] = useState<CitaAdminResponse[]>([]);
  const [proximas, setProximas] = useState<CitaAdminResponse[]>([]);
  const [solicitudes, setSolicitudes] = useState<CitaAdminResponse[]>([]);
  const [solicitudesError, setSolicitudesError] = useState<string | null>(null);
  const [quickActionId, setQuickActionId] = useState<string | null>(null);
  const [quickActionError, setQuickActionError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [paginaMaternas, setPaginaMaternas] = useState(1);
  const [selPaciente, setSelPaciente] = useState<string | null>(() => {
    return localStorage.getItem('selected_gestante_gmi') || 'XYZ1002';
  });

  useEffect(() => {
    if (selPaciente && selPaciente !== 'XYZ1002') {
      localStorage.setItem('selected_gestante_gmi', selPaciente);
      const g = gestantes.find(p => p.codigo_gmi === selPaciente);
      if (g) {
        localStorage.setItem('selected_gestante_id', g.id);
      }
    }
  }, [selPaciente, gestantes]);

  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ─── Modal Nueva Cita ───────────────────────────────────────────────────
  const [showNuevaCita, setShowNuevaCita] = useState(false);
  const [nuevaCitaForm, setNuevaCitaForm] = useState(EMPTY_NUEVA_CITA);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // ─── Modal Gestionar Cita ───────────────────────────────────────────────
  const [selectedCita, setSelectedCita] = useState<CitaAdminResponse | null>(null);
  const [reprogramarFecha, setReprogramarFecha] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchGestantes = async () => {
    try {
      const data = await getGestantes({ page: 1, size: 100 });
      setGestantes(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchCitasMes = async () => {
    setErrorMsg(null);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const from = toISODate(new Date(year, month, 1));
      const to = toISODate(new Date(year, month + 1, 0));
      const data = await getAppointments({ from, to });
      setCitas(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Error al cargar las citas del mes.');
    }
  };

  const fetchProximas = async () => {
    try {
      const from = toISODate(new Date());
      const data = await getAppointments({ from });
      const ordenadas = [...data].sort(
        (a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()
      );
      setProximas(ordenadas.slice(0, 6));
    } catch (err: any) {
      console.error(err);
    }
  };

  const fetchSolicitudes = async () => {
    setSolicitudesError(null);
    try {
      const from = toISODate(new Date());
      const data = await getAppointments({ from });
      const activas = data
        .filter(c => ESTADOS_SOLICITUD.includes(c.estado) || c.estado === 'cancelada')
        .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime());
      setSolicitudes(activas);
    } catch (err: any) {
      console.error(err);
      setSolicitudesError('Error al cargar las solicitudes de citas.');
    }
  };

  useEffect(() => {
    fetchGestantes();
    fetchProximas();
    fetchSolicitudes();
  }, []);

  useEffect(() => {
    fetchCitasMes();
  }, [currentDate]);

  const refrescarCitas = async () => {
    await Promise.all([fetchCitasMes(), fetchProximas(), fetchSolicitudes()]);
  };

  const quickConfirmar = async (id: string) => {
    setQuickActionId(id);
    setQuickActionError(null);
    try {
      await confirmarAppointment(id);
      await refrescarCitas();
    } catch (err: any) {
      console.error(err);
      setQuickActionError('Error al confirmar la cita.');
    } finally {
      setQuickActionId(null);
    }
  };

  const quickCancelar = async (id: string) => {
    setQuickActionId(id);
    setQuickActionError(null);
    try {
      await cancelarAppointment(id);
      await refrescarCitas();
    } catch (err: any) {
      console.error(err);
      setQuickActionError('Error al cancelar la cita.');
    } finally {
      setQuickActionId(null);
    }
  };

  const cambiarMes = (delta: number) => {
    setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + delta, 1));
  };

  const filtrados = gestantes
    .filter(g => g.codigo_gmi.toLowerCase().includes(busqueda.toLowerCase()))
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

  useEffect(() => {
    setPaginaMaternas(1);
  }, [busqueda]);

  const citasPorDia = new Set(citas.map(c => toISODate(new Date(c.fecha_hora))));
  const todayISO = toISODate(new Date());
  const grid = buildMonthGrid(currentDate.getFullYear(), currentDate.getMonth());

  // ─── Nueva Cita ─────────────────────────────────────────────────────────

  const iniciarNuevaCita = () => {
    const sel = gestantes.find(g => g.codigo_gmi === selPaciente);
    setNuevaCitaForm({ ...EMPTY_NUEVA_CITA, gestante_id: sel?.id || '' });
    setCreateError(null);
    setShowNuevaCita(true);
  };

  const guardarNuevaCita = async () => {
    if (!nuevaCitaForm.gestante_id || !nuevaCitaForm.fecha || !nuevaCitaForm.hora) {
      setCreateError('Completa todos los campos obligatorios.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await createAppointment({
        gestante_id: nuevaCitaForm.gestante_id,
        fecha_hora: `${nuevaCitaForm.fecha}T${nuevaCitaForm.hora}:00`,
        tipo_cita: nuevaCitaForm.tipo_cita,
      });
      setShowNuevaCita(false);
      await refrescarCitas();
    } catch (err: any) {
      console.error(err);
      setCreateError('Error al crear la cita en el servidor.');
    } finally {
      setCreating(false);
    }
  };

  // ─── Gestionar Cita (confirmar / reprogramar / cancelar) ────────────────

  const abrirCita = (c: CitaAdminResponse) => {
    setSelectedCita(c);
    setReprogramarFecha(toDatetimeLocal(c.fecha_hora));
    setActionError(null);
  };

  const handleConfirmar = async () => {
    if (!selectedCita) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await confirmarAppointment(selectedCita.id);
      setSelectedCita(null);
      await refrescarCitas();
    } catch (err: any) {
      console.error(err);
      setActionError('Error al confirmar la cita.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReprogramar = async () => {
    if (!selectedCita || !reprogramarFecha) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await reprogramarAppointment(selectedCita.id, { fecha_hora: `${reprogramarFecha}:00` });
      setSelectedCita(null);
      await refrescarCitas();
    } catch (err: any) {
      console.error(err);
      setActionError('Error al reprogramar la cita.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (!selectedCita) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await cancelarAppointment(selectedCita.id);
      setSelectedCita(null);
      await refrescarCitas();
    } catch (err: any) {
      console.error(err);
      setActionError('Error al cancelar la cita.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className={styles.root}>

      <HeaderActividad rol="medico" tabActivo="Citas" />

      <div className={styles.grid}>

        {/* Lista del panel izq */}
        <div className={styles.panel}>
          <p className={styles.panelTitle}>Lista Maternas</p>
          <div className={styles.searchWrap}>
            <svg className={styles.searchIcon} width="14" height="14"
              viewBox="0 0 24 24" fill="none" stroke="#999"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              className={styles.searchInput}
              placeholder="Buscar por codigo"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
            />
          </div>
          <div className={styles.pList}>
            {maternasPagina.map((p, i) => {
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
                </span>
                <div>
                  <div className={styles.pDetail}>Nro Semana · {currentWeeks}</div>
                  <div className={styles.pDetail}>Fase · {getFaseOrTrimestre(currentWeeks)}</div>
                </div>
              </div>
            )})}
          </div>
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
        </div>

        {/* Panel de citas (el calendario) */}
        <div className={styles.panel}>

          <div className={styles.calPanelHeader}>
            <h2 className={styles.calTitulo}>Agendamiento de Citas</h2>
            <button className={styles.newCitaBtn} onClick={iniciarNuevaCita}>+ Nueva Cita</button>
          </div>

          {errorMsg && <p style={{ color: '#dc2626', fontSize: '13px', margin: '0 0 10px', fontWeight: 500 }}>⚠️ {errorMsg}</p>}

          <div className={styles.calLayout}>
            <div className={styles.calSection}>
              <div className={styles.calNav}>
                <div className={styles.calNavLeft}>
                  <button className={styles.navBtn} onClick={() => cambiarMes(-1)}>‹</button>
                  <span className={styles.calMes}>{MESES[currentDate.getMonth()]} {currentDate.getFullYear()}</span>
                  <button className={styles.navBtn} onClick={() => cambiarMes(1)}>›</button>
                </div>
                <div className={styles.vistaToggle}>
                  <button className={`${styles.vistaBtn} ${styles.vistaBtnOn}`}>
                    Mes
                  </button>
                </div>
              </div>

              <div className={styles.calGrid}>
                <div className={styles.calDiasHeader}>
                  {DIAS_SEMANA.map(d => (
                    <div key={d} className={styles.calDiaLabel}>{d}</div>
                  ))}
                </div>

                {grid.map((semana, si) => (
                  <div key={si} className={styles.calSemana}>
                    {semana.map((celda, di) => {
                      const iso = toISODate(celda.date);
                      const tieneCita = citasPorDia.has(iso) && celda.enMes;
                      const esHoy = iso === todayISO && celda.enMes;
                      return (
                        <div
                          key={di}
                          className={`
                            ${styles.calCell}
                            ${!celda.enMes ? styles.calCellFuera : ''}
                            ${esHoy       ? styles.calCellHoy   : ''}
                            ${tieneCita   ? styles.calCellCita  : ''}
                          `}
                        >
                          <span className={styles.calNum}>{celda.date.getDate()}</span>
                          {tieneCita && <div className={styles.citaDot} />}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.proxSection}>
              <h3 className={styles.proxTitulo}>Próximas Citas</h3>
              <div className={styles.proxList}>
                {proximas.length === 0 && (
                  <p style={{ color: '#999', fontSize: '12px', margin: 0 }}>No hay citas próximas.</p>
                )}
                {proximas.map(c => {
                  const esHoy = toISODate(new Date(c.fecha_hora)) === todayISO;
                  return (
                    <div
                      key={c.id}
                      className={styles.citaCard}
                      onClick={() => abrirCita(c)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className={styles.citaHoraRow}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                          stroke="#CA436E" strokeWidth="2"
                          strokeLinecap="round" strokeLinejoin="round">
                          {esHoy
                            ? <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>
                            : <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>
                          }
                        </svg>
                        <span className={`${styles.citaHora} ${esHoy ? styles.citaHoy : ''}`}>
                          {formatHora(c.fecha_hora)} {esHoy ? '· Hoy' : `· ${formatFechaCorta(c.fecha_hora)}`}
                        </span>
                      </div>
                      <p className={styles.citaPaciente}>Paciente: {c.codigo_gmi}</p>
                      <span className={styles.citaTipoBadge}>{c.tipo_cita || 'Cita'}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Solicitudes de citas hechas por las gestantes */}
          <div className={styles.solicitudesSection}>
            <h3 className={styles.proxTitulo}>Solicitudes de Citas de Gestantes</h3>
            {solicitudesError && (
              <p style={{ color: '#dc2626', fontSize: '13px', margin: '0 0 10px', fontWeight: 500 }}>⚠️ {solicitudesError}</p>
            )}
            {quickActionError && (
              <p style={{ color: '#dc2626', fontSize: '13px', margin: '0 0 10px', fontWeight: 500 }}>⚠️ {quickActionError}</p>
            )}
            <div className={styles.solicitudesList}>
              {solicitudes.length === 0 && (
                <p style={{ color: '#999', fontSize: '12px', margin: 0 }}>No hay solicitudes de citas.</p>
              )}
              {solicitudes.map(c => {
                const esPendiente = ESTADOS_SOLICITUD.includes(c.estado);
                const loading = quickActionId === c.id;
                return (
                  <div key={c.id} className={styles.solicitudCard}>
                    <div className={styles.solicitudInfo}>
                      <span className={styles.citaPaciente}>{c.codigo_gmi}</span>
                      <span className={styles.citaHora}>
                        {formatFechaCorta(c.fecha_hora)} · {formatHora(c.fecha_hora)}
                      </span>
                      <span className={styles.citaTipoBadge}>{c.tipo_cita || 'Cita'}</span>
                      <span className={estadoBadgeClass(c.estado)}>{estadoLabel(c.estado)}</span>
                    </div>
                    {esPendiente && (
                      <div className={styles.solicitudActions}>
                        <button
                          type="button"
                          className={styles.quickCancelBtn}
                          onClick={() => quickCancelar(c.id)}
                          disabled={loading}
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          className={styles.quickConfirmBtn}
                          onClick={() => quickConfirmar(c.id)}
                          disabled={loading}
                        >
                          Confirmar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Modal Nueva Cita */}
      <Modal
        isOpen={showNuevaCita}
        onClose={() => setShowNuevaCita(false)}
        title="Nueva Cita"
      >
        <form className={modalStyles.form} onSubmit={(e) => { e.preventDefault(); guardarNuevaCita(); }}>
          <div className={modalStyles.field}>
            <label className={modalStyles.label}>Paciente *</label>
            <select
              className={modalStyles.select}
              value={nuevaCitaForm.gestante_id}
              onChange={e => setNuevaCitaForm({ ...nuevaCitaForm, gestante_id: e.target.value })}
              disabled={creating}
            >
              <option value="">Seleccionar paciente</option>
              {gestantes.map(g => (
                <option key={g.id} value={g.id}>{g.codigo_gmi}</option>
              ))}
            </select>
          </div>

          <div className={modalStyles.field}>
            <label className={modalStyles.label}>Fecha *</label>
            <input
              type="date"
              className={modalStyles.input}
              value={nuevaCitaForm.fecha}
              onChange={e => setNuevaCitaForm({ ...nuevaCitaForm, fecha: e.target.value })}
              disabled={creating}
            />
          </div>

          <div className={modalStyles.field}>
            <label className={modalStyles.label}>Hora *</label>
            <input
              type="time"
              className={modalStyles.input}
              value={nuevaCitaForm.hora}
              onChange={e => setNuevaCitaForm({ ...nuevaCitaForm, hora: e.target.value })}
              disabled={creating}
            />
          </div>

          <div className={modalStyles.field}>
            <label className={modalStyles.label}>Tipo de Cita</label>
            <select
              className={modalStyles.select}
              value={nuevaCitaForm.tipo_cita}
              onChange={e => setNuevaCitaForm({ ...nuevaCitaForm, tipo_cita: e.target.value })}
              disabled={creating}
            >
              {TIPOS_CITA.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {createError && <p className={modalStyles.error}>{createError}</p>}

          <div className={modalStyles.actions}>
            <button type="button" className={modalStyles.cancelBtn} onClick={() => setShowNuevaCita(false)} disabled={creating}>
              Cancelar
            </button>
            <button type="submit" className={modalStyles.submitBtn} disabled={creating}>
              {creating ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Gestionar Cita */}
      {selectedCita && (
        <Modal
          isOpen={!!selectedCita}
          onClose={() => setSelectedCita(null)}
          title="Gestionar Cita"
        >
          <div className={modalStyles.form}>
            <div className={modalStyles.field}>
              <span className={modalStyles.label}>Paciente</span>
              <span>{selectedCita.codigo_gmi}</span>
            </div>
            <div className={modalStyles.field}>
              <span className={modalStyles.label}>Tipo</span>
              <span>{selectedCita.tipo_cita || 'Cita'}</span>
            </div>
            <div className={modalStyles.field}>
              <span className={modalStyles.label}>Estado</span>
              <span>{selectedCita.estado}</span>
            </div>

            <div className={modalStyles.field}>
              <label className={modalStyles.label}>Fecha y hora</label>
              <input
                type="datetime-local"
                className={modalStyles.input}
                value={reprogramarFecha}
                onChange={e => setReprogramarFecha(e.target.value)}
                disabled={actionLoading}
              />
            </div>

            {actionError && <p className={modalStyles.error}>{actionError}</p>}

            <div className={modalStyles.actions}>
              <button type="button" className={modalStyles.cancelBtn} onClick={handleCancelar} disabled={actionLoading}>
                Cancelar Cita
              </button>
              <button type="button" className={modalStyles.cancelBtn} onClick={handleReprogramar} disabled={actionLoading}>
                Reprogramar
              </button>
              <button type="button" className={modalStyles.submitBtn} onClick={handleConfirmar} disabled={actionLoading}>
                Confirmar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
