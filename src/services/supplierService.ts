
// Сервіс для роботи з постачальниками
import { supabase } from '@/integrations/supabase/client';
import { FileProcessingResult, FileType, Product, ProductCategory, Supplier } from '@/types/supplier';
import { processSupplierFile } from '@/utils/fileProcessing';
import { toast } from 'sonner';

// Функція для обробки та збереження даних з файлу постачальника
export const processAndSaveFileData = async (
  supplierId: string,
  userId: string,
  fileData: {
    products: Product[];
    categories: ProductCategory[];
  }
): Promise<{ success: boolean; message: string; affectedRows?: number }> => {
  try {
    // Зберігаємо категорії
    const categoriesToInsert = fileData.categories.map(category => ({
      name: category.name,
      supplier_id: supplierId,
      user_id: userId,
      product_count: category.product_count
    }));
    
    // Додаємо категорії (без ON CONFLICT, оскільки немає відповідного обмеження)
    const { data: insertedCategories, error: categoriesError } = await supabase
      .from('product_categories')
      .insert(categoriesToInsert)
      .select('id, name');
    
    if (categoriesError) {
      console.error('Помилка збереження категорій:', categoriesError);
      return { success: false, message: `Помилка збереження категорій: ${categoriesError.message}` };
    }
    
    // Створюємо мапу для категорій за їх назвами
    const categoryMap = new Map<string, string>();
    insertedCategories?.forEach(category => {
      categoryMap.set(category.name, category.id);
    });
    
    // Зберігаємо товари з правильними ID категорій
    const productsToInsert = fileData.products.map(product => {
      const categoryId = product.category_name ? categoryMap.get(product.category_name) : null;
      
      return {
        name: product.name,
        description: product.description,
        price: product.price,
        old_price: product.old_price,
        sale_price: product.sale_price,
        currency: product.currency,
        manufacturer: product.manufacturer,
        category_id: categoryId,
        supplier_id: supplierId,
        user_id: userId,
        is_active: true
      };
    });
    
    // Додаємо товари
    const { data: insertedProducts, error: productsError } = await supabase
      .from('products')
      .insert(productsToInsert)
      .select('id');
    
    if (productsError) {
      console.error('Помилка збереження товарів:', productsError);
      return { success: false, message: `Помилка збереження товарів: ${productsError.message}` };
    }
    
    // Створюємо масив для зберігання всіх атрибутів товарів
    const allAttributes: any[] = [];
    
    // Створюємо масив для зберігання всіх зображень товарів
    const allImages: any[] = [];
    
    // Додаємо атрибути та зображення для кожного товару
    fileData.products.forEach((product, index) => {
      const productId = insertedProducts[index]?.id;
      
      if (productId) {
        // Додаємо атрибути
        if (product.attributes && product.attributes.length > 0) {
          product.attributes.forEach(attr => {
            allAttributes.push({
              product_id: productId,
              attribute_name: attr.attribute_name,
              attribute_value: attr.attribute_value
            });
          });
        }
        
        // Додаємо зображення
        if (product.images && product.images.length > 0) {
          product.images.forEach(img => {
            allImages.push({
              product_id: productId,
              image_url: img.image_url,
              is_main: img.is_main
            });
          });
        }
      }
    });
    
    // Зберігаємо атрибути товарів
    if (allAttributes.length > 0) {
      const { error: attributesError } = await supabase
        .from('product_attributes')
        .insert(allAttributes);
      
      if (attributesError) {
        console.error('Помилка збереження атрибутів:', attributesError);
        // Продовжуємо виконання, оскільки атрибути не є критичними
      }
    }
    
    // Зберігаємо зображення товарів
    if (allImages.length > 0) {
      const { error: imagesError } = await supabase
        .from('product_images')
        .insert(allImages);
      
      if (imagesError) {
        console.error('Помилка збереження зображень:', imagesError);
        // Продовжуємо виконання, оскільки зображення не є критичними
      }
    }
    
    // Оновлюємо кількість товарів у постачальника
    const { error: updateError } = await supabase
      .from('suppliers')
      .update({ product_count: productsToInsert.length })
      .eq('id', supplierId);
    
    if (updateError) {
      console.error('Помилка оновлення кількості товарів постачальника:', updateError);
      // Продовжуємо виконання, це не критична помилка
    }
    
    return { 
      success: true, 
      message: `Успішно додано ${insertedProducts.length} товарів та ${insertedCategories.length} категорій`,
      affectedRows: insertedProducts.length
    };
  } catch (error) {
    console.error('Помилка обробки даних:', error);
    return { 
      success: false, 
      message: `Помилка обробки даних: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
};

/**
 * Отримує всі товари постачальника
 */
export const getSupplierProducts = async (supplierId: string): Promise<{
  products: Product[];
  categories: ProductCategory[];
}> => {
  try {
    // Отримуємо категорії
    const { data: categories, error: categoriesError } = await supabase
      .from('product_categories')
      .select('*')
      .eq('supplier_id', supplierId);
    
    if (categoriesError) {
      console.error('Помилка отримання категорій:', categoriesError);
      throw new Error(`Помилка отримання категорій: ${categoriesError.message}`);
    }
    
    // Отримуємо товари
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        product_attributes (*),
        product_images (*)
      `)
      .eq('supplier_id', supplierId);
    
    if (productsError) {
      console.error('Помилка отримання товарів:', productsError);
      throw new Error(`Помилка отримання товарів: ${productsError.message}`);
    }
    
    // Перетворюємо дані у формат, що очікуєє клієнтом
    const formattedProducts = products.map(product => {
      const category = categories.find(cat => cat.id === product.category_id);
      
      return {
        ...product,
        category_name: category?.name || 'Без категорії',
        attributes: product.product_attributes,
        images: product.product_images
      };
    });
    
    return {
      products: formattedProducts,
      categories: categories
    };
  } catch (error) {
    console.error('Помилка отримання даних:', error);
    throw error;
  }
};

