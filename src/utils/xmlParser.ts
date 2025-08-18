
// Повноцінний XML-парсер для YML-файлів з підтримкою всіх полів згідно специфікації
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
    multilingual_values?: Record<string, string>;
    cdata_content?: string;
    attributes?: Record<string, string>;
  }>;
}

// Структура для відображення в модальному вікні
export interface ParsedTreeStructure {
  type: 'shop' | 'currencies' | 'categories' | 'offers';
  name: string;
  icon: string;
  children: ParsedTreeNode[];
}

export interface ParsedTreeNode {
  type: string;
  name: string;
  value?: string;
  icon: string;
  attributes?: Record<string, string>;
  cdata?: boolean;
  multilingual?: Record<string, string>;
  children?: ParsedTreeNode[];
}

// Очищення CDATA секцій
const cleanCDATA = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/<!\[CDATA\[/g, '')
    .replace(/\]\]>/g, '')
    .trim();
};

// Отримання тексту з елементу включаючи CDATA
const getElementText = (element: Element): string => {
  if (!element) return '';
  
  const cdataNodes = Array.from(element.childNodes).filter(
    node => node.nodeType === Node.CDATA_SECTION_NODE
  );
  
  if (cdataNodes.length > 0) {
    return cdataNodes.map(node => cleanCDATA(node.textContent || '')).join('');
  }
  
  return element.textContent?.trim() || '';
};

// Побудова XML шляху
const buildXMLPath = (element: Element): string => {
  const path: string[] = [];
  let current: Element | null = element;
  
  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let nodeName = current.nodeName.toLowerCase();
    
    if (current.hasAttribute('id')) {
      nodeName += `[@id="${current.getAttribute('id')}"]`;
    } else if (current.hasAttribute('name')) {
      nodeName += `[@name="${current.getAttribute('name')}"]`;
    } else if (current.hasAttribute('lang')) {
      nodeName += `[@lang="${current.getAttribute('lang')}"]`;
    }
    
    path.unshift(nodeName);
    current = current.parentElement;
    
    if (current && (current.nodeName === 'yml_catalog' || current.nodeName === 'shop')) {
      break;
    }
  }
  
  return '/' + path.join('/');
};

// Отримання всіх атрибутів елемента
const getElementAttributes = (element: Element): Record<string, string> => {
  const attributes: Record<string, string> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attributes[attr.name] = attr.value;
  }
  return attributes;
};

// Перевірка чи містить елемент CDATA
const hasCDATA = (element: Element): boolean => {
  return Array.from(element.childNodes).some(
    node => node.nodeType === Node.CDATA_SECTION_NODE
  );
};

// Парсинг багатомовних параметрів
const parseMultilingualParam = (paramElement: Element): {
  name: string;
  multilingual_values: Record<string, string>;
  path: string;
} => {
  const paramName = paramElement.getAttribute('name') || 'Невідомий параметр';
  const path = buildXMLPath(paramElement);
  const multilingual_values: Record<string, string> = {};
  
  const valueElements = paramElement.querySelectorAll('value[lang]');
  valueElements.forEach(valueElement => {
    const lang = valueElement.getAttribute('lang');
    const value = getElementText(valueElement);
    if (lang && value) {
      multilingual_values[lang] = value;
    }
  });
  
  return { name: paramName, multilingual_values, path };
};

