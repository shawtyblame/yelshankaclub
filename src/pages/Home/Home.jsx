import { useState, useEffect } from 'react';
import Header from '../../components/Header/Header';
import Hero from '../../components/Hero/Hero';
import PartsCatalog from '../../components/PartsCatalog/PartsCatalog';
import ServicesCatalog from '../../components/ServicesCatalog/ServicesCatalog';
import Contacts from '../../components/Contacts/Contacts';
import Footer from '../../components/Footer/Footer';
import styles from './Home.module.css';

export default function Home() {
  const [activeSection, setActiveSection] = useState('parts');

  useEffect(() => {
    if (window.location.hash === '#catalog') {
      const element = document.getElementById('catalog');
      if (element) {
        setTimeout(() => element.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, []);

  return (
    <div className={styles.homePage}>
      <Header />
      <main>
        <Hero />
        <div className={styles.catalogSection} id="catalog">
          <div className={styles.catalogTabs}>
            <button 
              className={`${styles.catalogTab} ${activeSection === 'parts' ? styles.active : ''}`}
              onClick={() => setActiveSection('parts')}
            >
              Запчасти
            </button>
            <button 
              className={`${styles.catalogTab} ${activeSection === 'services' ? styles.active : ''}`}
              onClick={() => setActiveSection('services')}
            >
              Услуги
            </button>
          </div>
          {activeSection === 'parts' ? <PartsCatalog /> : <ServicesCatalog />}
        </div>
        <Contacts />
      </main>
      <Footer />
    </div>
  );
}
