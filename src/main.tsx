import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/shippori-mincho-b1/500.css';
import '@fontsource/cormorant-garamond/300.css';
import '@fontsource/cormorant-garamond/300-italic.css';
import '@fontsource/cormorant-garamond/400.css';
import '@fontsource/noto-sans-jp/400.css';
import './styles.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
