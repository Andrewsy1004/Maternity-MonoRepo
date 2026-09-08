import { useVitals } from '../../../../hooks/clinical/useClinical';
import styles from './Datos.module.css';

interface Props {
  className?: string;
  activeModule?: { codigo: string; nombre: string } | null;
}

export const Datos = ({ className }: Props) => {
  const { data: vitalsData } = useVitals();

  // La API retorna los registros ordenados por fecha de control DESC (el primero es el más reciente)
  const ultimoRegistro =
    vitalsData.length > 0 ? vitalsData[0] : null;

  return (
    <section className={`${styles.container} ${className ?? ''}`}>
      <div className={styles.tarjeta}>
        <h3>Información general</h3>
        <div className={styles.mis_datos}>
          <div className={styles.datos}>
            <h4>PESO</h4>
            <p>
              {ultimoRegistro?.peso_kg || '--'} <span>kg</span>
            </p>
          </div>

          <div className={styles.datos}>
            <h4>TALLA</h4>
            <p>
              {ultimoRegistro?.talla_cm || '--'} <span>cm</span>
            </p>
          </div>

          <div className={styles.datos}>
            <h4>IMC</h4>
            <p>{ultimoRegistro?.imc || '--'}</p>
          </div>

          {ultimoRegistro?.fcf != null && (
            <div className={styles.datos}>
              <h4>FCF</h4>
              <p>
                {ultimoRegistro.fcf} <span>lpm</span>
              </p>
            </div>
          )}

          <div className={styles.datos}>
            <h4>ALTURA UTERINA</h4>
            <p>
              {ultimoRegistro?.altura_uterina || '--'} <span>cm</span>
            </p>
          </div>

          {ultimoRegistro?.presion_diastolica != null && (
            <div className={styles.datos}>
              <h4>PRESIÓN DIASTÓLICA</h4>
              <p>
                {ultimoRegistro.presion_diastolica} <span>mmHg</span>
              </p>
            </div>
          )}

          {ultimoRegistro?.presion_sistolica != null && (
            <div className={styles.datos}>
              <h4>PRESIÓN SISTÓLICA</h4>
              <p>
                {ultimoRegistro.presion_sistolica} <span>mmHg</span>
              </p>
            </div>
          )}

          <div className={styles.datos}>
            <h4>FECHA CONTROL</h4>
            <p className={styles.fechaValue}>
              {ultimoRegistro?.fecha_control || '--'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
