
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
    return cleanCDATA(node.textContent || '');
  }
  
  let text = '';
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    if (child.nodeType === Node.TEXT_NODE || child.nodeType === Node.CDATA_SECTION_NODE) {
      text += cleanCDATA(child.textContent || '');
    }
  }
  
  return text.trim();
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

// Парсинг параметрів з повною підтримкою всіх полів
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

  // Список всіх можливих елементів для парсингу
  const allPossibleFields = [
    'name', 'company', 'url', 'price', 'price_old', 'old_price', 'price_promo', 'promo_price',
    'currencyid', 'categoryid', 'picture', 'vendor', 'article', 'model', 'name_ua', 'model_ua',
    'description', 'description_ua', 'state', 'docket', 'docket_ua', 'stock_quantity', 
    'quantity_in_stock', 'available', 'id'
  ];

  // Парсинг всіх дочірніх елементів
  Array.from(element.children).forEach(child => {
    const tagName = child.tagName.toLowerCase();
    const xmlPath = buildXMLPath(child);
    
    // Пропускаємо контейнери
    if (['currencies', 'categories', 'offers', 'param'].includes(tagName)) {
      return;
    }

    let value = getNodeText(child);
    let paramName = tagName;

    // Перетворення назв полів на зрозумілі українські назви
    const fieldMapping: {[key: string]: string} = {
      'name': 'Назва',
      'company': 'Компанія',
      'url': 'URL',
      'price': 'Ціна',
      'price_old': 'Стара ціна',
      'old_price': 'Стара ціна',
      'price_promo': 'Промо-ціна',
      'promo_price': 'Промо-ціна',
      'currencyid': 'Валюта',
      'categoryid': 'ID категорії',
      'picture': 'Зображення',
      'vendor': 'Виробник',
      'article': 'Артикул',
      'model': 'Модель',
      'name_ua': 'Назва (UA)',
      'model_ua': 'Модель (UA)',
      'description': 'Опис',
      'description_ua': 'Опис (UA)',
      'state': 'Стан товару',
      'docket': 'Короткий опис',
      'docket_ua': 'Короткий опис (UA)',
      'stock_quantity': 'Кількість на складі',
      'quantity_in_stock': 'Залишки',
      'available': 'Наявність',
      'id': 'Ідентифікатор'
    };

    paramName = fieldMapping[tagName] || tagName;

    if (value && value.trim() !== '') {
      parameters.push({
        name: paramName,
        value: value,
        path: xmlPath,
        type: 'parameter',
        category: category
      });
      
      console.log(`Знайдено параметр: ${paramName} = ${value}`);
    }
  });

  // Парсинг param елементів з підтримкою багатомовності
  const paramElements = element.querySelectorAll('param');
  console.log(`Знайдено ${paramElements.length} param елементів в категорії ${category}`);
  
  paramElements.forEach((paramElement, index) => {
    const paramName = paramElement.getAttribute('name') || `Параметр ${index + 1}`;
    const xmlPath = buildXMLPath(paramElement);
    
    console.log(`Обробка param: ${paramName}`);
    
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
          console.log(`  Мова ${lang}: ${value}`);
        }
      });
      
      if (Object.keys(values).length > 0) {
        // Додаємо кожну мову як окремий параметр
        Object.entries(values).forEach(([lang, value]) => {
          parameters.push({
            name: `${paramName} (${lang.toUpperCase()})`,
            value: value,
            path: `${xmlPath}/value[@lang="${lang}"]`,
            type: 'characteristic',
            category: category
          });
        });
      }
    } else {
      // Звичайний параметр
      const value = getNodeText(paramElement);
      if (value && value.trim() !== '') {
        parameters.push({
          name: paramName,
          value: value,
          path: xmlPath,
          type: 'characteristic',
          category: category
        });
        
        console.log(`  Значення: ${value}`);
      }
    }
  });

  return parameters;
};

