
-- Додаємо RLS політики для таблиці user_stores
ALTER TABLE public.user_stores ENABLE ROW LEVEL SECURITY;

-- Користувачі можуть переглядати свої магазини
CREATE POLICY "Users can view their own stores" 
ON public.user_stores 
FOR SELECT 
USING (user_id = auth.uid());

-- Користувачі можуть створювати свої магазини
CREATE POLICY "Users can create their own stores" 
ON public.user_stores 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Користувачі можуть оновлювати свої магазини
CREATE POLICY "Users can update their own stores" 
ON public.user_stores 
FOR UPDATE 
USING (user_id = auth.uid());

-- Користувачі можуть видаляти свої магазини
CREATE POLICY "Users can delete their own stores" 
ON public.user_stores 
FOR DELETE 
USING (user_id = auth.uid());
