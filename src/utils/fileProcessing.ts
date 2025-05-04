
// Утиліти для обробки файлів постачальників
import { FileProcessingResult, FileType, Product, ProductCategory, SupplierFileData } from "@/types/supplier";

/**
 * Визначає тип файлу за його URL
 */
export const determineFileType = (url: string): FileType => {
  const lowercaseUrl = url.toLowerCase();
  
  if (lowercaseUrl.endsWith('.xml')) {
    return FileType.XML;
  } else if (lowercaseUrl.endsWith('.csv')) {
    return FileType.CSV;
  } else {
    return FileType.UNKNOWN;
  }
};

/**
 * Перевіряє валідність URL та формату файлу
 */
export const validateFileUrl = (url: string): { valid: boolean; fileType: FileType; message?: string } => {
  // Перевіряємо чи це коректний URL
  try {
    new URL(url);
  } catch (e) {
    return { valid: false, fileType: FileType.UNKNOWN, message: "Неправильний формат URL" };
  }
  
  // Перевіряємо тип файлу
  const fileType = determineFileType(url);
  
  if (fileType === FileType.UNKNOWN) {
    return { 
      valid: false, 
      fileType, 
      message: "URL повинен вказувати на файл формату XML або CSV" 
    };
  }
  
  return { valid: true, fileType };
};

/**
 * Обробляє XML дані
 */