// Створення структури дерева для відображення
const createTreeStructure = (xmlDoc: Document): ParsedTreeStructure[] => {
  const result: ParsedTreeStructure[] = [];

  // 1. SHOP
  const shopElement = xmlDoc.querySelector('shop');
  if (shopElement) {
    const shopChildren: ParsedTreeNode[] = [];
    
    const shopName = shopElement.querySelector('name');
    const shopCompany = shopElement.querySelector('company');
    const shopUrl = shopElement.querySelector('url');
    
    if (shopName) {
      shopChildren.push({
        type: 'name',
        name: 'name',
        value: getElementText(shopName),
        icon: '🏪'
      });
    }
    
    if (shopCompany) {
      shopChildren.push({
        type: 'company',
        name: 'company',
        value: getElementText(shopCompany),
        icon: '🏢'
      });
    }
    
    if (shopUrl) {
      shopChildren.push({
        type: 'url',
        name: 'url',
        value: getElementText(shopUrl),
        icon: '🌐'
      });
    }

    result.push({
      type: 'shop',
      name: 'shop',
      icon: '🛍️',
      children: shopChildren
    });
  }

  // 2. CURRENCIES
  const currenciesElement = xmlDoc.querySelector('currencies');
  if (currenciesElement) {
    const currencyChildren: ParsedTreeNode[] = [];
    const currencyElements = currenciesElement.querySelectorAll('currency');
    
    currencyElements.forEach(currency => {
      const id = currency.getAttribute('id');
      const rate = currency.getAttribute('rate');
      
      if (id) {
        currencyChildren.push({
          type: 'currency',
          name: 'currency',
          value: `(id="${id}", rate="${rate}")`,
          icon: id === 'UAH' ? '💰' : id === 'USD' ? '💵' : '💶',
          attributes: { id, rate: rate || '1' }
        });
      }
    });

    if (currencyChildren.length > 0) {
      result.push({
        type: 'currencies',
        name: 'currencies',
        icon: '💱',
        children: currencyChildren
      });
    }
  }

  // 3. CATEGORIES
  const categoriesElement = xmlDoc.querySelector('categories');
  if (categoriesElement) {
    const categoryChildren: ParsedTreeNode[] = [];
    const categoryElements = categoriesElement.querySelectorAll('category');
    
    categoryElements.forEach(category => {
      const id = category.getAttribute('id');
      const name = getElementText(category);
      const rz_id = category.getAttribute('rz_id');
      
      if (id && name) {
        const attributes: Record<string, string> = { id };
        if (rz_id) attributes.rz_id = rz_id;
        
        categoryChildren.push({
          type: 'category',
          name: 'category',
          value: `(id="${id}")${rz_id ? `, rz_id="${rz_id}"` : ''}: "${name}"`,
          icon: '📁',
          attributes
        });
      }
    });

    if (categoryChildren.length > 0) {
      result.push({
        type: 'categories',
        name: 'categories',
        icon: '📂',
        children: categoryChildren
      });
    }
  }

  // 4. OFFERS
  const offersElement = xmlDoc.querySelector('offers');
  if (offersElement) {
    const offerChildren: ParsedTreeNode[] = [];
    const offerElements = offersElement.querySelectorAll('offer');
    
    // Обробляємо тільки перший оффер для демонстрації
    const firstOffer = offerElements[0];
    if (firstOffer) {
      const id = firstOffer.getAttribute('id');
      const available = firstOffer.getAttribute('available');
      
      const offerNode: ParsedTreeNode = {
        type: 'offer',
        name: 'offer',
        value: `(id="${id}", available="${available}")`,
        icon: '📦',
        attributes: { id: id || '', available: available || 'true' },
        children: []
      };

      // Основні поля оффера
      const offerFields = [
        { tag: 'price', icon: '💲' },
        { tag: 'price_old', icon: '💲' },
        { tag: 'old_price', icon: '💲' },
        { tag: 'price_promo', icon: '💲' },
        { tag: 'promo_price', icon: '💲' },
        { tag: 'currencyid', icon: '💱' },
        { tag: 'categoryid', icon: '🗂️' },
        { tag: 'vendor', icon: '🏷️' },
        { tag: 'article', icon: '🔖' },
        { tag: 'stock_quantity', icon: '📦' },
        { tag: 'quantity_in_stock', icon: '📦' },
        { tag: 'url', icon: '🔗' },
        { tag: 'name', icon: '🏷️' },
        { tag: 'model', icon: '🏷️' },
        { tag: 'name_ua', icon: '🏷️' },
        { tag: 'model_ua', icon: '🏷️' },
        { tag: 'description', icon: '📝' },
        { tag: 'description_ua', icon: '📝' },
        { tag: 'state', icon: '📊' },
        { tag: 'docket', icon: '📋' },
        { tag: 'docket_ua', icon: '📋' }
      ];

      offerFields.forEach(field => {
        const element = firstOffer.querySelector(field.tag);
        if (element) {
          const value = getElementText(element);
          const isCDATA = hasCDATA(element);
          
          offerNode.children!.push({
            type: field.tag,
            name: field.tag,
            value: isCDATA ? '<![CDATA[...]]>' + (field.tag.includes('_ua') ? ' (UA HTML)' : ' (RU HTML)') : value,
            icon: field.icon,
            cdata: isCDATA
          });
        }
      });

      // Картинки
      const pictureElements = firstOffer.querySelectorAll('picture');
      pictureElements.forEach(picture => {
        const imageUrl = getElementText(picture);
        if (imageUrl) {
          offerNode.children!.push({
            type: 'picture',
            name: 'picture',
            value: imageUrl,
            icon: '🖼️'
          });
        }
      });

      // Параметри (характеристики)
      const paramElements = firstOffer.querySelectorAll('param');
      paramElements.forEach(paramElement => {
        const paramName = paramElement.getAttribute('name') || 'Невідомий параметр';
        const paramid = paramElement.getAttribute('paramid');
        const valueid = paramElement.getAttribute('valueid');
        
        // Перевіряємо багатомовні значення
        const valueElements = paramElement.querySelectorAll('value[lang]');
        
        if (valueElements.length > 0) {
          // Багатомовний параметр
          const paramNode: ParsedTreeNode = {
            type: 'param',
            name: 'param',
            value: `(name="${paramName}")`,
            icon: getParamIcon(paramName),
            children: []
          };

          const multilingual: Record<string, string> = {};
          valueElements.forEach(valueElement => {
            const lang = valueElement.getAttribute('lang');
            const value = getElementText(valueElement);
            if (lang && value) {
              multilingual[lang] = value;
              paramNode.children!.push({
                type: 'value',
                name: 'value',
                value: `(lang="${lang}"): "${value}"`,
                icon: lang === 'uk' ? '🇺🇦' : '🇷🇺'
              });
            }
          });

          paramNode.multilingual = multilingual;
          offerNode.children!.push(paramNode);
        } else {
          // Звичайний параметр
          const value = getElementText(paramElement);
          const attributes: Record<string, string> = { name: paramName };
          if (paramid) attributes.paramid = paramid;
          if (valueid) attributes.valueid = valueid;
          
          offerNode.children!.push({
            type: 'param',
            name: 'param',
            value: `(name="${paramName}"): "${value}"`,
            icon: getParamIcon(paramName),
            attributes
          });
        }
      });

      offerChildren.push(offerNode);
    }

    if (offerChildren.length > 0) {
      result.push({
        type: 'offers',
        name: 'offers',
        icon: '🎁',
        children: offerChildren
      });
    }
  }

  return result;
};

