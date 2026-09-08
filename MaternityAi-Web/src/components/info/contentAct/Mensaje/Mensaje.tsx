import styles from './Mnesaje.module.css';

export const Mensaje = () => {
  return (
    <section className={styles.mensaje}>
      <h1>Bienvenida a mi actividad!</h1>
      <p>
        Aquí podrás encontrar el detalle de tus encuestas y las notificaciones
        de usuario
      </p>

      <h2>Actividad</h2>
    </section>
  );
};
