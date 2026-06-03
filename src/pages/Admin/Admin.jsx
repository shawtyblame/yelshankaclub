import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, API_URL } from '../../context/AuthContext';
import styles from './Admin.module.css';

const serviceCategories = [
  { id: 'power', label: 'Двигатель' },
  { id: 'exhaust', label: 'Выхлоп' },
  { id: 'suspension', label: 'Подвеска' },
  { id: 'exterior', label: 'Экстерьер' },
  { id: 'interior', label: 'Интерьер' },
  { id: 'other', label: 'Другое' }
];

const partCategories = [
  { id: 'engine', label: 'Двигатель' },
  { id: 'exhaust', label: 'Выхлоп' },
  { id: 'suspension', label: 'Подвеска' },
  { id: 'brakes', label: 'Тормоза' },
  { id: 'wheels', label: 'Диски' },
  { id: 'interior', label: 'Интерьер' },
  { id: 'exterior', label: 'Экстерьер' },
  { id: 'other', label: 'Другое' }
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState('services');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [services, setServices] = useState([]);
  const [parts, setParts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('service');
  const [editingItem, setEditingItem] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [stockItem, setStockItem] = useState(null);
  const [stockAmount, setStockAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ type: 'phone', value: '', label: '', order_num: 0 });
  
  const { user, logout, getToken } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name_ru: '',
    description_ru: '',
    category: 'other',
    price: '',
    image: '',
    stock: 0,
    images: []
  });

  const [bookingFormData, setBookingFormData] = useState({
    name: '',
    phone: '',
    email: '',
    car: '',
    date: '',
    time: '',
    message: '',
    status: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const servicesRes = await fetch(`${API_URL}/services`);
      const servicesData = await servicesRes.json();
      setServices(servicesData);

      const partsRes = await fetch(`${API_URL}/parts`);
      const partsData = await partsRes.json();
      setParts(partsData);

      const bookingsRes = await fetch(`${API_URL}/bookings`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      const bookingsData = await bookingsRes.json();
      setBookings(bookingsData);

      const galleryRes = await fetch(`${API_URL}/gallery`);
      const galleryData = await galleryRes.json();
      setGallery(galleryData);

      const contactsRes = await fetch(`${API_URL}/contacts`);
      const contactsData = await contactsRes.json();
      setContacts(contactsData);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openModal = (type, item = null) => {
    setModalType(type);
    if (item) {
      setEditingItem(item);
      if (type === 'gallery') {
        const itemImages = item.images || (item.image ? [item.image] : []);
        setFormData({
          title_ru: item.title_ru || item.name_ru || '',
          description_ru: item.description_ru || '',
          images: Array.isArray(itemImages) ? itemImages : [itemImages],
          category: '',
          price: '',
          stock: ''
        });
      } else {
        setFormData({
          name_ru: item.name_ru || item.name_en || '',
          description_ru: item.description_ru || item.description_en || '',
          category: item.category || 'other',
          price: item.price || '',
          image: item.image || '',
          stock: item.stock || ''
        });
      }
    } else {
      setEditingItem(null);
      if (type === 'gallery') {
        setFormData({
          title_ru: '',
          description_ru: '',
          images: [''],
          category: '',
          price: '',
          stock: ''
        });
      } else {
        setFormData({
          name_ru: '',
          description_ru: '',
          category: 'other',
          price: '',
          image: '',
          stock: 0
        });
      }
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let endpoint, url, method, dataToSend;
    
    if (modalType === 'gallery') {
      endpoint = 'gallery';
      url = editingItem 
        ? `${API_URL}/gallery/${editingItem.id}`
        : `${API_URL}/gallery`;
      method = editingItem ? 'PUT' : 'POST';
      
      const validImages = formData.images ? formData.images.filter(img => img && img.trim() !== '') : [];
      
      dataToSend = {
        title_ru: formData.title_ru || formData.name_ru,
        title_en: formData.title_ru || formData.name_ru,
        description_ru: formData.description_ru,
        description_en: formData.description_ru,
        images: validImages
      };
    } else {
      endpoint = modalType === 'service' ? 'services' : 'parts';
      url = editingItem 
        ? `${API_URL}/${endpoint}/${editingItem.id}`
        : `${API_URL}/${endpoint}`;
      method = editingItem ? 'PUT' : 'POST';
      dataToSend = {
        name_ru: formData.name_ru,
        name_en: formData.name_ru,
        description_ru: formData.description_ru,
        description_en: formData.description_ru,
        category: formData.category,
        price: formData.price,
        image: formData.image,
        stock: formData.stock || 0
      };
    }

    try {
      console.log('Saving:', modalType, dataToSend);
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(dataToSend)
      });

      console.log('Save response:', res.status);
      if (res.ok) {
        fetchData();
        closeModal();
      } else {
        const err = await res.json();
        console.error('Save error:', err);
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm('Удалить?')) return;
    
    let endpoint;
    if (type === 'service') endpoint = 'services';
    else if (type === 'part') endpoint = 'parts';
    else if (type === 'gallery') endpoint = 'gallery';
    else return;
    
    try {
      const res = await fetch(`${API_URL}/${endpoint}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      const res = await fetch(`${API_URL}/bookings/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        fetchData();
      }
    } catch (error) {
      console.error('Status update error:', error);
    }
  };

  const openBookingModal = (booking) => {
    setEditingBooking(booking);
    setBookingFormData({
      name: booking.name || '',
      phone: booking.phone || '',
      email: booking.email || '',
      car: booking.car || '',
      date: booking.date || '',
      time: booking.time || '',
      message: booking.message || '',
      status: booking.status || 'new'
    });
    setModalOpen(true);
    setModalType('booking');
  };

  const viewBookingDetails = (booking) => {
    setViewingBooking(booking);
  };

  const closeViewBookingModal = () => {
    setViewingBooking(null);
  };

  const closeBookingModal = () => {
    setModalOpen(false);
    setEditingBooking(null);
    setModalType('service');
  };

  const handleBookingSave = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch(`${API_URL}/bookings/${editingBooking.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(bookingFormData)
      });
      if (res.ok) {
        fetchData();
        closeBookingModal();
      } else {
        const err = await res.json();
        console.error('Update error:', err);
      }
    } catch (error) {
      console.error('Update booking error:', error);
    }
  };

  const deleteBooking = async (id) => {
    if (!confirm('Удалить заявку?')) return;
    
    try {
      await fetch(`${API_URL}/bookings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      fetchData();
    } catch (error) {
      console.error('Delete booking error:', error);
    }
  };

  const deleteAllBookings = async () => {
    if (!confirm('Удалить ВСЕ заявки? Это действие необратимо!')) return;
    
    try {
      for (const booking of bookings) {
        await fetch(`${API_URL}/bookings/${booking.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${getToken()}` }
        });
      }
      fetchData();
    } catch (error) {
      console.error('Delete all bookings error:', error);
    }
  };

  const openStockModal = (item) => {
    setStockItem(item);
    setStockAmount('');
    setStockModalOpen(true);
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    const amount = parseInt(stockAmount);
    if (isNaN(amount) || amount < 0) return;

    try {
      const res = await fetch(`${API_URL}/parts/${stockItem.id}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ stock: amount })
      });
      if (res.ok) {
        fetchData();
        setStockModalOpen(false);
      }
    } catch (error) {
      console.error('Stock update error:', error);
    }
  };

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const handleAdminPasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (adminNewPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Пароль должен содержать минимум 6 символов' });
      return;
    }

    try {
      const res = await fetch(`${API_URL}/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ currentPassword, newPassword: adminNewPassword })
      });

      const data = await res.json();

      if (res.ok) {
        setPasswordMsg({ type: 'success', text: 'Пароль успешно изменён' });
        setCurrentPassword('');
        setAdminNewPassword('');
        setTimeout(() => setShowPasswordForm(false), 1500);
      } else {
        setPasswordMsg({ type: 'error', text: data.error || 'Ошибка при смене пароля' });
      }
    } catch (error) {
      setPasswordMsg({ type: 'error', text: 'Ошибка при смене пароля' });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU');
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className={styles.adminPage}>Загрузка...</div>;
  }

  const categories = modalType === 'service' ? serviceCategories : partCategories;

  return (
    <div className={styles.adminPage}>
      <header className={styles.adminHeader}>
        <a href="/" className={styles.logo} onClick={(e) => { e.preventDefault(); navigate('/'); }}>
          Автосервис
        </a>
        <div className={styles.headerRight}>
          <button className={styles.backBtn} onClick={() => navigate('/')}>
            ← На сайт
          </button>
          <span className={styles.userInfo}>{user?.email}</span>
          <button className={styles.logoutBtn} onClick={() => setShowPasswordForm(!showPasswordForm)}>
            Сменить пароль
          </button>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </header>

      {showPasswordForm && (
        <div className={styles.passwordForm}>
          <h3>Смена пароля администратора</h3>
          <form onSubmit={handleAdminPasswordChange}>
            <input
              type="password"
              className={styles.input}
              placeholder="Текущий пароль"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
            <input
              type="password"
              className={styles.input}
              placeholder="Новый пароль (мин. 6 символов)"
              value={adminNewPassword}
              onChange={(e) => setAdminNewPassword(e.target.value)}
              required
              minLength={6}
            />
            {passwordMsg.text && (
              <div className={passwordMsg.type === 'error' ? styles.error : styles.success}>
                {passwordMsg.text}
              </div>
            )}
            <div className={styles.passwordFormBtns}>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowPasswordForm(false)}>
                Отмена
              </button>
              <button type="submit" className={styles.saveBtn}>
                Изменить
              </button>
            </div>
          </form>
        </div>
      )}

      <div className={styles.adminContent}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'services' ? styles.active : ''}`}
            onClick={() => setActiveTab('services')}
          >
            Услуги
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'parts' ? styles.active : ''}`}
            onClick={() => setActiveTab('parts')}
          >
            Запчасти
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'bookings' ? styles.active : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Заявки ({bookings.length})
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'gallery' ? styles.active : ''}`}
            onClick={() => setActiveTab('gallery')}
          >
            Галерея
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'contacts' ? styles.active : ''}`}
            onClick={() => setActiveTab('contacts')}
          >
            Контакты
          </button>
        </div>

        {activeTab === 'services' && (
          <>
            <button className={styles.addBtn} onClick={() => openModal('service')}>
              + Добавить услугу
            </button>

            <div className={styles.filters}>
              {serviceCategories.map(cat => (
                <button
                  key={cat.id}
                  className={`${styles.filterBtn} ${serviceFilter === cat.id ? styles.active : ''}`}
                  onClick={() => setServiceFilter(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {services.filter(s => serviceFilter === 'all' || s.category === serviceFilter).length === 0 ? (
              <div className={styles.emptyState}>
                <p>Услуги не найдены</p>
              </div>
            ) : (
              <div className={styles.servicesGrid}>
                {services.filter(s => serviceFilter === 'all' || s.category === serviceFilter).map((service) => (
                  <div key={service.id} className={styles.serviceCard}>
                    <h3 className={styles.serviceName}>{service.name_ru}</h3>
                    <span className={styles.serviceCategory}>
                      {serviceCategories.find(c => c.id === service.category)?.label || service.category}
                    </span>
                    <p className={styles.serviceDesc}>
                      {service.description_ru || 'Без описания'}
                    </p>
                    {service.price && (
                      <div className={styles.servicePrice}>{service.price}</div>
                    )}
                    <div className={styles.serviceActions}>
                      <button
                        className={`${styles.actionBtn} ${styles.editBtn}`}
                        onClick={() => openModal('service', service)}
                      >
                        Редактировать
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDelete('service', service.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'parts' && (
          <>
            <button className={styles.addBtn} onClick={() => openModal('part')}>
              + Добавить запчасть
            </button>

            {parts.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Запчасти не найдены</p>
              </div>
            ) : (
              <div className={styles.servicesGrid}>
                {parts.map((part) => (
                  <div key={part.id} className={styles.serviceCard}>
                    <h3 className={styles.serviceName}>{part.name_ru}</h3>
                    <span className={styles.serviceCategory}>
                      {partCategories.find(c => c.id === part.category)?.label || part.category}
                    </span>
                    <p className={styles.serviceDesc}>
                      {part.description_ru || 'Без описания'}
                    </p>
                    <div className={styles.servicePrice}>
                      {part.price && <span>{part.price} ₽</span>}
                      {part.stock > 0 && (
                        <span className={styles.stockBadge}>В наличии: {part.stock}</span>
                      )}
                    </div>
                    <div className={styles.serviceActions}>
                      <button
                        className={`${styles.actionBtn} ${styles.editBtn}`}
                        onClick={() => openStockModal(part)}
                      >
                        Пополнить
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.editBtn}`}
                        onClick={() => openModal('part', part)}
                      >
                        Редактировать
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDelete('part', part.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'gallery' && (
          <>
            <button className={styles.addBtn} onClick={() => openModal('gallery')}>
              + Добавить работу
            </button>

            {gallery.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Галерея пуста</p>
              </div>
            ) : (
              <div className={styles.servicesGrid}>
                {gallery.map((item) => (
                  <div key={item.id} className={styles.serviceCard}>
                    <div className={styles.galleryImage}>
                      <img src={item.image} alt={item.title_ru} />
                    </div>
                    <h3 className={styles.serviceName}>{item.title_ru}</h3>
                    <p className={styles.serviceDesc}>
                      {item.description_ru || 'Без описания'}
                    </p>
                    <div className={styles.serviceActions}>
                      <button
                        className={`${styles.actionBtn} ${styles.editBtn}`}
                        onClick={() => openModal('gallery', item)}
                      >
                        Редактировать
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDelete('gallery', item.id)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {activeTab === 'bookings' && (
        <>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Все заявки</h3>
            {bookings.length > 0 && (
              <button className={`${styles.deleteBtn} ${styles.deleteAllBtn}`} onClick={deleteAllBookings}>
                Удалить все заявки
              </button>
            )}
          </div>
          {bookings.length === 0 ? (
            <div className={styles.emptyState}>
              <p>Заявок пока нет</p>
            </div>
          ) : (
            <table className={styles.bookingsTable}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Дата создания</th>
                  <th>Имя</th>
                  <th>Телефон</th>
                  <th>Услуга</th>
                  <th>Дата/Время</th>
                  <th>Статус</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className={styles.bookingIdCell} onClick={() => viewBookingDetails(booking)}>#{booking.id}</td>
                    <td>{new Date(booking.created_at).toLocaleString('ru-RU')}</td>
                    <td>{booking.name}</td>
                    <td>{booking.phone}</td>
                    <td className={styles.serviceCell}>{booking.service}</td>
                    <td>{booking.date && booking.time ? `${booking.date} ${booking.time}` : (booking.date || booking.time || '-')}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[`status${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}`] || styles.statusNew}`}>
                        {booking.status === 'new' ? 'Новая' : booking.status === 'confirmed' ? 'Одобрена' : booking.status === 'completed' ? 'Оказано' : booking.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.statusActions}>
                        {booking.status === 'new' && (
                          <>
                            <button
                              className={`${styles.statusBtn} ${styles.editBtn}`}
                              onClick={() => openBookingModal(booking)}
                            >
                              Редактировать
                            </button>
                            <button
                              className={`${styles.statusBtn} ${styles.confirmBtn}`}
                              onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                            >
                              Принять
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            className={`${styles.statusBtn} ${styles.completeBtn}`}
                            onClick={() => updateBookingStatus(booking.id, 'completed')}
                          >
                            Выполнено
                          </button>
                        )}
                        <button
                          className={`${styles.statusBtn} ${styles.deleteItemBtn}`}
                          onClick={() => deleteBooking(booking.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}

      {activeTab === 'contacts' && (
          <>
            <button className={styles.addBtn} onClick={() => { setEditingItem(null); setContactForm({ type: 'phone', value: '', label: '', order_num: 0 }); setContactModalOpen(true); }}>
              + Добавить контакт
            </button>

            {contacts.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Контакты не найдены</p>
              </div>
            ) : (
              <div className={styles.servicesGrid}>
                {contacts.map(contact => (
                  <div key={contact.id} className={styles.serviceCard}>
                    <span className={styles.serviceCategory}>{contact.type}</span>
                    <h3 className={styles.serviceName}>{contact.value}</h3>
                    <p>{contact.label}</p>
                    <div className={styles.serviceActions}>
                      <button
                        className={`${styles.actionBtn} ${styles.editBtn}`}
                        onClick={() => { setEditingItem(contact); setContactForm({ type: contact.type, value: contact.value, label: contact.label || '', order_num: contact.order_num }); setContactModalOpen(true); }}
                      >
                        Редактировать
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={async () => {
                          if (!confirm('Удалить?')) return;
                          await fetch(`${API_URL}/contacts/${contact.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
                          fetchData();
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {contactModalOpen && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2 className={styles.modalTitle}>{editingItem ? 'Редактировать контакт' : 'Новый контакт'}</h2>
              <form onSubmit={async (e) => {
                e.preventDefault();
                console.log('Saving contact:', contactForm);
                const url = editingItem ? `${API_URL}/contacts/${editingItem.id}` : `${API_URL}/contacts`;
                const method = editingItem ? 'PUT' : 'POST';
                const res = await fetch(url, {
                  method,
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
                  body: JSON.stringify(contactForm)
                });
                console.log('Response:', res.status);
                if (!res.ok) {
                  const err = await res.json();
                  console.error('Error:', err);
                }
                setContactModalOpen(false);
                fetchData();
              }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Тип</label>
                  <select className={styles.select} value={contactForm.type} onChange={e => setContactForm({ ...contactForm, type: e.target.value })}>
                    <option value="phone">Телефон</option>
                    <option value="email">Email</option>
                    <option value="address">Адрес</option>
                    <option value="instagram">Instagram</option>
                    <option value="telegram">Telegram</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="hours">Часы работы</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Значение</label>
                  <input type="text" className={styles.input} value={contactForm.value} onChange={e => setContactForm({ ...contactForm, value: e.target.value })} required />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Метка</label>
                  <input type="text" className={styles.input} value={contactForm.label} onChange={e => setContactForm({ ...contactForm, label: e.target.value })} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Порядок</label>
                  <input type="number" className={styles.input} value={contactForm.order_num} onChange={e => setContactForm({ ...contactForm, order_num: parseInt(e.target.value) || 0 })} />
                </div>
                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={() => setContactModalOpen(false)}>Отмена</button>
                  <button type="submit" className={styles.saveBtn}>Сохранить</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {modalOpen && modalType === 'gallery' && (
        <div className={styles.modal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingItem ? 'Редактировать работу' : 'Новая работа'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Название *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.title_ru}
                  onChange={(e) => setFormData({ ...formData, title_ru: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Описание</label>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  value={formData.description_ru}
                  onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Изображения *</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className={styles.input}
                  onChange={async (e) => {
                    const files = Array.from(e.target.files);
                    if (files.length === 0) return;
                    
                    setUploading(true);
                    const formDataUpload = new FormData();
                    files.forEach(file => formDataUpload.append('images', file));
                    
                    try {
                      const res = await fetch(`${API_URL}/upload`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${getToken()}` },
                        body: formDataUpload
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setFormData({ ...formData, images: [...(formData.images || []), ...data.files] });
                      }
                    } catch (err) {
                      console.error('Upload error:', err);
                    }
                    setUploading(false);
                  }}
                />
                {uploading && <div className={styles.loading}>Загрузка...</div>}
                {formData.images && formData.images.map((img, idx) => (
                  <div key={idx} className={styles.imageInputRow}>
                    <img src={img} alt="" style={{ width: 60, height: 60, objectFit: 'cover' }} />
                    <button 
                      type="button" 
                      className={styles.removeImageBtn}
                      onClick={() => {
                        const newImages = formData.images.filter((_, i) => i !== idx);
                        setFormData({ ...formData, images: newImages });
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button 
                  type="button" 
                  className={styles.addImageBtn}
                  onClick={() => {}}
                >
                  Нажмите выше для добавления фото
                </button>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                  Отмена
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalOpen && (modalType === 'service' || modalType === 'part') && (
        <div className={styles.modal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingItem ? 'Редактировать' : `Новая ${modalType === 'service' ? 'услуга' : 'запчасть'}`}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Название *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.name_ru}
                  onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Описание</label>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  value={formData.description_ru}
                  onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Категория</label>
                <select
                  className={styles.select}
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Цена</label>
                <input
                  type="text"
                  className={styles.input}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="750"
                />
              </div>

              {modalType === 'part' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Остаток</label>
                  <input
                    type="number"
                    className={styles.input}
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                  />
                </div>
              )}

              {modalType === 'part' && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Изображение</label>
                  <input
                    type="file"
                    accept="image/*"
                    className={styles.input}
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setUploading(true);
                      const formDataUpload = new FormData();
                      formDataUpload.append('images', file);
                      try {
                        const res = await fetch(`${API_URL}/upload`, {
                          method: 'POST',
                          headers: { 'Authorization': `Bearer ${getToken()}` },
                          body: formDataUpload
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setFormData({ ...formData, image: data.files[0] });
                        }
                      } catch (err) {
                        console.error('Upload error:', err);
                      }
                      setUploading(false);
                    }}
                  />
                  {uploading && <div className={styles.loading}>Загрузка...</div>}
                  {formData.image && (
                    <img src={formData.image} alt="" style={{ width: 100, height: 100, objectFit: 'cover', marginTop: 10 }} />
                  )}
                </div>
              )}

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={closeModal}>
                  Отмена
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalOpen && modalType === 'booking' && (
        <div className={styles.modal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Редактирование заявки #{editingBooking?.id}</h2>
            <form onSubmit={handleBookingSave}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Имя</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={bookingFormData.name}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, name: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Телефон</label>
                  <input
                    type="tel"
                    className={styles.input}
                    value={bookingFormData.phone}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Email</label>
                  <input
                    type="email"
                    className={styles.input}
                    value={bookingFormData.email}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, email: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Автомобиль</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={bookingFormData.car}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, car: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Дата</label>
                  <input
                    type="date"
                    className={styles.input}
                    value={bookingFormData.date}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, date: e.target.value })}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Время</label>
                  <input
                    type="time"
                    className={styles.input}
                    value={bookingFormData.time}
                    onChange={(e) => setBookingFormData({ ...bookingFormData, time: e.target.value })}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Услуга</label>
                <textarea
                  className={`${styles.input} ${styles.textarea}`}
                  value={bookingFormData.message}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, message: e.target.value })}
                />
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={`${styles.cancelBtn} ${styles.deleteBtn}`}
                  onClick={() => deleteBooking(editingBooking.id)}
                >
                  Удалить
                </button>
                <button type="button" className={styles.cancelBtn} onClick={closeBookingModal}>
                  Отмена
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {stockModalOpen && (
        <div className={styles.modal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Пополнить склад: {stockItem?.name_ru}</h2>
            <p className={styles.currentStock}>Текущий остаток: {stockItem?.stock} шт.</p>
            <form onSubmit={handleStockUpdate}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Новое количество</label>
                <input
                  type="number"
                  className={styles.input}
                  value={stockAmount}
                  onChange={(e) => setStockAmount(e.target.value)}
                  min="0"
                  required
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setStockModalOpen(false)}>
                  Отмена
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingBooking && (
        <div className={styles.modal}>
          <div className={`${styles.modalContent} ${styles.viewBookingDetails}`} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Заявка #{viewingBooking.id}</h2>
            
            <div className={styles.bookingDetailSection}>
              <h3 className={styles.bookingDetailTitle}>Информация о клиенте</h3>
              <div className={styles.bookingDetailRow}>
                <span className={styles.bookingDetailLabel}>Имя:</span>
                <span className={styles.bookingDetailValue}>{viewingBooking.name}</span>
              </div>
              <div className={styles.bookingDetailRow}>
                <span className={styles.bookingDetailLabel}>Телефон:</span>
                <span className={styles.bookingDetailValue}>{viewingBooking.phone}</span>
              </div>
              {viewingBooking.email && (
                <div className={styles.bookingDetailRow}>
                  <span className={styles.bookingDetailLabel}>Email:</span>
                  <span className={styles.bookingDetailValue}>{viewingBooking.email}</span>
                </div>
              )}
              <div className={styles.bookingDetailRow}>
                <span className={styles.bookingDetailLabel}>Автомобиль:</span>
                <span className={styles.bookingDetailValue}>{viewingBooking.car || '-'}</span>
              </div>
            </div>

            <div className={styles.bookingDetailSection}>
              <h3 className={styles.bookingDetailTitle}>Заказ</h3>
              <div className={styles.bookingDetailRow}>
                <span className={styles.bookingDetailLabel}>Услуга/Товар:</span>
                <span className={styles.bookingDetailValue}>{viewingBooking.service}</span>
              </div>
              {viewingBooking.date && (
                <div className={styles.bookingDetailRow}>
                  <span className={styles.bookingDetailLabel}>Дата записи:</span>
                  <span className={styles.bookingDetailValue}>{viewingBooking.date} {viewingBooking.time || ''}</span>
                </div>
              )}
              {viewingBooking.message && (
                <div className={styles.bookingDetailRow}>
                  <span className={styles.bookingDetailLabel}>Сообщение:</span>
                  <span className={styles.bookingDetailValue}>{viewingBooking.message}</span>
                </div>
              )}
            </div>

            <div className={styles.bookingDetailSection}>
              <h3 className={styles.bookingDetailTitle}>Статус заявки</h3>
              <div className={styles.bookingDetailRow}>
                <span className={styles.bookingDetailLabel}>Статус:</span>
                <span className={styles.bookingDetailValue}>
                  {viewingBooking.status === 'new' ? 'Новая' : 
                   viewingBooking.status === 'confirmed' ? 'Подтверждена' : 
                   viewingBooking.status === 'completed' ? 'Завершена' : 
                   viewingBooking.status === 'cancelled' ? 'Отменена' : viewingBooking.status}
                </span>
              </div>
              <div className={styles.bookingDetailRow}>
                <span className={styles.bookingDetailLabel}>Создана:</span>
                <span className={styles.bookingDetailValue}>
                  {new Date(viewingBooking.created_at).toLocaleString('ru-RU')}
                </span>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={closeViewBookingModal}>
                Закрыть
              </button>
              <button type="button" className={styles.editBtn} onClick={() => { closeViewBookingModal(); openBookingModal(viewingBooking); }}>
                Редактировать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
