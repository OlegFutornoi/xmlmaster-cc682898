
// Покращений XML-парсер з підтримкою всіх YML-полів та CDATA
export interface ParsedXMLStructure {
  shop?: {
    name?: string;
    company?: string;
    url?: string;
  };
  currencies?: Array<{
    id: string;
    rate: number;
  }>;
  categories?: Array<{
    id: string;
    name: string;
    rz_id?: string;
  }>;
  offers?: Array<{
    id: string;
    available?: boolean;
    [key: string]: any;
  }>;
  parameters: Array<{
    name: string;
    value: any;
    path: string;
    type: 'parameter' | 'characteristic';
    category: 'shop' | 'currency' | 'category' | 'offer';
  }>;
}

// Функція для очищення CDATA
const cleanCDATA = (text: string): string => {
  return text
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .trim();
};

// Функція для отримання тексту з вузла, включаючи CDATA
const getNodeText = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.CDATA_SECTION_NODE) {
    return node.textContent || '';
  }
  
  let text = '';
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    if (child.nodeType === Node.TEXT_NODE || child.nodeType === Node.CDATA_SECTION_NODE) {
      text += child.textContent || '';
    }
  }
  
  return cleanCDATA(text.trim());
};

// Функція для побудови XML-шляху
const buildXMLPath = (element: Element): string => {
  const path: string[] = [];
  let current: Element | null = element;
  
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let nodeName = current.nodeName.toLowerCase();
    
    // Додаємо атрибути для унікальності
    if (current.hasAttribute('id')) {
      nodeName += `[@id="${current.getAttribute('id')}"]`;
    } else if (current.hasAttribute('name')) {
      nodeName += `[@name="${current.getAttribute('name')}"]`;
    }
    
    path.unshift(nodeName);
    current = current.parentElement;
    
    // Зупиняємось на кореневому елементі
    if (current && (current.nodeName === 'yml_catalog' || current.nodeName === 'shop')) {
      break;
    }
  }
  
  return '/' + path.join('/');
};

// Парсинг параметрів з підтримкою багатомовності
const parseParameters = (element: Element, category: 'shop' | 'currency' | 'category' | 'offer'): Array<{
  name: string;
  value: any;
  path: string;
  type: 'parameter' | 'characteristic';
  category: 'shop' | 'currency' | 'category' | 'offer';
}> => {
  const parameters: Array<{
    name: string;
    value: any;
    path: string;
    type: 'parameter' | 'characteristic';
    category: 'shop' | 'currency' | 'category' | 'offer';
  }> = [];

  // Парсинг звичайних елементів
  const children = Array.from(element.children);
  children.forEach(child => {
    const tagName = child.tagName.toLowerCase();
    const xmlPath = buildXMLPath(child);
    
    // Пропускаємо контейнери
    if (['currencies', 'categories', 'offers', 'param'].includes(tagName)) {
      return;
    }

    let value = getNodeText(child);
    let paramName = tagName;

    // Обробка спеціальних полів
    switch (tagName) {
      case 'article':
        paramName = 'Артикул';
        break;
      case 'name_ua':
      case 'model_ua':
        paramName = 'Назва (UA)';
        break;
      case 'description_ua':
        paramName = 'Опис (UA)';
        break;
      case 'price_old':
      case 'old_price':
        paramName = 'Стара ціна';
        break;
      case 'price_promo':
      case 'promo_price':
        paramName = 'Промо-ціна';
        break;
      case 'stock_quantity':
      case 'quantity_in_stock':
        paramName = 'Кількість на складі';
        break;
      case 'currencyid':
        paramName = 'Валюта';
        break;
      case 'categoryid':
        paramName = 'ID категорії';
        break;
      case 'docket_ua':
        paramName = 'Короткий опис (UA)';
        break;
    }

    if (value) {
      parameters.push({
        name: paramName,
        value: value,
        path: xmlPath,
        type: 'parameter',
        category: category
      });
    }
  });

  // Парсинг param елементів з підтримкою багатомовності
  const paramElements = element.querySelectorAll('param');
  paramElements.forEach(paramElement => {
    const paramName = paramElement.getAttribute('name') || 'Невідомий параметр';
    const xmlPath = buildXMLPath(paramElement);
    
    // Перевіряємо наявність value елементів з мовними атрибутами
    const valueElements = paramElement.querySelectorAll('value[lang]');
    
    if (valueElements.length > 0) {
      // Багатомовний параметр
      const values: Record<string, string> = {};
      valueElements.forEach(valueElement => {
        const lang = valueElement.getAttribute('lang');
        const value = getNodeText(valueElement);
        if (lang && value) {
          values[lang] = value;
        }
      });
      
      if (Object.keys(values).length > 0) {
        parameters.push({
          name: paramName,
          value: values,
          path: xmlPath,
          type: 'characteristic',
          category: category
        });
      }
    } else {
      // Звичайний параметр
      const value = getNodeText(paramElement);
      if (value) {
        parameters.push({
          name: paramName,
          value: value,
          path: xmlPath,
          type: 'characteristic',
          category: category
        });
      }
    }
  });

  return parameters;
};

