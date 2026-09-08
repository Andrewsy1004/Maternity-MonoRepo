import React, { useState } from 'react';
import { deleteAccount } from '../../services/m0Service';
import { loginUser } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import styles from './Profile.module.css';

export const DeleteAccount: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [gmiConfirmation, setGmiConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Extract GMI code from localStorage
  const storedUser = localStorage.getItem('user_name') || '';
  let gmiCode = storedUser;
  if (storedUser.startsWith('Gestante')) {
    gmiCode = storedUser.replace('Gestante ', '');
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!securityAnswer.trim()) {
      setError('Por favor, ingresa tu respuesta de seguridad.');
      return;
    }

    if (gmiConfirmation.trim() !== gmiCode) {
      setError(`El código de confirmación ingresado no coincide con tu código GMI (${gmiCode}).`);
      return;
    }

    setLoading(true);

    try {
      // Step 1: Validate security answer via login API
      await loginUser({
        codigo_gmi: gmiCode,
        respuesta_seguridad: securityAnswer
      });
      // Verification succeeded
      setStep(2);
      setSuccess('Identidad verificada exitosamente. Por favor, confirma la eliminación final.');
    } catch (err: any) {
      console.error("Error validating security credentials for deletion:", err);
      setError('Respuesta de seguridad incorrecta. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 2: Call DELETE account endpoint
      await deleteAccount();
      
      // Clear storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('role');
      localStorage.removeItem('user_name');

      alert('Tu cuenta y datos asociados han sido eliminados de forma permanente.');
      navigate('/login', { replace: true });
    } catch (err: any) {
      console.error("Error executing account deletion:", err);
      setError('Ocurrió un error al eliminar tu cuenta. Por favor, inténtalo de nuevo.');
      setStep(1); // Reset back to verification step
    } finally {
      setLoading(false);
    }
  };

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={styles.card} style={{ border: '1px solid rgba(227, 38, 54, 0.2)' }}>
      <div 
        className={styles.header} 
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ 
          cursor: 'pointer', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: isExpanded ? '20px' : '0px'
        }}
      >
        <h3 style={{ color: '#e32636', margin: 0 }}>Solicitar Eliminación de Cuenta</h3>
        <span style={{ color: '#e32636', fontSize: '12px', fontWeight: 'bold' }}>{isExpanded ? '▲' : '▼'}</span>
      </div>

      {isExpanded && (
        <div className={styles.content}>
        {/* Warning Banner */}
        <div style={{
          color: '#c62828',
          backgroundColor: '#ffebee',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #ffcdd2',
          fontSize: '0.92rem',
          lineHeight: '1.6',
          marginBottom: '20px',
          fontWeight: '500'
        }}>
          ⚠️ <strong>ATENCIÓN: Proceso irreversible (Derecho de Supresión)</strong>
          <br />
          Esta acción eliminará de forma definitiva y permanente tu cuenta de gestante, tus datos clínicos, historial de alertas, fórmula obstétrica y toda la información de trazabilidad de la plataforma. Ninguno de estos datos podrá ser recuperado posteriormente.
        </div>

        {error && (
          <div style={{ color: '#d32f2f', backgroundColor: '#fdeded', padding: '12px 16px', borderRadius: '12px', border: '1px solid #ef5350', fontSize: '0.9rem', fontWeight: '500', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ color: '#2e7d32', backgroundColor: '#edf7ed', padding: '12px 16px', borderRadius: '12px', border: '1px solid #c8e6c9', fontSize: '0.9rem', fontWeight: '500', marginBottom: '16px' }}>
            {success}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, color: '#666', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Para iniciar el proceso de eliminación, completa la siguiente verificación de seguridad:
            </p>

            <div className={styles.field}>
              <label>1. Respuesta de seguridad</label>
              <input
                type="password"
                placeholder="Escribe tu respuesta secreta actual"
                value={securityAnswer}
                onChange={(e) => {
                  setSecurityAnswer(e.target.value);
                  if (error) setError(null);
                }}
                disabled={loading}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e0e0e0',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div className={styles.field}>
              <label>2. Escribe tu código GMI para confirmar (<strong>{gmiCode}</strong>)</label>
              <input
                type="text"
                placeholder="Escribe exactamente tu código GMI"
                value={gmiConfirmation}
                onChange={(e) => {
                  setGmiConfirmation(e.target.value);
                  if (error) setError(null);
                }}
                disabled={loading}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e0e0e0',
                  fontSize: '1rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              className={styles.saveBtn}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #e32636 0%, #ff5c5c 100%)',
                boxShadow: '0 4px 12px rgba(227, 38, 54, 0.25)'
              }}
            >
              {loading ? 'Verificando datos...' : 'Verificar datos de eliminación'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '10px' }}>
            <p style={{ margin: 0, color: '#333', fontSize: '0.95rem', fontWeight: '500', lineHeight: '1.6' }}>
              Tu identidad ha sido verificada. Para completar la eliminación de tu cuenta y todos tus datos médicos, presiona el botón rojo a continuación.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => {
                  setStep(1);
                  setSuccess(null);
                  setError(null);
                  setSecurityAnswer('');
                  setGmiConfirmation('');
                }}
                style={{ flex: 1, padding: '12px', borderRadius: '12px' }}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: '#c62828',
                  boxShadow: '0 4px 12px rgba(198, 40, 40, 0.3)'
                }}
              >
                {loading ? 'Eliminando...' : 'Sí, eliminar mi cuenta permanentemente'}
              </button>
            </div>
          </div>
        )}
        </div>
      )}
    </div>
  );
};
