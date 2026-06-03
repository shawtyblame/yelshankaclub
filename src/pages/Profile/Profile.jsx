import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth, API_URL } from '../../context/AuthContext';
import styles from './Profile.module.css';

export default function Profile() {
  const { t } = useTranslation();
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else {
      setIsReady(true);
    }
  }, [user, navigate]);
  
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setAvatar(user.avatar || '');
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Profile: token exists:', !!token, 'user:', user?.id, user?.email);
    if (token) {
      fetch(`/api/bookings/my`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          console.log('Profile: bookings response status:', res.status);
          if (!res.ok) {
            throw new Error('Failed to load orders');
          }
          return res.json();
        })
        .then(data => {
          console.log('Profile: bookings data:', data);
          setOrders(Array.isArray(data) ? data : []);
          setOrdersLoading(false);
        })
        .catch(err => {
          console.error('Profile: bookings error:', err);
          setOrders([]);
          setOrdersLoading(false);
        });
    } else {
      setOrdersLoading(false);
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    try {
      const token = localStorage.getItem('token');
      const updateData = {};
      
      if (name !== undefined) {
        updateData.name = name;
      }
      if (avatar !== undefined && avatar !== '') {
        updateData.avatar = avatar;
      }
      
      const res = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
throw new Error(errorData.error || 'Profile update error');
      }
      
      const data = await res.json();
      updateUser({ name: data.name, avatar: data.avatar });
      setProfileSuccess(t('profile.saved'));
    } catch (err) {
      setProfileError(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError(t('profile.password.errors.minLength'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(t('profile.password.errors.notMatch'));
      return;
    }

    setPasswordLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Password change error');
      }

      setPasswordSuccess(t('profile.password.changed'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusLabel = (status) => {
    return t(`profile.orders.status.${status}`);
  };

  const getStatusClass = (status) => {
    const classes = {
      new: styles.statusNew,
      confirmed: styles.statusConfirmed,
      completed: styles.statusCompleted,
      cancelled: styles.statusCancelled
    };
    return classes[status] || '';
  };

  if (!isReady) {
    return (
      <div className={styles.profilePage}>
        <div className={styles.loading}>{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className={styles.profilePage}>
      <div className={styles.profileContainer}>
        <div className={styles.profileHeader}>
          <h1 className={styles.title}>{t('profile.title')}</h1>
          <div className={styles.headerButtons}>
            <button className={styles.backBtn} onClick={() => navigate('/')}>
              {t('profile.back')}
            </button>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              {t('profile.logout')}
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('profile.title')}</h2>
          
          <div className={styles.avatarSection}>
            <div className={styles.avatarWrapper}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className={styles.avatarImage} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  {name ? name.charAt(0).toUpperCase() : '?'}
                </div>
              )}
              <label className={styles.avatarUpload}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className={styles.avatarInput}
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </label>
            </div>
            <p className={styles.avatarHint}>{t('profile.avatar.hint')}</p>
          </div>

          <form className={styles.form} onSubmit={handleProfileUpdate}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('profile.email')}</label>
              <input
                type="email"
                className={styles.input}
                value={user?.email || ''}
                disabled
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('profile.name')}</label>
              <input
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('profile.namePlaceholder')}
              />
            </div>

            {profileError && <div className={styles.error}>{profileError}</div>}
            {profileSuccess && <div className={styles.success}>{profileSuccess}</div>}

            <button type="submit" className={styles.submitBtn} disabled={profileLoading}>
              {profileLoading ? t('profile.saving') : t('profile.save')}
            </button>
          </form>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('profile.password.title')}</h2>
          
          <form className={styles.form} onSubmit={handlePasswordChange}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('profile.password.current')}</label>
              <input
                type="password"
                className={styles.input}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('profile.password.new')}</label>
              <input
                type="password"
                className={styles.input}
                placeholder={t('profile.password.newPlaceholder')}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>{t('profile.password.confirm')}</label>
              <input
                type="password"
                className={styles.input}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {passwordError && <div className={styles.error}>{passwordError}</div>}
            {passwordSuccess && <div className={styles.success}>{passwordSuccess}</div>}

            <button type="submit" className={styles.submitBtn} disabled={passwordLoading}>
              {passwordLoading ? t('profile.password.changing') : t('profile.password.change')}
            </button>
          </form>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('profile.orders.title')}</h2>
          
          {ordersLoading ? (
            <div className={styles.loading}>{t('common.loading')}</div>
          ) : orders.length === 0 ? (
            <div className={styles.emptyOrders}>
              <p>{t('profile.orders.empty')}</p>
            </div>
          ) : (
            <div className={styles.ordersList}>
              {orders.map((order) => (
                <div key={order.id} className={styles.orderCard}>
                  <div className={styles.orderHeader}>
                    <span className={styles.orderId}>Order #{order.id}</span>
                    <span className={`${styles.orderStatus} ${getStatusClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className={styles.orderDetails}>
                    <div className={styles.orderItem}>
                      <span className={styles.orderLabel}>{t('profile.orders.dateTime')}</span>
                      <span className={styles.orderValue}>
                        {order.created_at ? new Date(order.created_at).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </span>
                    </div>
                    <div className={styles.orderItem}>
                      <span className={styles.orderLabel}>{t('profile.orders.service')}</span>
                      <span className={styles.orderValue}>{order.service}</span>
                    </div>
                    <div className={styles.orderItem}>
                      <span className={styles.orderLabel}>{t('profile.orders.car')}</span>
                      <span className={styles.orderValue}>{order.car || t('profile.orders.carNotSpecified')}</span>
                    </div>
                    {order.date && (
                      <div className={styles.orderItem}>
                        <span className={styles.orderLabel}>{t('profile.orders.bookingDate')}</span>
                        <span className={styles.orderValue}>
                          {order.date} {order.time || ''}
                        </span>
                      </div>
                    )}
                    {order.message && (
                      <div className={styles.orderItem}>
                        <span className={styles.orderLabel}>{t('profile.orders.message')}</span>
                        <span className={styles.orderValue}>{order.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
