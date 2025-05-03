
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
    // Парсимо XML документ
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    
    // Перевіряємо на помилки парсингу
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      return {
        success: false,
        message: "Помилка парсингу XML: " + parserError.textContent,
        fileType: FileType.XML
      };
    }
    
    // Результуючі масиви
    const products: Product[] = [];
    const categoriesMap = new Map<string, ProductCategory>();
    
    // Отримуємо всі товари з XML
    const productElements = xmlDoc.querySelectorAll("product");
    
    // Обробляємо кожен товар
    productElements.forEach((productElement, index) => {
      // Основні дані товару
      const name = productElement.querySelector("name")?.textContent || `Товар ${index + 1}`;
      const description = productElement.querySelector("description")?.textContent || null;
      const priceText = productElement.querySelector("price")?.textContent || "0";
      const price = parseFloat(priceText);
      const oldPriceText = productElement.querySelector("old_price")?.textContent || null;
      const oldPrice = oldPriceText ? parseFloat(oldPriceText) : null;
      const salePriceText = productElement.querySelector("sale_price")?.textContent || null;
      const salePrice = salePriceText ? parseFloat(salePriceText) : null;
      const currency = productElement.querySelector("currency")?.textContent || "UAH";
      const manufacturer = productElement.querySelector("manufacturer")?.textContent || null;
      const categoryName = productElement.querySelector("category")?.textContent || "Без категорії";
      
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
      const imageElements = productElement.querySelectorAll("image");
      imageElements.forEach((imgEl, imgIndex) => {
        const imageUrl = imgEl.textContent || "";
        if (imageUrl) {
          images.push({
            image_url: imageUrl,
            is_main: imgIndex === 0 // Перше зображення є головним
          });
        }
      });
      
      // Характеристики товару
      const attributes = [];
      const attrElements = productElement.querySelectorAll("attribute");
      attrElements.forEach((attrEl) => {
        const attrName = attrEl.getAttribute("name") || attrEl.querySelector("name")?.textContent;
        const attrValue = attrEl.textContent || attrEl.querySelector("value")?.textContent;
        
        if (attrName && attrValue) {
          attributes.push({
            attribute_name: attrName,
            attribute_value: attrValue
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
    });
    
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
    // Перевіряємо валідність URL та формат файлу
    const { valid, fileType, message } = validateFileUrl(url);
    if (!valid) {
      return {
        success: false,
        message: message || "Неправильний формат URL",
        fileType
      };
    }
    
    // Завантажуємо файл
    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        success: false,
        message: `Помилка завантаження файлу: ${response.status} ${response.statusText}`,
        fileType
      };
    }
    
    const content = await response.text();
    
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
  } catch (error) {
    console.error("Помилка обробки файлу постачальника:", error);
    return {
      success: false,
      message: `Помилка обробки файлу: ${error instanceof Error ? error.message : String(error)}`,
      fileType: FileType.UNKNOWN
    };
  }
};
