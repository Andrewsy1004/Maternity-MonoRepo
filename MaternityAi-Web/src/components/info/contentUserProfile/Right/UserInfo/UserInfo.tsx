import { useEffect, useState } from 'react';
import styles from './UserInfo.module.css';

export const UserInfo = () => {
  const storedUser = localStorage.getItem('user_name') || '';
  const [codigoGmi, setCodigoGmi] = useState<string | null>(null);

  let nombre = 'Usuario';
  let apellidos = 'No especificado';
  let usuario = storedUser || 'Usuario';
  let initial = 'U';

  if (storedUser.startsWith('Gestante')) {
    nombre = 'Gestante';
    apellidos = 'Guía Materna';
    usuario = storedUser.replace('Gestante ', '');
    initial = 'G';
  } else if (storedUser.includes('@')) {
    nombre = 'Personal Médico';
    apellidos = 'MaternityAI';
    usuario = storedUser;
    initial = 'P';
  } else if (storedUser) {
    nombre = storedUser;
    initial = storedUser.charAt(0).toUpperCase();
  }

  // Estructura obstétrica y datos demográficos se cargan en la vista principal
  // Aquí sólo mostramos datos básicos de la sesión

  useEffect(() => {
    // El código GMI se guarda en localStorage durante el registro o login
    const stored = localStorage.getItem('codigo_gmi');
    if (stored) {
      setCodigoGmi(stored);
      return;
    }
    // Si no, intentar extraerlo del user_name (que tiene formato "Gestante GMI-XXXX")
    if (storedUser.startsWith('Gestante')) {
      const gmi = storedUser.replace('Gestante ', '');
      setCodigoGmi(gmi);
      localStorage.setItem('codigo_gmi', gmi);
    }
  }, [storedUser]);

  return (
    <section className={styles.containerInfo}>
      <h2>Mi información</h2>

      {/* ID-GMI Badge */}
      {codigoGmi && (
        <div className={styles.gmiCode}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>ID-GMI: <strong>{codigoGmi}</strong></span>
        </div>
      )}

      <div className={styles.foto}>
        <span className={styles.fotoperfil}>Foto de perfil</span>
        <div className={styles.initialAvatar}>{initial}</div>
        <div className={styles.photoButtons}>
          <button className={styles.uploadBtn}>Cargar nueva foto</button>
          <button className={styles.deleteBtn}>Eliminar</button>
        </div>
      </div>

      <div className={styles.data}>
        <div className={styles.infoField}>
          <label>Nombre</label>
          <span>{nombre}</span>
        </div>
        <div className={styles.infoField}>
          <label>Apellidos</label>
          <span>{apellidos}</span>
        </div>
        <div className={styles.infoField}>
          <label>Usuario / Código</label>
          <span>{usuario}</span>
        </div>
        {codigoGmi && (
          <div className={styles.infoField}>
            <label>Identificador Anónimo (ID-GMI)</label>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#CA436E' }}>{codigoGmi}</span>
          </div>
        )}
      </div>
    </section>
  );
};
