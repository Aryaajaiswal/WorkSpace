import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Google Fonts
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700;800&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

// Global styles
const style = document.createElement('style');
style.innerHTML = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0a0f; color: #e8e8f0; font-family: 'DM Sans', sans-serif; }
  .loading-screen { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #0a0a0f; color: #8888a8; font-size: 14px; }
  input, select, button { font-family: 'DM Sans', sans-serif; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #111118; }
  ::-webkit-scrollbar-thumb { background: #2a2a38; border-radius: 3px; }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