// Отримати іконку для параметра
const getParamIcon = (paramName: string): string => {
  const name = paramName.toLowerCase();
  if (name.includes('зріст') || name.includes('розмір')) return '📏';
  if (name.includes('сезон')) return '🍂';
  if (name.includes('колір')) return '🎨';
  if (name.includes('модел') || name.includes('особлив')) return '👕';
  if (name.includes('склад') || name.includes('матеріал')) return '🧵';
  if (name.includes('догляд') || name.includes('прання')) return '🧺';
  if (name.includes('країна') || name.includes('виробник')) return '🌍';
  return '📋';
};

export const parseAdvancedXML = (xmlString: string): ParsedXMLStructure => {
  console.log('=== ПОЧАТОК ПАРСИНГУ XML ===');
  
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  // Перевірка помилок парсингу
  const parseErrors = xmlDoc.getElementsByTagName('parsererror');
  if (parseErrors.length > 0) {
    console.error('Помилка парсингу XML:', parseErrors[0].textContent);
    throw new Error('Невірний формат XML файлу');
  }
  
  const result: ParsedXMLStructure = {
    parameters: []
  };

  // 1. ПАРСИНГ МАГАЗИНУ
  const shopElement = xmlDoc.querySelector('shop');
  if (shopElement) {
    console.log('=== ПАРСИНГ ІНФОРМАЦІЇ ПРО МАГАЗИН ===');
    
    const shopName = shopElement.querySelector('name');
    const shopCompany = shopElement.querySelector('company');
    const shopUrl = shopElement.querySelector('url');
    
    result.shop = {
      name: shopName ? getElementText(shopName) : undefined,
      company: shopCompany ? getElementText(shopCompany) : undefined,
      url: shopUrl ? getElementText(shopUrl) : undefined
    };

    console.log('Інформація про магазин:', result.shop);

    // Додаємо як параметри
    if (result.shop.name) {
      result.parameters.push({
        name: 'Назва магазину',
        value: result.shop.name,
        path: '/shop/name',
        type: 'parameter',
        category: 'shop'
      });
    }
    if (result.shop.company) {
      result.parameters.push({
        name: 'Компанія',
        value: result.shop.company,
        path: '/shop/company',
        type: 'parameter',
        category: 'shop'
      });
    }
    if (result.shop.url) {
      result.parameters.push({
        name: 'URL магазину',
        value: result.shop.url,
        path: '/shop/url',
        type: 'parameter',
        category: 'shop'
      });
    }
  }

  // 2. ПАРСИНГ ВАЛЮТ
  const currenciesElement = xmlDoc.querySelector('currencies');
  if (currenciesElement) {
    console.log('=== ПАРСИНГ ВАЛЮТ ===');
    
    const currencies: Array<{id: string; rate: number}> = [];
    const currencyElements = currenciesElement.querySelectorAll('currency');
    
    console.log(`Знайдено валют: ${currencyElements.length}`);
    
    currencyElements.forEach((currency, index) => {
      const id = currency.getAttribute('id');
      const rateStr = currency.getAttribute('rate');
      const rate = parseFloat(rateStr || '1');
      
      console.log(`Валюта ${index + 1}: ${id} = ${rate}`);
      
      if (id) {
        currencies.push({ id, rate });
        
        result.parameters.push({
          name: `Валюта ${id}`,
          value: rate.toString(),
          path: buildXMLPath(currency),
          type: 'parameter',
          category: 'currency',
          attributes: getElementAttributes(currency)
        });
      }
    });
    
    result.currencies = currencies;
    console.log(`Всього валют оброблено: ${currencies.length}`);
  }

  // 3. ПАРСИНГ КАТЕГОРІЙ
  const categoriesElement = xmlDoc.querySelector('categories');
  if (categoriesElement) {
    console.log('=== ПАРСИНГ КАТЕГОРІЙ ===');
    
    const categories: Array<{id: string; name: string; rz_id?: string}> = [];
    const categoryElements = categoriesElement.querySelectorAll('category');
    
    console.log(`Знайдено категорій: ${categoryElements.length}`);
    
    categoryElements.forEach((category, index) => {
      const id = category.getAttribute('id');
      const name = getElementText(category);
      const rz_id = category.getAttribute('rz_id');
      
      console.log(`Категорія ${index + 1}: "${name}" (ID: ${id}${rz_id ? `, RZ_ID: ${rz_id}` : ''})`);
      
      if (id && name) {
        const categoryObj = { id, name, rz_id: rz_id || undefined };
        categories.push(categoryObj);
        
        result.parameters.push({
          name: `Категорія: ${name}`,
          value: name,
          path: buildXMLPath(category),
          type: 'parameter',
          category: 'category',
          attributes: getElementAttributes(category)
        });
      }
    });
    
    result.categories = categories;
    console.log(`Всього категорій оброблено: ${categories.length}`);
  }

  // 4. ПАРСИНГ ТОВАРІВ (НАЙВАЖЛИВІША ЧАСТИНА)
  const offersElement = xmlDoc.querySelector('offers');
  if (offersElement) {
    console.log('=== ПАРСИНГ ТОВАРІВ ===');
    
    const offers: Array<{id: string; available?: boolean; [key: string]: any}> = [];
    const offerElements = offersElement.querySelectorAll('offer');
    
    console.log(`Знайдено товарів: ${offerElements.length}`);
    
    offerElements.forEach((offer, offerIndex) => {
      const id = offer.getAttribute('id');
      const availableAttr = offer.getAttribute('available');
      const available = availableAttr !== 'false';
      
      console.log(`\n--- ТОВАР ${offerIndex + 1} (ID: ${id}) ---`);
      
      if (!id) return;
      
      const offerObj: {id: string; available?: boolean; [key: string]: any} = { id, available };
      
      // Парсинг всіх основних полів товару згідно специфікації YML
      const offerFields = [
        'url', 'price', 'price_old', 'old_price', 'price_promo', 'promo_price',
        'currencyid', 'categoryid', 'picture', 'vendor', 'article', 
        'name', 'model', 'name_ua', 'model_ua', 
        'description', 'description_ua', 'state', 'docket', 'docket_ua',
        'stock_quantity', 'quantity_in_stock'
      ];
      
      offerFields.forEach(fieldName => {
        const fieldElement = offer.querySelector(fieldName);
        if (fieldElement) {
          let value = getElementText(fieldElement);
          let displayName = fieldName;
          
          // Зіставлення назв полів згідно специфікації
          const fieldMapping: {[key: string]: string} = {
            'url': 'URL товару',
            'price': 'Ціна',
            'price_old': 'Стара ціна', 
            'old_price': 'Стара ціна',
            'price_promo': 'Промо-ціна',
            'promo_price': 'Промо-ціна',
            'currencyid': 'Валюта',
            'categoryid': 'ID категорії',
            'picture': 'Зображення',
            'vendor': 'Виробник/Бренд',
            'article': 'Артикул',
            'name': 'Назва товару',
            'model': 'Модель',
            'name_ua': 'Назва товару (UA)',
            'model_ua': 'Модель (UA)',
            'description': 'Опис товару',
            'description_ua': 'Опис товару (UA)',
            'state': 'Стан товару',
            'docket': 'Короткий опис',
            'docket_ua': 'Короткий опис (UA)',
            'stock_quantity': 'Кількість на складі',
            'quantity_in_stock': 'Залишки товару'
          };
          
          displayName = fieldMapping[fieldName] || fieldName;
          
          // Спеціальна обробка для числових полів
          if (['price', 'price_old', 'old_price', 'price_promo', 'promo_price', 'stock_quantity', 'quantity_in_stock'].includes(fieldName)) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              offerObj[fieldName] = numValue;
            }
          } else {
            offerObj[fieldName] = value;
          }
          
          console.log(`  ${displayName}: ${value}`);
          
          // Перевірка на CDATA контент
          const cdataContent = hasCDATA(fieldElement) ? getElementText(fieldElement) : undefined;
          
          result.parameters.push({
            name: displayName,
            value: value,
            path: `${buildXMLPath(offer)}/${fieldName}`,
            type: 'parameter',
            category: 'offer',
            cdata_content: cdataContent
          });
        }
      });

      // Парсинг всіх зображень (до 15 згідно специфікації)
      const pictureElements = offer.querySelectorAll('picture');
      console.log(`  Знайдено зображень: ${pictureElements.length}`);
      pictureElements.forEach((picture, pictureIndex) => {
        const imageUrl = getElementText(picture);
        if (imageUrl) {
          result.parameters.push({
            name: `Зображення ${pictureIndex + 1}`,
            value: imageUrl,
            path: `${buildXMLPath(offer)}/picture[${pictureIndex + 1}]`,
            type: 'parameter',
            category: 'offer'
          });
        }
      });

      // Парсинг характеристик (param елементів) згідно специфікації
      const paramElements = offer.querySelectorAll('param');
      console.log(`  Знайдено характеристик: ${paramElements.length}`);
      
      paramElements.forEach((paramElement, paramIndex) => {
        const paramName = paramElement.getAttribute('name') || `Характеристика ${paramIndex + 1}`;
        const paramid = paramElement.getAttribute('paramid');
        const valueid = paramElement.getAttribute('valueid');
        
        // Перевіряємо багатомовні значення (value lang)
        const valueElements = paramElement.querySelectorAll('value[lang]');
        
        if (valueElements.length > 0) {
          // Багатомовний параметр згідно специфікації
          const multilingual = parseMultilingualParam(paramElement);
          console.log(`    Багатомовна характеристика "${paramName}":`, multilingual.multilingual_values);
          
          result.parameters.push({
            name: paramName,
            value: Object.values(multilingual.multilingual_values).join(' / '),
            path: multilingual.path,
            type: 'characteristic',
            category: 'offer',
            multilingual_values: multilingual.multilingual_values,
            attributes: {
              name: paramName,
              ...(paramid && { paramid }),
              ...(valueid && { valueid })
            }
          });
        } else {
          // Звичайний параметр
          const value = getElementText(paramElement);
          const isCDATA = hasCDATA(paramElement);
          
          if (value) {
            console.log(`    Характеристика "${paramName}": ${value}${isCDATA ? ' (CDATA)' : ''}`);
            
            result.parameters.push({
              name: paramName,
              value: value,
              path: buildXMLPath(paramElement),
              type: 'characteristic',
              category: 'offer',
              cdata_content: isCDATA ? value : undefined,
              attributes: {
                name: paramName,
                ...(paramid && { paramid }),
                ...(valueid && { valueid })
              }
            });
          }
        }
      });
      
      offers.push(offerObj);
    });
    
    result.offers = offers;
    console.log(`\nВсього товарів оброблено: ${offers.length}`);
  }

  console.log('\n=== ПІДСУМОК ПАРСИНГУ ===');
  console.log(`Загальна кількість параметрів: ${result.parameters.length}`);
  console.log('Розподіл по категоріях:', {
    shop: result.parameters.filter(p => p.category === 'shop').length,
    currency: result.parameters.filter(p => p.category === 'currency').length,
    category: result.parameters.filter(p => p.category === 'category').length,
    offer: result.parameters.filter(p => p.category === 'offer').length
  });
  
  console.log('Типи параметрів:', {
    parameters: result.parameters.filter(p => p.type === 'parameter').length,
    characteristics: result.parameters.filter(p => p.type === 'characteristic').length
  });

  return result;
};

// Функція для створення структури дерeva (експорт для використання в компонентах)
export const createXMLTreeStructure = (xmlString: string): ParsedTreeStructure[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  const parseErrors = xmlDoc.getElementsByTagName('parsererror');
  if (parseErrors.length > 0) {
    throw new Error('Невірний формат XML файлу');
  }
  
  return createTreeStructure(xmlDoc);
};
