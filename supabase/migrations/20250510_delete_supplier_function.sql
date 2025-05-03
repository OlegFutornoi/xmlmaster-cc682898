
-- Функція для видалення всіх даних постачальника
CREATE OR REPLACE FUNCTION public.delete_supplier_data(supplier_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Видаляємо атрибути товарів
  DELETE FROM product_attributes
  WHERE product_id IN (
    SELECT id FROM products WHERE supplier_id = supplier_id_param
  );
  
  -- Видаляємо зображення товарів
  DELETE FROM product_images
  WHERE product_id IN (
    SELECT id FROM products WHERE supplier_id = supplier_id_param
  );
  
  -- Видаляємо товари
  DELETE FROM products
  WHERE supplier_id = supplier_id_param;
  
  -- Видаляємо категорії
  DELETE FROM product_categories
  WHERE supplier_id = supplier_id_param;
  
  -- Оновлюємо кількість товарів у постачальника
  UPDATE suppliers
  SET product_count = 0
  WHERE id = supplier_id_param;
END;
$$;

-- Надаємо дозволи на виконання функції
GRANT EXECUTE ON FUNCTION public.delete_supplier_data(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_supplier_data(UUID) TO service_role;
