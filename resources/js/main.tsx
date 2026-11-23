import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import '../css/app.css';

// Initialize and ensure CSRF token from document meta
const csrfMeta = document.querySelector('meta[name="csrf-token"]');
if (csrfMeta) {
  (window as any).CSRF_TOKEN = csrfMeta.getAttribute('content') || '';
}

// Global fetch wrapper to guarantee X-CSRF-TOKEN & X-Requested-With on state-mutating requests
const originalFetch = window.fetch.bind(window);
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const method = (init?.method || 'GET').toUpperCase();
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  if (isMutating) {
    const token = (window as any).CSRF_TOKEN || document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
    const headers = new Headers(init?.headers || {});
    if (token && !headers.has('X-CSRF-TOKEN')) {
      headers.set('X-CSRF-TOKEN', token);
    }
    if (!headers.has('X-Requested-With')) {
      headers.set('X-Requested-With', 'XMLHttpRequest');
    }
    return originalFetch(input, {
      ...init,
      headers,
      credentials: init?.credentials || 'same-origin',
    });
  }
  return originalFetch(input, init);
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 menit
      refetchOnWindowFocus: false,
    },
  },
});

const rootElement = document.getElementById('app');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster position="top-right" richColors />
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
