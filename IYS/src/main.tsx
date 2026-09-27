import '@fontsource-variable/anybody/standard.css';
import '@fontsource-variable/instrument-sans/wght.css';
import '@fontsource-variable/caveat/wght.css';
import '@fontsource/dm-mono/400.css';
import '@fontsource/dm-mono/500.css';
import './styles/base.css';
import './styles/components.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
