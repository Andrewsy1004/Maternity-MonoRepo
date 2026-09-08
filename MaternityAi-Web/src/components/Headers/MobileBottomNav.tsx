import { Link, useLocation } from 'react-router-dom';
import styles from './MobileBottomNav.module.css';
import { SvgHome, SvgBook, SvgUser, SvgClipboard, SvgAicon } from '../Icons/IconsSystem';

export const MobileBottomNav = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath.includes(path);

  return (
    <nav className={styles.bottomNav}>
      <Link to="/main" className={`${styles.navItem} ${isActive('/main') ? styles.active : ''}`}>
        <SvgHome className={styles.icon} />
      </Link>
      <Link to="/biblioteca" className={`${styles.navItem} ${isActive('/biblioteca') ? styles.active : ''}`}>
        <SvgBook className={styles.icon} />
      </Link>
      <Link to="/userprofile" className={`${styles.navItem} ${isActive('/userprofile') ? styles.active : ''}`}>
        <SvgUser className={styles.icon} />
      </Link>
      <Link to="/actividad" className={`${styles.navItem} ${isActive('/actividad') ? styles.active : ''}`}>
        <SvgClipboard className={styles.icon} />
      </Link>
      <Link to="/ai" className={`${styles.navItem} ${isActive('/ai') ? styles.active : ''}`}>
        <div className={styles.aiIconWrapper}>
          <SvgAicon className={styles.iconAi} />
        </div>
      </Link>
    </nav>
  );
};
