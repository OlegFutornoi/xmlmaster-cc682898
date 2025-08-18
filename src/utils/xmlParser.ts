
// Повноцінний XML-парсер для YML-файлів згідно специфікації Rozetka
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

export interface ParsedTreeStructure {
  type: 'shop' | 'currencies' | 'categories' | 'offers';
  name: string;
  icon: string;
  children: ParsedTreeNode[];
}

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
    parameter_name: string;
    parameter_value: any;
    xml_path: string;
    parameter_type: string;
    parameter_category: string;
    multilingual_values?: Record<string, string>;
    cdata_content?: string;
    element_attributes?: Record<string, string>;
    param_id?: string;
    value_id?: string;
    is_active: boolean;
    is_required: boolean;
    display_order: number;
  }>;
  structure: any;
}

// Очищення CDATA секцій
const cleanCDATA = (text: string): string => {
  if (!text) return '';
  return text.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '').trim();
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

// Перевірка чи містить елемент CDATA
const hasCDATA = (element: Element): boolean => {
  return Array.from(element.childNodes).some(
    node => node.nodeType === Node.CDATA_SECTION_NODE
  );
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

// Створення структури дерева для відображення
export const createXMLTreeStructure = (xmlString: string): ParsedTreeStructure[] => {
  console.log('=== СТВОРЕННЯ СТРУКТУРИ ДЕРЕВА ===');
  
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  const parseErrors = xmlDoc.getElementsByTagName('parsererror');
  if (parseErrors.length > 0) {
    console.error('Помилка парсингу XML:', parseErrors[0].textContent);
    throw new Error('Невірний формат XML файлу');
  }
  
  const result: ParsedTreeStructure[] = [];

  // ПАРСИНГ SHOP
  const shopElement = xmlDoc.querySelector('shop');
  if (shopElement) {
    const shopChildren: ParsedTreeNode[] = [];
    
    // Основна інформація про магазин
    const shopName = shopElement.querySelector('name');
    const shopCompany = shopElement.querySelector('company');
    const shopUrl = shopElement.querySelector('url');
    
    if (shopName) {
      const nameValue = getElementText(shopName);
      shopChildren.push({
        type: 'name',
        name: 'name',
        value: `"${nameValue}"`,
        icon: '🏪'
      });
    }
    
    if (shopCompany) {
      const companyValue = getElementText(shopCompany);
      shopChildren.push({
        type: 'company',
        name: 'company',
        value: `"${companyValue}"`,
        icon: '🏢'
      });
    }
    
    if (shopUrl) {
      const urlValue = getElementText(shopUrl);
      shopChildren.push({
        type: 'url',
        name: 'url',
        value: `"${urlValue}"`,
        icon: '🌐'
      });
    }

    // ПАРСИНГ ВАЛЮТ
    const currenciesElement = shopElement.querySelector('currencies');
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
        shopChildren.push({
          type: 'currencies',
          name: 'currencies',
          icon: '💱',
          children: currencyChildren
        });
      }
    }

    // ПАРСИНГ КАТЕГОРІЙ
    const categoriesElement = shopElement.querySelector('categories');
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
        shopChildren.push({
          type: 'categories',
          name: 'categories',
          icon: '📂',
          children: categoryChildren
        });
      }
    }

    // ПАРСИНГ ТОВАРІВ
    const offersElement = shopElement.querySelector('offers');
    if (offersElement) {
      const offerChildren: ParsedTreeNode[] = [];
      const offerElements = offersElement.querySelectorAll('offer');
      
      // Показуємо тільки перший товар для демонстрації
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

        // Основні поля товару
        const offerFields = [
          { tag: 'price', icon: '💲' },
          { tag: 'currencyId', icon: '💱' },
          { tag: 'categoryId', icon: '🗂️' },
          { tag: 'picture', icon: '🖼️' },
          { tag: 'vendor', icon: '🏷️' },
          { tag: 'article', icon: '🔖' },
          { tag: 'stock_quantity', icon: '📦' },
          { tag: 'quantity_in_stock', icon: '📦' },
          { tag: 'name', icon: '🏷️' },
          { tag: 'model', icon: '🏷️' },
          { tag: 'name_ua', icon: '🏷️' },
          { tag: 'model_ua', icon: '🏷️' },
          { tag: 'description', icon: '📝' },
          { tag: 'description_ua', icon: '📝' },
          { tag: 'state', icon: '📊' },
          { tag: 'docket', icon: '📋' },
          { tag: 'docket_ua', icon: '📋' },
          { tag: 'price_old', icon: '💲' },
          { tag: 'old_price', icon: '💲' },
          { tag: 'price_promo', icon: '💲' },
          { tag: 'promo_price', icon: '💲' },
          { tag: 'url', icon: '🌐' }
        ];

        // Обробка всіх picture елементів
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

        // Обробка інших полів
        offerFields.forEach(field => {
          if (field.tag === 'picture') return; // Вже оброблено вище
          
          const element = firstOffer.querySelector(field.tag);
          if (element) {
            const value = getElementText(element);
            const isCDATA = hasCDATA(element);
            
            let displayValue = value;
            if (isCDATA) {
              displayValue = `<![CDATA[...]]>${field.tag.includes('_ua') ? ' (UA HTML)' : field.tag.includes('description') ? ' (RU HTML)' : ''}`;
            }
            
            offerNode.children!.push({
              type: field.tag,
              name: field.tag,
              value: displayValue,
              icon: field.icon,
              cdata: isCDATA
            });
          }
        });

        // ПАРСИНГ ПАРАМЕТРІВ (ХАРАКТЕРИСТИК)
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
        shopChildren.push({
          type: 'offers',
          name: 'offers',
          icon: '🎁',
          children: offerChildren
        });
      }
    }

    result.push({
      type: 'shop',
      name: 'shop',
      icon: '🛍️',
      children: shopChildren
    });
  }

  console.log('Структура дерева створена:', result);
  return result;
};

