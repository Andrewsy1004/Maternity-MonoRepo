import { useState, useEffect } from 'react';

export const OfflineBanner = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(135deg, #e05c87 0%, #ca436e 100%)',
      color: 'white',
      padding: '10px 16px',
      fontSize: '13.5px',
      fontWeight: '600',
      textAlign: 'center',
      zIndex: 99999,
      boxShadow: '0 3px 12px rgba(0,0,0,0.15)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.3s ease-in-out',
    }}>
      <svg 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{ animation: 'pulse 1.5s infinite' }}
      >
        <line x1="1" y1="1" x2="23" y2="23"></line>
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.5"></path>
        <path d="M5 12.5a10.94 10.94 0 0 1 5.83-2.84"></path>
        <path d="M12 18.5a4.25 4.25 0 0 1-2.12-.56"></path>
        <path d="M12 18.5a4.25 4.25 0 0 0 2.56-.86"></path>
        <path d="M19 12.5a10.94 10.94 0 0 0-4.83-2.84"></path>
        <path d="M5 12.5c2.47-1.57 5.4-2.5 8.5-2.5"></path>
      </svg>
      <span>Trabajando sin conexión. Los cambios se guardarán localmente.</span>

      <style>{`
        @keyframes pulse {
          0% { opacity: 0.6; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.6; transform: scale(0.95); }
        }
      `}</style>
    </div>
  );
};
