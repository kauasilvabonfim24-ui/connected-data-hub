"use client";

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        className: 'font-body text-sm font-medium rounded-xl border border-surface-border bg-white text-ink shadow-lg px-4 py-3',
        success: {
          iconTheme: {
            primary: '#0ea5a0',
            secondary: '#ffffff',
          },
        },
        error: {
          iconTheme: {
            primary: '#e11d48',
            secondary: '#ffffff',
          },
        },
      }}
    />
  )
}