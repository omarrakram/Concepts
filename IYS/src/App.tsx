import { lazy, Suspense, useEffect } from 'react';

import { BagDrawer } from './components/BagDrawer';
import { Mirror } from './components/Mirror';
import { SearchOverlay } from './components/SearchOverlay';
import { Toasts } from './components/Toasts';
import { TopBar } from './components/TopBar';
import { ScrollTrigger } from './lib/gsap';
import { parse, usePath } from './lib/router';
import { StoreProvider } from './lib/store';
import { Collection } from './pages/Collection';
import { Home } from './pages/Home';
import { EndFrame } from './sections/EndFrame';

const Showcase = lazy(() => import('./showcase/Showcase'));

export function App() {
  const path = usePath();
  const route = parse(path);

  useEffect(() => {
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [path]);

  if (route.name === 'showcase')
    return (
      <Suspense fallback={null}>
        <Showcase />
      </Suspense>
    );

  return (
    <StoreProvider>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <TopBar />
      {route.name === 'collection' ? <Collection slug={route.slug} /> : <Home />}
      <EndFrame />
      <Mirror />
      <BagDrawer />
      <SearchOverlay />
      <Toasts />
    </StoreProvider>
  );
}
