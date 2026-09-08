import styles from './ContentLogin.module.css';
import { FormLogin } from './FormLogin';
export const ContentLogin = () => {
  return (
    <section className={styles.container}>
      <img src="./image/login.png" className={styles.foto} />
      <div className={styles.comenzar}>
        <div>
          <h2>Bienvenida</h2>
          <p className={styles.parrafo}>
            Al iniciar sesión, tendrás acceso a información personalizada y un
            espacio seguro para seguir el desarrollo de tu bebé y tu bienestar.
          </p>
        </div>
        <FormLogin />
      </div>
    </section>
  );
};
