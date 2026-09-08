import { useState } from 'react';
import { useAlertas, useNotificaciones } from '../../../../hooks/m6/useM6';
import styles from './styles.module.css';

type Tab = 'alertas' | 'notificaciones';

const CANAL_META: Record<string, { label: string }> = {
  push:  { label: 'Push' },
  sms:   { label: 'SMS' },
  email: { label: 'Email' },
};

const PRIORIDAD_CLASS: Record<number, string> = {
  1: styles.prioridad1,
  2: styles.prioridad2,
  3: styles.prioridad3,
};

const formatFecha = (dateStr: string | null) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const ahora = new Date();
  const diffMs = ahora.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH   = Math.floor(diffMin / 60);
  const diffD   = Math.floor(diffH / 24);

  if (diffMin < 1)  return 'Ahora mismo';
  if (diffMin < 60) return `Hace ${diffMin} min`;
  if (diffH < 24)   return `Hace ${diffH}h`;
  if (diffD === 1)  return 'Ayer';
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
};

export const NotificacionesPanel = ({ hideHeader = false }: { hideHeader?: boolean }) => {
  const [activeTab, setActiveTab] = useState<Tab>('alertas');

  const { data: alertas,       loading: loadingAlertas, acknowledge } = useAlertas();
  const { data: notificaciones, loading: loadingNotif,  unreadCount, markRead } = useNotificaciones();

  const alertasActivas = alertas.filter(a => a.estado !== 'leida').length;
  const loading = activeTab === 'alertas' ? loadingAlertas : loadingNotif;

  return (
    <div className={styles.panel}>

      {/* Header */}
      {!hideHeader && (
        <div className={styles.panelHeader}>
          <h1>Notificaciones</h1>
          <p className={styles.panelSubtitle}>Alertas y mensajes de tu seguimiento</p>
        </div>
      )}

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'alertas' ? styles.active : ''}`}
          onClick={() => setActiveTab('alertas')}
        >
          Alertas
          {alertasActivas > 0 && (
            <span className={styles.tabBadge}>{alertasActivas}</span>
          )}
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'notificaciones' ? styles.active : ''}`}
          onClick={() => setActiveTab('notificaciones')}
        >
          Notificaciones
          {unreadCount > 0 && (
            <span className={styles.tabBadge}>{unreadCount}</span>
          )}
        </button>
      </div>

      {/* Lista */}
      <div className={styles.list}>

        {/* Skeletons */}
        {loading && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <div className={styles.skeletonLine} style={{ width: '30%' }} />
            <div className={styles.skeletonLine} style={{ width: '88%' }} />
            <div className={styles.skeletonLine} style={{ width: '50%' }} />
          </div>
        ))}

        {/* Alertas */}
        {!loading && activeTab === 'alertas' && (
          alertas.length === 0 ? (
            <div className={styles.emptyState}>
              <h4>Todo en orden</h4>
              <p>No tienes alertas activas en este momento.</p>
            </div>
          ) : (
            alertas.map(alerta => {
              const isActiva = alerta.estado !== 'leida';
              const prioClass = PRIORIDAD_CLASS[alerta.prioridad_id] ?? '';

              return (
                <div
                  key={alerta.id}
                  className={`${styles.alertCard} ${prioClass} ${isActiva ? styles.alertActiva : ''}`}
                  onClick={() => { if (isActiva) acknowledge(alerta.id); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && isActiva) acknowledge(alerta.id);
                  }}
                  title={isActiva ? 'Click para marcar como leída' : undefined}
                >
                  <div className={styles.alertBody}>
                    <div className={styles.alertModuloRow}>
                      {alerta.modulo_origen && (
                        <span className={styles.alertModulo}>{alerta.modulo_origen}</span>
                      )}
                      <span className={styles.alertEstado}>
                        {isActiva ? '● Activa' : '○ Leída'}
                      </span>
                    </div>
                    <p className={styles.alertDesc}>
                      {alerta.descripcion ?? 'Sin descripción'}
                    </p>
                    <span className={styles.alertFecha}>
                      {formatFecha(alerta.created_at)}
                    </span>
                  </div>
                </div>
              );
            })
          )
        )}

        {/* Notificaciones */}
        {!loading && activeTab === 'notificaciones' && (
          notificaciones.length === 0 ? (
            <div className={styles.emptyState}>
              <h4>Sin Notificaciones</h4>
              <p>No tienes notificaciones por ahora.</p>
            </div>
          ) : (
            notificaciones.map(notif => {
              const isUnread = notif.estado_entrega !== 'leida';
              const canal = CANAL_META[notif.canal] ?? { label: notif.canal };

              return (
                <div
                  key={notif.id}
                  className={`${styles.notifCard} ${isUnread ? styles.unread : ''}`}
                  onClick={() => { if (isUnread) markRead(notif.id); }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && isUnread) markRead(notif.id);
                  }}
                  title={isUnread ? 'Click para marcar como leída' : undefined}
                >
                  <div className={styles.notifTop}>
                    <span className={styles.notifCanal}>{canal.label}</span>
                  </div>
                  <p className={styles.notifContenido}>
                    {notif.contenido ?? 'Sin contenido'}
                  </p>
                  <span className={styles.notifFecha}>
                    {formatFecha(notif.created_at)}
                  </span>
                </div>
              );
            })
          )
        )}

      </div>
    </div>
  );
};
