import { Cuestionario } from './cuestionario/Cuestionario';
import { Message } from './DayliReminder/Message';
import { Descubrimiento } from './Descubrimiento/Descubrimiento';
import styles from './Registros.module.css';
import { Reporte } from './reportarsignos/Reporte';

interface Props {
  className: string;
  activeModule?: { modulo_id: number; codigo: string; nombre: string } | null;
}
export const Registros = ({ className, activeModule }: Props) => {
  return (
    <section className={` ${styles.container} ${className ?? ''}`}>
      <section className={styles.cuestionarios}>
        <Reporte text="Reportar signos de alarma" />
        <Cuestionario activeModule={activeModule} />
        <Message />
        <Descubrimiento />
      </section>
    </section>
  );
};
