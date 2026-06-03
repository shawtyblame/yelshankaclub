import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../../context/AuthContext';
import styles from './PartsCatalog.module.css';

const categories = [
  { id: 'all', label: 'Все' },
  { id: 'engine', label: 'Двигатель' },
  { id: 'exhaust', label: 'Выхлоп' },
  { id: 'suspension', label: 'Подвеска' },
  { id: 'brakes', label: 'Тормоза' },
  { id: 'wheels', label: 'Диски' },
  { id: 'interior', label: 'Интерьер' },
  { id: 'exterior', label: 'Экстерьер' }
];

export default function PartsCatalog() {
  const [items, setItems] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/parts`)
      .then(res => {
        if (res.ok) return res.json();
        return [];
      })
      .then(data => {
        setItems(data);
      })
      .catch(() => {
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = items.filter(item => {
    const categoryMatch = activeFilter === 'all' || item.category === activeFilter;
    let priceMatch = true;
    if (priceFilter !== 'all') {
      const price = parseInt(item.price?.replace(/\D/g, '')) || 0;
      if (priceFilter === '0-1000') priceMatch = price < 1000;
      else if (priceFilter === '1000-3000') priceMatch = price >= 1000 && price < 3000;
      else if (priceFilter === '3000-5000') priceMatch = price >= 3000 && price < 5000;
      else if (priceFilter === '5000+') priceMatch = price >= 5000;
    }
    const searchMatch = !searchQuery || 
      item.name_ru?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description_ru?.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && priceMatch && searchMatch;
  });

  const priceRanges = [
    { id: 'all', label: 'Все' },
    { id: '0-1000', label: 'До 1000' },
    { id: '1000-3000', label: '1000-3000' },
    { id: '3000-5000', label: '3000-5000' },
    { id: '5000+', label: '5000+' }
  ];

  return (
    <section id="catalog" className={styles.catalog}>
      <div className={styles.catalogInner}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Поиск товаров..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <button 
          className={styles.filterToggle}
          onClick={() => setShowFilters(!showFilters)}
        >
          Фильтры {showFilters ? '▲' : '▼'}
        </button>

        {showFilters && (
          <>
            <div className={styles.filters}>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`${styles.filterBtn} ${activeFilter === cat.id ? styles.active : ''}`}
                  onClick={() => setActiveFilter(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className={styles.filters}>
              {priceRanges.map(range => (
                <button
                  key={range.id}
                  className={`${styles.filterBtn} ${priceFilter === range.id ? styles.active : ''}`}
                  onClick={() => setPriceFilter(range.id)}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </>
        )}

        {loading ? (
          <div className={styles.emptyState}>Загрузка...</div>
        ) : filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            Запчасти не найдены
          </div>
        ) : (
          <div className={styles.grid}>
            {filteredItems.map((item) => (
              <Link 
                to={`/product/${item.id}`} 
                key={item.id} 
                className={styles.card}
              >
                <div className={styles.cardImage}>
                  {item.image ? (
                    <img src={item.image} alt={item.name_ru} />
                  ) : (
                    <div className={styles.placeholder} />
                  )}
                  <span className={styles.cardBadge}>
                    {categories.find(c => c.id === item.category)?.label || item.category}
                  </span>
                </div>
                <div className={styles.cardContent}>
                  <h3 className={styles.cardName}>{item.name_ru}</h3>
                  <div className={styles.cardFooter}>
                    {item.price && (
                      <span className={styles.cardPrice}>{item.price} ₽</span>
                    )}
                    {item.stock > 0 && (
                      <span className={styles.stockBadge}>В наличии</span>
                    )} 
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
