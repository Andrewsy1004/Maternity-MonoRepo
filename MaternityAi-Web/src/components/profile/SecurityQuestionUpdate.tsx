import React, { useState } from 'react';
import { updateSecurityQuestion } from '../../services/m0Service';
import { loginUser } from '../../services/authService';
import styles from './Profile.module.css';

export const SecurityQuestionUpdate: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [newQuestion, setNewQuestion] = useState('¿Cuál es el nombre de tu primera mascota?');
  const [newAnswer, setNewAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Extract GMI code from localStorage
  const storedUser = localStorage.getItem('user_name') || '';
  let gmiCode = storedUser;
  if (storedUser.startsWith('Gestante')) {
    gmiCode = storedUser.replace('Gestante ', '');
  }

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAnswer.trim()) {
      setError('Por favor, ingresa tu respuesta de seguridad actual.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate by attempting to login with the current code and the typed answer
      await loginUser({
        codigo_gmi: gmiCode,
        respuesta_seguridad: currentAnswer
      });
      setStep(2);
      setSuccess('Respuesta validada correctamente. Ahora puedes modificar tu pregunta y respuesta.');
    } catch (err: any) {
      console.error("Error validating security question answer:", err);
      setError('Respuesta de seguridad incorrecta. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnswer.trim()) {
      setError('Por favor, ingresa la respuesta para tu nueva pregunta.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await updateSecurityQuestion({
        pregunta: newQuestion,
        respuesta: newAnswer
      });
      setSuccess('Pregunta de seguridad actualizada exitosamente.');
      setStep(1);
      setCurrentAnswer('');
      setNewAnswer('');
    } catch (err: any) {
      console.error("Error updating security question:", err);
      setError('No se pudo actualizar la pregunta de seguridad. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3>Pregunta de Seguridad</h3>
      </div>

      <div className={styles.content}>
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
          <form onSubmit={handleValidate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ margin: 0, color: '#666', fontSize: '0.95rem', lineHeight: '1.5' }}>
              Para poder modificar tu pregunta de seguridad, primero debes validar tu respuesta de seguridad actual.
            </p>
            
            <div className={styles.field}>
              <label>Respuesta de seguridad actual</label>
              <input
                type="password"
                placeholder="Tu respuesta secreta actual"
                value={currentAnswer}
                onChange={(e) => {
                  setCurrentAnswer(e.target.value);
                  if (error) setError(null);
                }}
                disabled={loading}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e0e0e0',
                  fontSize: '1rem',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button
              type="submit"
              className={styles.saveBtn}
              disabled={loading}
              style={{ width: '100%', padding: '12px' }}
            >
              {loading ? 'Validando...' : 'Validar Respuesta'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className={styles.field}>
              <label>Nueva pregunta de seguridad</label>
              <select
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                disabled={loading}
                style={{
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e0e0e0',
                  fontSize: '1rem',
                  outline: 'none',
                  backgroundColor: 'white',
                  boxSizing: 'border-box'
                }}
              >
                <option value="¿Cuál es el nombre de tu primera mascota?">¿Cuál es el nombre de tu primera mascota?</option>
                <option value="¿Cuál es el nombre de tu ciudad natal?">¿Cuál es el nombre de tu ciudad natal?</option>
                <option value="¿Cuál es tu color favorito?">¿Cuál es tu color favorito?</option>
                <option value="¿Cuál es el nombre de tu mejor amigo de la infancia?">¿Cuál es el nombre de tu mejor amigo de la infancia?</option>
                <option value="¿En qué ciudad naciste?">¿En qué ciudad naciste?</option>
                <option value="¿Cuál es tu comida favorita?">¿Cuál es tu comida favorita?</option>
                <option value="¿Cuál es el nombre de tu escuela de la infancia?">¿Cuál es el nombre de tu escuela de la infancia?</option>
              </select>
            </div>

            <div className={styles.field}>
              <label>Nueva respuesta de seguridad</label>
              <input
                type="text"
                placeholder="Tu nueva respuesta secreta"
                value={newAnswer}
                onChange={(e) => {
                  setNewAnswer(e.target.value);
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

            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button
                type="button"
                className={styles.editBtn}
                onClick={() => {
                  setStep(1);
                  setSuccess(null);
                  setError(null);
                  setCurrentAnswer('');
                }}
                style={{ flex: 1, padding: '12px', borderRadius: '12px' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={loading}
                style={{ flex: 2, padding: '12px', margin: 0 }}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
