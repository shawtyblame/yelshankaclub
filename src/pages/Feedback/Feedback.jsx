import { useState } from 'react';
import { Link } from 'react-router-dom';
import { API_URL } from '../../context/AuthContext';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styles from './Feedback.module.css';

export default function Feedback() {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');

    try {
      const res = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        setSuccess(true);
        setFormData({ name: '', phone: '', email: '', message: '' });
      } else {
        const err = await res.json();
        setError(err.error || 'Ошибка отправки');
      }
    } catch (err) {
      setError('Ошибка отправки');
    }

    setSending(false);
  };

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Связаться с нами</h1>
          <p className={styles.subtitle}>Оставьте заявку, и мы свяжемся с вами</p>

          {success ? (
            <div className={styles.success}>
              <div className={styles.successIcon}>✓</div>
              <h2>Сообщение отправлено!</h2>
              <p>Мы свяжемся с вами в ближайшее время</p>
              <Link to="/" className={styles.backBtn}>На главную</Link>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Ваше имя *</label>
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
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email</label>
                <input
                  type="email"
                  className={styles.input}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Сообщение *</label>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={5}
                />
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button type="submit" className={styles.submitBtn} disabled={sending}>
                {sending ? 'Отправка...' : 'Отправить'}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}