
// Сервіс для роботи з товарами та постачальниками
import { supabase } from "@/integrations/supabase/client";
import { Product, ProductAttribute, ProductCategory, ProductImage, SupplierFileData } from "@/types/supplier";
import { toast } from "sonner";

/**
 * Обробляє дані файлу постачальника та зберігає їх у базу даних
 */
export const processAndSaveFileData = async (
  supplierId: string,
  userId: string,
  data: SupplierFileData
): Promise<{ success: boolean; message: string; productCount: number; categoryCount: number }> => {
  try {
    // 1. Обробляємо та зберігаємо категорії
    const categories = data.categories.map(category => ({
      ...category,
      user_id: userId,
      supplier_id: supplierId
    }));
    
    const { data: savedCategories, error: categoriesError } = await supabase
      .from('product_categories')
      .upsert(
        categories.map(category => ({
          name: category.name,
          user_id: userId,
          supplier_id: supplierId,
          product_count: category.product_count
        })),
        { onConflict: 'user_id, supplier_id, name' }
      )
      .select();
    
    if (categoriesError) {
      console.error("Помилка збереження категорій:", categoriesError);
      return { 
        success: false, 
        message: `Помилка збереження категорій: ${categoriesError.message}`,
        productCount: 0,
        categoryCount: 0
      };
    }
    
    // 2. Створюємо мапу категорій для пошуку їх ID
    const categoryMap = new Map<string, string>();
    if (savedCategories) {
      savedCategories.forEach(category => {
        categoryMap.set(category.name, category.id);
      });
    }
    
    // 3. Обробляємо та зберігаємо продукти
    const products = data.products.map(product => {
      const categoryName = product.category_name || "Без категорії";
      return {
        ...product,
        user_id: userId,
        supplier_id: supplierId,
        category_id: categoryMap.get(categoryName) || null
      };
    });
    
    // 4. Зберігаємо продукти партіями
    const savedProductIds: string[] = [];
    const batchSize = 50; // Розмір пакету для збереження
    
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      
      const { data: savedProducts, error: productsError } = await supabase
        .from('products')
        .upsert(
          batch.map(product => ({
            name: product.name,
            description: product.description,
            price: product.price,
            old_price: product.old_price,
            sale_price: product.sale_price,
            currency: product.currency,
            manufacturer: product.manufacturer,
            category_id: product.category_id,
            supplier_id: product.supplier_id,
            user_id: product.user_id,
            is_active: product.is_active
          })),
          { onConflict: 'name, supplier_id, user_id' }
        )
        .select();
      
      if (productsError) {
        console.error("Помилка збереження товарів:", productsError);
        return { 
          success: false, 
          message: `Помилка збереження товарів: ${productsError.message}`,
          productCount: savedProductIds.length,
          categoryCount: savedCategories?.length || 0
        };
      }
      
      if (savedProducts) {
        // Зберігаємо ID збережених продуктів
        savedProductIds.push(...savedProducts.map(p => p.id));
        
        // 5. Зберігаємо зображення та атрибути для поточного пакету продуктів
        for (let j = 0; j < savedProducts.length; j++) {
          const savedProduct = savedProducts[j];
          const originalProduct = batch[j];
          
          // 5.1. Зберігаємо зображення
          if (originalProduct.images && originalProduct.images.length > 0) {
            const { error: imagesError } = await supabase
              .from('product_images')
              .upsert(
                originalProduct.images.map(image => ({
                  product_id: savedProduct.id,
                  image_url: image.image_url,
                  is_main: image.is_main
                })),
                { onConflict: 'product_id, image_url' }
              );
            
            if (imagesError) {
              console.error(`Помилка збереження зображень для товару ${savedProduct.id}:`, imagesError);
            }
          }
          
          // 5.2. Зберігаємо атрибути
          if (originalProduct.attributes && originalProduct.attributes.length > 0) {
            const { error: attributesError } = await supabase
              .from('product_attributes')
              .upsert(
                originalProduct.attributes.map(attr => ({
                  product_id: savedProduct.id,
                  attribute_name: attr.attribute_name,
                  attribute_value: attr.attribute_value
                })),
                { onConflict: 'product_id, attribute_name' }
              );
            
            if (attributesError) {
              console.error(`Помилка збереження атрибутів для товару ${savedProduct.id}:`, attributesError);
            }
          }
        }
      }
    }
    
    // 6. Оновлюємо кількість товарів у постачальника
    const { error: supplierUpdateError } = await supabase
      .from('suppliers')
      .update({ product_count: savedProductIds.length })
      .eq('id', supplierId);
    
    if (supplierUpdateError) {
      console.error("Помилка оновлення кількості товарів у постачальника:", supplierUpdateError);
    }
    
    return {
      success: true,
      message: `Успішно збережено ${savedProductIds.length} товарів та ${savedCategories?.length || 0} категорій`,
      productCount: savedProductIds.length,
      categoryCount: savedCategories?.length || 0
    };
  } catch (error) {
    console.error("Помилка обробки та збереження даних файлу:", error);
    return {
      success: false,
      message: `Помилка обробки та збереження даних файлу: ${error instanceof Error ? error.message : String(error)}`,
      productCount: 0,
      categoryCount: 0
    };
  }
};

