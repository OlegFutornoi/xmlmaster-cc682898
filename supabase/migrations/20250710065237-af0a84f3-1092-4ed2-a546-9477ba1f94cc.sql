
-- Додаємо поле template_id до таблиці user_stores для зв'язку з XML-шаблонами
ALTER TABLE public.user_stores 
ADD COLUMN template_id uuid REFERENCES public.template_xml(id);

-- Створюємо таблицю для збереження параметрів шаблону конкретного магазину
CREATE TABLE public.store_template_parameters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id uuid NOT NULL REFERENCES public.user_stores(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.template_xml(id) ON DELETE CASCADE,
  parameter_name text NOT NULL,
  parameter_value text,
  xml_path text NOT NULL,
  parameter_type text NOT NULL DEFAULT 'text',
  parameter_category text NOT NULL DEFAULT 'parameter',
  is_active boolean NOT NULL DEFAULT true,
  is_required boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(store_id, parameter_name)
);

-- Додаємо RLS політики для store_template_parameters
ALTER TABLE public.store_template_parameters ENABLE ROW LEVEL SECURITY;

-- Користувачі можуть переглядати параметри шаблонів своїх магазинів
CREATE POLICY "Users can view their store template parameters" 
ON public.store_template_parameters 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_stores 
    WHERE user_stores.id = store_template_parameters.store_id 
    AND user_stores.user_id = auth.uid()
  )
);

-- Користувачі можуть створювати параметри шаблонів для своїх магазинів
CREATE POLICY "Users can create store template parameters" 
ON public.store_template_parameters 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_stores 
    WHERE user_stores.id = store_template_parameters.store_id 
    AND user_stores.user_id = auth.uid()
  )
);

-- Користувачі можуть оновлювати параметри шаблонів своїх магазинів
CREATE POLICY "Users can update their store template parameters" 
ON public.store_template_parameters 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_stores 
    WHERE user_stores.id = store_template_parameters.store_id 
    AND user_stores.user_id = auth.uid()
  )
);

-- Користувачі можуть видаляти параметри шаблонів своїх магазинів
CREATE POLICY "Users can delete their store template parameters" 
ON public.store_template_parameters 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.user_stores 
    WHERE user_stores.id = store_template_parameters.store_id 
    AND user_stores.user_id = auth.uid()
  )
);

-- Створюємо тригер для автоматичного оновлення updated_at
CREATE TRIGGER update_store_template_parameters_updated_at
  BEFORE UPDATE ON public.store_template_parameters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Додаємо RLS політику для перегляду XML-шаблонів користувачами
CREATE POLICY "Users can view active templates" 
ON public.template_xml 
FOR SELECT 
USING (is_active = true);
