import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './ContentLogin.module.css';
import { loginUser, loginStaff, getSecurityQuestion, type AuthError, createActivationRequest } from '../../../services/authService';
import { useAuth } from '../../../context/AuthContext';

// Mapa rol → ruta de destino
const ROLE_HOME: Record<string, string> = {
  gestante: '/main',
  admin: '/admin',
  clinico: '/clinico',
  hospital: '/hospital/dashboard',
};

interface GestanteLoginState {
  codigo_gmi: string;
  respuesta_seguridad: string;
}

interface StaffLoginState {
  email: string;
  password: string;
}

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);



export const FormLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [isStaff, setIsStaff] = useState(location.state?.isStaff || false);

  // Estados para Gestante
  const [gestanteStep, setGestanteStep] = useState<1 | 2>(1);
  const [securityQuestion, setSecurityQuestion] = useState<string>('');
  const [showActivationForm, setShowActivationForm] = useState(false);
  const [activationQuestion, setActivationQuestion] = useState('¿Cuál es el nombre de tu primera mascota?');
  const [activationAnswer, setActivationAnswer] = useState('');
  const [isSubmittingActivation, setIsSubmittingActivation] = useState(false);

  const [gestanteForm, setGestanteForm] = useState<GestanteLoginState>({
    codigo_gmi: '',
    respuesta_seguridad: '',
  });

  const [staffForm, setStaffForm] = useState<StaffLoginState>({
    email: '',
    password: '',
  });

  const [showAnswer, setShowAnswer] = useState(false);
  const [showPassword, setShowPassword] = useState(false);


  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleGestanteForm = (key: keyof GestanteLoginState, valor: string) => {
    setGestanteForm((prev) => ({ ...prev, [key]: valor }));
    if (errorMessage) setErrorMessage(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handleStaffForm = (key: keyof StaffLoginState, valor: string) => {
    setStaffForm((prev) => ({ ...prev, [key]: valor }));
    if (errorMessage) setErrorMessage(null);
    if (successMessage) setSuccessMessage(null);
  };

  const handleSendActivation = async (e: React.MouseEvent) => {
    e.preventDefault();
    const trimmedAnswer = activationAnswer.trim();
    const trimmedGmi = gestanteForm.codigo_gmi.trim();
    if (!trimmedAnswer) {
      setErrorMessage('Por favor, ingresa una respuesta.');
      return;
    }
    setIsSubmittingActivation(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await createActivationRequest({
        codigo_gmi: trimmedGmi,
        pregunta: activationQuestion,
        respuesta: trimmedAnswer,
      });
      setSuccessMessage('Solicitud de activación enviada correctamente. El administrador la revisará pronto.');
      setShowActivationForm(false);
      setActivationAnswer('');
      setGestanteStep(1);
    } catch (error) {
      const authError = error as AuthError;
      setErrorMessage(authError?.message || 'Error al enviar la solicitud. Intenta de nuevo.');
    } finally {
      setIsSubmittingActivation(false);
    }
  };

  const handleNextStep = async (e: React.MouseEvent) => {
    e.preventDefault();
    const trimmedGmi = gestanteForm.codigo_gmi.trim();
    if (!trimmedGmi) {
      setErrorMessage('Por favor, ingresa tu Código GMI.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await getSecurityQuestion(trimmedGmi);
      setSecurityQuestion(res.pregunta);
      setSuccessMessage('Código validado correctamente. Responde la pregunta para continuar.');
      setGestanteStep(2);
    } catch (error) {
      const authError = error as AuthError;
      if (authError?.status === 404) {
        setShowActivationForm(true);
        setErrorMessage(null);
        setSuccessMessage('Tu cuenta aún no está activada. Configura tu pregunta de seguridad para solicitar la activación al administrador.');
      } else {
        setErrorMessage(authError?.message || 'Código GMI no encontrado o error de servidor.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (isStaff) {
        const trimmedEmail = staffForm.email.trim();
        const trimmedPassword = staffForm.password.trim();
        if (!trimmedEmail || !trimmedPassword) {
          setErrorMessage('Por favor, completa todos los campos.');
          setIsLoading(false);
          return;
        }
        const staffData = await loginStaff({
          email: trimmedEmail,
          password: trimmedPassword,
        });
        login(staffData); // actualiza el AuthContext
        localStorage.setItem('user_name', trimmedEmail);
        localStorage.setItem('has_logged_in_before', 'true');
        setSuccessMessage('Sesión iniciada correctamente.');
        // Redirige al dashboard correspondiente al rol
        const from = location.state?.from?.pathname;
        navigate(from || ROLE_HOME[staffData.role] || '/admin', { replace: true });
      } else {
        if (gestanteStep === 1) {
          // Fallback por si dan enter en el input en el paso 1
          await handleNextStep(e as any);
          return;
        }

        const trimmedGmi = gestanteForm.codigo_gmi.trim();
        const trimmedRespuesta = gestanteForm.respuesta_seguridad.trim();
        if (!trimmedGmi || !trimmedRespuesta) {
          setErrorMessage('Por favor, completa tu respuesta.');
          setIsLoading(false);
          return;
        }
        const gestanteData = await loginUser({
          codigo_gmi: trimmedGmi,
          respuesta_seguridad: trimmedRespuesta,
        });
        login(gestanteData); // actualiza el AuthContext
        localStorage.setItem('user_name', `Gestante ${trimmedGmi}`);
        localStorage.setItem('codigo_gmi', trimmedGmi);
        localStorage.setItem('has_logged_in_before', 'true');
        setSuccessMessage('Sesión iniciada correctamente.');
        navigate('/main', { replace: true });
      }
    } catch (error) {
      const authError = error as AuthError;
      if (authError?.status === 401 || authError?.status === 403) {
        setErrorMessage('Credenciales incorrectas. Intenta de nuevo.');
      } else if (authError?.status === 422) {
        setErrorMessage('Formato de datos incorrecto.');
      } else if (authError?.message) {
        setErrorMessage(authError.message);
      } else {
        setErrorMessage('Error de conexión. Verifica que el servidor esté activo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.formulario}>

      <div className={styles.hideOnMobile} style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', gap: '10px' }}>
        <button
          type="button"
          style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #CA436E', background: !isStaff ? '#CA436E' : 'transparent', color: !isStaff ? 'white' : '#CA436E', cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => {
            setIsStaff(false);
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
        >
          Gestante
        </button>
        <button
          type="button"
          style={{ padding: '8px 16px', borderRadius: '20px', border: '1px solid #CA436E', background: isStaff ? '#CA436E' : 'transparent', color: isStaff ? 'white' : '#CA436E', cursor: 'pointer', transition: 'all 0.3s ease' }}
          onClick={() => {
            setIsStaff(true);
            setErrorMessage(null);
            setSuccessMessage(null);
          }}
        >
          Staff / Médico
        </button>
      </div>

      {!isStaff ? (
        <>
          {showActivationForm ? (
            <>
              <p style={{ fontWeight: '600', color: '#CA436E', marginBottom: '8px' }}>Configurar Pregunta de Seguridad</p>
              <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '15px', lineHeight: '1.4' }}>
                Tu cuenta requiere ser activada. Elige una pregunta de seguridad y tu respuesta (funcionará como tu contraseña secreta) para enviar la solicitud de activación al administrador.
              </p>

              <p>Pregunta de Seguridad</p>
              <select
                value={activationQuestion}
                onChange={(e) => setActivationQuestion(e.target.value)}
                disabled={isSubmittingActivation}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  marginBottom: '15px',
                  fontSize: '0.9rem',
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

              <p>Tu Respuesta (Contraseña Secreta)</p>
              <input
                value={activationAnswer}
                type="text"
                placeholder="Escribe tu respuesta secreta"
                disabled={isSubmittingActivation}
                onChange={(e) => setActivationAnswer(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', marginBottom: '15px' }}
              />

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowActivationForm(false);
                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setActivationAnswer('');
                  }}
                  disabled={isSubmittingActivation}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ccc',
                    background: 'white',
                    color: '#666',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSendActivation}
                  disabled={isSubmittingActivation}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#CA436E',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  {isSubmittingActivation ? 'Enviando...' : 'Solicitar'}
                </button>
              </div>
            </>
          ) : (
            <>
              {gestanteStep === 1 && (
                <>
                  <p>Código GMI</p>
                  <input
                    value={gestanteForm.codigo_gmi}
                    type="text"
                    placeholder="Ej. ID-GMI-2024-001"
                    disabled={isLoading}
                    onChange={(e) => handleGestanteForm('codigo_gmi', e.target.value)}
                  />
                </>
              )}

              {gestanteStep === 2 && (
                <>
                  <p>Pregunta de Seguridad</p>
                  <div style={{ padding: '12px', background: '#fef5f8', borderRadius: '8px', borderLeft: '4px solid #CA436E', marginBottom: '15px', color: '#CA436E', fontWeight: '500' }}>
                    {securityQuestion}
                  </div>

                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', marginTop: '8px' }}>
                    <input
                      value={gestanteForm.respuesta_seguridad}
                      type={showAnswer ? "text" : "password"}
                      placeholder="Tu respuesta secreta"
                      disabled={isLoading}
                      onChange={(e) => handleGestanteForm('respuesta_seguridad', e.target.value)}
                      style={{ width: '100%', paddingRight: '45px', marginTop: 0 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowAnswer(prev => !prev)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#888',
                        top: '50%',
                        transform: 'translateY(-50%)',
                      }}
                    >
                      {showAnswer ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setGestanteStep(1);
                      setGestanteForm(prev => ({ ...prev, respuesta_seguridad: '' }));
                      setSuccessMessage(null);
                      setErrorMessage(null);
                    }}
                    style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', marginTop: '10px', textDecoration: 'underline', fontSize: '0.9rem' }}
                  >
                    Volver y corregir código
                  </button>
                </>
              )}
            </>
          )}
        </>
      ) : (
        <>
          <p>Correo Electrónico</p>
          <input
            value={staffForm.email}
            type="email"
            placeholder="correo@ejemplo.com"
            disabled={isLoading}
            onChange={(e) => handleStaffForm('email', e.target.value)}
          />

          <p>Contraseña</p>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%', marginTop: '8px' }}>
            <input
              value={staffForm.password}
              type={showPassword ? "text" : "password"}
              placeholder="Tu contraseña"
              disabled={isLoading}
              onChange={(e) => handleStaffForm('password', e.target.value)}
              style={{ width: '100%', paddingRight: '45px', marginTop: 0 }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#888',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            >
              {showPassword ? <EyeIcon /> : <EyeOffIcon />}
            </button>
          </div>
        </>
      )}

      {successMessage && (
        <p className={styles.successMessage || 'success-message'} role="alert" style={{ color: '#2e7d32', backgroundColor: '#edf7ed', padding: '10px', borderRadius: '5px', marginTop: '15px', fontSize: '0.9rem', border: '1px solid #c8e6c9' }}>
          {successMessage}
        </p>
      )}

      {errorMessage && (
        <p className={styles.errorMessage || 'error-message'} role="alert" style={{ color: '#d32f2f', backgroundColor: '#fdeded', padding: '10px', borderRadius: '5px', marginTop: '15px', fontSize: '0.9rem', border: '1px solid #ef5350' }}>
          {errorMessage}
        </p>
      )}

      {/* Registro oculto del login público según requerimiento */}

      {!showActivationForm && (
        <div className={styles.boton}>
          {(!isStaff && gestanteStep === 1) ? (
            <button
              type="button"
              className={styles.lastbutton}
              disabled={isLoading}
              onClick={handleNextStep}
            >
              {isLoading ? 'Verificando...' : 'Continuar'}
            </button>
          ) : (
            <button
              type="submit"
              className={styles.lastbutton}
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          )}
        </div>
      )}
    </form>
  );
};
