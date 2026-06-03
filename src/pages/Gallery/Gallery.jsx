import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../../context/AuthContext';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styles from './Gallery.module.css';

export default function Gallery() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/gallery`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        const parsedData = data.map(item => {
          let images = item.images || [];
          if (images.length === 0 && item.image) {
            try {
              images = JSON.parse(item.image);
            } catch {
              images = [item.image];
            }
          }
          return { ...item, images };
        });
        
        setItems(parsedData);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to fetch gallery:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.loading}>Загрузка...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.error}>Ошибка: {error}</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const openModal = (item) => {
    setSelectedItem(item);
    setCurrentImageIndex(0);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    const images = selectedItem.images;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    const images = selectedItem.images;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.loading}>Загрузка...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Наши работы</h1>
          
          {items.filter(item => item.images && item.images.length > 0).length === 0 ? (
            <div className={styles.empty}>
              <p>Галерея пуста</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {items.filter(item => item.images && item.images.length > 0).map((item) => (
                <div 
                  key={item.id} 
                  className={styles.card}
                  onClick={() => openModal(item)}
                >
                  <div className={styles.imageWrapper}>
                    <img src={item.images[0]} alt={item.title_ru} />
                    {item.images.length > 1 && (
                      <div className={styles.imageCount}>{item.images.length} фото</div>
                    )}
                  </div>
                  <div className={styles.cardContent}>
                    <h3>{item.title_ru}</h3>
                    {item.description_ru && (
                      <p>{item.description_ru}</p>
                    )}
                    <Link to={`/works/${item.id}`} className={styles.detailsLink}>
                      Подробнее
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {selectedItem && (
        <div className={styles.modal} onClick={() => setSelectedItem(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setSelectedItem(null)}>×</button>
            
            <div className={styles.modalImages}>
              {selectedItem.images.length > 1 && (
                <button className={styles.navBtn} onClick={prevImage}>←</button>
              )}
              <img 
                src={selectedItem.images[currentImageIndex]} 
                alt={selectedItem.title_ru} 
                className={styles.modalImage} 
              />
              {selectedItem.images.length > 1 && (
                <button className={styles.navBtn} onClick={nextImage}>→</button>
              )}
            </div>
            
            {selectedItem.images.length > 1 && (
              <div className={styles.dots}>
                {selectedItem.images.map((_, idx) => (
                  <span 
                    key={idx} 
                    className={`${styles.dot} ${idx === currentImageIndex ? styles.activeDot : ''}`}
                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                  />
                ))}
              </div>
            )}
            
            <div className={styles.modalInfo}>
              <h2>{selectedItem.title_ru}</h2>
              {selectedItem.description_ru && <p>{selectedItem.description_ru}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}