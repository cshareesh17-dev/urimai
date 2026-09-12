import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import AdminPanel from './AdminPanel';

function Root() {
  const isAdmin = window.location.pathname === '/admin';
  return isAdmin ? <AdminPanel /> : <App />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW error:', err));
  });
}
