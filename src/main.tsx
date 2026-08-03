import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {window.location.pathname === '/reset-password' ? <ResetPasswordPage /> : <App />}
  </StrictMode>,
);


if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Não foi possível ativar o modo offline:', error);
    });
  });
}