/**
 * Отримує всі товари постачальника
 */
export const getSupplierProducts = async (supplierId: string): Promise<{
  products: Product[];
  categories: ProductCategory[];
  success: boolean;
}> => {
  try {
    // 1. Отримуємо товари постачальника
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });
    
    if (productsError) {
      console.error("Помилка отримання товарів:", productsError);
      toast.error("Не вдалося завантажити товари");
      return { products: [], categories: [], success: false };
    }
    
    // 2. Отримуємо категорії постачальника
    const { data: categories, error: categoriesError } = await supabase
      .from('product_categories')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('name');
    
    if (categoriesError) {
      console.error("Помилка отримання категорій:", categoriesError);
      toast.error("Не вдалося завантажити категорії");
      return { products: products || [], categories: [], success: false };
    }
    
    // 3. Отримуємо зображення для товарів
    const { data: images, error: imagesError } = await supabase
      .from('product_images')
      .select('*')
      .in(
        'product_id', 
        products ? products.map(p => p.id as string) : []
      );
    
    if (imagesError) {
      console.error("Помилка отримання зображень:", imagesError);
    }
    
    // 4. Отримуємо атрибути для товарів
    const { data: attributes, error: attributesError } = await supabase
      .from('product_attributes')
      .select('*')
      .in(
        'product_id', 
        products ? products.map(p => p.id as string) : []
      );
    
    if (attributesError) {
      console.error("Помилка отримання атрибутів:", attributesError);
    }
    
    // 5. Організуємо дані та додаємо зображення і атрибути до товарів
    const productsWithData = products ? products.map(product => {
      // Знаходимо всі зображення для товару
      const productImages = images 
        ? images.filter(img => img.product_id === product.id)
        : [];
      
      // Знаходимо всі атрибути для товару
      const productAttributes = attributes 
        ? attributes.filter(attr => attr.product_id === product.id)
        : [];
      
      // Знаходимо категорію товару
      const category = categories 
        ? categories.find(cat => cat.id === product.category_id)
        : undefined;
      
      return {
        ...product,
        images: productImages,
        attributes: productAttributes,
        category_name: category?.name
      };
    }) : [];
    
    return {
      products: productsWithData,
      categories: categories || [],
      success: true
    };
  } catch (error) {
    console.error("Помилка отримання товарів та категорій:", error);
    toast.error("Сталася помилка при завантаженні даних товарів");
    return { products: [], categories: [], success: false };
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
      toast.error("Не вдалося завантажити інформацію про товар");
      return { success: false };
    }
    
    if (!product) {
      toast.error("Товар не знайдено");
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
    toast.error("Сталася помилка при завантаженні деталей товару");
    return { success: false };
  }
};

/**
 * Перевіряє та оновлює товари постачальника за URL
 */
export const updateSupplierProducts = async (
  supplierId: string, 
  userId: string,
  url: string | null
): Promise<{ success: boolean; message: string }> => {
  if (!url) {
    return { 
      success: false, 
      message: "URL файлу постачальника не вказано" 
    };
  }
  
  try {
    // Імпортуємо функцію для обробки файлу
    const { processSupplierFile } = await import('@/utils/fileProcessing');
    
    // Обробляємо файл
    const result = await processSupplierFile(url);
    
    if (!result.success || !result.data) {
      return { 
        success: false, 
        message: result.message 
      };
    }
    
    // Зберігаємо оброблені дані
    const saveResult = await processAndSaveFileData(supplierId, userId, result.data);
    
    return {
      success: saveResult.success,
      message: saveResult.message
    };
  } catch (error) {
    console.error("Помилка оновлення товарів постачальника:", error);
    return {
      success: false,
      message: `Помилка оновлення товарів постачальника: ${error instanceof Error ? error.message : String(error)}`
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
  // Тут має бути логіка перевірки обмежень тарифного плану
  // Поки просто заглушка, яка дозволяє будь-яку кількість товарів
  return {
    reachedLimit: false,
    currentCount: 0,
    maxAllowed: Number.MAX_SAFE_INTEGER
  };
};