export const processXmlData = async (xmlContent: string): Promise<FileProcessingResult> => {
  try {
    console.log("Починаємо обробку XML даних...");
    
    // Парсимо XML документ
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    
    // Перевіряємо на помилки парсингу
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      console.error("Помилка парсингу XML:", parserError.textContent);
      return {
        success: false,
        message: "Помилка парсингу XML: " + parserError.textContent,
        fileType: FileType.XML
      };
    }
    
    // Результуючі масиви
    const products: Product[] = [];
    const categoriesMap = new Map<string, ProductCategory>();
    
    console.log("XML документ успішно створено, шукаємо елементи...");
    
    // Отримуємо всі товари з XML
    // Перевіряємо різні можливі структури XML
    let productElements = xmlDoc.querySelectorAll("product");
    
    // Якщо немає прямих елементів "product", шукаємо в різних структурах
    if (productElements.length === 0) {
      console.log("Не знайдено елементи 'product', шукаємо альтернативні структури...");
      
      // Варіант 1: products/product
      productElements = xmlDoc.querySelectorAll("products > product");
      
      // Варіант 2: catalog/product або catalog/products/product
      if (productElements.length === 0) {
        productElements = xmlDoc.querySelectorAll("catalog > product, catalog > products > product");
      }
      
      // Варіант 3: shop/products/product
      if (productElements.length === 0) {
        productElements = xmlDoc.querySelectorAll("shop > products > product");
      }
      
      // Варіант 4: items/item
      if (productElements.length === 0) {
        productElements = xmlDoc.querySelectorAll("items > item");
      }
      
      // Варіант 5: yml_catalog/shop/offers/offer
      if (productElements.length === 0) {
        productElements = xmlDoc.querySelectorAll("yml_catalog > shop > offers > offer");
      }
      
      console.log(`Знайдено ${productElements.length} елементів в альтернативних структурах`);
    } else {
      console.log(`Знайдено ${productElements.length} елементів 'product'`);
    }
    
    // Якщо все ще немає елементів, пробуємо знайти будь-які теги, які можуть бути товарами
    if (productElements.length === 0) {
      console.log("Не знайдено стандартних структур, шукаємо будь-які можливі елементи товарів...");
      const possibleProductTags = ["item", "offer", "product", "good", "article"];
      
      for (const tag of possibleProductTags) {
        productElements = xmlDoc.querySelectorAll(tag);
        if (productElements.length > 0) {
          console.log(`Знайдено ${productElements.length} елементів '${tag}'`);
          break;
        }
      }
    }
    
    if (productElements.length === 0) {
      console.error("Не знайдено жодного елемента товару в XML файлі");
      return {
        success: false,
        message: "Не знайдено жодного елемента товару в XML файлі. Перевірте структуру XML.",
        fileType: FileType.XML
      };
    }
    
    console.log(`Починаємо обробку ${productElements.length} товарів...`);
    
    // Обробляємо кожен товар
    productElements.forEach((productElement, index) => {
      try {
        // Функція для пошуку значення в різних можливих елементах
        const findValue = (selectors: string[]): string | null => {
          for (const selector of selectors) {
            const element = productElement.querySelector(selector);
            if (element && element.textContent) {
              return element.textContent.trim();
            }
          }
          return null;
        };
        
        // Основні дані товару
        const name = findValue(["name", "title", "product_name", "model"]) || `Товар ${index + 1}`;
        const description = findValue(["description", "desc", "content", "text", "product_description"]);
        const priceText = findValue(["price", "cost", "product_price"]) || "0";
        const price = parseFloat(priceText);
        const oldPriceText = findValue(["old_price", "oldprice", "base_price", "regular_price"]);
        const oldPrice = oldPriceText ? parseFloat(oldPriceText) : null;
        const salePriceText = findValue(["sale_price", "saleprice", "discount_price", "special_price"]);
        const salePrice = salePriceText ? parseFloat(salePriceText) : null;
        const currency = findValue(["currency", "currencyId", "currency_id"]) || "UAH";
        const manufacturer = findValue(["manufacturer", "brand", "vendor", "producer"]);
        const categoryName = findValue(["category", "categoryId", "category_id", "group", "catalog"]) || "Без категорії";
        
        console.log(`Обробка товару: ${name}`);
        
        // Створюємо або оновлюємо категорію
        if (!categoriesMap.has(categoryName)) {
          categoriesMap.set(categoryName, {
            name: categoryName,
            product_count: 1
          });
        } else {
          const category = categoriesMap.get(categoryName)!;
          category.product_count += 1;
          categoriesMap.set(categoryName, category);
        }
        
        // Зображення товару
        const images: any[] = [];
        // Шукаємо зображення в різних форматах
        const imageSelectors = [
          "image", "picture", "img", "photo", 
          "images > image", "pictures > picture", "imgs > img", "photos > photo"
        ];
        
        let mainImageFound = false;
        
        // Перевіряємо всі можливі селектори для зображень
        for (const selector of imageSelectors) {
          const imgElements = productElement.querySelectorAll(selector);
          
          if (imgElements.length > 0) {
            imgElements.forEach((imgEl, imgIndex) => {
              // Перевіряємо, чи елемент містить URL або сам є текстовим вузлом з URL
              let imageUrl = imgEl.getAttribute("url") || 
                             imgEl.getAttribute("src") || 
                             imgEl.getAttribute("href") || 
                             imgEl.textContent;
                              
              if (imageUrl && imageUrl.trim()) {
                imageUrl = imageUrl.trim();
                // Перевіряємо, що URL не відносний
                if (!imageUrl.startsWith('http') && !imageUrl.startsWith('https')) {
                  // Спробуємо знайти базовий URL в XML
                  const baseUrlElement = xmlDoc.querySelector("base_url, shop > base_url");
                  const baseUrl = baseUrlElement ? baseUrlElement.textContent : null;
                  
                  if (baseUrl) {
                    imageUrl = baseUrl.endsWith('/') ? 
                      `${baseUrl}${imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl}` :
                      `${baseUrl}${imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl}`;
                  }
                }
                
                images.push({
                  image_url: imageUrl,
                  is_main: !mainImageFound // Перше зображення є головним
                });
                
                if (!mainImageFound) mainImageFound = true;
              }
            });
            
            // Якщо знайшли зображення за цим селектором, не продовжуємо пошук
            if (images.length > 0) break;
          }
        }
        
        console.log(`Знайдено ${images.length} зображень для товару`);
        
        // Характеристики товару
        const attributes: any[] = [];
        // Шукаємо атрибути в різних форматах
        const attrSelectors = [
          "attribute", "param", "characteristic", "spec",
          "attributes > attribute", "params > param", "characteristics > characteristic", "specs > spec"
        ];
        
        // Перевіряємо всі можливі селектори для атрибутів
        for (const selector of attrSelectors) {
          const attrElements = productElement.querySelectorAll(selector);
          
          if (attrElements.length > 0) {
            attrElements.forEach((attrEl) => {
              const attrName = attrEl.getAttribute("name") || 
                               attrEl.querySelector("name")?.textContent || 
                               attrEl.tagName;
              
              const attrValue = attrEl.textContent || 
                                attrEl.querySelector("value")?.textContent || 
                                attrEl.getAttribute("value") || "";
              
              if (attrName && attrValue && attrName !== attrValue) {
                attributes.push({
                  attribute_name: attrName,
                  attribute_value: attrValue
                });
              }
            });
            
            // Якщо знайшли атрибути за цим селектором, не продовжуємо пошук
            if (attributes.length > 0) break;
          }
        }
        
        console.log(`Знайдено ${attributes.length} атрибутів для товару`);
        
        // Створюємо об'єкт товару
        const product: Product = {
          name,
          description,
          price,
          old_price: oldPrice,
          sale_price: salePrice,
          currency,
          manufacturer,
          is_active: true,
          supplier_id: "", // Буде встановлено пізніше
          images,
          attributes,
          category_name: categoryName
        };
        
        products.push(product);
      } catch (err) {
        console.error(`Помилка обробки товару ${index}:`, err);
        // Продовжуємо з наступним товаром
      }
    });
    
    console.log(`Успішно оброблено ${products.length} товарів з ${categoriesMap.size} категорій`);
    
    if (products.length === 0) {
      return {
        success: false,
        message: "Не вдалося отримати жодного товару з файлу. Перевірте формат XML.",
        fileType: FileType.XML
      };
    }
    
    return {
      success: true,
      message: `Успішно оброблено ${products.length} товарів з ${categoriesMap.size} категорій`,
      data: {
        products,
        categories: Array.from(categoriesMap.values())
      },
      fileType: FileType.XML
    };
  } catch (error) {
    console.error("Помилка обробки XML:", error);
    return {
      success: false,
      message: `Помилка обробки XML: ${error instanceof Error ? error.message : String(error)}`,
      fileType: FileType.XML
    };
  }
};