export const parseAdvancedXML = (xmlString: string): ParsedXMLStructure => {
  console.log('=== РОЗПОЧИНАЄМО ПАРСИНГ XML ===');
  
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  // Перевіряємо на помилки парсингу
  const parseErrors = xmlDoc.getElementsByTagName('parsererror');
  if (parseErrors.length > 0) {
    console.error('Помилка парсингу XML:', parseErrors[0].textContent);
    throw new Error('Невірний формат XML файлу');
  }
  
  const result: ParsedXMLStructure = {
    parameters: []
  };

  // Парсинг інформації про магазин
  const shopElement = xmlDoc.querySelector('shop');
  if (shopElement) {
    console.log('=== ПАРСИНГ МАГАЗИНУ ===');
    
    const shopName = shopElement.querySelector('name');
    const shopCompany = shopElement.querySelector('company');
    const shopUrl = shopElement.querySelector('url');
    
    result.shop = {
      name: shopName ? getNodeText(shopName) : undefined,
      company: shopCompany ? getNodeText(shopCompany) : undefined,
      url: shopUrl ? getNodeText(shopUrl) : undefined
    };

    console.log('Магазин:', result.shop);
    
    // Додаємо параметри магазину
    result.parameters.push(...parseParameters(shopElement, 'shop'));
  }

  // Парсинг валют
  const currenciesElement = xmlDoc.querySelector('currencies');
  if (currenciesElement) {
    console.log('=== ПАРСИНГ ВАЛЮТ ===');
    
    const currencies: Array<{id: string; rate: number}> = [];
    const currencyElements = currenciesElement.querySelectorAll('currency');
    
    console.log(`Знайдено ${currencyElements.length} валют`);
    
    currencyElements.forEach((currency, index) => {
      const id = currency.getAttribute('id');
      const rateStr = currency.getAttribute('rate');
      const rate = parseFloat(rateStr || '1');
      
      console.log(`Валюта ${index + 1}: ${id} = ${rate}`);
      
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
    console.log(`Загалом валют: ${currencies.length}`);
  }

  // Парсинг категорій
  const categoriesElement = xmlDoc.querySelector('categories');
  if (categoriesElement) {
    console.log('=== ПАРСИНГ КАТЕГОРІЙ ===');
    
    const categories: Array<{id: string; name: string; rz_id?: string}> = [];
    const categoryElements = categoriesElement.querySelectorAll('category');
    
    console.log(`Знайдено ${categoryElements.length} категорій`);
    
    categoryElements.forEach((category, index) => {
      const id = category.getAttribute('id');
      const name = getNodeText(category);
      const rz_id = category.getAttribute('rz_id');
      
      console.log(`Категорія ${index + 1}: ${name} (ID: ${id}${rz_id ? `, RZ_ID: ${rz_id}` : ''})`);
      
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
    console.log(`Загалом категорій: ${categories.length}`);
  }

  // Парсинг товарів
  const offersElement = xmlDoc.querySelector('offers');
  if (offersElement) {
    console.log('=== ПАРСИНГ ТОВАРІВ ===');
    
    const offers: Array<{id: string; available?: boolean; [key: string]: any}> = [];
    const offerElements = offersElement.querySelectorAll('offer');
    
    console.log(`Знайдено ${offerElements.length} товарів`);
    
    offerElements.forEach((offer, index) => {
      const id = offer.getAttribute('id');
      const availableAttr = offer.getAttribute('available');
      const available = availableAttr !== 'false';
      
      console.log(`\n--- Товар ${index + 1} (ID: ${id}) ---`);
      
      if (id) {
        const offerObj: {id: string; available?: boolean; [key: string]: any} = { id, available };
        
        // Парсинг всіх елементів товару
        Array.from(offer.children).forEach(child => {
          const tagName = child.tagName.toLowerCase();
          let value: any = getNodeText(child);
          
          console.log(`  ${tagName}: ${value}`);
          
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
        
        // Додаємо параметри для КОЖНОГО товару (не тільки першого!)
        console.log(`Парсинг параметрів товару ${index + 1}:`);
        const offerParams = parseParameters(offer, 'offer');
        console.log(`Знайдено ${offerParams.length} параметрів для товару ${index + 1}`);
        result.parameters.push(...offerParams);
      }
    });
    
    result.offers = offers;
    console.log(`\nЗагалом товарів: ${offers.length}`);
  }

  console.log('\n=== ПІДСУМОК ПАРСИНГУ ===');
  console.log('Загальна кількість параметрів:', result.parameters.length);
  console.log('Параметри по категоріях:', {
    shop: result.parameters.filter(p => p.category === 'shop').length,
    currency: result.parameters.filter(p => p.category === 'currency').length,
    category: result.parameters.filter(p => p.category === 'category').length,
    offer: result.parameters.filter(p => p.category === 'offer').length
  });
  
  // Виводимо всі знайдені параметри для налагодження
  console.log('\n=== ВСІ ЗНАЙДЕНІ ПАРАМЕТРИ ===');
  result.parameters.forEach((param, index) => {
    console.log(`${index + 1}. [${param.category}] ${param.name}: ${typeof param.value === 'object' ? JSON.stringify(param.value) : param.value}`);
  });

  return result;
};