export const parseAdvancedXML = (xmlString: string): ParsedXMLStructure => {
  console.log('Парсинг XML з покращеною підтримкою полів...');
  
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  const result: ParsedXMLStructure = {
    parameters: []
  };

  // Парсинг інформації про магазин
  const shopElement = xmlDoc.querySelector('shop');
  if (shopElement) {
    const shopName = shopElement.querySelector('name');
    const shopCompany = shopElement.querySelector('company');
    const shopUrl = shopElement.querySelector('url');
    
    result.shop = {
      name: shopName ? getNodeText(shopName) : undefined,
      company: shopCompany ? getNodeText(shopCompany) : undefined,
      url: shopUrl ? getNodeText(shopUrl) : undefined
    };

    // Додаємо параметри магазину
    result.parameters.push(...parseParameters(shopElement, 'shop'));
  }

  // Парсинг валют
  const currenciesElement = xmlDoc.querySelector('currencies');
  if (currenciesElement) {
    const currencies: Array<{id: string; rate: number}> = [];
    const currencyElements = currenciesElement.querySelectorAll('currency');
    
    currencyElements.forEach(currency => {
      const id = currency.getAttribute('id');
      const rate = parseFloat(currency.getAttribute('rate') || '1');
      
      if (id) {
        currencies.push({ id, rate });
        
        // Додаємо як параметр
        result.parameters.push({
          name: `Валюта ${id}`,
          value: `${id}: ${rate}`,
          path: buildXMLPath(currency),
          type: 'parameter',
          category: 'currency'
        });
      }
    });
    
    result.currencies = currencies;
  }

  // Парсинг категорій
  const categoriesElement = xmlDoc.querySelector('categories');
  if (categoriesElement) {
    const categories: Array<{id: string; name: string; rz_id?: string}> = [];
    const categoryElements = categoriesElement.querySelectorAll('category');
    
    categoryElements.forEach(category => {
      const id = category.getAttribute('id');
      const name = getNodeText(category);
      const rz_id = category.getAttribute('rz_id');
      
      if (id && name) {
        const categoryObj = { id, name, rz_id: rz_id || undefined };
        categories.push(categoryObj);
        
        // Додаємо як параметр
        result.parameters.push({
          name: `Категорія ${name}`,
          value: `ID: ${id}${rz_id ? `, RZ_ID: ${rz_id}` : ''}`,
          path: buildXMLPath(category),
          type: 'parameter',
          category: 'category'
        });
      }
    });
    
    result.categories = categories;
  }

  // Парсинг товарів
  const offersElement = xmlDoc.querySelector('offers');
  if (offersElement) {
    const offers: Array<{id: string; available?: boolean; [key: string]: any}> = [];
    const offerElements = offersElement.querySelectorAll('offer');
    
    console.log(`Знайдено ${offerElements.length} товарів`);
    
    offerElements.forEach((offer, index) => {
      const id = offer.getAttribute('id');
      const available = offer.getAttribute('available') !== 'false';
      
      if (id) {
        const offerObj: {id: string; available?: boolean; [key: string]: any} = { id, available };
        
        // Парсинг всіх елементів товару
        Array.from(offer.children).forEach(child => {
          const tagName = child.tagName.toLowerCase();
          let value: any = getNodeText(child);
          
          // Спеціальна обробка для числових полів
          if (['price', 'price_old', 'old_price', 'price_promo', 'promo_price', 'stock_quantity', 'quantity_in_stock'].includes(tagName)) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              value = numValue;
            }
          }
          
          offerObj[tagName] = value;
        });
        
        offers.push(offerObj);
        
        // Додаємо параметри тільки для першого товару як приклад
        if (index === 0) {
          result.parameters.push(...parseParameters(offer, 'offer'));
        }
      }
    });
    
    result.offers = offers;
    console.log(`Парсинг завершено. Знайдено ${offers.length} товарів`);
  }

  console.log('Загальна кількість параметрів:', result.parameters.length);
  console.log('Параметри по категоріях:', {
    shop: result.parameters.filter(p => p.category === 'shop').length,
    currency: result.parameters.filter(p => p.category === 'currency').length,
    category: result.parameters.filter(p => p.category === 'category').length,
    offer: result.parameters.filter(p => p.category === 'offer').length
  });

  return result;
};
