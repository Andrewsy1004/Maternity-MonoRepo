import styles from './Terms.module.css';
export const Terms = () => {
  return (
    <section className={styles.container}>
      <h2>Politicas y privacidad</h2>
      <p>
        En MaternityAI, reconocemos la importancia de proteger la información
        personal de nuestras usuarias, especialmente tratándose de datos
        relacionados con la salud materna y el bienestar familiar. Por ello,
        garantizamos el cumplimiento de las normativas vigentes en materia de
        protección de datos personales y privacidad digital.
      </p>

      <p>
        Toda la información personal recopilada —incluyendo datos de
        identificación, contacto, antecedentes de salud o preferencias de uso—
        será tratada conforme a los principios de legalidad, confidencialidad,
        integridad, transparencia y seguridad. Su tratamiento se realiza
        exclusivamente con el consentimiento informado de la usuaria y con la
        finalidad de ofrecer una experiencia digital segura, personalizada y
        adaptada a sus necesidades.
      </p>

      <p>
        Los datos personales no serán compartidos, vendidos ni transferidos a
        terceros sin la autorización expresa de la usuaria, salvo cuando sea
        necesario para el cumplimiento de obligaciones legales o requerimientos
        de autoridades competentes. En tales casos, siempre se actuará bajo los
        principios de proporcionalidad y confidencialidad.
      </p>
    </section>
  );
};