/**
 * Отримує деталі товару за його ID
 */
export const getProductDetails = async (productId: string): Promise<{
  product?: Product;
  success: boolean;
}> => {
  try {
    // 1. Отримуємо основну інформацію про товар
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (productError) {
      console.error("Помилка отримання товару:", productError);
      toast("Не вдалося завантажити інформацію про товар", {
        description: productError.message,
        duration: 3000,
      });
      return { success: false };
    }
    
    if (!product) {
      toast("Товар не знайдено", {
        description: "Запитаний товар не знайдено в базі даних",
        duration: 3000,
      });
      return { success: false };
    }
    
    // 2. Отримуємо зображення товару
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId);
    
    if (imagesError) {
      console.error("Помилка отримання зображень:", imagesError);
    }
    
    // 3. Отримуємо атрибути товару
    const { data: attributes, error: attributesError } = await supabase
      .from('product_attributes')
      .select('*')
      .eq('product_id', productId);
    
    if (attributesError) {
      console.error("Помилка отримання атрибутів:", attributesError);
    }
    
    // 4. Отримуємо категорію товару
    let categoryName = "Без категорії";
    if (product.category_id) {
      const { data: category, error: categoryError } = await supabase
        .from('product_categories')
        .select('name')
        .eq('id', product.category_id)
        .single();
      
      if (!categoryError && category) {
        categoryName = category.name;
      }
    }
    
    // 5. Об'єднуємо всі дані
    const productWithData: Product = {
      ...product,
      images: images || [],
      attributes: attributes || [],
      category_name: categoryName
    };
    
    return {
      product: productWithData,
      success: true
    };
  } catch (error) {
    console.error("Помилка отримання деталей товару:", error);
    toast("Сталася помилка при завантаженні деталей товару", {
      description: error instanceof Error ? error.message : "Невідома помилка",
      duration: 3000,
    });
    return { success: false };
  }
};

/**
 * Перевіряє та оновлює товари постачальника за URL
 */
