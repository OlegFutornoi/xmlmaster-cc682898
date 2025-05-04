
-- Активуємо розширення pg_cron, якщо ще не активовано
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Створюємо таблицю для логування оновлень постачальників
CREATE TABLE IF NOT EXISTS public.supplier_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'skipped')),
  message TEXT,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Застосовуємо політики безпеки
ALTER TABLE public.supplier_updates ENABLE ROW LEVEL SECURITY;

-- Користувачі можуть бачити лише свої логи оновлень
CREATE POLICY "Users can view their own supplier updates"
  ON public.supplier_updates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Додаємо крон-завдання для оновлення товарів кожного дня о 3:00 ранку
SELECT cron.schedule(
  'update-supplier-products-daily',
  '0 3 * * *', -- Кожен день о 3:00 ранку
  $$
  SELECT
    net.http_post(
      url := 'https://lzjwkentllirumevvmhr.supabase.co/functions/v1/update-supplier-products',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6andrZW50bGxpcnVtZXZ2bWhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM0OTY4MDQsImV4cCI6MjA1OTA3MjgwNH0.Z8v_Hf_Q9sJ4JsyXYxIg0aOJDiwmQo6pgw3L2uJwtCU"}'::jsonb,
      body := '{"automated": true}'::jsonb
    ) as request_id;
  $$
);
