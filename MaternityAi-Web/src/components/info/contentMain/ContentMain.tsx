import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Consejos } from './consejos/Consejos';
import styles from './ContentMain.module.css';
import { Datos } from './datos/Datos';
import { Registros } from './registros/Registros';
import { SvgBell, SvgSparkle } from '../../Icons/IconsSystem';
import { getActiveModule, type ActiveModule } from '../../../services/m0Service';
import { useGestationalAge } from '../../../hooks/m0/useM0';

import { ReporteModal } from './registros/reportarsignos/ReporteModal';
import { useSymptoms } from '../../../hooks/clinical/useClinical';
import { PostpartumDashboard } from './postpartum/PostpartumDashboard';
import { useBirthRecord } from '../../../hooks/m4/useM4';
import { AlertasPanel } from '../../alertas/AlertasPanel';
import { Modal } from '../../Modal';
import { RiskSummaryCard } from './RiskSummaryCard/RiskSummaryCard';
import { useRiskSummary } from '../../../hooks/ia/useRiskSummary';
import { PwaInstallPrompt } from '../../pwa/PwaInstallPrompt';

export const ContentMain = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<ActiveModule | null>(null);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const { summary } = useRiskSummary();
  const riskLevel = summary?.nivel_riesgo || 'verde';

  const handleNuevoEmbarazo = async () => {
    const confirm = window.confirm(
      "Para iniciar el monitoreo de tu nueva gestación, cerraremos tu sesión actual y te redirigiremos al formulario de registro donde obtendrás tu nuevo código de seguimiento. ¿Deseas continuar?"
    );
    if (confirm) {
      await logout();
      navigate('/register');
    }
  };

  const userName = localStorage.getItem('user_name') || 'Gestante';
  const displayId = userName.replace('Gestante ', '');
  const { data, refresh: refreshGestationalAge } = useGestationalAge();
  const { data: birthData, refresh: refreshBirth } = useBirthRecord(activeModule?.codigo === 'M4');

  const calcularDiasPosparto = () => {
    if (!birthData?.fecha_parto) return null;
    const fechaPartoDate = new Date(birthData.fecha_parto);
    const hoy = new Date();
    const diferenciaMs = hoy.getTime() - fechaPartoDate.getTime();
    const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
    return dias >= 0 ? dias : 0;
  };
  const diasPosparto = calcularDiasPosparto();

  const mensajeTiempo = () => {
    const hora = new Date().getHours();
    if (hora < 12) return 'Buenos días';
    if (hora < 18) return 'Buenas tardes';
    return 'Buenas noches';
  }



  const getEtapaImage = (moduloCodigo: string | undefined, semanas: number | undefined): string => {
    if (moduloCodigo === 'M4') return './image/etapas/puerperio.png';
    const s = semanas ?? 0;
    if (s <= 13) return './image/etapas/primertrimestre.png';
    if (s <= 36) return './image/etapas/tercertrimestre.png';
    return './image/etapas/parto.png';
  };



  const [symptomsModalOpen, setSymptomsModalOpen] = useState(false);
  const { report: reportSymptoms, loading: symptomsLoading, error: symptomsError } = useSymptoms();

  // Estados para el registro de parto y recién nacido desde el modal
  const [registerBirthOpen, setRegisterBirthOpen] = useState(false);

  const handleSymptomsSubmit = async (
    descripcion: string,
    severidad: 'leve' | 'moderado' | 'severo' | null,
  ) => {
    let capitalizedSeveridad: 'Leve' | 'Moderado' | 'Severo' | undefined = undefined;
    if (severidad === 'leve') capitalizedSeveridad = 'Leve';
    else if (severidad === 'moderado') capitalizedSeveridad = 'Moderado';
    else if (severidad === 'severo') capitalizedSeveridad = 'Severo';

    await reportSymptoms({ descripcion, severidad: capitalizedSeveridad });
    setSymptomsModalOpen(false);
  };

  const loadData = async () => {
    try {
      refreshBirth();
      refreshGestationalAge();
      const activeData = await getActiveModule();
      setActiveModule(activeData);
    } catch (err) {
      console.error("Error loading active module:", err);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('maternity-active-module-changed', loadData);
    return () => {
      window.removeEventListener('maternity-active-module-changed', loadData);
    };
  }, []);

  return (
    <section className={styles.container}>
      {/* --- DESKTOP VIEW --- */}
      <div className={styles.desktopView}>
        <div className={styles.informacion_usuario}>
          <div className="">
            <p style={{margin: 0}}>{mensajeTiempo()}, </p>
            <h1 className="">{userName}</h1>
            {activeModule?.codigo === 'M4' ? (
              <>
                <div className={styles.seccion_informacion}>
                  <div className={styles.semanas}>
                    <h2>{diasPosparto !== null ? `${diasPosparto} días` : 'Pendiente'}</h2>
                    <p>Posparto / Recuperación</p>
                  </div>
                  <img alt="foto posparto" src={getEtapaImage(activeModule?.codigo, undefined)} loading="lazy" decoding="async" />
                </div>
                {activeModule && (
                  <div className={styles.trimestreLabelOuter}>{activeModule.nombre}</div>
                )}
                <div 
                  className={styles.nuevoEmbarazoContainer} 
                  style={{ 
                    marginTop: '20px', 
                    padding: '16px', 
                    background: 'rgba(223, 93, 134, 0.05)', 
                    borderRadius: '16px', 
                    border: '1px dashed #df5d86', 
                    textAlign: 'center' 
                  }}
                >
                  <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#666', fontWeight: '500' }}>¿Nuevamente embarazada?</p>
                  <button 
                    onClick={handleNuevoEmbarazo}
                    style={{ 
                      background: '#df5d86', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '20px', 
                      padding: '8px 16px', 
                      fontSize: '12px', 
                      fontWeight: '600', 
                      cursor: 'pointer', 
                      boxShadow: '0 2px 4px rgba(223, 93, 134, 0.2)', 
                      transition: 'background 0.2s' 
                    }}
                  >
                    Registrar nueva gestación
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.seccion_informacion}>
                  <div className={styles.semanas}>
                    <h2>{data?.semanas ?? '--'}/40</h2>
                    <p>Semanas</p>
                  </div>
                  <img alt="foto trimestre" src={getEtapaImage(activeModule?.codigo, data?.semanas)} loading="lazy" decoding="async" />
                </div>
                {activeModule && (
                  <div className={styles.trimestreLabelOuter}>{activeModule.nombre}</div>
                )}
              </>
            )}
          </div>








        </div>
        <section className={styles.right}>
          <Datos className={styles.datos} activeModule={activeModule} />
          <Consejos 
            className={styles.consejos} 
            activeModule={activeModule}
            birthData={birthData}
            weeks={data?.semanas}
            onRegisterBirth={() => {
              setRegisterBirthOpen(true);
            }}
          />
          <Registros className={styles.registros} activeModule={activeModule} />
        </section>
      </div>

      {/* --- MOBILE VIEW --- */}
      <div className={styles.mobileView}>
        <div className={styles.mobileHeaderBg}>
          <div className={styles.mobileHeaderContent}>
            <div className={styles.mobileGreeting}>
              {mensajeTiempo()},<br />
              <strong>{displayId}</strong>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button 
                onClick={() => setIsRiskModalOpen(true)}
                title="Semáforo de Riesgo IA"
                aria-label="Semáforo de Riesgo IA"
                style={{
                  background: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}
              >
                <span style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  display: 'inline-block',
                  backgroundColor: riskLevel === 'rojo' ? '#ef4444' : riskLevel === 'amarillo' ? '#f59e0b' : '#10b981',
                  boxShadow: riskLevel === 'rojo' 
                    ? '0 0 8px #ef4444' 
                    : riskLevel === 'amarillo' 
                    ? '0 0 8px #f59e0b' 
                    : '0 0 8px #10b981',
                }} />
              </button>
              <button 
                onClick={() => {
                  setRegisterBirthOpen(true);
                }}
                title="Mi Bebé / Parto"
                aria-label="Mi Bebé / Parto"
                style={{
                  background: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  color: '#ca436e'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 12h.01" />
                  <path d="M15 12h.01" />
                  <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
                  <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 5 6.3" />
                  <path d="M12 2v2" />
                </svg>
              </button>
              <div 
                className={styles.mobileBell} 
                onClick={() => setAlertsOpen(!alertsOpen)} 
                style={{ cursor: 'pointer' }}
              >
                <SvgBell />
                <span className={styles.notificationDot}></span>
              </div>
            </div>
          </div>
        </div>

        {alertsOpen && (
          <div className={styles.mobileAlertsOverlay}>
            <AlertasPanel />
          </div>
        )}

        <div className={styles.mobileCard}>
          <PwaInstallPrompt />
          {(activeModule?.codigo === 'M4' || birthData) ? (
            <>
              <div className={styles.weeksCounter}>
                <span className={styles.weekCenter}>{diasPosparto !== null ? `${diasPosparto}` : '--'}</span>
              </div>
              <div className={styles.weeksLabel}>Días Posparto</div>
              {activeModule && (
                <div className={styles.mobileTrimestreLabel}>{activeModule.nombre}</div>
              )}
              {/* Progreso del Puerperio/Recuperación (Minimalista) */}
              <div style={{ width: '100%', padding: '0 8px', marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888', marginBottom: '4px', fontWeight: '500' }}>
                  <span>Día {diasPosparto || 0} de 42</span>
                  <span style={{ color: '#ca436e', fontWeight: '600' }}>{diasPosparto !== null ? Math.min(Math.round((diasPosparto / 42) * 100), 100) : 0}%</span>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(223, 93, 134, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${diasPosparto !== null ? Math.min((diasPosparto / 42) * 100, 100) : 0}%`, 
                    height: '100%', 
                    background: 'linear-gradient(90deg, #df5d86, #ca436e)',
                    borderRadius: '2px',
                    transition: 'width 0.5s ease-out'
                  }} />
                </div>
              </div>
            </>
          ) : (
            <>
              {(() => {
                const hasWeeks = data?.semanas !== undefined && data?.semanas !== null;
                const currentWeeks = hasWeeks ? data.semanas : 28;
                const side1 = hasWeeks ? Math.max(0, data.semanas - 1) : 27;
                const side2 = hasWeeks ? data.semanas + 1 : 29;
                const side3 = hasWeeks ? data.semanas + 2 : 30;
                const progressPercent = hasWeeks ? Math.min(Math.round((data.semanas / 40) * 100), 100) : 70;

                return (
                  <>
                    <div className={styles.weeksCounter}>
                      <span className={styles.weekSide}>{side1}</span>
                      <span className={styles.weekCenter}>{currentWeeks}</span>
                      <span className={styles.weekSide}>{side2}</span>
                      <span className={styles.weekSide}>{side3}</span>
                    </div>
                    <div className={styles.weeksLabel}>Semanas</div>
                    {activeModule && (
                      <div className={styles.mobileTrimestreLabel}>{activeModule.nombre}</div>
                    )}
                    {/* Progreso de la Gestación (Minimalista) */}
                    <div style={{ width: '100%', padding: '0 8px', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888', marginBottom: '4px', fontWeight: '500' }}>
                        <span>Semana {currentWeeks} de 40</span>
                        <span style={{ color: '#ca436e', fontWeight: '600' }}>{progressPercent}%</span>
                      </div>
                      <div style={{ width: '100%', height: '4px', backgroundColor: 'rgba(223, 93, 134, 0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${progressPercent}%`, 
                          height: '100%', 
                          background: 'linear-gradient(90deg, #df5d86, #ca436e)',
                          borderRadius: '2px',
                          transition: 'width 0.5s ease-out'
                        }} />
                      </div>
                    </div>
                  </>
                );
              })()}
            </>
          )}

          {/* Botón superior de acceso rápido para parto o bebé en el móvil */}
          <div style={{ width: '100%', padding: '0 8px', marginBottom: '15px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activeModule?.codigo === 'M4' || birthData ? (
              <>
                <button 
                  onClick={() => {
                    setRegisterBirthOpen(true);
                  }}
                  className={styles.topActionBtn}
                >
                  🍼 Control de Posparto
                </button>
                <button 
                  onClick={handleNuevoEmbarazo}
                  className={styles.topActionBtn}
                  style={{
                    background: 'white',
                    color: '#df5d86',
                    border: '1px dashed #df5d86',
                    boxShadow: 'none'
                  }}
                >
                  👶 Registrar Nueva Gestación
                </button>
              </>
            ) : (
              (activeModule?.codigo === 'M3' || (data?.semanas && data.semanas >= 28)) && (
                <button 
                  onClick={() => {
                    setRegisterBirthOpen(true);
                  }}
                  className={styles.topActionBtn}
                >
                  👶 ¿Ya nació tu bebé? Registrar Parto
                </button>
              )
            )}
          </div>

          <button className={styles.sintomasBtn} onClick={() => setSymptomsModalOpen(true)}>
            Sintomas criticos
            <div className={styles.sintomasIcon}>
              <SvgSparkle width={18} height={18} fill="white" />
            </div>
          </button>
          
          {activeModule?.codigo !== 'M4' && (
            <div className={styles.preparacionSeccion} style={{ width: '100%', marginTop: '15px' }}>
              <Consejos 
                activeModule={activeModule}
                birthData={birthData}
                weeks={data?.semanas}
                onRegisterBirth={() => {
                  setRegisterBirthOpen(true);
                }}
              />
            </div>
          )}
        </div>

        {/* --- DATOS Y REGISTROS EN MÓVIL --- */}
        <div className={styles.mobileAdditionalContainer}>
          <div className={styles.mobileSectionHeader}>
            <h3>Mis Métricas Clínicas</h3>
          </div>
          <Datos activeModule={activeModule} className={styles.mobileSectionComponent} />
        </div>

        <div className={styles.mobileAdditionalContainer}>
          <div className={styles.mobileSectionHeader}>
            <h3>Mis Registros y Cuestionarios</h3>
          </div>
          <Registros className={styles.mobileSectionComponent} activeModule={activeModule} />
        </div>
      </div>

      {isRiskModalOpen && (
        <Modal 
          isOpen={isRiskModalOpen} 
          onClose={() => setIsRiskModalOpen(false)} 
          title="Semáforo de Riesgo IA"
        >
          <div style={{ padding: '5px' }}>
            <RiskSummaryCard />
          </div>
        </Modal>
      )}

      {symptomsModalOpen && (
        <ReporteModal
          loading={symptomsLoading}
          error={symptomsError}
          onClose={() => setSymptomsModalOpen(false)}
          onSubmit={handleSymptomsSubmit}
        />
      )}

      {registerBirthOpen && (
        <Modal 
          isOpen={registerBirthOpen} 
          onClose={() => {
            setRegisterBirthOpen(false);
            loadData();
          }} 
          title="Control de Posparto"
        >
          <div style={{ padding: '10px' }}>
            <PostpartumDashboard inModal={true} onBirthSaved={loadData} />
          </div>
        </Modal>
      )}
    </section>
  );
};