export const updateSupplierProducts = async (
  supplierId: string, 
  userId: string,
  url: string
): Promise<{ success: boolean; message: string; affectedRows?: number }> => {
  try {
    // Перевіряємо обмеження за тарифним планом
    const limitsCheck = await checkProductLimits(userId);
    if (limitsCheck.reachedLimit) {
      return {
        success: false,
        message: `Ви досягли ліміту в ${limitsCheck.maxAllowed} товарів за вашим тарифним планом`
      };
    }
    
    // Видаляємо старі дані
    const { error: deleteError } = await supabase.rpc('delete_supplier_data', {
      supplier_id_param: supplierId
    });
    
    if (deleteError) {
      console.error('Помилка видалення старих даних:', deleteError);
      return {
        success: false,
        message: `Помилка видалення старих даних: ${deleteError.message}`
      };
    }
    
    // Отримуємо та обробляємо дані з файлу
    const result = await processSupplierFile(url);
    
    if (!result.success || !result.data) {
      return {
        success: false,
        message: result.message
      };
    }
    
    // Зберігаємо оброблені дані
    return await processAndSaveFileData(supplierId, userId, result.data);
  } catch (error) {
    console.error('Помилка оновлення товарів:', error);
    return {
      success: false,
      message: `Помилка оновлення товарів: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Перевіряє обмеження тарифного плану для товарів
 */
export const checkProductLimits = async (userId: string): Promise<{
  reachedLimit: boolean;
  currentCount: number;
  maxAllowed: number;
}> => {
  try {
    // Отримуємо активну підписку користувача
    const { data: subscription, error: subError } = await supabase
      .from('user_tariff_subscriptions')
      .select(`
        id,
        tariff_plan_id,
        tariff_plans:tariff_plan_id (id)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (subError) {
      console.error('Помилка отримання підписки:', subError);
      return {
        reachedLimit: false,
        currentCount: 0,
        maxAllowed: 100 // Базове обмеження за замовчуванням
      };
    }
    
    if (!subscription) {
      return {
        reachedLimit: true, // Без активної підписки обмеження досягнуто
        currentCount: 0,
        maxAllowed: 0
      };
    }
    
    // Отримуємо обмеження для тарифного плану
    const { data: limitations, error: limError } = await supabase
      .from('tariff_plan_limitations')
      .select(`
        id,
        limitation_type_id,
        value,
        limitation_types:limitation_type_id (name)
      `)
      .eq('tariff_plan_id', subscription.tariff_plan_id);
    
    if (limError) {
      console.error('Помилка отримання обмежень:', limError);
      return {
        reachedLimit: false,
        currentCount: 0,
        maxAllowed: 100 // Базове обмеження за замовчуванням
      };
    }
    
    // Шукаємо обмеження для товарів
    const productLimitation = limitations.find(
      lim => lim.limitation_types && lim.limitation_types.name === 'products'
    );
    
    if (!productLimitation) {
      return {
        reachedLimit: false,
        currentCount: 0,
        maxAllowed: Number.MAX_SAFE_INTEGER // Без обмежень
      };
    }
    
    // Отримуємо поточну кількість товарів користувача
    const { count: currentCount, error: countError } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (countError) {
      console.error('Помилка отримання кількості товарів:', countError);
      return {
        reachedLimit: false,
        currentCount: 0,
        maxAllowed: Number(productLimitation.value)
      };
    }
    
    const maxAllowed = Number(productLimitation.value);
    
    return {
      reachedLimit: currentCount !== null && currentCount >= maxAllowed,
      currentCount: currentCount || 0,
      maxAllowed
    };
  } catch (error) {
    console.error('Помилка перевірки обмежень:', error);
    return {
      reachedLimit: false,
      currentCount: 0,
      maxAllowed: 100 // Базове обмеження за замовчуванням у випадку помилки
    };
  }
};

/**
 * Перевіряє обмеження тарифного плану для постачальників
 */
export const checkSupplierLimits = async (userId: string): Promise<{
  reachedLimit: boolean;
  currentCount: number;
  maxAllowed: number;
}> => {
  try {
    // Отримуємо активну підписку користувача
    const { data: subscription, error: subError } = await supabase
      .from('user_tariff_subscriptions')
      .select(`
        id,
        tariff_plan_id,
        tariff_plans:tariff_plan_id (id)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    
    if (subError) {
      console.error('Помилка отримання підписки:', subError);
      return {
        reachedLimit: false,
        currentCount: 0,
        maxAllowed: 5 // Базове обмеження за замовчуванням
      };
    }
    
    if (!subscription) {
      return {
        reachedLimit: true, // Без активної підписки обмеження досягнуто
        currentCount: 0,
        maxAllowed: 0
      };
    }
    
    // Отримуємо обмеження для тарифного плану
    const { data: limitations, error: limError } = await supabase
      .from('tariff_plan_limitations')
      .select(`
        id,
        limitation_type_id,
        value,
        limitation_types:limitation_type_id (name)
      `)
      .eq('tariff_plan_id', subscription.tariff_plan_id);
    
    if (limError) {
      console.error('Помилка отримання обмежень:', limError);
      return {
        reachedLimit: false,
        currentCount: 0,
        maxAllowed: 5 // Базове обмеження за замовчуванням
      };
    }
    
    // Шукаємо обмеження для постачальників
    const supplierLimitation = limitations.find(
      lim => lim.limitation_types && lim.limitation_types.name === 'suppliers'
    );
    
    if (!supplierLimitation) {
      return {
        reachedLimit: false,
        currentCount: 0,
        maxAllowed: Number.MAX_SAFE_INTEGER // Без обмежень
      };
    }
    
    // Отримуємо поточну кількість постачальників користувача
    const { count: currentCount, error: countError } = await supabase
      .from('suppliers')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (countError) {
      console.error('Помилка отримання кількості постачальників:', countError);
      return {
        reachedLimit: false,
        currentCount: 0,
        maxAllowed: Number(supplierLimitation.value)
      };
    }
    
    const maxAllowed = Number(supplierLimitation.value);
    
    return {
      reachedLimit: currentCount !== null && currentCount >= maxAllowed,
      currentCount: currentCount || 0,
      maxAllowed
    };
  } catch (error) {
    console.error('Помилка перевірки обмежень:', error);
    return {
      reachedLimit: false,
      currentCount: 0,
      maxAllowed: 5 // Базове обмеження за замовчуванням у випадку помилки
    };
  }
};
