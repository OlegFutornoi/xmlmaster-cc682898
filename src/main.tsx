
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Створюємо QueryClient з оптимізованими налаштуваннями
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Вимикаємо автоматичний рефетч при фокусі вікна
      refetchOnWindowFocus: false,
      // Зменшуємо частоту автоматичних оновлень
      refetchOnReconnect: false,
      // Збільшуємо час кешування
      staleTime: 5 * 60 * 1000, // 5 хвилин
      // Зменшуємо час збереження в кеші неактивних запитів
      gcTime: 10 * 60 * 1000, // 10 хвилин
      // Вимикаємо автоматичний retry при помилках
      retry: 1,
      // Збільшуємо інтервал між retry
      retryDelay: 3000,
    },
    mutations: {
      retry: 1,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
