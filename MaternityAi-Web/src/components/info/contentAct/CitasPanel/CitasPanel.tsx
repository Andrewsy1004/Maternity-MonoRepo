import React, { useState } from 'react';
import { useCitas } from '../../../../hooks/m6/useM6';
import type { CitaMedicaResponse, CitaMedicaCreate } from '../../../../services/m6Service';
import styles from './CitasPanel.module.css';

const formatFecha = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('es-CO', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatHora = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  });

const estadoConfig: Record<string, { label: string; className: string }> = {
  programada: { label: 'Programada', className: styles.estadoProgramada },
  confirmada: { label: 'Confirmada', className: styles.estadoConfirmada },
  cancelada:  { label: 'Cancelada',  className: styles.estadoCancelada  },
};

const getTipoIcon = (tipo: string | null) => {
  const t = (tipo ?? '').toLowerCase();
  if (t.includes('control prenatal')) {
    return (
      <span className={`${styles.iconWrapper} ${styles.iconPrenatal}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10a7 7 0 0 0 14 0V4a2 2 0 0 1 4 0v3a2 2 0 0 0 4 0" />
          <path d="M21 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
          <path d="M12 17v4" />
          <circle cx="12" cy="21" r="1" />
        </svg>
      </span>
    );
  }
  if (t.includes('ecografía')) {
    return (
      <span className={`${styles.iconWrapper} ${styles.iconEco}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 18h8" />
          <path d="M3 22h18" />
          <path d="M12 18a4 4 0 0 0 4-4V6a4 4 0 0 0-4-4" />
          <circle cx="12" cy="6" r="2" />
          <path d="M16 12h2" />
        </svg>
      </span>
    );
  }
  if (t.includes('laboratorio')) {
    return (
      <span className={`${styles.iconWrapper} ${styles.iconLab}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2v7.31L4.75 18A2 2 0 0 0 6.5 21h11a2 2 0 0 0 1.75-3L14 9.31V2h-4z" />
          <line x1="8.5" y1="2" x2="15.5" y2="2" />
          <line x1="6.5" y1="15" x2="17.5" y2="15" />
        </svg>
      </span>
    );
  }
  if (t.includes('vacuna')) {
    return (
      <span className={`${styles.iconWrapper} ${styles.iconVacuna}`}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m18 2 4 4" />
          <path d="m17 7 3-3" />
          <path d="M16 9 9.5 15.5" />
          <path d="m14 11 1.5 1.5" />
          <path d="m11 14 1.5 1.5" />
          <path d="M9 16H5v-4l7-7 5 5-8 8Z" />
          <path d="M3 21v-3l3 3H3Z" />
        </svg>
      </span>
    );
  }
  return (
    <span className={`${styles.iconWrapper} ${styles.iconDefault}`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      </svg>
    </span>
  );
};

const CitaCard = React.memo(({ cita }: { cita: CitaMedicaResponse }) => {
  const cfg = estadoConfig[cita.estado] ?? { label: cita.estado, className: '' };
  return (
    <div className={styles.card}>
      <div className={styles.cardAvatar} style={{ background: 'transparent', boxShadow: 'none' }}>
        {getTipoIcon(cita.tipo_cita)}
      </div>

      <div className={styles.cardLeft}>
        <p className={styles.tipo}>{cita.tipo_cita ?? 'Cita médica'}</p>
        <p className={styles.citaMeta}>{formatFecha(cita.fecha_hora)} · {formatHora(cita.fecha_hora)}</p>
      </div>

      <div className={`${styles.estadoIndicador} ${styles[`estado${cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)}`] ?? ''}`}>
        <div className={styles.estadoDot} />
        <span className={styles.estadoLabel}>{cfg.label}</span>
      </div>
    </div>
  );
});

const CitaCardSkeleton = () => (
  <div className={styles.card} style={{ opacity: 0.5 }}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ height: 22, width: '35%', borderRadius: 20, background: '#ffe8ee' }} />
      <div style={{ height: 18, width: '70%', borderRadius: 6, background: '#f5e0e8' }} />
      <div style={{ height: 16, width: '55%', borderRadius: 6, background: '#f5e0e8' }} />
      <div style={{ height: 16, width: '40%', borderRadius: 6, background: '#f5e0e8' }} />
    </div>
    <div style={{ width: 56, height: 56, borderRadius: 8, background: '#f5e0e8' }} />
  </div>
);

// ---- Modal para solicitar nueva cita ----
const NuevaCitaModal = ({
  onClose,
  onCreate,
  saving,
  error,
}: {
  onClose: () => void;
  onCreate: (payload: CitaMedicaCreate) => Promise<void>;
  saving: boolean;
  error: string | null;
}) => {
  const TIPOS_CITA = [
    'Control Prenatal',
    'Ecografía Obstétrica',
    'Monitoreo Fetal',
    'Consulta Nutricional',
    'Laboratorios',
    'Otro',
  ];
  const [tipoCita, setTipoCita] = useState('Control Prenatal');
  const [fechaHora, setFechaHora] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fechaHora || !tipoCita) return;
    await onCreate({ tipo_cita: tipoCita, fecha_hora: `${fechaHora}:00` });
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3 className={styles.modalTitle}>Solicitar nueva cita</h3>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Tipo de cita <span className={styles.required}>*</span>
            <select
              className={styles.input}
              value={tipoCita}
              onChange={e => setTipoCita(e.target.value)}
              required
            >
              {TIPOS_CITA.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            Fecha y hora <span className={styles.required}>*</span>
            <input
              className={styles.input}
              type="datetime-local"
              required
              value={fechaHora}
              onChange={e => setFechaHora(e.target.value)}
            />
          </label>
          {error && <p className={styles.modalError}>{error}</p>}
          <div className={styles.modalActions}>
            <button type="button" className={styles.btnCancel} onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnConfirm} disabled={saving || !fechaHora || !tipoCita}>
              {saving ? 'Guardando…' : 'Solicitar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface Props {
  horizontal?: boolean;
  hideTitle?: boolean;
}

export const CitasPanel = ({ horizontal = false, hideTitle = false }: Props) => {
  const { data, loading, error, create } = useCitas();
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const upcoming = data
    .filter(c => c.estado !== 'cancelada')
    .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime());

  const handleCreate = async (payload: CitaMedicaCreate) => {
    setSaving(true);
    setCreateError(null);
    try {
      await create(payload);
      setShowModal(false);
    } catch (err) {
      console.error(err);
      setCreateError('No se pudo solicitar la cita. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.panelRoot}>
      <div 
        className={styles.panelHeader}
        style={hideTitle ? { display: 'flex', justifyContent: 'flex-end', marginTop: '-44px', marginBottom: '14px', paddingRight: '20px' } : undefined}
      >
        {!hideTitle && <h1 className={styles.panelTitle}>Mis Citas</h1>}
        <button 
          className={styles.btnSolicitar} 
          onClick={() => setShowModal(true)}
          style={hideTitle ? { padding: '8px 16px', fontSize: '12px', borderRadius: '15px' } : undefined}
        >
          + Solicitar cita
        </button>
      </div>

      <div className={horizontal ? styles.wrapperHorizontal : styles.wrapper}>
        {upcoming.length > 0 ? (
          upcoming.map(c => <CitaCard key={c.id} cita={c} />)
        ) : loading ? (
          Array.from({ length: 2 }).map((_, i) => <CitaCardSkeleton key={i} />)
        ) : error ? (
          <p className={styles.empty}>No se pudieron cargar las citas.</p>
        ) : (
          <p className={styles.empty}>No tienes citas programadas.</p>
        )}
      </div>

      {showModal && (
        <NuevaCitaModal
          onClose={() => { setShowModal(false); setCreateError(null); }}
          onCreate={handleCreate}
          saving={saving}
          error={createError}
        />
      )}
    </div>
  );
};
