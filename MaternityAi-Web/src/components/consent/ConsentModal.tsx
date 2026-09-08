import { useState, useRef, useEffect, useCallback } from 'react';
import styles from './ConsentModal.module.css';
import { getConsent, registerConsent } from '../../services/m0Service';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface ConsentModalProps {
  onAccepted: () => void;
}

export const ConsentModal = ({ onAccepted }: ConsentModalProps) => {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const bodyRef = useRef<HTMLDivElement>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleScroll = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    const progress = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
    setScrollProgress(Math.min(100, Math.max(0, progress)));
  }, []);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.addEventListener('scroll', handleScroll);
    return () => { if (el) el.removeEventListener('scroll', handleScroll); };
  }, [handleScroll]);

  const handleAccept = async () => {
    if (!checked || loading) return;
    setLoading(true);
    try {
      // Generar hash del consentimiento (timestamp + version)
      const version = 'v1.0-2025';
      const hashInput = `GMI-CONSENT-${version}-${Date.now()}`;
      const hashBuffer = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(hashInput)
      );
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      await registerConsent({ version, hash_consentimiento: hash });
      localStorage.setItem('consent_accepted', 'true');
      onAccepted();
    } catch (err) {
      console.error('Error registrando consentimiento:', err);
      // Si falla el backend, guardar localmente y continuar
      localStorage.setItem('consent_accepted', 'true');
      onAccepted();
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="consent-title">
      <div className={styles.modal}>

        {/* Scroll progress bar */}
        <div className={styles.scrollBar}>
          <div className={styles.scrollBarFill} style={{ width: `${scrollProgress}%` }} />
        </div>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoRow}>
            <div className={styles.logoIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div className={styles.logoText}>
              <strong>Guía Materna Inteligente</strong>
              <span>UNAD · Universidad Libre · Alcaldía de Puerto Colombia</span>
            </div>
          </div>
          <h1 className={styles.title} id="consent-title">Consentimiento Informado</h1>
          <p className={styles.subtitle}>Lee con atención antes de activar tu perfil de gestante</p>
        </div>

        {/* Scrollable body */}
        <div className={styles.body} ref={bodyRef}>

          {/* Propósito */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
              </svg>
              Propósito del sistema
            </h2>
            <p className={styles.sectionText}>
              La <strong>Guía Materna Inteligente</strong> acompaña tu embarazo de manera segura y personalizada.
              Su objetivo es ayudarte a reconocer signos de alerta, fortalecer tu autocuidado y conectarte con los
              servicios de salud cuando sea necesario. La aplicación <em>no reemplaza la atención médica</em>, sino
              que la complementa con apoyo digital y educativo.
            </p>
          </div>

          {/* Uso de datos */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              Uso y protección de tus datos
            </h2>
            <div className={styles.infoBox}>
              <div className={styles.infoRow}>
                <div className={styles.infoRowIcon}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#CA436E" stroke="none"><circle cx="12" cy="12" r="10"/></svg>
                </div>
                <div>
                  <span className={styles.infoRowLabel}>Finalidad</span>
                  <span className={styles.infoRowValue}>Acompañamiento clínico, educativo y de salud pública durante el embarazo, parto y puerperio.</span>
                </div>
              </div>
              <div className={styles.infoRow}>
                <div className={styles.infoRowIcon}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#CA436E" stroke="none"><circle cx="12" cy="12" r="10"/></svg>
                </div>
                <div>
                  <span className={styles.infoRowLabel}>Anonimización</span>
                  <span className={styles.infoRowValue}>Tu información personal será anonimizada con un código único ID-GMI y guardada de forma cifrada (AES-256) en servidores seguros.</span>
                </div>
              </div>
              <div className={styles.infoRow}>
                <div className={styles.infoRowIcon}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#CA436E" stroke="none"><circle cx="12" cy="12" r="10"/></svg>
                </div>
                <div>
                  <span className={styles.infoRowLabel}>Acceso autorizado</span>
                  <span className={styles.infoRowValue}>Solo el equipo de salud e investigadores autorizados de UNAD, Universidad Libre, Hospital de Puerto Colombia y Alcaldía pueden acceder a tus datos nominales bajo confidencialidad.</span>
                </div>
              </div>
              <div className={styles.infoRow}>
                <div className={styles.infoRowIcon}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#CA436E" stroke="none"><circle cx="12" cy="12" r="10"/></svg>
                </div>
                <div>
                  <span className={styles.infoRowLabel}>Publicación</span>
                  <span className={styles.infoRowValue}>Los informes de resultados se presentan sin nombres ni identificaciones personales.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tus derechos */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              Tus derechos (Ley 1581 de 2012)
            </h2>
            <ul className={styles.rightsList}>
              <li>Conocer, actualizar y rectificar tus datos personales en cualquier momento.</li>
              <li>Solicitar prueba de esta autorización de tratamiento de datos.</li>
              <li>Ser informada sobre el uso dado a tus datos de salud.</li>
              <li>Revocar tu consentimiento y solicitar eliminación de tu cuenta escribiendo a <strong>guiamaterna@unad.edu.co</strong></li>
              <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC).</li>
            </ul>
          </div>

          {/* Nota legal */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
              Marco normativo
            </h2>
            <div className={styles.legalNote}>
              Proyecto interinstitucional <strong>UNAD – Universidad Libre – Alcaldía de Puerto Colombia – E.S.E. Hospital de Puerto Colombia</strong>.<br/><br/>
              Tratamiento bajo: <strong>Ley 1581 de 2012</strong> · Decreto 1377 de 2013 · Resolución 1995/1999 · Ley 2015 de 2020.<br/>
              Estándares: <strong>ISO 27001</strong> · HL7/FHIR · OWASP · Cifrado AES-256 y TLS 1.3.<br/><br/>
              Al aceptar, confirmas que eres mayor de 14 años o actúas con representación legal, que has leído y comprendido este documento, y que otorgas de manera libre, voluntaria e informada tu autorización para el tratamiento de datos descrito.
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={checked}
              onChange={e => setChecked(e.target.checked)}
              id="consent-check"
            />
            <span className={styles.checkLabel}>
              He leído y comprendo el propósito del sistema. Acepto el tratamiento de mis datos bajo la normativa vigente.{' '}
              <strong>Entiendo que puedo revocar este consentimiento en cualquier momento.</strong>
            </span>
          </label>

          <div className={styles.buttonRow}>
            <button className={styles.rejectBtn} onClick={handleReject} type="button">
              No acepto
            </button>
            <button
              className={styles.acceptBtn}
              onClick={handleAccept}
              disabled={!checked || loading}
              type="button"
            >
              {loading ? (
                <><div className={styles.spinner} /> Registrando...</>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Acepto y continuar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook para manejar el estado del consentimiento informado.
 * Verifica primero localStorage, luego la API.
 */
export const useConsentCheck = () => {
  const [consentStatus, setConsentStatus] = useState<'loading' | 'accepted' | 'pending'>('loading');

  useEffect(() => {
    const local = localStorage.getItem('consent_accepted');
    if (local === 'true') {
      setConsentStatus('accepted');
      return;
    }
    // Verificar con el backend
    getConsent()
      .then(resp => {
        if (resp.estado === 'ACEPTADO') {
          localStorage.setItem('consent_accepted', 'true');
          setConsentStatus('accepted');
        } else {
          setConsentStatus('pending');
        }
      })
      .catch(() => {
        // Si el endpoint falla (404 = no registrado), mostrar modal
        setConsentStatus('pending');
      });
  }, []);

  const markAccepted = () => setConsentStatus('accepted');

  return { consentStatus, markAccepted };
};
