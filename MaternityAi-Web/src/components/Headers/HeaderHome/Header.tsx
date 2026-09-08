import { useState } from 'react';
import { Link } from 'react-router-dom';
import { GradedButton } from '../../gradedbutton/GradedButton';
import { DegradedText } from '../../gradedcomponents/degradedtext/DegradedText';
import styles from './header.module.css';

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className={styles.headerStyle}>
      <nav className={styles.container}>
        <Link to={'/'} className={styles.logo}>
          <DegradedText text={'MaternityAi'} fontSize="20px" />
        </Link>

        <div className={styles.desktopLinks}>
          <Link to={'/nosotros'} className={styles.nosotros}>
            Nosotros
          </Link>
        </div>

        <Link to={'/login'} state={{ isStaff: true }} style={{ textDecoration: 'none' }} className={styles.hideOnMobile}>
          <GradedButton textbutton={'Login'} height="35px" width="100px" />
        </Link>

        <button
          className={styles.hamburgerBtn}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isMenuOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </>
            ) : (
              <>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </>
            )}
          </svg>
        </button>
      </nav>

      {isMenuOpen && (
        <div className={styles.mobileMenu}>
          <Link to={'/nosotros'} className={styles.mobileLink} onClick={() => setIsMenuOpen(false)}>
            Nosotros
          </Link>
        </div>
      )}
    </header>
  );
};
