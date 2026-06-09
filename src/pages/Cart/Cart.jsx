import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../context/CartContext';
import { API_URL, useAuth } from '../../context/AuthContext';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styles from './Cart.module.css';

export default function Cart() {
  const { t } = useTranslation();
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [bookInstallation, setBookInstallation] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [consent, setConsent] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: '',
    email: user?.email || '',
    car: '',
    date: '',
    time: '',
    message: '',
    city: '',
    street: '',
    house: '',
    apartment: ''
  });
  const [error, setError] = useState('');

  const hasServicesInCart = cart.some(item => item.stock === undefined);
  const hasPartsInCart = cart.some(item => item.stock !== undefined);
  const showBookingCheckbox = !hasServicesInCart && hasPartsInCart;
  const showBookingSection = hasServicesInCart || bookInstallation;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    setOrdering(true);
    setError('');

    try {
      const items = cart.map(item => ({
        id: item.id,
        item_name: item.name_ru || item.name,
        quantity: item.quantity,
        price: item.price,
        item_type: item.stock !== undefined ? 'part' : 'service'
      }));

      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email || null,
          car: formData.car || null,
          message: formData.message || null,
          booking_date: formData.date || null,
          booking_time: formData.time || null,
          delivery_method: hasPartsInCart ? deliveryMethod : null,
          delivery_city: formData.city || null,
          delivery_street: formData.street || null,
          delivery_house: formData.house || null,
          delivery_apartment: formData.apartment || null,
          payment_method: paymentMethod,
          items
        })
      });

      if (res.ok) {
        setOrderSuccess(true);
        clearCart();
      } else {
        setError(t('cart.error'));
      }
    } catch (err) {
      setError(t('cart.error'));
    } finally {
      setOrdering(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return '0 ₽';
    const num = parseInt(price.replace(/\D/g, ''));
    return new Intl.NumberFormat('ru-RU').format(num) + ' ₽';
  };

  if (orderSuccess) {
    return (
      <div className={styles.page}>
        <Header />
        <main className={styles.main}>
          <div className={styles.container}>
            <div className={styles.success}>
              <div className={styles.successIcon}>✓</div>
              <h2>{t('cart.success.title')}</h2>
              <p>{t('cart.success.message')}</p>
              <Link to="/" className={styles.backBtn}>{t('cart.success.back')}</Link>
            </div>
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
          <h1 className={styles.title}>{t('cart.title')}</h1>

          {cart.length === 0 ? (
            <div className={styles.empty}>
              <p>{t('cart.empty')}</p>
              <Link to="/" className={styles.backBtn}>{t('cart.goToCatalog')}</Link>
            </div>
          ) : (
            <div className={styles.content}>
              <div className={styles.items}>
                {cart.map((item) => (
                  <div key={item.id} className={styles.item}>
                    <div className={styles.itemImage}>
                      {item.image ? (
                        <img src={item.image} alt={item.name_ru || item.name} />
                      ) : (
                        <div className={styles.imagePlaceholder} />
                      )}
                    </div>
                    <div className={styles.itemInfo}>
                      <h3>{item.name_ru || item.name}</h3>
                      <p className={styles.itemPrice}>{formatPrice(item.price)}</p>
                    </div>
                    <div className={styles.itemQty}>
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <div className={styles.itemTotal}>
                      {formatPrice((parseInt(item.price?.replace(/\D/g, '') || 0) * item.quantity).toString())}
                    </div>
                    <button className={styles.removeBtn} onClick={() => removeFromCart(item.id)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.summary}>
                <div className={styles.totalRow}>
                  <span>{t('cart.total')}</span>
                  <span className={styles.totalAmount}>{formatPrice(getCartTotal().toString())}</span>
                </div>
              </div>

              <form id="order-form" className={styles.form} onSubmit={handleOrder}>
                {showBookingCheckbox && (
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={bookInstallation}
                      onChange={(e) => setBookInstallation(e.target.checked)}
                    />
                    <span>{t('cart.installCheckbox')}</span>
                  </label>
                )}

                {showBookingSection && (
                  <div className={styles.bookingSection}>
                    <h2>{t('cart.bookingSection.title')}</h2>
                    
                    <div className={styles.field}>
                      <label>{t('cart.bookingSection.car')} *</label>
                      <input
                        type="text"
                        name="car"
                        value={formData.car}
                        onChange={handleChange}
                        required
                        placeholder={t('cart.bookingSection.carPlaceholder')}
                      />
                    </div>

                    <div className={styles.row}>
                      <div className={styles.field}>
                        <label>{t('cart.bookingSection.date')} *</label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleChange}
                          required
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div className={styles.field}>
                        <label>{t('cart.bookingSection.time')} *</label>
                        <input
                          type="time"
                          name="time"
                          value={formData.time}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {hasPartsInCart && (
                  <>
                    <div className={styles.deliverySection}>
<h2>{t('cart.delivery.title')}</h2>
                      
                      <div className={styles.deliveryOptions}>
                        <label className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="delivery"
                            value="pickup"
                            checked={deliveryMethod === 'pickup'}
                            onChange={() => setDeliveryMethod('pickup')}
                          />
                          <span>{t('cart.delivery.pickup')}</span>
                        </label>
                        <label className={styles.radioLabel}>
                          <input
                            type="radio"
                            name="delivery"
                            value="delivery"
                            checked={deliveryMethod === 'delivery'}
                            onChange={() => setDeliveryMethod('delivery')}
                          />
                          <span>{t('cart.delivery.delivery')}</span>
                        </label>
                      </div>

                      {deliveryMethod === 'delivery' && (
                        <div className={styles.deliveryFields}>
                          <div className={styles.field}>
                            <label>{t('cart.delivery.city')} *</label>
                            <input
                              type="text"
                              name="city"
                              value={formData.city}
                              onChange={handleChange}
                              required
                              placeholder={t('cart.delivery.cityPlaceholder')}
                            />
                          </div>
                          <div className={styles.row}>
                            <div className={styles.field}>
                              <label>{t('cart.delivery.street')} *</label>
                              <input
                                type="text"
                                name="street"
                                value={formData.street}
                                onChange={handleChange}
                                required
                                placeholder={t('cart.delivery.streetPlaceholder')}
                              />
                            </div>
                            <div className={styles.field}>
                              <label>{t('cart.delivery.house')} *</label>
                              <input
                                type="text"
                                name="house"
                                value={formData.house}
                                onChange={handleChange}
                                required
                                placeholder={t('cart.delivery.housePlaceholder')}
                              />
                            </div>
                          </div>
                          <div className={styles.field}>
                            <label>{t('cart.delivery.apartment')}</label>
                            <input
                              type="text"
                              name="apartment"
                              value={formData.apartment}
                              onChange={handleChange}
                              placeholder={t('cart.delivery.apartmentPlaceholder')}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div className={styles.paymentSection}>
                  <h2>{t('cart.payment.title')}</h2>
                  <div className={styles.paymentOptions}>
                    <label className={`${styles.paymentLabel} ${styles.paymentActive}`}>
                      <input
                        type="radio"
                        name="payment"
                        value="cash"
                        checked={paymentMethod === 'cash'}
                        onChange={() => setPaymentMethod('cash')}
                      />
                      <span>{t('cart.payment.cash')}</span>
                    </label>
                    <label className={`${styles.paymentLabel} ${styles.paymentDisabled}`}>
                      <input type="radio" name="payment" value="card" disabled />
                      <span>{t('cart.payment.card')}</span>
                      <span className={styles.comingSoon}>{t('cart.payment.comingSoon')}</span>
                    </label>
                    <label className={`${styles.paymentLabel} ${styles.paymentDisabled}`}>
                      <input type="radio" name="payment" value="transfer" disabled />
                      <span>{t('cart.payment.transfer')}</span>
                      <span className={styles.comingSoon}>{t('cart.payment.comingSoon')}</span>
                    </label>
                  </div>
                </div>

                <h2>{t('cart.contactInfo')}</h2>
                
                <div className={styles.field}>
                  <label>{t('cart.yourName')} *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label>{t('cart.phoneNum')} *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.field}>
                  <label>{t('cart.emailAddr')}</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>

                {error && <div className={styles.error}>{t('cart.error')}</div>}

                <label className={styles.consentLabel}>
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                  />
                  <span>
                    {t('cart.consent')}{' '}
                    <Link to="/consumer-info" className={styles.consentLink}>
                      {t('cart.privacyPolicy')}
                    </Link>
                  </span>
                </label>

                <button type="submit" className={styles.submitBtn} disabled={ordering || !consent}>
                  {ordering ? t('cart.ordering') : t('cart.submit')}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}