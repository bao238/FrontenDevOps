import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Tự động tải lại trang khi phát hiện bản build mới khiến chunk JS cũ bị 404 (chống lỗi màn hình trắng khi deploy)
window.addEventListener('vite:preloadError', (event) => {
  console.warn('⚠️ [Vite] Phát hiện phiên bản cập nhật mới trên máy chủ, đang tự động nạp lại trang...');
  window.location.reload();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
