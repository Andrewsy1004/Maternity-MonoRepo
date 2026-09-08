import styles from './ContentUs.module.css';

// SVG Icons for Pills
const GraduationCapIcon = () => (
  <svg className={styles.pillIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>
);

const ActivityIcon = () => (
  <svg className={styles.pillIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const HospitalIcon = ({ size = 16, className = '' }) => (
  <svg className={className || styles.pillIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width={size} height={size}>
    <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
    <path d="M10 9h4M12 7v4" />
  </svg>
);

const GovernmentIcon = () => (
  <svg className={styles.pillIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M3 22h18M6 18v-9M10 18v-9M14 18v-9M18 18v-9M4 6l8-4 8 4M4 6h16" />
  </svg>
);

// SVG Icons for Principles
const HeartIcon = () => (
  <svg className={styles.principleSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
  </svg>
);

const ScaleIcon = () => (
  <svg className={styles.principleSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <path d="M12 2v20M2 7h20M18 7l-3 5h6l-3-5zM6 7L3 12h6L6 7z" />
    <path d="M4 22h16" />
  </svg>
);

const ShieldIcon = () => (
  <svg className={styles.principleSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const UsersIcon = () => (
  <svg className={styles.principleSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const RESEARCH_TEAM = [
  { name: 'Guiomar Denise Martínez Vargas', role: 'Investigadora Principal', institution: 'UNAD', area: 'Semillero Salud Digital' },
  { name: 'Lucy de los Milagros Ebratt Castro', role: 'Coinvestigadora', institution: 'UNAD', area: 'Semillero Hermenéuticos en Acción' },
  { name: 'Jaime Jorge Ríos Tarazona', role: 'Coinvestigador', institution: 'UNAD', area: 'Zona Caribe' },
];

const CLINICAL_TEAM = [
  { name: 'Mario Julio Mendoza', role: 'Coinvestigador Clínico', institution: 'Universidad Libre', area: 'Ginecología y Obstetricia' },
  { name: 'Richard Prasca', role: 'Coinvestigador Clínico', institution: 'Universidad Libre', area: 'Ginecología y Obstetricia' },
  { name: 'Eduardo Otero Melo', role: 'Coinvestigador Clínico', institution: 'Universidad Libre', area: 'Ginecología y Obstetricia' },
  { name: 'Mauricio Gómez', role: 'Coinvestigador Clínico', institution: 'Universidad Libre', area: 'Ginecología y Obstetricia' },
];

const ENGINEERING_TEAM = [
  { name: 'William Insignares', role: 'Decano – Coordinación de Ingeniería', institution: 'Universidad Libre', area: 'Facultad de Ingeniería de Sistemas' },
  { name: 'Juan Manuel Meza Barraza', role: 'Coinvestigador Territorial', institution: 'Alcaldía de Puerto Colombia', area: 'Ingeniería y Territorio' },
];

const NORMS = [
  { code: 'Ley 1581/2012', desc: 'Protección de datos personales' },
  { code: 'Decreto 1377/2013', desc: 'Reglamento de la Ley 1581' },
  { code: 'Res. 1995/1999', desc: 'Historia Clínica y custodia' },
  { code: 'Ley 2015/2020', desc: 'Interoperabilidad HCE' },
  { code: 'HL7 / FHIR', desc: 'Estándar de interoperabilidad' },
  { code: 'ISO 27001', desc: 'Seguridad de la información' },
  { code: 'OWASP', desc: 'Buenas prácticas de seguridad web' },
  { code: 'AES-256 / TLS 1.3', desc: 'Cifrado de datos' },
];

const PRINCIPLES = [
  { icon: <HeartIcon />, title: 'Dignidad', desc: 'Cada gestante merece atención cálida y sin barreras.', colorClass: styles.iconHeart },
  { icon: <ScaleIcon />, title: 'Equidad', desc: 'Reducir brechas de acceso en territorios vulnerables.', colorClass: styles.iconScale },
  { icon: <ShieldIcon />, title: 'Cuidado', desc: 'Anticipar riesgos antes de que ocurra la urgencia.', colorClass: styles.iconShield },
  { icon: <UsersIcon />, title: 'Responsabilidad', desc: 'Compromiso público interinstitucional con la vida.', colorClass: styles.iconUsers },
];

export const ContentUs = () => {
  return (
    <div className={styles.pageWrapper}>
      {/* ── Background Blobs for pink blurred spots ── */}
      <div className={styles.blobLeft}></div>
      <div className={styles.blobRight}></div>
      <div className={styles.blobCenter}></div>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroLeft}>
          {/* Mobile Badge */}
          <div className={styles.mobileAiBadge}>
            <div className={styles.sparkleCircleMobile}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
              </svg>
            </div>
            <span>AI Integrada</span>
          </div>

          <div className={styles.titleWrapper}>
            <h1 className={styles.heroTitle}>
              ¿Quiénes <span className={styles.pinkText}>somos?</span>
            </h1>
          </div>
          
          <p className={styles.heroDesc}>
            La <strong>Guía Materna Inteligente</strong> surge como una estrategia interinstitucional para 
            fortalecer el cuidado materno, anticipar riesgos, organizar la respuesta oportuna y garantizar 
            continuidad en la ruta de atención. Esta herramienta no sustituye el criterio médico: lo apoya, 
            estructurando la información y facilitando la articulación entre equipos clínicos, administrativos y comunitarios.
          </p>
          
          <div className={styles.heroPills}>
            <span className={styles.pill}>
              <GraduationCapIcon />
              UNAD Zona Caribe
            </span>
            <span className={styles.pill}>
              <ActivityIcon />
              Universidad Libre
            </span>
            <span className={styles.pill}>
              <HospitalIcon />
              E.S.E. Hospital Puerto Colombia
            </span>
            <span className={styles.pill}>
              <GovernmentIcon />
              Alcaldía Puerto Colombia
            </span>
          </div>
        </div>

        <div className={styles.heroRight}>
          {/* AI Integrada element */}
          <div className={`${styles.aiIntegrada} ${styles.floatItem1}`}>
            <span>AI Integrada</span>
            <div className={styles.sparkleCircle}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
              </svg>
            </div>
          </div>

          {/* Biblioteca card */}
          <div className={`${styles.visualCard} ${styles.floatItem2}`}>
            <span className={styles.cardTitle}>Biblioteca</span>
            <img src="/image/biblioteca.png" alt="Biblioteca" className={styles.cardImage} />
          </div>

          {/* Control diario card */}
          <div className={`${styles.visualCard} ${styles.floatItem3}`}>
            <span className={styles.cardTitle}>Control diario</span>
            <img src="/image/cuestionario.png" alt="Control Diario" className={styles.cardImage} />
          </div>
        </div>
      </section>

      {/* ── Principles ── */}
      <section className={styles.principlesSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Principios Rectores</h2>
        </div>
        <div className={styles.principlesGrid}>
          {PRINCIPLES.map(p => (
            <div key={p.title} className={styles.principleCard}>
              <span className={`${styles.principleIcon} ${p.colorClass}`}>{p.icon}</span>
              <strong className={styles.principleTitle}>{p.title}</strong>
              <p className={styles.principleDesc}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Research Team ── */}
      <section className={styles.teamSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Equipo Investigador</h2>
          <p className={styles.sectionSubtitle}>UNAD – Semillero Salud Digital y Semillero Hermenéuticos en Acción</p>
        </div>
        <div className={styles.teamGrid}>
          {RESEARCH_TEAM.map(m => (
            <div key={m.name} className={`${styles.memberCard} ${styles.unadCard}`}>
              <div className={styles.memberAvatar}>{m.name.charAt(0)}</div>
              <div className={styles.memberInfo}>
                <strong className={styles.memberName}>{m.name}</strong>
                <span className={styles.memberRole}>{m.role}</span>
                <span className={styles.memberInstitution}>{m.institution} · {m.area}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Clinical Team ── */}
      <section className={styles.teamSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Equipo Clínico</h2>
          <p className={styles.sectionSubtitle}>Universidad Libre – Facultad de Ciencias de la Salud (Ginecología y Obstetricia)</p>
        </div>
        <div className={styles.teamGrid}>
          {CLINICAL_TEAM.map(m => (
            <div key={m.name} className={`${styles.memberCard} ${styles.clinicalCard}`}>
              <div className={styles.memberAvatar} style={{ background: 'linear-gradient(135deg,#0ea5e9,#38bdf8)' }}>{m.name.charAt(0)}</div>
              <div className={styles.memberInfo}>
                <strong className={styles.memberName}>{m.name}</strong>
                <span className={styles.memberRole}>{m.role}</span>
                <span className={styles.memberInstitution}>{m.institution} · {m.area}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Engineering & Territorial Team ── */}
      <section className={styles.teamSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Equipo de Ingeniería y Territorial</h2>
          <p className={styles.sectionSubtitle}>Universidad Libre – Ingeniería de Sistemas · Alcaldía de Puerto Colombia</p>
        </div>
        <div className={styles.teamGrid}>
          {ENGINEERING_TEAM.map(m => (
            <div key={m.name} className={`${styles.memberCard} ${styles.engCard}`}>
              <div className={styles.memberAvatar} style={{ background: 'linear-gradient(135deg,#8b5cf6,#a78bfa)' }}>{m.name.charAt(0)}</div>
              <div className={styles.memberInfo}>
                <strong className={styles.memberName}>{m.name}</strong>
                <span className={styles.memberRole}>{m.role}</span>
                <span className={styles.memberInstitution}>{m.institution} · {m.area}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Hospital Reference ── */}
      <section className={styles.hospitalSection}>
        <div className={styles.hospitalCard}>
          <HospitalIcon size={32} className={styles.hospitalSvgColor} />
          <div>
            <strong className={styles.hospitalTitle}>E.S.E. Hospital de Puerto Colombia</strong>
            <p className={styles.hospitalDesc}>
              Referencia y Contrarreferencia · Verificación y respuesta a alertas clínicas · 
              Canal exclusivo de recepción inmediata de alertas obstétricas
            </p>
          </div>
        </div>
      </section>

      {/* ── Normative Framework ── */}
      <section className={styles.normsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Marco Normativo y Estándares</h2>
          <p className={styles.sectionSubtitle}>
            Cumplimiento de la normativa colombiana de protección de datos e interoperabilidad en salud
          </p>
        </div>
        <div className={styles.normsGrid}>
          {NORMS.map(n => (
            <div key={n.code} className={styles.normCard}>
              <strong className={styles.normCode}>{n.code}</strong>
              <span className={styles.normDesc}>{n.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mission Quote ── */}
      <section className={styles.quoteSection}>
        <blockquote className={styles.quote}>
          <span className={styles.quoteIcon}>"</span>
          Que ninguna mujer en gestación esté sola frente al riesgo, y que el territorio cuente con 
          los elementos necesarios para actuar antes de que la urgencia ocurra.
          <footer className={styles.quoteAuthor}>
            — Guiomar Denise Martínez Vargas, Investigadora Principal · UNAD Zona Caribe
          </footer>
        </blockquote>
      </section>
    </div>
  );
};
