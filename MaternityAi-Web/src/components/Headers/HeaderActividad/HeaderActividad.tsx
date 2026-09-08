import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { DegradedText } from '../../gradedcomponents/degradedtext/DegradedText';
import { useAuth } from '../../../context/AuthContext';
import styles from './HeaderActividad.module.css';
import { MobileBottomNav } from '../MobileBottomNav';
import { AlertasPanel } from '../../alertas/AlertasPanel';
import { RiskSummaryCard } from '../../info/contentMain/RiskSummaryCard/RiskSummaryCard';
import { Modal } from '../../Modal';
import { ProgressChecklist } from '../../info/contentMain/progressChecklist/ProgressChecklist';
import { getActiveModule } from '../../../services/m0Service';
import { PostpartumDashboard } from '../../info/contentMain/postpartum/PostpartumDashboard';

interface HeaderActividadProps {
  rol?: 'paciente' | 'medico' | 'admin' | 'hospital';
  tabActivo?: string; 
}

export const HeaderActividad = ({ rol }: HeaderActividadProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const currentPath = location.pathname;

  const rawRole = localStorage.getItem('role') || rol;
  const activeRole: 'paciente' | 'medico' | 'admin' | 'hospital' = 
    rawRole === 'admin' ? 'admin' :
    rawRole === 'hospital' ? 'hospital' :
    (rawRole === 'clinico' || rawRole === 'medico') ? 'medico' : 'paciente';

  const [alertsOpen, setAlertsOpen] = useState(false);
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isBabyModalOpen, setIsBabyModalOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<{
    modulo_id: number;
    codigo: string;
    nombre: string;
  } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadModule = () => {
      if (activeRole === 'paciente') {
        getActiveModule().then(setActiveModule).catch(console.error);
      }
    };
    loadModule();

    window.addEventListener('maternity-active-module-changed', loadModule);
    return () => {
      window.removeEventListener('maternity-active-module-changed', loadModule);
    };
  }, [activeRole]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getTabClass = (path: string) => {
    return currentPath.includes(path) ? `${styles.tab} ${styles.activeTab}` : styles.tab;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAlertsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
    <header className={`${styles.container} ${currentPath === '/main' ? styles.hideOnMobileMain : ''}`}>
      <div className={styles.logo}>
        <DegradedText text="MaternityAi" fontSize="23px" />
      </div>

      <nav>        
        {activeRole === 'paciente' && (
          <>
            <Link to={'/main'} className={getTabClass('/main')}>Principal</Link>
            <Link to={'/biblioteca'} className={getTabClass('/biblioteca')}>Biblioteca</Link>
            <Link to={'/actividad'} className={getTabClass('/actividad')}>Actividad</Link>
            <Link to={'/ai'} className={getTabClass('/ai')}>Chat IA</Link>
          </>
        )}

        {/* Links específicos de Admin */}
        {activeRole === 'admin' && (
          <>
            <Link to={'/admin/usuarias'} className={getTabClass('/admin/usuarias')}>Usuarias</Link>
            <Link to={'/admin/preguntas'} className={getTabClass('/admin/preguntas')}>Preguntas</Link>
            <Link to={'/admin/cargas'} className={getTabClass('/admin/cargas')}>Cargas</Link>
            <Link to={'/admin/checklist'} className={getTabClass('/admin/checklist')}>Checklist</Link>
            <Link to={'/admin/ia'} className={getTabClass('/admin/ia')}>IA</Link>
          </>
        )}

        {/* Links específicos de Médico / Clínico */}
        {activeRole === 'medico' && (
          <>
            <Link to={'/clinico/usuarias'} className={getTabClass('/clinico/usuarias')}>Usuarias</Link>
            <Link to={'/clinico/oba'} className={getTabClass('/clinico/oba')}>OVA</Link>
            <Link to={'/clinico/citas'} className={getTabClass('/clinico/citas')}>Citas</Link>
            <Link to={'/clinico/ia'} className={getTabClass('/clinico/ia')}>IA</Link>
          </>
        )}

        {activeRole === 'hospital' && (
          <>
            <Link to={'/hospital/dashboard'} className={getTabClass('/hospital/dashboard')}>Monitoreo de Alertas</Link>
          </>
        )}
      </nav>

      <div className={styles.perfilSection} ref={dropdownRef}>
        {activeRole === 'paciente' && (
          <>
            <button 
              onClick={() => {
                setAlertsOpen(false);
                setIsProgressModalOpen(true);
              }}
              className={styles.bellBtn}
              style={{ marginRight: '5px' }}
              aria-label="Mi Progreso"
              title="Mi Progreso"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="9" y1="6" x2="20" y2="6"></line>
                <line x1="9" y1="12" x2="20" y2="12"></line>
                <line x1="9" y1="18" x2="20" y2="18"></line>
                <circle cx="4" cy="6" r="1"></circle>
                <circle cx="4" cy="12" r="1"></circle>
                <circle cx="4" cy="18" r="1"></circle>
              </svg>
            </button>
            <button 
              onClick={() => {
                setAlertsOpen(false);
                setIsRiskModalOpen(true);
              }}
              className={styles.bellBtn}
              style={{ marginRight: '5px' }}
              aria-label="Semáforo de Riesgo IA"
              title="Semáforo de Riesgo IA"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="7" y="2" width="10" height="20" rx="3" />
                <circle cx="12" cy="7" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="17" r="2" />
              </svg>
            </button>
            <button 
              onClick={() => {
                setAlertsOpen(false);
                setIsBabyModalOpen(true);
              }}
              className={styles.bellBtn}
              style={{ marginRight: '5px' }}
              aria-label="Mi Bebé / Parto"
              title="Mi Bebé / Parto"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12h.01" />
                <path d="M15 12h.01" />
                <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" />
                <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 5 6.3" />
                <path d="M12 2v2" />
              </svg>
            </button>
            <button 
              onClick={() => setAlertsOpen(!alertsOpen)}
              className={`${styles.bellBtn} ${alertsOpen ? styles.bellActive : ''}`}
              aria-label="Alertas y Notificaciones"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>
          </>
        )}

        <div 
          onClick={activeRole === 'paciente' ? () => navigate('/userprofile') : undefined} 
          className={`${styles.perfil} ${activeRole !== 'paciente' ? styles.perfilNoClick : ''}`}
        >
          <div>
            <p className={styles.name}>{localStorage.getItem('user_name') || 'Usuario'}</p>
            <p className={styles.desc}>
              {activeRole === 'medico' ? 'Personal Médico' : 
               activeRole === 'admin' ? 'Administrador' : 
               activeRole === 'hospital' ? 'Personal Hospitalario' : 
               'Gestante'}
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleLogout}
          style={{ 
            background: '#CA436E', 
            color: 'white', 
            border: 'none', 
            padding: '6px 12px', 
            borderRadius: '15px', 
            cursor: 'pointer', 
            height: 'fit-content',
            fontSize: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          Cerrar sesión
        </button>

        {alertsOpen && (
          <div className={styles.alertsDropdown}>
            <AlertasPanel />
          </div>
        )}
      </div>
    </header>

    <Modal isOpen={isRiskModalOpen} onClose={() => setIsRiskModalOpen(false)} title="Semáforo de Riesgo IA">
      <RiskSummaryCard />
    </Modal>

    <Modal isOpen={isProgressModalOpen} onClose={() => setIsProgressModalOpen(false)} title="Mi Progreso">
      {activeModule && (
        <ProgressChecklist
          moduloId={activeModule.modulo_id}
          moduloCodigo={activeModule.codigo}
        />
      )}
    </Modal>

    {isBabyModalOpen && (
      <Modal 
        isOpen={isBabyModalOpen} 
        onClose={() => setIsBabyModalOpen(false)} 
        title="Control de Posparto"
      >
        <div style={{ padding: '10px' }}>
          <PostpartumDashboard inModal={true} />
        </div>
      </Modal>
    )}

    {activeRole === 'paciente' && (
      <div className={styles.mobileNavWrapper}>
        <MobileBottomNav />
      </div>
    )}
    </>
  );
};
