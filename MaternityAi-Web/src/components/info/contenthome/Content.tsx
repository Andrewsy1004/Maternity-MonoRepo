import { useNavigate } from 'react-router-dom';
import { DegradedText } from '../../gradedcomponents/degradedtext/DegradedText';
import { SvgArrowRight } from '../../Icons/IconsSystem';
import styles from './Content.module.css';

export const Content = () => {
  const navigate = useNavigate();
  return (
    <section className={styles.container}>
      <div className={styles.left}>
        <div className={styles.titleWrapper}>
          <DegradedText text="MaternityAi" fontSize="clamp(36px, 5vw, 60px)" />
        </div>
        <p>
          Impulsada por inteligencia artificial, nuestra asistente virtual
          ofrece orientación basada en evidencia, recordatorios de salud,
          consejos de autocuidado y recursos confiables para el bienestar físico
          y mental de la madre y su bebé.
        </p>
        
        <div className={styles.mobileImageContainer}>
          <img className={styles.fotoMobile} src="/image/home.jpg" alt="Home" />
        </div>

        <button onClick={() => navigate('/login')} className={styles.comenzarBtn}>
          Comenzar <SvgArrowRight />
        </button>
      </div>
      <div className={styles.desktopImageContainer}>
        <img className={styles.foto} src="/image/home.jpg" alt="Home" />
      </div>
    </section>
  );
};
