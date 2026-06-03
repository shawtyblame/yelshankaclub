import styles from './ProductDetail.module.css';

export default function ProductDetail({ item, onClose, categories }) {
  const categoryLabel = categories.find(c => c.id === item.category)?.label || item.category;

  return (
    <div className={styles.modal} onClick={onClose}>
      <button className={styles.closeBtn} onClick={onClose}>×</button>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {item.image ? (
          <img src={item.image} alt={item.name_ru} className={styles.image} />
        ) : (
          <div className={styles.image} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            Нет изображения
          </div>
        )}
        <div className={styles.content}>
          <span className={styles.badge}>{categoryLabel}</span>
          <h2 className={styles.name}>{item.name_ru}</h2>
          {item.price && <div className={styles.price}>{item.price} ₽</div>}
          <p className={styles.description}>
            {item.description_ru || 'Описание отсутствует'}
          </p>
          {item.stock !== undefined && (
            <div className={styles.stock}>
              <span className={`${styles.stockDot} ${item.stock <= 0 ? styles.empty : ''}`}></span>
              {item.stock > 0 ? `В наличии: ${item.stock} шт.` : 'Нет в наличии'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
