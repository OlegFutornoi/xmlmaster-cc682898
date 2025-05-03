
// Edge функція для обробки файлів постачальників
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

// CORS заголовки
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Інтерфейс для атрибутів товару
interface ProductAttribute {
  attribute_name: string;
  attribute_value: string;
}

// Інтерфейс для зображень товару
interface ProductImage {
  image_url: string;
  is_main: boolean;
}

// Інтерфейс для товару
interface Product {
  name: string;
  description: string | null;
  price: number;
  old_price: number | null;
  sale_price: number | null;
  currency: string;
  manufacturer: string | null;
  is_active: boolean;
  supplier_id: string;
  category_name?: string;
  images: ProductImage[];
  attributes: ProductAttribute[];
}

// Інтерфейс для категорії товарів
interface ProductCategory {
  name: string;
  product_count: number;
}

// Результат обробки файлу
interface ProcessingResult {
  success: boolean;
  message: string;
  fileType?: "XML" | "CSV" | "UNKNOWN";
  data?: {
    products: Product[];
    categories: ProductCategory[];
  };
}

// Функція парсингу XML
async function processXmlData(xmlContent: string): Promise<ProcessingResult> {
  try {
    // Створюємо DOM парсер
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    
    if (!xmlDoc) {
      return {
        success: false,
        message: "Не вдалося розпарсити XML",
        fileType: "XML"
      };
    }
    
    // Результуючі масиви
    const products: Product[] = [];
    const categoriesMap = new Map<string, ProductCategory>();
    
    // Отримуємо всі товари з XML
    const productElements = xmlDoc.querySelectorAll("product");
    
    if (!productElements || productElements.length === 0) {
      return {
        success: false,
        message: "Не знайдено елементи товарів у XML",
        fileType: "XML"
      };
    }
    
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
      const images: ProductImage[] = [];
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
      const attributes: ProductAttribute[] = [];
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
      fileType: "XML",
      data: {
        products,
        categories: Array.from(categoriesMap.values())
      }
    };
  } catch (error) {
    console.error("Помилка обробки XML:", error);
    return {
      success: false,
      message: `Помилка обробки XML: ${error instanceof Error ? error.message : String(error)}`,
      fileType: "XML"
    };
  }
}

// Функція парсингу CSV
async function processCsvData(csvContent: string): Promise<ProcessingResult> {
  try {
    const lines = csvContent.trim().split("\n");
    if (lines.length === 0) {
      return {
        success: false,
        message: "CSV файл порожній або має неправильний формат",
        fileType: "CSV"
      };
    }
    
    // Парсимо заголовки
    const headers = lines[0].split(",").map(header => header.trim().toLowerCase());
    
    // Перевіряємо обов'язкові поля
    if (!headers.includes("name") || !headers.includes("price")) {
      return {
        success: false,
        message: "CSV файл повинен містити обов'язкові колонки 'name' та 'price'",
        fileType: "CSV"
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
      const values: string[] = [];
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
      const images: ProductImage[] = [];
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
      const attributes: ProductAttribute[] = [];
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
      fileType: "CSV",
      data: {
        products,
        categories: Array.from(categoriesMap.values())
      }
    };
  } catch (error) {
    console.error("Помилка обробки CSV:", error);
    return {
      success: false,
      message: `Помилка обробки CSV: ${error instanceof Error ? error.message : String(error)}`,
      fileType: "CSV"
    };
  }
}

// Основна функція обробки запитів
serve(async (req) => {
  // Обробка OPTIONS запитів (CORS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Отримуємо дані запиту
    const { url } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "URL файлу не вказано",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Визначаємо тип файлу
    let fileType: "XML" | "CSV" | "UNKNOWN" = "UNKNOWN";
    const lowercaseUrl = url.toLowerCase();
    
    if (lowercaseUrl.endsWith(".xml")) {
      fileType = "XML";
    } else if (lowercaseUrl.endsWith(".csv")) {
      fileType = "CSV";
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Непідтримуваний формат файлу. Підтримуються тільки XML та CSV.",
          fileType,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Завантажуємо файл
    const response = await fetch(url);
    
    if (!response.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Помилка завантаження файлу: ${response.status} ${response.statusText}`,
          fileType,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Отримуємо вміст файлу
    const content = await response.text();

    // Обробляємо файл відповідно до його типу
    let result: ProcessingResult;
    
    if (fileType === "XML") {
      result = await processXmlData(content);
    } else {
      result = await processCsvData(content);
    }

    // Повертаємо результат
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Помилка обробки запиту:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Помилка обробки запиту: ${error instanceof Error ? error.message : String(error)}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
