import styles from './ServiceDetail.module.css';

export default function ServiceDetail({ service, onClose, categoryLabels }) {
  const categoryLabel = categoryLabels[service.category] || service.category;

  return (
    <div className={styles.modal} onClick={onClose}>
      <button className={styles.closeBtn} onClick={onClose}>×</button>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.content}>
          <span className={styles.badge}>{categoryLabel}</span>
          <h2 className={styles.name}>{service.name_ru}</h2>
          {service.price && <div className={styles.price}>{service.price} ₽</div>}
          <p className={styles.description}>
            {service.description_ru || 'Описание отсутствует'}
          </p>
        </div>
      </div>
    </div>
  );
}