// Основний парсер для створення шаблону
export const parseAdvancedXML = (xmlString: string): ParsedXMLStructure => {
  console.log('=== ОСНОВНИЙ ПАРСИНГ XML ===');
  
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
  
  const parseErrors = xmlDoc.getElementsByTagName('parsererror');
  if (parseErrors.length > 0) {
    throw new Error('Невірний формат XML файлу');
  }
  
  const result: ParsedXMLStructure = {
    parameters: [],
    structure: {}
  };

  let paramOrder = 0;

  // ПАРСИНГ ІНФОРМАЦІЇ ПРО МАГАЗИН
  const shopElement = xmlDoc.querySelector('shop');
  if (shopElement) {
    const shopName = shopElement.querySelector('name');
    const shopCompany = shopElement.querySelector('company');
    const shopUrl = shopElement.querySelector('url');
    
    result.shop = {
      name: shopName ? getElementText(shopName) : undefined,
      company: shopCompany ? getElementText(shopCompany) : undefined,
      url: shopUrl ? getElementText(shopUrl) : undefined
    };

    // Додаємо інформацію про магазин як параметри
    if (result.shop.name) {
      result.parameters.push({
        parameter_name: 'Назва магазину',
        parameter_value: result.shop.name,
        xml_path: '/shop/name',
        parameter_type: 'text',
        parameter_category: 'shop',
        is_active: true,
        is_required: false,
        display_order: paramOrder++
      });
    }
    
    if (result.shop.company) {
      result.parameters.push({
        parameter_name: 'Компанія',
        parameter_value: result.shop.company,
        xml_path: '/shop/company',
        parameter_type: 'text',
        parameter_category: 'shop',
        is_active: true,
        is_required: false,
        display_order: paramOrder++
      });
    }
    
    if (result.shop.url) {
      result.parameters.push({
        parameter_name: 'URL магазину',
        parameter_value: result.shop.url,
        xml_path: '/shop/url',
        parameter_type: 'text',
        parameter_category: 'shop',
        is_active: true,
        is_required: false,
        display_order: paramOrder++
      });
    }

    // ПАРСИНГ ВАЛЮТ
    const currenciesElement = shopElement.querySelector('currencies');
    if (currenciesElement) {
      const currencies: Array<{id: string; rate: number}> = [];
      const currencyElements = currenciesElement.querySelectorAll('currency');
      
      currencyElements.forEach((currency, index) => {
        const id = currency.getAttribute('id');
        const rateStr = currency.getAttribute('rate');
        const rate = parseFloat(rateStr || '1');
        
        if (id) {
          currencies.push({ id, rate });
          
          result.parameters.push({
            parameter_name: `Валюта ${id}`,
            parameter_value: rate.toString(),
            xml_path: buildXMLPath(currency),
            parameter_type: 'currency',
            parameter_category: 'currency',
            element_attributes: getElementAttributes(currency),
            is_active: true,
            is_required: id === 'UAH',
            display_order: paramOrder++
          });
        }
      });
      
      result.currencies = currencies;
    }

    // ПАРСИНГ КАТЕГОРІЙ
    const categoriesElement = shopElement.querySelector('categories');
    if (categoriesElement) {
      const categories: Array<{id: string; name: string; rz_id?: string}> = [];
      const categoryElements = categoriesElement.querySelectorAll('category');
      
      categoryElements.forEach((category, index) => {
        const id = category.getAttribute('id');
        const name = getElementText(category);
        const rz_id = category.getAttribute('rz_id');
        
        if (id && name) {
          const categoryObj = { id, name, rz_id: rz_id || undefined };
          categories.push(categoryObj);
          
          result.parameters.push({
            parameter_name: `Категорія: ${name}`,
            parameter_value: name,
            xml_path: buildXMLPath(category),
            parameter_type: 'category',
            parameter_category: 'category',
            element_attributes: getElementAttributes(category),
            is_active: true,
            is_required: false,
            display_order: paramOrder++
          });
        }
      });
      
      result.categories = categories;
    }

    // ПАРСИНГ ТОВАРІВ
    const offersElement = shopElement.querySelector('offers');
    if (offersElement) {
      const offers: Array<{id: string; available?: boolean; [key: string]: any}> = [];
      const offerElements = offersElement.querySelectorAll('offer');
      
      offerElements.forEach((offer, offerIndex) => {
        const id = offer.getAttribute('id');
        const availableAttr = offer.getAttribute('available');
        const available = availableAttr !== 'false';
        
        if (!id) return;
        
        const offerObj: {id: string; available?: boolean; [key: string]: any} = { id, available };
        
        // Парсинг всіх полів товару
        const offerFields = [
          'url', 'price', 'price_old', 'old_price', 'price_promo', 'promo_price',
          'currencyId', 'categoryId', 'vendor', 'article', 
          'name', 'model', 'name_ua', 'model_ua', 
          'description', 'description_ua', 'state', 'docket', 'docket_ua',
          'stock_quantity', 'quantity_in_stock'
        ];
        
        offerFields.forEach(fieldName => {
          const fieldElement = offer.querySelector(fieldName);
          if (fieldElement) {
            const value = getElementText(fieldElement);
            const isRequired = ['price', 'currencyId', 'categoryId', 'vendor', 'name', 'description', 'stock_quantity'].includes(fieldName);
            
            const fieldMapping: {[key: string]: string} = {
              'url': 'URL товару',
              'price': 'Ціна',
              'price_old': 'Стара ціна', 
              'old_price': 'Стара ціна',
              'price_promo': 'Промо-ціна',
              'promo_price': 'Промо-ціна',
              'currencyId': 'Валюта',
              'categoryId': 'ID категорії',
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
            
            const displayName = fieldMapping[fieldName] || fieldName;
            const cdataContent = hasCDATA(fieldElement) ? getElementText(fieldElement) : undefined;
            
            result.parameters.push({
              parameter_name: displayName,
              parameter_value: value,
              xml_path: `${buildXMLPath(offer)}/${fieldName}`,
              parameter_type: 'text',
              parameter_category: 'offer',
              cdata_content: cdataContent,
              is_active: true,
              is_required: isRequired,
              display_order: paramOrder++
            });
          }
        });

        // Парсинг зображень
        const pictureElements = offer.querySelectorAll('picture');
        pictureElements.forEach((picture, pictureIndex) => {
          const imageUrl = getElementText(picture);
          if (imageUrl) {
            result.parameters.push({
              parameter_name: `Зображення ${pictureIndex + 1}`,
              parameter_value: imageUrl,
              xml_path: `${buildXMLPath(offer)}/picture[${pictureIndex + 1}]`,
              parameter_type: 'image',
              parameter_category: 'offer',
              is_active: true,
              is_required: pictureIndex === 0,
              display_order: paramOrder++
            });
          }
        });

        // Парсинг параметрів (характеристик)
        const paramElements = offer.querySelectorAll('param');
        paramElements.forEach((paramElement, paramIndex) => {
          const paramName = paramElement.getAttribute('name') || `Характеристика ${paramIndex + 1}`;
          const paramid = paramElement.getAttribute('paramid');
          const valueid = paramElement.getAttribute('valueid');
          
          // Перевіряємо багатомовні значення
          const valueElements = paramElement.querySelectorAll('value[lang]');
          
          if (valueElements.length > 0) {
            // Багатомовний параметр
            const multilingual_values: Record<string, string> = {};
            valueElements.forEach(valueElement => {
              const lang = valueElement.getAttribute('lang');
              const value = getElementText(valueElement);
              if (lang && value) {
                multilingual_values[lang] = value;
              }
            });
            
            result.parameters.push({
              parameter_name: paramName,
              parameter_value: Object.values(multilingual_values).join(' / '),
              xml_path: buildXMLPath(paramElement),
              parameter_type: 'characteristic',
              parameter_category: 'offer',
              multilingual_values: multilingual_values,
              element_attributes: {
                name: paramName,
                ...(paramid && { paramid }),
                ...(valueid && { valueid })
              },
              param_id: paramid,
              value_id: valueid,
              is_active: true,
              is_required: false,
              display_order: paramOrder++
            });
          } else {
            // Звичайний параметр
            const value = getElementText(paramElement);
            const cdataContent = hasCDATA(paramElement) ? value : undefined;
            
            if (value) {
              result.parameters.push({
                parameter_name: paramName,
                parameter_value: value,
                xml_path: buildXMLPath(paramElement),
                parameter_type: 'characteristic',
                parameter_category: 'offer',
                cdata_content: cdataContent,
                element_attributes: {
                  name: paramName,
                  ...(paramid && { paramid }),
                  ...(valueid && { valueid })
                },
                param_id: paramid,
                value_id: valueid,
                is_active: true,
                is_required: false,
                display_order: paramOrder++
              });
            }
          }
        });
        
        offers.push(offerObj);
      });
      
      result.offers = offers;
    }
  }

  result.structure = {
    shop_info: result.shop,
    currencies: result.currencies,
    categories: result.categories,
    offers_count: result.offers?.length || 0
  };

  console.log(`Парсинг завершено. Знайдено ${result.parameters.length} параметрів`);
  return result;
};
