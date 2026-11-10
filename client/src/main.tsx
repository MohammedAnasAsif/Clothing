import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, createHashRouter, Navigate, RouterProvider } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { OFFLINE } from './lib/api';
import { StoreProvider } from './lib/store';
import { Layout } from './components/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductPage from './pages/Product';
import { CartPage, WishlistPage } from './pages/Commerce';
import { About, Contact, Legal } from './pages/Info';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';
import './styles/global.css';

const routes = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/shop', element: <Shop /> },
      { path: '/category/:slug', element: <Shop /> },
      { path: '/product/:slug', element: <ProductPage /> },
      { path: '/cart', element: <CartPage /> },
      { path: '/wishlist', element: <WishlistPage /> },
      // Orders are placed on WhatsApp; old checkout/tracking links land somewhere useful.
      { path: '/checkout', element: <Navigate to="/cart" replace /> },
      { path: '/order/:number', element: <Navigate to="/contact" replace /> },
      { path: '/track', element: <Navigate to="/contact" replace /> },
      { path: '/about', element: <About /> },
      { path: '/contact', element: <Contact /> },
      { path: '/terms', element: <Legal kind="terms" /> },
      { path: '/privacy', element: <Legal kind="privacy" /> },
      { path: '/admin', element: <Admin /> },
      { path: '*', element: <NotFound /> },
    ],
  },
];

// The single-file preview is hosted at a URL we do not control, so it routes with the hash.
const router = OFFLINE ? createHashRouter(routes) : createBrowserRouter(routes);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <StoreProvider>
        <RouterProvider router={router} />
      </StoreProvider>
    </MotionConfig>
  </StrictMode>,
);
