import { useState, useEffect } from 'react';
import { API_URL } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import styles from './ServicesCatalog.module.css';

const categoryLabels = {
  all: 'Все',
  power: 'Двигатель',
  exhaust: 'Выхлоп',
  suspension: 'Подвеска',
  exterior: 'Экстерьер',
  interior: 'Интерьер',
  other: 'Другое'
};

export default function ServicesCatalog() {
  const [services, setServices] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToCart, isInCart } = useCart();

  const filteredServices = services.filter(s => {
    const categoryMatch = activeFilter === 'all' || s.category === activeFilter;
    const searchMatch = !searchQuery || 
      s.name_ru?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description_ru?.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  useEffect(() => {
    fetch(`${API_URL}/services`)
      .then(res => res.json())
      .then(data => setServices(data))
      .catch(err => console.error('Failed to fetch services:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = (e, service) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(service);
  };

  return (
    <section className={styles.catalog}>
      <div className={styles.catalogInner}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Поиск услуг..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${activeFilter === 'all' ? styles.active : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            Все
          </button>
          {Object.entries(categoryLabels).filter(([id]) => id !== 'all').map(([id, label]) => (
            <button
              key={id}
              className={`${styles.filterBtn} ${activeFilter === id ? styles.active : ''}`}
              onClick={() => setActiveFilter(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.emptyState}>Загрузка...</div>
        ) : filteredServices.length === 0 ? (
          <div className={styles.emptyState}>
            Услуги не найдены
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredServices.map((service) => (
              <div key={service.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardName}>{service.name_ru}</h3>
                  <span className={styles.cardCategory}>
                    {categoryLabels[service.category] || service.category}
                  </span>
                </div>
                {service.price && (
                  <span className={styles.cardPrice}>{service.price} ₽</span>
                )}
                <button 
                  className={styles.cardBtn}
                  onClick={(e) => handleAddToCart(e, service)}
                  disabled={isInCart(service.id)}
                >
                  {isInCart(service.id) ? 'В корзине' : 'Добавить в корзину'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}