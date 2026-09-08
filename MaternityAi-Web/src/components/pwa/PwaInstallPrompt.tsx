import { useState } from 'react';
import { usePWAInstall } from '../../hooks/pwa/usePWAInstall';
import styles from './PwaInstallPrompt.module.css';

interface PwaInstallPromptProps {
  forceShow?: boolean;
}

export const PwaInstallPrompt = ({ forceShow = false }: PwaInstallPromptProps) => {
  const { isInstallable, isStandalone, isIOS, installPWA } = usePWAInstall();
  const [isOpen, setIsOpen] = useState(false);

  // Si ya se está ejecutando como app nativa (standalone), no mostrar nada
  if (isStandalone) return null;

  // Si el navegador no es elegible para instalar (y no es iOS/Safari ni forceShow), no mostrar nada
  if (!isInstallable && !isIOS && !forceShow) return null;

  const handleInstallClick = async () => {
    const success = await installPWA();
    if (success) {
      setIsOpen(false);
    }
  };

  // Contenido de la instalación para Android/Chrome
  const renderAndroidContent = () => (
    <div className={styles.promptContent}>
      <div className={styles.headerRow}>
        <div className={styles.logoWrapper}>
          <img src="/image/logo.png" alt="MaternityAI Logo" className={styles.logoImg} />
        </div>
        <div className={styles.titleSection}>
          <h4 className={styles.title}>Instalar MaternityAI</h4>
          <span className={styles.subtitle}>Aplicación Web Optimizada</span>
        </div>
      </div>
      <p className={styles.description}>
        Añade MaternityAI a tu pantalla de inicio para un acceso rápido con un toque, menor consumo de datos y soporte sin internet.
      </p>
      <button onClick={handleInstallClick} className={styles.installBtn}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Instalar ahora
      </button>
    </div>
  );

  // Contenido de la instalación para iOS/Safari
  const renderIosContent = () => (
    <div className={styles.promptContent}>
      <div className={styles.headerRow}>
        <div className={styles.logoWrapper}>
          <img src="/image/logo.png" alt="MaternityAI Logo" className={styles.logoImg} />
        </div>
        <div className={styles.titleSection}>
          <h4 className={styles.title}>Instalar en iPhone / iPad</h4>
          <span className={styles.subtitle}>Añadir a pantalla de inicio</span>
        </div>
      </div>
      <p className={styles.description}>
        Agrega la aplicación a tu pantalla de inicio de Apple en segundos siguiendo estos pasos:
      </p>
      <div className={styles.iosInstructions}>
        <div className={styles.iosStep}>
          <div className={styles.iosIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#007AFF" strokeWidth="2.5">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </div>
          <span>1. Toca el botón <strong>Compartir</strong> en la barra inferior de Safari.</span>
        </div>
        <div className={styles.iosStep}>
          <div className={styles.iosIcon}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <span>2. Busca en el menú y selecciona <strong>Añadir a pantalla de inicio</strong>.</span>
        </div>
      </div>
    </div>
  );

  // Contenido de información genérica (fallback)
  const renderGenericContent = () => (
    <div className={styles.promptContent}>
      <div className={styles.headerRow}>
        <div className={styles.logoWrapper}>
          <img src="/image/logo.png" alt="MaternityAI Logo" className={styles.logoImg} />
        </div>
        <div className={styles.titleSection}>
          <h4 className={styles.title}>MaternityAI PWA</h4>
          <span className={styles.subtitle}>Información del Sistema</span>
        </div>
      </div>
      <p className={styles.description}>
        MaternityAI está optimizada como Aplicación Web Progresiva. Puedes instalarla en cualquier dispositivo móvil o de escritorio a través de las opciones o menú de descarga de tu navegador web.
      </p>
    </div>
  );

  // 1. Vista en línea estática (para la sección de Perfil)
  if (forceShow) {
    return (
      <div className={styles.installContainerInline}>
        {isInstallable ? renderAndroidContent() : isIOS ? renderIosContent() : renderGenericContent()}
      </div>
    );
  }

  // 2. Vista flotante minimalista (para el Dashboard/Pantalla principal)
  return (
    <>
      {/* Botón flotante redondo (FAB) en el lateral derecho de la pantalla */}
      <button 
        className={styles.floatingFab} 
        onClick={() => setIsOpen(true)}
        aria-label="Instalar PWA"
        title="Instalar PWA"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className={styles.fabIcon}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>

      {/* Cajón desplegable desde abajo (Bottom Sheet) */}
      {isOpen && (
        <div className={styles.drawerOverlay} onClick={() => setIsOpen(false)}>
          <div className={styles.drawerSheet} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div className={styles.drawerHandle} />
              <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>✕</button>
            </div>
            
            <div className={styles.drawerBody}>
              {isInstallable ? renderAndroidContent() : isIOS ? renderIosContent() : renderGenericContent()}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default PwaInstallPrompt;
