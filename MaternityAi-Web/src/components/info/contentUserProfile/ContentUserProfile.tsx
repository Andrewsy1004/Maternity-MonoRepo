import { useState, useEffect } from 'react';
import { HeaderActividad } from '../../Headers/HeaderActividad/HeaderActividad';
import styles from './ContentUserProfile.module.css';
import { Left } from './left/Left';
import { UserInfo } from './Right/UserInfo/UserInfo';
import { ClinicalProfile } from '../../profile/ClinicalProfile';
import { ObstetricFormula } from '../../profile/ObstetricFormula';
import { PathologicalHistory } from '../../profile/PathologicalHistory';
import { GestationalAge } from '../../profile/GestationalAge';
import { SecurityQuestionUpdate } from '../../profile/SecurityQuestionUpdate';
import { DeleteAccount } from '../../profile/DeleteAccount';
import { Terms } from './Right/Terms/Terms';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useVitals } from '../../../hooks/clinical/useClinical';
import { PwaInstallPrompt } from '../../pwa/PwaInstallPrompt';
import { useGestationalAge } from '../../../hooks/m0/useM0';
import { useNewborns } from '../../../hooks/m4/useM4';
import { getActiveModule, type ActiveModule } from '../../../services/m0Service';

export const ContentUserProfile = () => {
  const [activeTab, setActiveTab] = useState<'perfil' | 'seguridad' | 'privacidad' | 'eliminar_cuenta'>('perfil');
  const navigate = useNavigate();
  const { logout } = useAuth();

  const { data: vitalsData } = useVitals();
  const sortedVitals = vitalsData ? [...vitalsData].sort((a, b) => {
    const dateA = a.created_at || '';
    const dateB = b.created_at || '';
    return dateB.localeCompare(dateA);
  }) : [];
  const latestVital = sortedVitals[0] || null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const [activeModule, setActiveModule] = useState<ActiveModule | null>(null);
  const { data: gestationalAgeData } = useGestationalAge();
  const { data: newborns } = useNewborns(activeModule?.codigo === 'M4');

  useEffect(() => {
    const loadModule = async () => {
      try {
        const modulo = await getActiveModule();
        setActiveModule(modulo);
      } catch (err) {
        console.error("Failed to load active module in profile:", err);
      }
    };
    loadModule();
  }, []);

  const getEtapaImage = (moduloCodigo: string | undefined, semanas: number | undefined): string => {
    if (moduloCodigo === 'M4') return './image/etapas/puerperio.png';
    const s = semanas ?? 0;
    if (s <= 13) return './image/etapas/primertrimestre.png';
    if (s <= 36) return './image/etapas/tercertrimestre.png';
    return './image/etapas/parto.png';
  };

  const datosBebe = newborns.length > 0
    ? {
      tamaño: newborns[0].talla_cm !== null && newborns[0].talla_cm !== undefined ? `${newborns[0].talla_cm}` : '--',
      gramos: newborns[0].peso_gramos !== null && newborns[0].peso_gramos !== undefined ? newborns[0].peso_gramos.toLocaleString('es-ES') : '--'
    }
    : {
      tamaño: '--',
      gramos: '--'
    };

  const storedUser = localStorage.getItem('user_name') || '200412';
  let userId = storedUser;
  if (storedUser.startsWith('Gestante')) {
    userId = storedUser.replace('Gestante ', '');
  }

  return (
    <div className={styles.mainWrapper}>
      <HeaderActividad />

      {/* --- DESKTOP VIEW --- */}
      <div className={styles.desktopView}>
        <section className={styles.container}>
          <div className={styles.sidebar}>
            <Left activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          <div className={styles.contentArea}>
            {activeTab === 'perfil' ? (
              <>
                <UserInfo />
                <div className={styles.medicalInfo}>
                  <ObstetricFormula />
                  <ClinicalProfile />
                  <PathologicalHistory />
                  <GestationalAge />
                </div>
              </>
            ) : activeTab === 'seguridad' ? (
              <SecurityQuestionUpdate />
            ) : activeTab === 'eliminar_cuenta' ? (
              <DeleteAccount />
            ) : (
              <Terms />
            )}
          </div>
        </section>
      </div>

      {/* --- MOBILE VIEW --- */}
      <div className={styles.mobileView}>
        <div className={styles.mobileHeader}>
          <div className={styles.greeting}>
            <p>Buenas tardes,</p>
            <h2>{userId}</h2>
          </div>
        </div>

        <div className={styles.fetusImageContainer}>
          <img 
            src={getEtapaImage(activeModule?.codigo, gestationalAgeData?.semanas)} 
            alt="Feto" 
            className={styles.fetusImage} 
            loading="lazy" 
            decoding="async" 
          />
        </div>

        <div className={styles.bottomSection}>
          <h3 className={styles.sectionTitle}>Datos del bebé</h3>
          <div className={styles.pinkContainer}>
            <div className={styles.babyCard}>
              <span>TAMAÑO</span>
              <strong>{datosBebe.tamaño} {datosBebe.tamaño !== '--' && <small>CM</small>}</strong>
            </div>
            <div className={styles.babyCard}>
              <span>GRAMOS</span>
              <strong>{datosBebe.gramos} {datosBebe.gramos !== '--' && <small>g</small>}</strong>
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Mis datos clínicos</h3>
          <div className={styles.pinkContainer}>
            <div className={styles.babyCard}>
              <span>PRESIÓN</span>
              <strong>
                {latestVital?.presion_sistolica && latestVital?.presion_diastolica
                  ? `${latestVital.presion_sistolica}/${latestVital.presion_diastolica}`
                  : '--/--'}
                <small style={{ display: 'block', fontSize: '9px', fontWeight: 'normal', color: '#888', marginTop: '2px' }}>mmHg</small>
              </strong>
            </div>
            <div className={styles.babyCard}>
              <span>PESO</span>
              <strong>
                {latestVital?.peso_kg ? `${latestVital.peso_kg}` : '--'}
                <small style={{ display: 'block', fontSize: '9px', fontWeight: 'normal', color: '#888', marginTop: '2px' }}>kg</small>
              </strong>
            </div>
            <div className={styles.babyCard}>
              <span>LPM BEBÉ</span>
              <strong>
                {latestVital?.fcf ? `${latestVital.fcf}` : '--'}
                <small style={{ display: 'block', fontSize: '9px', fontWeight: 'normal', color: '#888', marginTop: '2px' }}>lpm</small>
              </strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
            <ObstetricFormula />
            <ClinicalProfile />
            <PathologicalHistory />
            <GestationalAge />
            <SecurityQuestionUpdate />
            <DeleteAccount />
            
            <button 
              onClick={() => setActiveTab(activeTab === 'privacidad' ? 'perfil' : 'privacidad')}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                background: '#fff',
                color: '#333',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                textAlign: 'left'
              }}
            >
              Términos y condiciones
            </button>

            {activeTab === 'privacidad' && (
              <div style={{ background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Terms />
              </div>
            )}

            <button 
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                background: '#fff',
                color: '#CA436E',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                textAlign: 'left',
                marginTop: '10px'
              }}
            >
              Cerrar sesión
            </button>

            <PwaInstallPrompt forceShow />
          </div>
        </div>
      </div>
    </div>
  );
};
