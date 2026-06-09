import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Home from './pages/Home/Home';
import Auth from './pages/Auth/Auth';
import Profile from './pages/Profile/Profile';
import Admin from './pages/Admin/Admin';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import ServiceDetail from './pages/ServiceDetail/ServiceDetail';
import Cart from './pages/Cart/Cart';
import Gallery from './pages/Gallery/Gallery';
import GalleryItem from './pages/GalleryItem/GalleryItem';
import Feedback from './pages/Feedback/Feedback';
import ConsumerInfo from './pages/ConsumerInfo/ConsumerInfo';
import './i18n';
import './styles/globals.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Загрузка...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>Загрузка...</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/auth" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalog" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/service/:id" element={<ServiceDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/consumer-info" element={<ConsumerInfo />} />
          <Route path="/works" element={<Gallery />} />
          <Route path="/works/:id" element={<GalleryItem />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
