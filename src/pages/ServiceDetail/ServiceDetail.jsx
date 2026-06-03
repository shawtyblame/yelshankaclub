import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_URL } from '../../context/AuthContext';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styles from './ServiceDetail.module.css';

const categoryLabels = {
  power: 'Мощность',
  exhaust: 'Выхлоп',
  suspension: 'Подвеска',
  exterior: 'Экстерьер',
  interior: 'Интерьер',
  other: 'Другое'
};

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({
    name: '',
    phone: '',
    email: '',
    car: '',
    date: '',
    time: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/services/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          navigate('/');
        } else {
          setService(data);
        }
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleChange = (e) => {
    setBooking({ ...booking, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...booking,
          service: service.name_ru
        })
      });

      if (res.ok) {
        setSuccess(true);
        setBooking({
          name: '',
          phone: '',
          email: '',
          car: '',
          date: '',
          time: '',
          message: ''
        });
      } else {
        setError('Ошибка при отправке заявки');
      }
    } catch (err) {
      setError('Ошибка при отправке заявки');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Header />
        <div className={styles.loading}>Загрузка...</div>
        <Footer />
      </div>
    );
  }

  if (!service) return null;

  const categoryLabel = categoryLabels[service.category] || service.category;

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <button className={styles.back} onClick={() => navigate(-1)}>
            ← Назад
          </button>

          <div className={styles.content}>
            <div className={styles.info}>
              {service.image && (
                <div className={styles.imageWrapper}>
                  <img src={service.image} alt={service.name_ru} className={styles.image} />
                </div>
              )}
              
              <span className={styles.badge}>{categoryLabel}</span>
              <h1 className={styles.title}>{service.name_ru}</h1>
              {service.price && <div className={styles.price}>{service.price} ₽</div>}
              <p className={styles.description}>
                {service.description_ru || 'Описание отсутствует'}
              </p>
            </div>

            <div className={styles.booking}>
              <h2 className={styles.bookingTitle}>Записаться на услугу</h2>
              
              {success ? (
                <div className={styles.success}>
                  <h3>Заявка отправлена!</h3>
                  <p>Мы свяжемся с вами в ближайшее время для подтверждения записи.</p>
                  <button onClick={() => setSuccess(false)}>Отправить ещё одну</button>
                </div>
              ) : (
                <form className={styles.form} onSubmit={handleSubmit}>
                  <div className={styles.field}>
                    <label>Ваше имя *</label>
                    <input
                      type="text"
                      name="name"
                      value={booking.name}
                      onChange={handleChange}
                      required
                      placeholder="Иван Иванов"
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Телефон *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={booking.phone}
                      onChange={handleChange}
                      required
                      placeholder="+7 (999) 123-45-67"
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Email</label>
                    <input
                      type="email"
                      name="email"
                      value={booking.email}
                      onChange={handleChange}
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className={styles.field}>
                    <label>Марка автомобиля *</label>
                    <input
                      type="text"
                      name="car"
                      value={booking.car}
                      onChange={handleChange}
                      required
                      placeholder="BMW M3, Mercedes AMG GT..."
                    />
                  </div>

                  <div className={styles.row}>
                    <div className={styles.field}>
                      <label>Желаемая дата *</label>
                      <input
                        type="date"
                        name="date"
                        value={booking.date}
                        onChange={handleChange}
                        required
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className={styles.field}>
                      <label>Время *</label>
                      <input
                        type="time"
                        name="time"
                        value={booking.time}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label>Сообщение</label>
                    <textarea
                      name="message"
                      value={booking.message}
                      onChange={handleChange}
                      placeholder="Дополнительные пожелания..."
                      rows={4}
                    />
                  </div>

                  {error && <div className={styles.error}>{error}</div>}

                  <button type="submit" className={styles.submitBtn} disabled={submitting}>
                    {submitting ? 'Отправка...' : 'Записаться'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}