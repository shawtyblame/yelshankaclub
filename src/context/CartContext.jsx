import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const getCartKey = (userId) => {
  if (userId) {
    return `avtoservis-cart-user-${userId}`;
  }
  return 'avtoservis-cart-guest';
};

function loadCartFromStorage(userId) {
  if (!userId) return [];
  try {
    const key = getCartKey(userId);
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(userId, cart) {
  if (!userId) return;
  try {
    const key = getCartKey(userId);
    localStorage.setItem(key, JSON.stringify(cart));
  } catch {}
}

export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [partsStock, setPartsStock] = useState({});

  useEffect(() => {
    fetch('/api/parts')
      .then(res => res.json())
      .then(parts => {
        const stockMap = {};
        parts.forEach(p => stockMap[p.id] = p.stock || 0);
        setPartsStock(stockMap);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!authLoading && user?.id) {
      setCart(loadCartFromStorage(user.id));
      setIsReady(true);
    } else if (!authLoading && !user) {
      setCart([]);
      setIsReady(true);
    }
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (isReady && user?.id) {
      saveCartToStorage(user.id, cart);
    }
  }, [cart, user?.id, isReady]);

  const addToCart = (service) => {
    if (service.stock !== undefined && service.stock <= 0) return;
    setCart(prev => {
      const exists = prev.find(item => item.id === service.id);
      if (exists) return prev;
      return [...prev, { ...service, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    const maxStock = partsStock[id] || Infinity;
    const limitedQty = Math.min(Math.max(1, quantity), maxStock);
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: limitedQty } : item
    ));
  };

  const clearCart = () => {
    setCart([]);
  };

  const isInCart = (id) => {
    return cart.some(item => item.id === id);
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const price = parseInt(item.price?.replace(/\D/g, '') || 0);
      return total + (price * item.quantity);
    }, 0);
  };

  const cartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ 
      cart, 
      addToCart, 
      removeFromCart,
      updateQuantity,
      clearCart, 
      isInCart,
      getCartTotal,
      cartCount,
      bookingModal: null,
      setBookingModal: () => {}
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}