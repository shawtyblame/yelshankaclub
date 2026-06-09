import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.links}>
          <Link to="/feedback" className={styles.link}>Связаться с нами</Link>
          <Link to="/consumer-info" className={styles.link}>Информация для потребителей</Link>
        </div>
        <span className={styles.copy}>© 2026 Автосервис</span>
      </div>
    </footer>
  );
}
