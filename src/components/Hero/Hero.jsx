import { useTranslation } from 'react-i18next';
import styles from './Hero.module.css';

export default function Hero() {
  const { t } = useTranslation();

  const scrollToCatalog = () => {
    const element = document.getElementById('catalog');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className={styles.hero}>
      <div className={styles.overlay}></div>
      
      <div className={styles.heroContent}>
        <img src="/logo-avtoservis.png" alt="Автосервис" className={styles.heroLogo} />
        <button className={styles.heroCta} onClick={scrollToCatalog}>
          {t('hero.cta')}
        </button>
      </div>

      <div className={styles.heroDecor}>Est. 2026</div>
    </section>
  );
}