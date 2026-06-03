import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_URL, useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import styles from './Header.module.css';

export default function Header() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const userAvatar = user?.avatar;
  const userName = user?.name;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMenuOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getNavItems = () => [
    { id: 'catalog', label: 'Каталог', to: '/catalog' },
    { id: 'works', label: 'Наши работы', to: '/works' },
    { id: 'contacts', label: 'Контакты' },
    { 
      id: 'login', 
      label: user ? (user.role === 'admin' ? 'Админ' : (user.name || user.email)) : 'Войти', 
      to: user ? (user.role === 'admin' ? '/admin' : '/profile') : '/auth', 
      isButton: !user 
    }
  ];

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logo}>
            Автосервис
          </Link>

          <nav className={styles.nav}>
            {getNavItems().map((item) => (
              item.to ? (
                <Link key={item.id} to={item.to} className={item.isButton ? styles.authBtn : styles.navLink}>
                  {item.id === 'login' && user && user.role !== 'admin' ? (
                    <span className={styles.navLinkWithAvatar}>
                      {userAvatar ? (
                        <img src={userAvatar} alt="" className={styles.userAvatar} />
                      ) : (
                        <span className={styles.userAvatarPlaceholder}>
                          {userName ? userName.charAt(0).toUpperCase() : '?'}
                        </span>
                      )}
                      <span>{item.label}</span>
                    </span>
                  ) : (
                    item.label
                  )}
                </Link>
              ) : (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className={styles.navLink}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(item.id);
                  }}
                >
                  {item.label}
                </a>
              )
            ))}
          </nav>

          <div className={styles.headerRight}>
            <Link to="/cart" className={styles.cartLink}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              {cartCount() > 0 && <span className={styles.cartBadge}>{cartCount()}</span>}
            </Link>

            {user && (
              <button className={styles.logoutBtn} onClick={handleLogout}>
                Выйти
              </button>
            )}

            <div className={styles.burger} onClick={() => setMenuOpen(!menuOpen)}>
              <span className={styles.burgerLine}></span>
              <span className={styles.burgerLine}></span>
              <span className={styles.burgerLine}></span>
            </div>
          </div>
        </div>
      </header>

      <div className={`${styles.mobileMenu} ${menuOpen ? styles.open : ''}`}>
        {getNavItems().map((item) => {
          let linkTo = item.to;
          return linkTo ? (
            <Link 
              key={item.id}
              to={linkTo} 
              className={item.isButton ? styles.authBtn : styles.navLink}
              onClick={() => setMenuOpen(false)}
            >
              {item.id === 'login' && user && user.role !== 'admin' ? (
                <span className={styles.navLinkWithAvatar}>
                  {userAvatar ? (
                    <img src={userAvatar} alt="" className={styles.userAvatar} />
                  ) : (
                    <span className={styles.userAvatarPlaceholder}>
                      {userName ? userName.charAt(0).toUpperCase() : '?'}
                    </span>
                  )}
                  <span>{item.label}</span>
                </span>
              ) : (
                item.label
              )}
            </Link>
          ) : (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={styles.navLink}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(item.id);
              }}
            >
              {item.label}
            </a>
          );
        })}
        
        {user && (
          <button 
            className={styles.logoutBtn}
            onClick={() => { handleLogout(); setMenuOpen(false); }}
          >
            Выйти
          </button>
        )}
        
        </div>
    </>
  );
}
