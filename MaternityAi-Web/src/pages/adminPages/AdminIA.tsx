import { useState, useEffect } from 'react';
import { HeaderActividad } from '../../components/Headers/HeaderActividad/HeaderActividad';
import styles from '../../components/admin/AdminUsuarias.module.css';
import {
  getGestantes,
  getClinicalSummary,
  getRiskSummary,
  getIARecommendations,
  type GestanteResponse,
  type ClinicalSummaryResponse,
  type RiskSummaryResponse,
  type IARecommendationResponse,
} from '../../services/adminService';

import { calculateCurrentWeeks, getFaseOrTrimestre } from '../../utils/gestationalAgeUtils';

const MENSAJE_ERROR_IA = 'No se pudo generar la respuesta de IA. Intenta nuevamente más tarde.';

export const AdminIA = () => {
  const [busqueda, setBusqueda] = useState('');
  const [gestantes, setGestantes] = useState<GestanteResponse[]>([]);
  const [selPaciente, setSelPaciente] = useState('');

  // ── Resumen clínico (IA) ──
  const [resumen, setResumen] = useState<ClinicalSummaryResponse | null>(null);
  const [resumenLoading, setResumenLoading] = useState(false);
  const [resumenError, setResumenError] = useState<string | null>(null);

  // ── Riesgo y recomendaciones (IA) ──
  const [riesgo, setRiesgo] = useState<RiskSummaryResponse | null>(null);
  const [recomendaciones, setRecomendaciones] = useState<IARecommendationResponse | null>(null);
  const [riesgoLoading, setRiesgoLoading] = useState(false);
  const [riesgoError, setRiesgoError] = useState<string | null>(null);

  useEffect(() => {
    getGestantes().then(data => {
      setGestantes(data);
      if (data.length > 0 && !selPaciente) {
        setSelPaciente(data[0].codigo_gmi);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selPaciente) return;

    setResumen(null);
    setResumenError(null);
    setResumenLoading(true);
    getClinicalSummary(selPaciente)
      .then(setResumen)
      .catch(() => setResumenError(MENSAJE_ERROR_IA))
      .finally(() => setResumenLoading(false));

    setRiesgo(null);
    setRecomendaciones(null);
    setRiesgoError(null);
    setRiesgoLoading(true);
    Promise.all([getRiskSummary(selPaciente), getIARecommendations(selPaciente)])
      .then(([riesgoData, recomendacionesData]) => {
        setRiesgo(riesgoData);
        setRecomendaciones(recomendacionesData);
      })
      .catch(() => setRiesgoError(MENSAJE_ERROR_IA))
      .finally(() => setRiesgoLoading(false));
  }, [selPaciente]);

  const filtrados = gestantes
    .filter(p => (p.codigo_gmi || p.id).toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => {
      const aAlerta = a.ultimo_estado_alerta === 'activa' ? 1 : 0;
      const bAlerta = b.ultimo_estado_alerta === 'activa' ? 1 : 0;
      return bAlerta - aAlerta;
    });

  const gestanteSeleccionada = gestantes.find(g => g.codigo_gmi === selPaciente);

  return (
    <div className={styles.root}>

      {/*tabs*/}
      <HeaderActividad rol="medico" tabActivo="IA" />

      {/* ── MAIN GRID ── */}
      <div className={styles.grid}>

        {/*parte izquierda la lista*/}
        <div className={styles.panel}>
          <div style={{ marginBottom: '16px' }}>
            <p className={styles.panelTitle} style={{ margin: 0 }}>Lista</p>
          </div>

          <div className={styles.searchWrap}>
            <input
              className={styles.searchInput}
              placeholder="Buscar por codigo"
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
            {filtrados.map((p, i) => {
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
        </div>

        {/*parte central: Resumen Clínico (IA)*/}
        <div className={`${styles.panel} ${styles.panelScroll}`}>
          <h1 className={styles.nombrePaciente}>{selPaciente || 'N/A'}</h1>
          <p className={styles.diagnostico}>
            Asistente de IA · GMI
          </p>

          <p className={styles.infoRow}><strong>Nro Semana</strong> · {gestanteSeleccionada ? calculateCurrentWeeks(gestanteSeleccionada.fecha_ultima_menstruacion) : 'N/A'}</p>
          <p className={styles.infoRow}><strong>Módulo activo</strong> · {resumen?.modulo_activo || 'N/A'}</p>

          <h2 className={styles.secTitle}>Resumen Clínico</h2>
          <p className={styles.secDesc}>
            Resumen generado por IA con los datos clínicos más recientes
            de la gestante. Incluye puntos clave y sugerencias para el
            equipo médico.
          </p>

          <div className={styles.analisisBox}>
            {resumenLoading ? (
              <div className={styles.reporteCards} style={{ marginTop: 0 }}>
                <div className={styles.rcard} style={{ width: '90%', background: '#e8e8e8' }} />
                <div className={styles.rcard} style={{ width: '75%', background: '#e8e8e8' }} />
                <div className={styles.rcard} style={{ width: '85%', background: '#e8e8e8' }} />
                <div className={styles.rcard} style={{ width: '60%', background: '#e8e8e8' }} />
                <p className={styles.secDesc} style={{ margin: '8px 0 0', textAlign: 'center' }}>
                  Generando resumen clínico con IA...
                </p>
              </div>
            ) : resumenError ? (
              <p className={styles.secDesc} style={{ margin: 0, color: '#CA436E' }}>
                ⚠️ {resumenError}
              </p>
            ) : resumen ? (
              <>
                <p className={styles.infoRow} style={{ margin: 0 }}>
                  <strong>Resumen</strong> · {resumen.resumen_clinico}
                </p>
                <p className={styles.infoRow}><strong>Semana de gestación</strong> · {resumen.semana_gestacion}</p>
                <p className={styles.infoRow}><strong>Módulo activo</strong> · {resumen.modulo_activo}</p>
                <p className={styles.infoRow}><strong>Alertas activas</strong> · {resumen.alertas_activas}</p>
                <p className={styles.infoRow}><strong>Puntos clave</strong></p>
                {resumen.puntos_clave.length === 0 ? (
                  <p className={styles.secDesc} style={{ margin: '0 0 4px 16px' }}>· Sin datos disponibles.</p>
                ) : (
                  resumen.puntos_clave.map((p, i) => (
                    <p key={i} className={styles.secDesc} style={{ margin: '0 0 4px 16px' }}>· {p}</p>
                  ))
                )}
                <p className={styles.infoRow}><strong>Sugerencias para el equipo clínico</strong></p>
                {resumen.sugerencias_clinico.length === 0 ? (
                  <p className={styles.secDesc} style={{ margin: '0 0 0 16px' }}>· Sin datos disponibles.</p>
                ) : (
                  resumen.sugerencias_clinico.map((s, i) => (
                    <p key={i} className={styles.secDesc} style={{ margin: '0 0 4px 16px' }}>· {s}</p>
                  ))
                )}
              </>
            ) : (
              <p className={styles.secDesc} style={{ margin: 0 }}>
                Selecciona una gestante para ver su resumen clínico.
              </p>
            )}
          </div>
        </div>

        {/*parte derecha: Riesgo y Recomendaciones (IA)*/}
        <div className={`${styles.panel} ${styles.reportePanel}`}>
          <h2 className={styles.panelTitle}>Riesgo y Recomendaciones</h2>
          <p className={styles.secDesc}>
            Nivel de riesgo y recomendaciones de la semana generadas por IA
            a partir del contexto clínico de la gestante.
          </p>

          {riesgoLoading ? (
            <div className={styles.reporteCards}>
              <div className={styles.rcard} style={{ width: '70%', background: '#f9c0cf' }} />
              <div className={styles.rcard} style={{ width: '55%', background: '#e8e8e8' }} />
              <div className={styles.rcard} style={{ width: '80%', background: '#e8e8e8' }} />
              <div className={styles.rcard} style={{ width: '45%', background: '#e8e8e8' }} />
              <p className={styles.secDesc} style={{ margin: '4px 0 0', textAlign: 'center' }}>
                Calculando riesgo y recomendaciones...
              </p>
            </div>
          ) : riesgoError ? (
            <p className={styles.secDesc} style={{ margin: 0, color: '#CA436E' }}>
              ⚠️ {riesgoError}
            </p>
          ) : (
            <>
              <p className={styles.infoRow}>
                <strong>Nivel de riesgo</strong>
                &nbsp;<span className={styles.sobrepeso}>{riesgo?.nivel_riesgo?.toUpperCase() || '—'}</span>
              </p>
              {riesgo?.resumen && (
                <p className={styles.secDesc} style={{ margin: '0 0 10px' }}>{riesgo.resumen}</p>
              )}

              <p className={styles.infoRow}><strong>Factores de riesgo</strong></p>
              {!riesgo || riesgo.factores_riesgo.length === 0 ? (
                <p className={styles.secDesc} style={{ margin: '0 0 10px 16px' }}>· Sin datos disponibles.</p>
              ) : (
                riesgo.factores_riesgo.map((f, i) => (
                  <p key={i} className={styles.secDesc} style={{ margin: '0 0 4px 16px' }}>· {f}</p>
                ))
              )}

              <p className={styles.infoRow}><strong>Recomendaciones de la semana</strong></p>
              {!recomendaciones || recomendaciones.recomendaciones.length === 0 ? (
                <p className={styles.secDesc} style={{ margin: '0 0 10px 16px' }}>· Sin datos disponibles.</p>
              ) : (
                recomendaciones.recomendaciones.map((r, i) => (
                  <p key={i} className={styles.secDesc} style={{ margin: '0 0 4px 16px' }}>· {r}</p>
                ))
              )}

              <p className={styles.infoRow}><strong>Mensaje motivacional</strong></p>
              <p className={styles.secDesc} style={{ margin: '0 0 0 16px' }}>
                {recomendaciones?.mensaje_motivacional || 'Sin datos disponibles.'}
              </p>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
