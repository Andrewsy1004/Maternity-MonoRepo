import { FormRegister } from './FormRegister';
import styles from './RegisterContent.module.css';
export const RegisterContent = () => {
  return (
    <section className={styles.container}>
      <img src="./image/register.png" className={styles.foto} />
      <div className={styles.comenzar}>
        <div>
          <h2>Crear cuenta</h2>
          <p className={styles.parrafo}>
            Al registrarte, tendrás acceso a herramientas personalizadas y un
            espacio seguro para monitorear el bienesta de tu bebé y el tuyo
          </p>
        </div>

        <FormRegister />
      </div>
    </section>
  );
};
