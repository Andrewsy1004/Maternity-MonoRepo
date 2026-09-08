import React from 'react';
import style from './Notificaciones.module.css';

export const Notificaciones = React.memo(() => {
  return (
    <section className={style.seccion_notificaciones}>
      <div className={style.notificacion}>
        <h3>Notificacion</h3>
        <p>Se ha identificaciodo un nuevo dispositivo desde Barranquilla</p>
      </div>
    </section>
  );
});
