import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { API_URL } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styles from './ProductDetail.module.css';

const categoryLabels = {
  engine: 'Двигатель',
  exhaust: 'Выхлоп',
  suspension: 'Подвеска',
  brakes: 'Тормоза',
  wheels: 'Диски',
  interior: 'Интерьер',
  exterior: 'Экстерьер',
  other: 'Другое'
};

const similarCategories = {
  engine: ['engine', 'exhaust'],
  exhaust: ['exhaust', 'engine'],
  suspension: ['suspension', 'brakes'],
  brakes: ['brakes', 'suspension'],
  wheels: ['wheels', 'exterior'],
  interior: ['interior', 'exterior'],
  exterior: ['exterior', 'interior'],
  other: ['other']
};

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [crossProducts, setCrossProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addToCart, isInCart } = useCart();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: ''
  });

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/parts/${id}`).then(r => r.json()),
      fetch(`${API_URL}/parts`).then(r => r.json())
    ])
      .then(([productData, allParts]) => {
        setProduct(productData);
        
        const productCategory = productData.category || 'other';
        const similarCats = similarCategories[productCategory] || ['other'];
        
        const sameCategory = allParts.filter(p => p.id !== productData.id && p.category === productCategory);
        const otherParts = allParts.filter(p => 
          p.id !== productData.id && 
          p.category !== productCategory && 
          similarCats.includes(p.category)
        );
        
        const combined = [...sameCategory, ...otherParts];
        const shuffled = combined.sort(() => 0.5 - Math.random()).slice(0, 5);
        setCrossProducts(shuffled);
      })
      .catch(() => {
        navigate('/');
      })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAddToCart = () => {
    addToCart(product);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: '',
          car: '',
          service: `Запрос: ${product.name_ru}`,
          message: formData.message
        })
      });

      if (response.ok) {
        setOrderSuccess(true);
      }
    } catch (error) {
      alert('Произошла ошибка. Попробуйте позже.');
    }
  };

  if (loading) {
    return <div className={styles.page}><div className={styles.container}>Загрузка...</div></div>;
  }

  if (!product) {
    return null;
  }

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.container}>
        <a href="/" className={styles.backLink} onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          ← Назад к каталогу
        </a>

        <div className={styles.content}>
          <div className={styles.imageContainer}>
            {product.image ? (
              <img src={product.image} alt={product.name_ru} />
            ) : (
              <div className={styles.imagePlaceholder}>📦</div>
            )}
          </div>

          <div className={styles.info}>
            <span className={styles.category}>
              {categoryLabels[product.category] || product.category}
            </span>
            
            <h1 className={styles.name}>{product.name_ru}</h1>
            
            {product.price && (
              <div className={styles.price}>{product.price} ₽</div>
            )}
            
            <p className={styles.description}>
              {product.description_ru || 'Описание отсутствует'}
            </p>

            <div className={styles.stock}>
              {product.stock > 0 ? (
                <span className={styles.stockIn}>✓ В наличии ({product.stock} шт.)</span>
              ) : (
                <span className={styles.stockOut}>✗ Под заказ</span>
              )}
            </div>

            <div className={styles.actions}>
              {isInCart(product?.id) ? (
                <Link to="/cart" className={styles.orderBtn}>
                  В корзине
                </Link>
              ) : product.stock > 0 ? (
                <button className={styles.orderBtn} onClick={handleAddToCart}>
                  {addedToCart ? 'Добавлено!' : 'В корзину'}
                </button>
              ) : (
                <button className={styles.orderBtn} onClick={() => setModalOpen(true)}>
                  Заказать
                </button>
              )}
            </div>
          </div>
        </div>

        {crossProducts.length > 0 && (
          <div className={styles.crossProducts}>
            <h3 className={styles.sectionTitle}>Похожие товары</h3>
            <div className={styles.crossGrid}>
              {crossProducts.map(item => (
                <div key={item.id} className={styles.crossCard} onClick={() => navigate(`/product/${item.id}`)}>
                  <div className={styles.crossImage}>
                    {item.image ? <img src={item.image} alt={item.name_ru} /> : <span>📦</span>}
                  </div>
                  <div className={styles.crossInfo}>
                    <span className={styles.crossName}>{item.name_ru}</span>
                    {item.price && <span className={styles.crossPrice}>{item.price} ₽</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {modalOpen && !orderSuccess && (
        <div className={styles.modal} onClick={() => setModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Оставить заявку</h2>
            <form onSubmit={handleOrder}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Ваше имя</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Телефон</label>
                <input
                  type="tel"
                  className={styles.input}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Сообщение</label>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Дополнительная информация..."
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setModalOpen(false)}>
                  Отмена
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Отправить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {orderSuccess && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.successMessage}>
              <div className={styles.successIcon}>✓</div>
              <h3 className={styles.successTitle}>Заявка отправлена!</h3>
              <p className={styles.successText}>Мы свяжемся с вами в ближайшее время.</p>
              <button 
                className={styles.submitBtn} 
                style={{ marginTop: '24px' }}
                onClick={() => { setModalOpen(false); setOrderSuccess(false); }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