/**
 * Обробляє CSV дані
 */
export const processCsvData = async (csvContent: string): Promise<FileProcessingResult> => {
  try {
    const lines = csvContent.trim().split("\n");
    if (lines.length === 0) {
      return {
        success: false,
        message: "CSV файл порожній або має неправильний формат",
        fileType: FileType.CSV
      };
    }
    
    // Парсимо заголовки
    const headers = lines[0].split(",").map(header => header.trim().toLowerCase());
    
    // Перевіряємо обов'язкові поля
    if (!headers.includes("name") || !headers.includes("price")) {
      return {
        success: false,
        message: "CSV файл повинен містити обов'язкові колонки 'name' та 'price'",
        fileType: FileType.CSV
      };
    }
    
    // Результуючі масиви
    const products: Product[] = [];
    const categoriesMap = new Map<string, ProductCategory>();
    
    // Обробляємо рядки з даними
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Парсимо CSV рядок (враховуємо можливість коми в лапках)
      let values: string[] = [];
      let insideQuotes = false;
      let currentValue = "";
      
      for (const char of line) {
        if (char === '"') {
          insideQuotes = !insideQuotes;
        } else if (char === ',' && !insideQuotes) {
          values.push(currentValue.trim());
          currentValue = "";
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim()); // Додаємо останнє значення
      
      // Створюємо об'єкт з даними товару
      const productData: Record<string, string> = {};
      headers.forEach((header, index) => {
        if (index < values.length) {
          // Видаляємо лапки з значень
          const value = values[index].replace(/^"|"$/g, "");
          productData[header] = value;
        }
      });
      
      // Основні дані товару
      const name = productData.name || `Товар ${i}`;
      const description = productData.description || null;
      const price = parseFloat(productData.price) || 0;
      const oldPrice = productData.old_price ? parseFloat(productData.old_price) : null;
      const salePrice = productData.sale_price ? parseFloat(productData.sale_price) : null;
      const currency = productData.currency || "UAH";
      const manufacturer = productData.manufacturer || null;
      const categoryName = productData.category || "Без категорії";
      
      // Створюємо або оновлюємо категорію
      if (!categoriesMap.has(categoryName)) {
        categoriesMap.set(categoryName, {
          name: categoryName,
          product_count: 1
        });
      } else {
        const category = categoriesMap.get(categoryName)!;
        category.product_count += 1;
        categoriesMap.set(categoryName, category);
      }
      
      // Зображення товару
      const images = [];
      const imageUrls = productData.images ? productData.images.split(";") : [];
      imageUrls.forEach((url, imgIndex) => {
        if (url.trim()) {
          images.push({
            image_url: url.trim(),
            is_main: imgIndex === 0 // Перше зображення є головним
          });
        }
      });
      
      // Характеристики товару (формат: "назва:значення;назва:значення")
      const attributes = [];
      const attributesStr = productData.attributes || "";
      const attributePairs = attributesStr.split(";");
      attributePairs.forEach((pair) => {
        const [attrName, attrValue] = pair.split(":");
        if (attrName && attrValue) {
          attributes.push({
            attribute_name: attrName.trim(),
            attribute_value: attrValue.trim()
          });
        }
      });
      
      // Створюємо об'єкт товару
      const product: Product = {
        name,
        description,
        price,
        old_price: oldPrice,
        sale_price: salePrice,
        currency,
        manufacturer,
        is_active: true,
        supplier_id: "", // Буде встановлено пізніше
        images,
        attributes,
        category_name: categoryName
      };
      
      products.push(product);
    }
    
    return {
      success: true,
      message: `Успішно оброблено ${products.length} товарів з ${categoriesMap.size} категорій`,
      data: {
        products,
        categories: Array.from(categoriesMap.values())
      },
      fileType: FileType.CSV
    };
  } catch (error) {
    console.error("Помилка обробки CSV:", error);
    return {
      success: false,
      message: `Помилка обробки CSV: ${error instanceof Error ? error.message : String(error)}`,
      fileType: FileType.CSV
    };
  }
};

