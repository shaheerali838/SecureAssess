import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Filter out noisy third-party browser extension exceptions (e.g. reportAllChanges, startTime, chrome-extension)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event.message?.includes('startTime') ||
      event.message?.includes('reportAllChanges') ||
      event.filename?.includes('chrome-extension') ||
      event.filename?.includes('moz-extension')
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
