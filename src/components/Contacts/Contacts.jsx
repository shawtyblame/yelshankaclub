import { useState, useEffect } from 'react';
import { API_URL } from '../../context/AuthContext';
import styles from './Contacts.module.css';

const contactTypeLabels = {
  phone: 'Телефон',
  email: 'Email',
  address: 'Адрес',
  instagram: 'Instagram',
  telegram: 'Telegram',
  whatsapp: 'WhatsApp',
  hours: 'Часы работы'
};

export default function Contacts() {
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/contacts`)
      .then(res => res.json())
      .then(data => setContacts(data))
      .catch(() => {});
  }, []);

  const getLink = (type, value) => {
    switch(type) {
      case 'phone': return `tel:${value}`;
      case 'email': return `mailto:${value}`;
      case 'instagram': return `https://instagram.com/${value}`;
      case 'telegram': return `https://t.me/${value}`;
      case 'whatsapp': return `https://wa.me/${value.replace(/\D/g, '')}`;
      default: return '#';
    }
  };

  return (
    <section id="contacts" className={styles.contacts}>
      <div className={styles.inner}>
        <div className={styles.contactsGrid}>
          {contacts.map(contact => (
            <div key={contact.id} className={styles.contactItem}>
              <span className={styles.label}>{contact.label || contactTypeLabels[contact.type] || contact.type}</span>
              {contact.type === 'address' ? (
                <span className={styles.value}>{contact.value}</span>
              ) : (
                <a href={getLink(contact.type, contact.value)} className={styles.value}>{contact.value}</a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