/**
 * Обробляє файл постачальника за його URL
 */
export const processSupplierFile = async (url: string): Promise<FileProcessingResult> => {
  try {
    console.log(`Початок обробки файлу за URL: ${url}`);
    
    // Перевіряємо валідність URL та формат файлу
    const { valid, fileType, message } = validateFileUrl(url);
    if (!valid) {
      console.error("Недійсний URL:", message);
      return {
        success: false,
        message: message || "Неправильний формат URL",
        fileType
      };
    }
    
    console.log(`URL валідний, тип файлу: ${fileType}, починаємо завантаження...`);
    
    // Завантажуємо файл
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': fileType === FileType.XML ? 'application/xml' : 'text/csv',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.error(`HTTP помилка: ${response.status} ${response.statusText}`);
        return {
          success: false,
          message: `Помилка завантаження файлу: ${response.status} ${response.statusText}`,
          fileType
        };
      }
      
      const content = await response.text();
      console.log(`Файл успішно завантажено, розмір: ${content.length} байт`);
      
      // Обробляємо файл відповідно до його типу
      if (fileType === FileType.XML) {
        return processXmlData(content);
      } else if (fileType === FileType.CSV) {
        return processCsvData(content);
      } else {
        return {
          success: false,
          message: "Непідтримуваний формат файлу",
          fileType
        };
      }
    } catch (fetchError) {
      console.error("Помилка завантаження файлу:", fetchError);
      return {
        success: false,
        message: `Помилка завантаження файлу: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
        fileType
      };
    }
  } catch (error) {
    console.error("Помилка обробки файлу постачальника:", error);
    return {
      success: false,
      message: `Помилка обробки файлу: ${error instanceof Error ? error.message : String(error)}`,
      fileType: FileType.UNKNOWN
    };
  }
};
