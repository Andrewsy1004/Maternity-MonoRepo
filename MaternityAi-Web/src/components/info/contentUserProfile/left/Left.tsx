import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import styles from './Left.module.css';

interface LeftProps {
  activeTab: 'perfil' | 'seguridad' | 'privacidad' | 'eliminar_cuenta';
  setActiveTab: (tab: 'perfil' | 'seguridad' | 'privacidad' | 'eliminar_cuenta') => void;
}

export const Left = ({ activeTab, setActiveTab }: LeftProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className={styles.container}>
      <h2>Configuraciones</h2>
      <p 
        className={activeTab === 'perfil' ? styles.active : ''} 
        onClick={() => setActiveTab('perfil')}
      >
        Mi perfil
      </p>
      <p 
        className={activeTab === 'seguridad' ? styles.active : ''} 
        onClick={() => setActiveTab('seguridad')}
      >
        Pregunta de seguridad
      </p>
      <p 
        className={activeTab === 'privacidad' ? styles.active : ''} 
        onClick={() => setActiveTab('privacidad')}
      >
        Políticas y privacidad
      </p>
      <p 
        className={activeTab === 'eliminar_cuenta' ? styles.active : ''} 
        onClick={() => setActiveTab('eliminar_cuenta')}
        style={{ color: '#e32636' }}
      >
        Eliminar cuenta
      </p>
      <p onClick={handleLogout} className={styles.logout}>
        Cerrar sesión
      </p>
    </aside>
  );
};
