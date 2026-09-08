import { useState, useMemo } from 'react';
import { useEducationalContent, useProgress } from '../../../hooks/m5/usM5';
import { PreguntasFrecuentes } from './CARDS/CardPF/PreguntasFrecuentes';
import { Recomendaciones } from './CARDS/CardR/Recomendaciones';
import { Posts } from './posts/Posts';
import styles from './ContentBiblioteca.module.css';

const TIPOS = [
  { key: 'todos',    label: 'Todos' },
  { key: 'articulo', label: 'Artículos' },
  { key: 'video',    label: 'Videos' },
  { key: 'documento', label: 'Documentos' },
];

const normalizeTipoContenido = (tipo: string | null | undefined): string => {
  if (!tipo) return 'otro';
  const clean = tipo.toLowerCase().trim();
  if (clean === 'video') return 'video';
  if (clean === 'articulo' || clean === 'artículo') return 'articulo';
  if (clean === 'documento') return 'documento';
  return clean;
};

export const ContentBiblioteca = () => {
  const { data, loading, error, activeModule } = useEducationalContent();
  const { data: progressData, markCompleted } = useProgress();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('todos');

  const completedIds = useMemo(() => {
    return new Set(progressData.map(p => p.contenido_id));
  }, [progressData]);

  const totalContents = data?.length ?? 0;
  const completedContentsCount = useMemo(() => {
    if (!data) return 0;
    return data.filter(item => completedIds.has(item.id)).length;
  }, [data, completedIds]);

  const progressPercent = totalContents > 0 ? Math.round((completedContentsCount / totalContents) * 100) : 0;

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter(item => {
      const matchType =
        activeFilter === 'todos' ||
        normalizeTipoContenido(item.tipo_contenido) === activeFilter;
      const matchSearch =
        search.trim() === '' ||
        item.titulo.toLowerCase().includes(search.toLowerCase()) ||
        (item.descripcion ?? '').toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [data, activeFilter, search]);

  const counts = useMemo(() => {
    if (!data) return {};
    return data.reduce<Record<string, number>>((acc, item) => {
      const t = normalizeTipoContenido(item.tipo_contenido);
      acc[t] = (acc[t] ?? 0) + 1;
      return acc;
    }, {});
  }, [data]);

  return (
    <div className={styles.libraryRoot}>

      {/* ── SEARCH BAR ─────────────────────────────────── */}
      <div className={styles.searchBar}>
        <svg className={styles.searchIcon} xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Buscar artículos, videos, documentos…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && (
          <button className={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* ── BODY ───────────────────────────────────────── */}
      <div className={styles.body}>

        {/* LEFT SIDEBAR */}
        <aside className={styles.sidebar}>

          {totalContents > 0 && (
            <div className={styles.sideSection}>
              <p className={styles.sideLabel}>MI PROGRESO</p>
              <div className={styles.progressSummary}>
                <div className={styles.progressStats}>
                  <span className={styles.progressCount}>{completedContentsCount} de {totalContents} leídos</span>
                  <span className={styles.progressPercent}>{progressPercent}%</span>
                </div>
                <div className={styles.progressBar}>
                  <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
                </div>
              </div>
            </div>
          )}

          <div className={styles.sideSection}>
            <PreguntasFrecuentes activeModule={activeModule} />
          </div>

          <div className={styles.sideSection}>
            <Recomendaciones activeModule={activeModule} />
          </div>

        </aside>

        {/* MAIN CONTENT */}
        <main className={styles.main}>
          <div className={styles.resultsHeader}>
            <div className={styles.resultsHeaderLeft}>
              <span className={styles.resultsCount}>
                {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
              </span>
              {activeModule && (
                <span className={styles.moduleBadge}>
                  📍 {activeModule.nombre}
                  {activeModule.semana_gestacion_actual !== undefined && activeModule.semana_gestacion_actual !== null
                    ? ` · Semana ${activeModule.semana_gestacion_actual}`
                    : ''}
                </span>
              )}
            </div>
            <div className={styles.filterRow}>
              {TIPOS.map(t => {
                const count = t.key === 'todos'
                  ? (data?.length ?? 0)
                  : (counts[t.key] ?? 0);
                return (
                  <button
                    key={t.key}
                    className={`${styles.filterPill} ${activeFilter === t.key ? styles.filterPillActive : ''}`}
                    onClick={() => setActiveFilter(t.key)}
                  >
                    <span>{t.label}</span>
                    <span className={styles.filterPillCount}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <Posts data={filtered} loading={loading} error={error} completedIds={completedIds} onMarkCompleted={markCompleted} />
        </main>

      </div>

      {/* ── MOBILE VIEW ────────────────────────────────── */}
      <div className={styles.mobileTabs}>
        {TIPOS.map(t => (
          <button
            key={t.key}
            className={`${styles.mobileTab} ${activeFilter === t.key ? styles.mobileTabActive : ''}`}
            onClick={() => setActiveFilter(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.mobileBody}>
        {totalContents > 0 && (
          <div className={styles.mobileProgressContainer}>
            <div className={styles.progressStats}>
              <span className={styles.progressCount}>{completedContentsCount} de {totalContents} leídos</span>
              <span className={styles.progressPercent}>{progressPercent}%</span>
            </div>
            <div className={styles.progressBar}>
              <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        )}
        <Posts data={filtered} loading={loading} error={error} completedIds={completedIds} onMarkCompleted={markCompleted} />
      </div>

      <div className={styles.mobileSide}>
        <PreguntasFrecuentes activeModule={activeModule} />
        <Recomendaciones activeModule={activeModule} />
      </div>

    </div>
  );
};
