import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { cssVarsFor } from '../../../shared/theme/themes';
import './tailwind.css';
import './App.css';

// Applies the same CSS custom properties web derives from shared/theme/themes.ts
// (the one canonical color source for web + mobile) so the composer port below
// can use identical `bg-[var(--bg-card)]`-style classes and be pixel-consistent
// with web's ChatInput, without hand-duplicating hex values here. Extension
// doesn't have a theme switcher (out of scope for this pass) — always dark,
// matching the rest of the extension's chrome.
const vars = cssVarsFor('dark');
for (const [key, value] of Object.entries(vars)) {
  document.documentElement.style.setProperty(key, value);
}
document.documentElement.style.setProperty('--font-sans', "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif");
document.documentElement.style.setProperty('--font-serif', "Georgia, 'Times New Roman', serif");

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
