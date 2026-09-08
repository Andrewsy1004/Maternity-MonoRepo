import { useState, useEffect, useCallback } from 'react';
import styles from './AlertasPanel.module.css';
import {
  getAlertas,
  getNotificaciones,
  acknowledgeAlerta,
  markNotificacionRead,
  type AlertaResponse,
  type NotificacionResponse,
} from '../../services/m6Service';

type Tab = 'alertas' | 'notificaciones';

const formatTime = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Ahora';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `hace ${diffHr}h`;
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
};

export const AlertasPanel = () => {
  const [tab, setTab] = useState<Tab>('alertas');
  const [alertas, setAlertas] = useState<AlertaResponse[]>([]);
  const [notificaciones, setNotificaciones] = useState<NotificacionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [al, notif] = await Promise.all([getAlertas(), getNotificaciones()]);
      setAlertas(al);
      setNotificaciones(notif);
    } catch (err) {
      console.error('Error cargando alertas/notificaciones:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAcknowledge = async (id: string) => {
    try {
      await acknowledgeAlerta(id);
      setAlertas(prev =>
        prev.map(a => a.id === id ? { ...a, estado: 'leida' } : a)
      );
    } catch (err) {
      console.error('Error al marcar alerta:', err);
    }
  };

  const handleMarkNotifRead = async (id: string) => {
    try {
      await markNotificacionRead(id);
      setNotificaciones(prev =>
        prev.map(n => n.id === id ? { ...n, estado_entrega: 'leida' } : n)
      );
    } catch (err) {
      console.error('Error al marcar notificación:', err);
    }
  };

  const activeCount = alertas.filter(a => a.estado === 'activa').length;
  const unreadNotifCount = notificaciones.filter(n => n.estado_entrega !== 'leida').length;

  return (
    <div className={styles.panel}>
      {/* Header */}
      <div className={styles.panelHeader}>
        <div className={styles.panelTitleGroup}>
          <div className={styles.panelIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </div>
          <div>
            <p className={styles.panelTitle}>Alertas y Comunicaciones</p>
            <p className={styles.panelSubtitle}>Módulo M6 – Sistema de notificaciones</p>
          </div>
        </div>
        <button
          className={styles.refreshBtn}
          onClick={() => { setLoading(true); load(); }}
          title="Actualizar"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/>
            <polyline points="21 3 21 8 16 8"/>
          </svg>
          Actualizar
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'alertas' ? styles.active : ''}`}
          onClick={() => setTab('alertas')}
        >
          Alertas
          {activeCount > 0 && <span className={styles.tabBadge}>{activeCount}</span>}
        </button>
        <button
          className={`${styles.tab} ${tab === 'notificaciones' ? styles.active : ''}`}
          onClick={() => setTab('notificaciones')}
        >
          Notificaciones
          {unreadNotifCount > 0 && <span className={styles.tabBadge}>{unreadNotifCount}</span>}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.loadingRow}>
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      ) : tab === 'alertas' ? (
        <div className={styles.list}>
          {alertas.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Sin alertas activas. Todo está bien 🩷
            </div>
          ) : (
            alertas.map(alerta => (
              <div
                key={alerta.id}
                className={`${styles.alertItem} ${alerta.estado === 'activa' ? styles.activa : styles.leida}`}
              >
                <div className={`${styles.alertDot} ${alerta.estado === 'activa' ? styles.dotActiva : styles.dotLeida}`} />
                <div className={styles.alertBody}>
                  <div className={styles.alertMeta}>
                    {alerta.modulo_origen && (
                      <span className={styles.alertModulo}>{alerta.modulo_origen}</span>
                    )}
                    <span className={styles.alertTime}>{formatTime(alerta.created_at)}</span>
                  </div>
                  <p className={styles.alertText}>
                    {alerta.descripcion || 'Alerta clínica generada por el sistema'}
                  </p>
                </div>
                {alerta.estado === 'activa' && (
                  <button
                    className={styles.markReadBtn}
                    onClick={() => handleAcknowledge(alerta.id)}
                    title="Marcar como leída"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className={styles.list}>
          {notificaciones.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Sin notificaciones recientes
            </div>
          ) : (
            notificaciones.map(notif => (
              <div key={notif.id} className={styles.notifItem}>
                <div className={styles.notifIcon}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={notif.estado_entrega === 'leida' ? 'rgba(255,255,255,0.35)' : '#CA436E'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div className={styles.notifContent}>
                  <p className={styles.notifText}>{notif.contenido || 'Notificación del sistema'}</p>
                  <div className={styles.notifMeta}>
                    <span className={styles.notifCanal}>{notif.canal}</span>
                    <span className={styles.notifTime}>{formatTime(notif.created_at)}</span>
                  </div>
                </div>
                {notif.estado_entrega !== 'leida' && (
                  <button
                    className={styles.markReadBtn}
                    onClick={() => handleMarkNotifRead(notif.id)}
                    title="Marcar como leída"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
