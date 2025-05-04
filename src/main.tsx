
// Файл main.tsx - Головний вхідний файл додатку
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import "./services/demoTariffService";

const queryClient = new QueryClient();

// Створюємо bucket для зберігання аватарів, якщо він ще не існує
const setupStorage = async () => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing storage buckets:', error);
      return;
    }
    
    // Перевіряємо, чи існує бакет "avatars"
    if (!buckets.some(bucket => bucket.name === 'avatars')) {
      // Додаємо поле avatar_url до таблиці users
      await supabase.rpc('add_avatar_column_if_not_exists');
    }
  } catch (error) {
    console.error('Error setting up storage:', error);
  }
};

// Викликаємо функцію налаштування сховища
setupStorage();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <Toaster richColors />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
