import React, { useState, useEffect, useRef } from 'react';
import { useBirthRecord, useNewborns, usePostpartum, useContraception } from '../../../../hooks/m4/useM4';
import { useObstetricFormula } from '../../../../hooks/m0/useM0';
import styles from './PostpartumDashboard.module.css';

const METODOS_ANTICONCEPTIVOS = [
  { id: 1, nombre: 'Implante subdérmico' },
  { id: 2, nombre: 'Dispositivo Intrauterino (DIU)' },
  { id: 3, nombre: 'Inyección anticonceptiva' },
  { id: 4, nombre: 'Pastillas anticonceptivas' },
  { id: 5, nombre: 'Preservativo / Condón' },
  { id: 6, nombre: 'Esterilización quirúrgica' },
  { id: 7, nombre: 'Ninguno / Otro' },
];

const PartoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const BebesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const EvolucionIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

const PlanificacionIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

interface PostpartumDashboardProps {
  inModal?: boolean;
  onEditBirth?: () => void;
  onBirthSaved?: () => void;
}

export const PostpartumDashboard: React.FC<PostpartumDashboardProps> = ({ inModal, onEditBirth, onBirthSaved }) => {
  const [activeTab, setActiveTab] = useState<'parto' | 'bebes' | 'evolucion' | 'planificacion'>('parto');

  // Hooks de datos
  const { data: birthData, create: createBirth, update: updateBirth, loading: birthLoading, refresh: refreshBirth } = useBirthRecord();
  const { data: newborns, create: createNewborn, loading: newbornLoading, refresh: refreshNewborns } = useNewborns();
  const { list: postpartumList, evolution, create: createPostpartum, loading: postpartumLoading, refresh: refreshPostpartum } = usePostpartum();
  const { data: contraceptionList, create: createContraception, loading: contraceptionLoading, refresh: refreshContraception } = useContraception();
  const { data: obstetricFormula, update: updateObstetricFormula, refresh: fetchObstetricFormula } = useObstetricFormula();

  useEffect(() => {
    fetchObstetricFormula();
  }, [fetchObstetricFormula]);

  // Estados de formularios
  const [tipoParto, setTipoParto] = useState('Vaginal');
  const [fechaParto, setFechaParto] = useState(new Date().toISOString().split('T')[0]);
  const [complicacionesParto, setComplicacionesParto] = useState('');
  const [uciMaterna, setUciMaterna] = useState(false);

  const [bebeVivo, setBebeVivo] = useState(true);
  const [bebePeso, setBebePeso] = useState('');
  const [bebeTalla, setBebeTalla] = useState('');
  const [bebeUci, setBebeUci] = useState(false);
  const [bebeObs, setBebeObs] = useState('');

  const [puerperioDias, setPuerperioDias] = useState('1');
  const [puerperioFecha, setPuerperioFecha] = useState(new Date().toISOString().split('T')[0]);
  const [puerperioCompl, setPuerperioCompl] = useState('');
  const [puerperioObs, setPuerperioObs] = useState('');

  const [anticonceptivoId, setAnticonceptivoId] = useState('1');
  const [anticonceptivoFecha, setAnticonceptivoFecha] = useState(new Date().toISOString().split('T')[0]);

  const [isAddingNewborn, setIsAddingNewborn] = useState(false);
  const [newbornError, setNewbornError] = useState<string | null>(null);

  const resetNewbornForm = () => {
    setBebeVivo(true);
    setBebePeso('');
    setBebeTalla('');
    setBebeUci(false);
    setBebeObs('');
    setNewbornError(null);
  };

  const hasSwitchedTab = useRef(false);

  useEffect(() => {
    if (birthData && !hasSwitchedTab.current) {
      setActiveTab('bebes');
      hasSwitchedTab.current = true;
    }
  }, [birthData]);

  useEffect(() => {
    if (birthData) {
      setTipoParto(birthData.tipo_parto);
      setFechaParto(birthData.fecha_parto);
      setComplicacionesParto(birthData.complicaciones || '');
      setUciMaterna(birthData.uci_materna);
    }
  }, [birthData]);


  // Manejadores de envíos
  const handleSaveBirth = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      tipo_parto: tipoParto,
      fecha_parto: fechaParto,
      complicaciones: complicacionesParto || null,
      uci_materna: uciMaterna,
    };
    const isNew = !birthData;
    if (birthData) {
      await updateBirth(payload);
    } else {
      await createBirth(payload);
    }
    
    // Sincronizar fórmula obstétrica
    if (obstetricFormula) {
      try {
        if (isNew) {
          const isCesarea = tipoParto === 'Cesárea';
          await updateObstetricFormula({
            gestaciones: (obstetricFormula.gestaciones || 0) + 1,
            partos: (obstetricFormula.partos || 0) + (isCesarea ? 0 : 1),
            cesareas: (obstetricFormula.cesareas || 0) + (isCesarea ? 1 : 0),
            abortos: obstetricFormula.abortos || 0,
            vivos: obstetricFormula.vivos || 0,
            mortinatos: obstetricFormula.mortinatos || 0,
          });
        } else if (birthData && tipoParto !== birthData.tipo_parto) {
          const wasCesarea = birthData.tipo_parto === 'Cesárea';
          const isCesarea = tipoParto === 'Cesárea';
          let newPartos = obstetricFormula.partos || 0;
          let newCesareas = obstetricFormula.cesareas || 0;
          if (wasCesarea && !isCesarea) {
            newCesareas = Math.max(0, newCesareas - 1);
            newPartos = newPartos + 1;
          } else if (!wasCesarea && isCesarea) {
            newPartos = Math.max(0, newPartos - 1);
            newCesareas = newCesareas + 1;
          }
          await updateObstetricFormula({
            gestaciones: obstetricFormula.gestaciones || 0,
            partos: newPartos,
            cesareas: newCesareas,
            abortos: obstetricFormula.abortos || 0,
            vivos: obstetricFormula.vivos || 0,
            mortinatos: obstetricFormula.mortinatos || 0,
          });
        }
        await fetchObstetricFormula();
      } catch (err) {
        console.error("Error al actualizar fórmula obstétrica:", err);
      }
    }
    refreshBirth();
    window.dispatchEvent(new CustomEvent('maternity-active-module-changed'));
    window.dispatchEvent(new CustomEvent('refresh-risk-summary'));
    if (onBirthSaved) {
      onBirthSaved();
    }
  };

  const handleAddNewborn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!birthData) return;
    setNewbornError(null);

    if (bebeVivo) {
      if (!bebePeso || !bebeTalla) {
        setNewbornError('El peso y la talla son obligatorios para un bebé nacido vivo.');
        return;
      }
      const pesoNum = parseInt(bebePeso);
      const tallaNum = parseFloat(bebeTalla);
      if (isNaN(pesoNum) || pesoNum < 500 || pesoNum > 6000) {
        setNewbornError('El peso del recién nacido debe estar entre 500 y 6000 gramos.');
        return;
      }
      if (isNaN(tallaNum) || tallaNum < 20 || tallaNum > 70) {
        setNewbornError('La talla del recién nacido debe estar entre 20 y 70 centímetros.');
        return;
      }
    } else {
      if (!bebeObs || bebeObs.trim().length < 10) {
        setNewbornError('Para registrar un óbito fetal, por favor proporcione observaciones explicativas (mínimo 10 caracteres).');
        return;
      }
    }

    try {
      await createNewborn({
        vivo: bebeVivo,
        peso_gramos: bebeVivo && bebePeso ? parseInt(bebePeso) : null,
        talla_cm: bebeVivo && bebeTalla ? parseFloat(bebeTalla) : null,
        uci_neonatal: bebeVivo ? bebeUci : false,
        observaciones: bebeObs || null,
      });

      // Sincronizar vivos / mortinatos en fórmula obstétrica
      if (obstetricFormula) {
        try {
          await updateObstetricFormula({
            gestaciones: obstetricFormula.gestaciones || 0,
            partos: obstetricFormula.partos || 0,
            cesareas: obstetricFormula.cesareas || 0,
            abortos: obstetricFormula.abortos || 0,
            vivos: (obstetricFormula.vivos || 0) + (bebeVivo ? 1 : 0),
            mortinatos: (obstetricFormula.mortinatos || 0) + (bebeVivo ? 0 : 1),
          });
          await fetchObstetricFormula();
        } catch (err) {
          console.error("Error al actualizar fórmula obstétrica en recién nacido:", err);
        }
      }
      resetNewbornForm();
      setIsAddingNewborn(false);
      refreshNewborns();
      window.dispatchEvent(new CustomEvent('refresh-risk-summary'));
    } catch (err) {
      setNewbornError('Ocurrió un error al guardar el registro del recién nacido.');
      console.error(err);
    }
  };


  const handleAddPostpartum = async (e: React.FormEvent) => {
    e.preventDefault();
    await createPostpartum({
      dias_posparto: parseInt(puerperioDias),
      fecha_evaluacion: puerperioFecha,
      complicaciones: puerperioCompl || null,
      observaciones: puerperioObs || null,
    });
    setPuerperioDias('1');
    setPuerperioCompl('');
    setPuerperioObs('');
    refreshPostpartum();
    window.dispatchEvent(new CustomEvent('refresh-risk-summary'));
  };

  const handleAddContraception = async (e: React.FormEvent) => {
    e.preventDefault();
    await createContraception({
      metodo_id: parseInt(anticonceptivoId),
      fecha_aplicacion: anticonceptivoFecha,
    });
    refreshContraception();
    window.dispatchEvent(new CustomEvent('refresh-risk-summary'));
  };

  return (
    <div className={styles.dashboardCard}>
      <div className={styles.dashboardHeader}>
        <h3 className={styles.title}>Control de Posparto (Módulo M4)</h3>
        <p className={styles.subtitle}>Gestiona los detalles de tu parto, recién nacido y recuperación de manera organizada.</p>
      </div>

      {/* Navegación por pestañas */}
      <div className={styles.tabNav}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'parto' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('parto')}
        >
          <PartoIcon /> Mi Parto
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'bebes' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('bebes')}
          disabled={!birthData}
          title={!birthData ? 'Primero registra el parto' : ''}
        >
          <BebesIcon /> Bebés
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'evolucion' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('evolucion')}
        >
          <EvolucionIcon /> Evolución
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'planificacion' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('planificacion')}
        >
          <PlanificacionIcon /> Planificación
        </button>
      </div>

      {/* Contenido de pestañas */}
      <div className={styles.tabContent}>
        
        {/* --- PESTAÑA 1: PARTO --- */}
        {activeTab === 'parto' && (
          <div className={styles.pane}>
            {birthData ? (
              <div className={styles.summaryBox}>
                <div className={styles.successBadge}>✓ Parto Registrado</div>
                <div className={styles.summaryGrid}>
                  <div>
                    <strong>Tipo de parto:</strong> {birthData.tipo_parto}
                  </div>
                  <div>
                    <strong>Fecha de parto:</strong> {birthData.fecha_parto}
                  </div>
                  <div>
                    <strong>UCI Materna:</strong> {birthData.uci_materna ? 'Sí' : 'No'}
                  </div>
                  {birthData.complicaciones && (
                    <div className={styles.fullWidth}>
                      <strong>Complicaciones:</strong> {birthData.complicaciones}
                    </div>
                  )}
                </div>
                {!inModal && (
                  <div className={styles.editSection} style={{ marginTop: '15px', textAlign: 'center' }}>
                    <p className={styles.helperText} style={{ marginBottom: '10px' }}>¿Hubo algún error? Puedes actualizar los datos del parto.</p>
                    <button
                      type="button"
                      onClick={onEditBirth}
                      className={styles.submitBtn}
                      style={{ margin: '0 auto', maxWidth: '250px', display: 'block' }}
                    >
                      Editar Registro de Parto
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.infoAlert}>
                Aún no has registrado los detalles de tu parto. Completa el formulario para habilitar el registro de tu bebé.
              </div>
            )}

            {(!birthData || inModal) && (
              <form onSubmit={handleSaveBirth} className={styles.form}>
                <h4 className={styles.formTitle}>{birthData ? 'Editar Registro de Parto' : 'Registrar Datos de Parto'}</h4>
                <div className={styles.fieldGroup}>
                  <label>Tipo de parto</label>
                  <select value={tipoParto} onChange={(e) => setTipoParto(e.target.value)}>
                    <option value="Vaginal">Parto Vaginal Natural</option>
                    <option value="Cesárea">Cesárea</option>
                    <option value="Instrumentado">Vaginal Instrumentado (Fórceps/Espátulas)</option>
                  </select>
                </div>
                <div className={styles.fieldGroup}>
                  <label>Fecha de parto</label>
                  <input
                    type="date"
                    value={fechaParto}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setFechaParto(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.fieldGroupCheckbox}>
                  <input
                    type="checkbox"
                    id="uciMaterna"
                    checked={uciMaterna}
                    onChange={(e) => setUciMaterna(e.target.checked)}
                  />
                  <label htmlFor="uciMaterna">¿Requirió ingreso a UCI Materna?</label>
                </div>
                <div className={styles.fieldGroup}>
                  <label>Complicaciones (Opcional)</label>
                  <textarea
                    value={complicacionesParto}
                    onChange={(e) => setComplicacionesParto(e.target.value)}
                    placeholder="Describe si hubo alguna eventualidad durante el parto..."
                  />
                </div>
                <button type="submit" className={styles.submitBtn} disabled={birthLoading}>
                  {birthLoading ? 'Guardando...' : birthData ? 'Actualizar Parto' : 'Registrar Parto'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* --- PESTAÑA 2: BEBÉS --- */}
        {activeTab === 'bebes' && birthData && (
          <div className={styles.pane}>
            <h4 className={styles.formTitle}>Bebés Registrados</h4>
            {newborns.length > 0 ? (
              <div className={styles.newbornList}>
                {newborns.map((baby, index) => (
                  <div key={baby.id || index} className={styles.babyCard}>
                    <div className={styles.babyIcon}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#df5d86' }}>
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div className={styles.babyDetails}>
                      <h5>{baby.vivo ? `Bebé #${index + 1} - Recién Nacido Activo` : `Bebé #${index + 1} - Óbito fetal`}</h5>
                      <p>
                        <strong>Peso:</strong> {baby.peso_gramos ? `${baby.peso_gramos} g` : 'No registrado'} |{' '}
                        <strong>Talla:</strong> {baby.talla_cm ? `${baby.talla_cm} cm` : 'No registrada'}
                      </p>
                      <p>
                        <strong>UCI Neonatal:</strong> {baby.uci_neonatal ? 'Sí' : 'No'}
                      </p>
                      {baby.observaciones && <p className={styles.babyNotes}>"{baby.observaciones}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>No has agregado recién nacidos todavía.</p>
            )}

            {newborns.length > 0 && !isAddingNewborn && (
              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    resetNewbornForm();
                    setIsAddingNewborn(true);
                  }}
                  className={styles.submitBtn}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', margin: '0 auto' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                  Registrar otro recién nacido
                </button>
              </div>
            )}

            {(newborns.length === 0 || isAddingNewborn) && (
              <form onSubmit={handleAddNewborn} className={styles.form}>
                <h4 className={styles.formTitle}>Agregar Recién Nacido</h4>
                {newbornError && (
                  <div className={styles.errorAlert} style={{ color: '#dc2626', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '14px', border: '1px solid #fecaca' }}>
                    ⚠️ {newbornError}
                  </div>
                )}
                <div className={styles.fieldGroupCheckbox}>
                  <input
                    type="checkbox"
                    id="bebeVivo"
                    checked={bebeVivo}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setBebeVivo(val);
                      if (!val) {
                        setBebePeso('');
                        setBebeTalla('');
                        setBebeUci(false);
                      }
                    }}
                  />
                  <label htmlFor="bebeVivo">Nacido Vivo</label>
                </div>
                {bebeVivo && (
                  <>
                    <div className={styles.row}>
                      <div className={styles.fieldGroup}>
                        <label>Peso (gramos)</label>
                        <input
                          type="number"
                          placeholder="Ej. 3200"
                          value={bebePeso}
                          min="500"
                          max="6000"
                          required
                          onChange={(e) => setBebePeso(e.target.value)}
                        />
                      </div>
                      <div className={styles.fieldGroup}>
                        <label>Talla (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Ej. 49.5"
                          value={bebeTalla}
                          min="20"
                          max="70"
                          required
                          onChange={(e) => setBebeTalla(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className={styles.fieldGroupCheckbox}>
                      <input
                        type="checkbox"
                        id="bebeUci"
                        checked={bebeUci}
                        onChange={(e) => setBebeUci(e.target.checked)}
                      />
                      <label htmlFor="bebeUci">¿Requirió ingreso a UCI Neonatal?</label>
                    </div>
                  </>
                )}
                <div className={styles.fieldGroup}>
                  <label>Observaciones o notas adicionales</label>
                  <textarea
                    value={bebeObs}
                    onChange={(e) => setBebeObs(e.target.value)}
                    placeholder="Detalles sobre el nacimiento de tu bebé..."
                  />
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className={styles.submitBtn} style={{ flex: 1 }} disabled={newbornLoading}>
                    {newbornLoading ? 'Guardando...' : 'Agregar Bebé'}
                  </button>
                  {newborns.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsAddingNewborn(false)}
                      className={styles.submitBtn}
                      style={{
                        background: '#f3e5e8',
                        color: '#9c4460',
                        boxShadow: 'none',
                        border: '1px solid #e2ccd3',
                        flex: 1
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}

        {/* --- PESTAÑA 3: EVOLUCIÓN --- */}
        {activeTab === 'evolucion' && (
          <div className={styles.pane}>
            <h4 className={styles.formTitle}>Historial de Puerperio / Recuperación</h4>
            {postpartumList.length > 0 ? (
              <div className={styles.timeline}>
                {postpartumList.map((item) => (
                  <div key={item.id} className={styles.timelineItem}>
                    <div className={styles.timelineMarker}>Día {item.dias_posparto}</div>
                    <div className={styles.timelineContent}>
                      <span className={styles.timelineDate}>{item.fecha_evaluacion}</span>
                      {item.complicaciones && (
                        <p className={styles.timelineAlert}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px', color: '#dc2626', verticalAlign: 'middle' }}>
                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                          <strong>Alerta:</strong> {item.complicaciones}
                        </p>
                      )}
                      {item.observaciones && <p className={styles.timelineText}>{item.observaciones}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.emptyText}>No hay registros de evolución posparto.</p>
            )}

            {/* Salud mental posparto si aplica */}
            {evolution?.evaluaciones_salud_mental && evolution.evaluaciones_salud_mental.length > 0 && (
              <div className={styles.mentalHealthBox}>
                <h5>Seguimiento de Salud Mental (Posparto)</h5>
                {evolution.evaluaciones_salud_mental.map((evalu) => (
                  <div key={evalu.id} className={styles.mentalRecord}>
                    <span className={styles.scoreBadge}>Puntaje {evalu.instrumento}: {evalu.puntaje}</span>
                    <span className={styles.mentalDate}>{evalu.fecha}</span>
                    {evalu.recomendaciones && <p className={styles.mentalTips}>{evalu.recomendaciones}</p>}
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddPostpartum} className={styles.form}>
              <h4 className={styles.formTitle}>Registrar Estado del Día</h4>
              <div className={styles.row}>
                <div className={styles.fieldGroup}>
                  <label>Días transcurridos posparto</label>
                  <input
                    type="number"
                    min="1"
                    value={puerperioDias}
                    onChange={(e) => setPuerperioDias(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.fieldGroup}>
                  <label>Fecha de evaluación</label>
                  <input
                    type="date"
                    value={puerperioFecha}
                    onChange={(e) => setPuerperioFecha(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className={styles.fieldGroup}>
                <label>Complicaciones o signos de alarma (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Fiebre, sangrado excesivo, dolor severo"
                  value={puerperioCompl}
                  onChange={(e) => setPuerperioCompl(e.target.value)}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label>Observaciones (Cómo te sientes hoy)</label>
                <textarea
                  placeholder="Escribe sobre tu lactancia, tu nivel de energía, dolor o dudas..."
                  value={puerperioObs}
                  onChange={(e) => setPuerperioObs(e.target.value)}
                />
              </div>
              <button type="submit" className={styles.submitBtn} disabled={postpartumLoading}>
                {postpartumLoading ? 'Guardando...' : 'Registrar Evolución'}
              </button>
            </form>
          </div>
        )}

        {/* --- PESTAÑA 4: PLANIFICACIÓN --- */}
        {activeTab === 'planificacion' && (
          <div className={styles.pane}>
            <h4 className={styles.formTitle}>Historial de Anticoncepción</h4>
            {contraceptionList.length > 0 ? (
              <div className={styles.contraceptionHistory}>
                {contraceptionList.map((item) => {
                  const metodo = METODOS_ANTICONCEPTIVOS.find((m) => m.id === item.metodo_id);
                  return (
                    <div key={item.id} className={styles.contraceptionCard}>
                      <div className={styles.contraceptionIcon}>
                        <ShieldIcon />
                      </div>
                      <div className={styles.contraceptionDetails}>
                        <h5>{metodo?.nombre || 'Método no especificado'}</h5>
                        <p><strong>Fecha de inicio/aplicación:</strong> {item.fecha_aplicacion}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className={styles.emptyText}>No has registrado métodos anticonceptivos posparto aún.</p>
            )}

            <form onSubmit={handleAddContraception} className={styles.form}>
              <h4 className={styles.formTitle}>Registrar Método Anticonceptivo</h4>
              <div className={styles.fieldGroup}>
                <label>Método utilizado/definido</label>
                <select value={anticonceptivoId} onChange={(e) => setAnticonceptivoId(e.target.value)}>
                  {METODOS_ANTICONCEPTIVOS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.fieldGroup}>
                <label>Fecha de aplicación</label>
                <input
                  type="date"
                  value={anticonceptivoFecha}
                  onChange={(e) => setAnticonceptivoFecha(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className={styles.submitBtn} disabled={contraceptionLoading}>
                {contraceptionLoading ? 'Guardando...' : 'Registrar Planificación'}
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
