import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/queryClient';
import { App } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#FFFFFF',
              color: '#0F2E2A',
              border: '1px solid #CFE7DC',
              borderRadius: '16px',
              fontSize: '13px',
              boxShadow: '0 4px 12px rgba(15, 46, 42, 0.08)',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#0F2E2A',
                secondary: '#BFEBD5',
              },
            },
            error: {
              iconTheme: {
                primary: '#0F2E2A',
                secondary: '#F1FAF6',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
