import styles from './styles.module.css';

export const BackgroundDecor = () => {
  return (
    <div className={styles.background} aria-hidden="true">

      {/* ---- Blobs difuminados ---- */}
      <div className={`${styles.blob} ${styles.blobTopRight}`} />
      <div className={`${styles.blob} ${styles.blobBottomCenter}`} />
      <div className={`${styles.blob} ${styles.blobBottomRight}`} />
      <div className={`${styles.blob} ${styles.blobMidLeft}`} />

      {/* ---- Líneas sinuosas SVG ---- */}
      <svg
        className={styles.lines}
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        {/* Línea principal — ola larga que cruza la pantalla */}
        <path
          d="M -60 320
             C 120 280, 240 420, 380 340
             C 520 260, 600 420, 760 360
             C 920 300, 1020 450, 1200 380
             C 1340 330, 1420 400, 1500 370"
          stroke="#e8a0b8"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.55"
          style={{zIndex: -10}}
        />

        {/* Segunda línea — más baja, diferente amplitud */}
        <path
          d="M -40 520
             C 100 480, 260 600, 420 530
             C 580 460, 680 590, 860 520
             C 1040 450, 1140 580, 1300 510
             C 1400 465, 1460 520, 1500 500"
          stroke="#f0b0c8"
          strokeWidth="1.3"
          strokeLinecap="round"
          opacity="0.45"
        />

        {/* Línea superior más sutil */}
        <path
          d="M 200 80
             C 340 50, 460 160, 620 110
             C 780 60, 880 180, 1040 130
             C 1160 90, 1280 170, 1440 140"
          stroke="#f5c0d0"
          strokeWidth="1.1"
          strokeLinecap="round"
          opacity="0.35"
        />

        {/* Línea corta inferior derecha */}
        <path
          d="M 800 780
             C 920 740, 1040 820, 1180 760
             C 1300 710, 1400 780, 1500 750"
          stroke="#e8a8bc"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.4"
        />
      </svg>

    </div>
  );
};