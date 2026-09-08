import { useState, useEffect } from 'react';
import { getChecklistForGestante, type ChecklistItem } from '../../../../services/m0Service';
import styles from './ProgressChecklist.module.css';
import { useRiskSummary } from '../../../../hooks/ia/useRiskSummary';

interface Props {
  moduloId: number;
  moduloCodigo: string;
  style?: React.CSSProperties;
}

export const ProgressChecklist = ({ moduloId, moduloCodigo, style }: Props) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { summary } = useRiskSummary();

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getChecklistForGestante(moduloId, moduloCodigo);
        // Ordenar: primero activos (completos), luego pendientes, luego por orden
        const sorted = [...data].sort((a, b) => {
          const aDone = a.completado ?? a.activo ?? false;
          const bDone = b.completado ?? b.activo ?? false;
          if (aDone !== bDone) return aDone ? -1 : 1;
          return (a.orden ?? 99) - (b.orden ?? 99);
        });
        setItems(sorted);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [moduloId, moduloCodigo]);

  const completados = items.filter(i => i.completado ?? i.activo ?? false).length;
  const total = items.length;
  const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

  const getRiskColors = (nivel: 'verde' | 'amarillo' | 'rojo' | undefined) => {
    switch (nivel) {
      case 'verde':
        return {
          fillColor: '#22c55e',
          badgeBg: '#e8f5e9',
          badgeColor: '#2e7d32',
        };
      case 'amarillo':
        return {
          fillColor: '#eab308',
          badgeBg: '#fef9c3',
          badgeColor: '#a16207',
        };
      case 'rojo':
        return {
          fillColor: '#ef4444',
          badgeBg: '#fee2e2',
          badgeColor: '#b91c1c',
        };
      default:
        return {
          fillColor: '#ca436e',
          badgeBg: '#fce7f3',
          badgeColor: '#ca436e',
        };
    }
  };

  const riskColors = getRiskColors(summary?.nivel_riesgo);

  return (
    <div className={styles.card} style={style}>
      {/* Encabezado */}
      <div className={styles.header}>
        <h3 className={styles.title}>Mi progreso</h3>
        <span
          className={styles.badge}
          style={{ backgroundColor: riskColors.badgeBg, color: riskColors.badgeColor }}
        >
          {moduloCodigo}
        </span>
      </div>

      {/* Barra de progreso */}
      {!loading && total > 0 && (
        <div className={styles.progressWrapper}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${porcentaje}%`, backgroundColor: riskColors.fillColor }}
            />
          </div>
          <div className={styles.progressLabel}>
            <span>{completados} de {total} completados</span>
            <span>{porcentaje}%</span>
          </div>
        </div>
      )}

      {/* Lista de ítems */}
      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          Cargando checklist...
        </div>
      ) : items.length === 0 ? (
        <p className={styles.empty}>No hay ítems configurados para este módulo.</p>
      ) : (
        <div className={styles.list}>
          {items.map(item => {
            const isDone = item.completado ?? item.activo ?? false;
            return (
              <div
                key={item.id}
                className={`${styles.item} ${isDone ? styles.itemDone : ''}`}
              >
                <div className={`${styles.icon} ${isDone ? styles.iconDone : styles.iconPending}`}>
                  {isDone ? '✓' : '○'}
                </div>
                <div>
                  <p className={`${styles.itemText} ${isDone ? styles.itemTextDone : styles.itemTextPending}`}>
                    {item.texto}
                  </p>
                  {item.semana_eg && (
                    <span className={styles.semanaTag}>Semana {item.semana_eg}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
