
-- Функція для видалення даних постачальника
CREATE OR REPLACE FUNCTION public.delete_supplier_data(supplier_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Видаляємо атрибути товарів постачальника
  DELETE FROM public.product_attributes
  WHERE product_id IN (
    SELECT id FROM public.products WHERE supplier_id = supplier_id_param
  );
  
  -- Видаляємо зображення товарів постачальника
  DELETE FROM public.product_images
  WHERE product_id IN (
    SELECT id FROM public.products WHERE supplier_id = supplier_id_param
  );
  
  -- Видаляємо товари постачальника
  DELETE FROM public.products
  WHERE supplier_id = supplier_id_param;
  
  -- Видаляємо категорії постачальника
  DELETE FROM public.product_categories
  WHERE supplier_id = supplier_id_param;
  
  -- Оновлюємо лічильник товарів постачальника
  UPDATE public.suppliers
  SET product_count = 0
  WHERE id = supplier_id_param;
END;
$$ LANGUAGE plpgsql;
