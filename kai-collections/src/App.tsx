import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Outlet, Route, Routes, useLocation } from 'react-router';
import { Footer, MobileMenu, Nav } from './components/Chrome';
import { BagDrawer, QuickView, SavedDrawer, SearchOverlay } from './components/Panels';
import { Home } from './home/Home';
import { Shop } from './pages/Shop';
import { ProductPage } from './pages/Product';
import { Sets } from './pages/Sets';
import { Lookbook } from './pages/Lookbook';
import { About } from './pages/About';
import { Stores } from './pages/Stores';
import { NotFound } from './pages/NotFound';

const Showcase = lazy(() => import('./showcase/Showcase'));

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        requestAnimationFrame(() => el.scrollIntoView({ behavior: 'auto', block: 'start' }));
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}

function Layout() {
  return (
    <>
      <ScrollManager />
      <Nav />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <MobileMenu />
      <BagDrawer />
      <SavedDrawer />
      <SearchOverlay />
      <QuickView />
    </>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/showcase"
          element={
            <Suspense fallback={null}>
              <Showcase />
            </Suspense>
          }
        />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="shop/sets" element={<Sets />} />
          <Route path="shop/:view" element={<Shop />} />
          <Route path="product/:slug" element={<ProductPage />} />
          <Route path="lookbook" element={<Lookbook />} />
          <Route path="about" element={<About />} />
          <Route path="stores" element={<Stores />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
