import { useState, useEffect } from 'react';

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Detectar si ya está instalado y ejecutándose como Standalone
    const checkStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    setIsStandalone(checkStandalone);

    // 2. Detectar si es un dispositivo iOS (iPhone, iPad, iPod)
    const checkIOS = 
      /iPad|iPhone|iPod/.test(navigator.userAgent) && 
      !(window as any).MSStream;
    
    setIsIOS(checkIOS);

    // 3. Capturar el evento beforeinstallprompt (Android / Chrome Desktop / Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const installPWA = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.warn('El prompt de instalación no está disponible.');
      return false;
    }

    // Mostrar el prompt nativo
    deferredPrompt.prompt();

    // Esperar la respuesta de la usuaria
    const { outcome } = await deferredPrompt.userChoice;
    
    // Limpiar el evento guardado ya que solo se puede usar una vez
    setDeferredPrompt(null);
    setIsInstallable(false);

    return outcome === 'accepted';
  };

  return {
    isInstallable,
    isStandalone,
    isIOS,
    installPWA,
  };
};
