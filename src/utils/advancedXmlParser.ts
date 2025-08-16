
// Розширений XML парсер для повного аналізу структури та збереження всіх даних
export interface ParsedXMLStructure {
  shop: ShopData;
  currencies: CurrencyData[];
  categories: CategoryData[];
  offers: OfferData[];
}

export interface ShopData {
  name?: string;
  company?: string;
  url?: string;
}

export interface CurrencyData {
  id: string;
  rate: string;
  attributes?: Record<string, string>;
}

export interface CategoryData {
  id: string;
  name: string;
  parentId?: string;
  attributes?: Record<string, string>;
}

export interface OfferData {
  id: string;
  available?: string;
  price?: string;
  currencyId?: string;
  categoryId?: string;
  pictures: string[];
  vendor?: string;
  article?: string;
  stock_quantity?: string;
  name?: string;
  name_ua?: string;
  description?: string;
  description_ua?: string;
  characteristics: CharacteristicData[];
  attributes?: Record<string, string>;
}

export interface CharacteristicData {
  name: string;
  values: Array<{
    value: string;
    lang?: string;
  }>;
  xmlPath: string;
}

export const parseXMLToStructure = (xmlContent: string): ParsedXMLStructure => {
  console.log('🔍 Розпочинаємо розширений парсинг XML...');
  
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
  
  if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
    throw new Error('Помилка парсингу XML файлу');
  }

  const result: ParsedXMLStructure = {
    shop: {},
    currencies: [],
    categories: [],
    offers: []
  };

  // Парсинг основної інформації магазину
  const shopElement = xmlDoc.querySelector('shop');
  if (shopElement) {
    result.shop = {
      name: shopElement.querySelector('name')?.textContent || '',
      company: shopElement.querySelector('company')?.textContent || '',
      url: shopElement.querySelector('url')?.textContent || ''
    };
    console.log('🏪 Shop info parsed:', result.shop);
  }

  // Парсинг всіх валют
  const currencyElements = xmlDoc.querySelectorAll('currencies currency');
  currencyElements.forEach((currency) => {
    const currencyData: CurrencyData = {
      id: currency.getAttribute('id') || '',
      rate: currency.getAttribute('rate') || '1'
    };
    
    // Зберігаємо всі додаткові атрибути
    const attributes: Record<string, string> = {};
    Array.from(currency.attributes).forEach(attr => {
      if (attr.name !== 'id' && attr.name !== 'rate') {
        attributes[attr.name] = attr.value;
      }
    });
    if (Object.keys(attributes).length > 0) {
      currencyData.attributes = attributes;
    }
    
    result.currencies.push(currencyData);
  });
  console.log(`💱 Parsed ${result.currencies.length} currencies:`, result.currencies);

  // Парсинг всіх категорій
  const categoryElements = xmlDoc.querySelectorAll('categories category');
  categoryElements.forEach((category) => {
    const categoryData: CategoryData = {
      id: category.getAttribute('id') || '',
      name: category.textContent?.trim() || '',
      parentId: category.getAttribute('parentId') || undefined
    };
    
    // Зберігаємо всі додаткові атрибути
    const attributes: Record<string, string> = {};
    Array.from(category.attributes).forEach(attr => {
      if (!['id', 'parentId'].includes(attr.name)) {
        attributes[attr.name] = attr.value;
      }
    });
    if (Object.keys(attributes).length > 0) {
      categoryData.attributes = attributes;
    }
    
    result.categories.push(categoryData);
  });
  console.log(`📂 Parsed ${result.categories.length} categories:`, result.categories);

  // Парсинг всіх офферів з повною інформацією
  const offerElements = xmlDoc.querySelectorAll('offers offer');
  offerElements.forEach((offer) => {
    const offerData: OfferData = {
      id: offer.getAttribute('id') || '',
      available: offer.getAttribute('available') || 'true',
      pictures: [],
      characteristics: []
    };

    // Зберігаємо всі атрибути оффера
    const attributes: Record<string, string> = {};
    Array.from(offer.attributes).forEach(attr => {
      if (!['id', 'available'].includes(attr.name)) {
        attributes[attr.name] = attr.value;
      }
    });
    if (Object.keys(attributes).length > 0) {
      offerData.attributes = attributes;
    }

    // Парсинг основних полів оффера
    offerData.price = offer.querySelector('price')?.textContent || undefined;
    offerData.currencyId = offer.querySelector('currencyId')?.textContent || undefined;
    offerData.categoryId = offer.querySelector('categoryId')?.textContent || undefined;
    offerData.vendor = offer.querySelector('vendor')?.textContent || undefined;
    offerData.article = offer.querySelector('article')?.textContent || undefined;
    offerData.stock_quantity = offer.querySelector('stock_quantity')?.textContent || undefined;
    offerData.name = offer.querySelector('name')?.textContent || undefined;
    offerData.name_ua = offer.querySelector('name_ua')?.textContent || undefined;
    
    // Парсинг описів (можуть містити CDATA)
    const descriptionElement = offer.querySelector('description');
    if (descriptionElement) {
      offerData.description = descriptionElement.textContent || undefined;
    }
    
    const descriptionUaElement = offer.querySelector('description_ua');
    if (descriptionUaElement) {
      offerData.description_ua = descriptionUaElement.textContent || undefined;
    }

    // Парсинг всіх зображень
    const pictureElements = offer.querySelectorAll('picture');
    pictureElements.forEach((picture) => {
      const url = picture.textContent?.trim();
      if (url) {
        offerData.pictures.push(url);
      }
    });

    // Парсинг всіх характеристик (param елементів)
    const paramElements = offer.querySelectorAll('param');
    paramElements.forEach((param, index) => {
      const paramName = param.getAttribute('name');
      if (paramName) {
        const characteristic: CharacteristicData = {
          name: paramName,
          values: [],
          xmlPath: `/yml_catalog/shop/offers/offer/param[${index + 1}]`
        };

        // Перевіряємо чи є вкладені значення з мовами
        const valueElements = param.querySelectorAll('value');
        if (valueElements.length > 0) {
          valueElements.forEach((valueEl) => {
            const lang = valueEl.getAttribute('lang');
            const value = valueEl.textContent?.trim() || '';
            if (value) {
              characteristic.values.push({ value, lang: lang || undefined });
            }
          });
        } else {
          // Просте текстове значення
          const value = param.textContent?.trim() || '';
          if (value) {
            characteristic.values.push({ value });
          }
        }

        offerData.characteristics.push(characteristic);
      }
    });

    result.offers.push(offerData);
  });

  console.log(`🎁 Parsed ${result.offers.length} offers with full data`);
  console.log('✅ XML parsing completed successfully');
  
  return result;
};

// Функція для генерації візуального дерева структури
export const generateTreeStructure = (structure: ParsedXMLStructure): string => {
  let tree = '🛍️ shop\n';
  
  // Основна інформація магазину
  if (structure.shop.name) {
    tree += ` ├── 🏪 name: "${structure.shop.name}"\n`;
  }
  if (structure.shop.company) {
    tree += ` ├── 🏢 company: "${structure.shop.company}"\n`;
  }
  if (structure.shop.url) {
    tree += ` ├── 🌐 url: "${structure.shop.url}"\n`;
  }
  
  // Валюти
  if (structure.currencies.length > 0) {
    tree += ` ├── 💱 currencies\n`;
    structure.currencies.forEach((currency, index) => {
      const isLast = index === structure.currencies.length - 1 && structure.categories.length === 0 && structure.offers.length === 0;
      const prefix = isLast ? ' └──' : ' ├──';
      tree += ` │    ${prefix} 💰 currency (id="${currency.id}", rate="${currency.rate}")\n`;
    });
  }
  
  // Категорії
  if (structure.categories.length > 0) {
    tree += ` ├── 📂 categories\n`;
    structure.categories.forEach((category, index) => {
      const isLast = index === structure.categories.length - 1 && structure.offers.length === 0;
      const prefix = isLast ? ' └──' : ' ├──';
      tree += ` │    ${prefix} 📁 category (id="${category.id}"): "${category.name}"\n`;
    });
  }
  
  // Оффери (показуємо тільки перший для прикладу)
  if (structure.offers.length > 0) {
    tree += ` └── 🎁 offers\n`;
    const firstOffer = structure.offers[0];
    tree += `      └── 📦 offer (id="${firstOffer.id}", available="${firstOffer.available || 'true'}")\n`;
    
    if (firstOffer.price) {
      tree += `           ├── 💲 price: ${firstOffer.price}\n`;
    }
    if (firstOffer.currencyId) {
      tree += `           ├── 💱 currencyId: "${firstOffer.currencyId}"\n`;
    }
    if (firstOffer.categoryId) {
      tree += `           ├── 🗂️ categoryId: ${firstOffer.categoryId}\n`;
    }
    
    // Зображення
    firstOffer.pictures.forEach((picture) => {
      tree += `           ├── 🖼️ picture: "${picture}"\n`;
    });
    
    if (firstOffer.vendor) {
      tree += `           ├── 🏷️ vendor: "${firstOffer.vendor}"\n`;
    }
    if (firstOffer.article) {
      tree += `           ├── 🔖 article: ${firstOffer.article}\n`;
    }
    if (firstOffer.stock_quantity) {
      tree += `           ├── 📦 stock_quantity: ${firstOffer.stock_quantity}\n`;
    }
    if (firstOffer.name) {
      tree += `           ├── 🏷️ name: "${firstOffer.name}"\n`;
    }
    if (firstOffer.name_ua) {
      tree += `           ├── 🏷️ name_ua: "${firstOffer.name_ua}"\n`;
    }
    if (firstOffer.description) {
      tree += `           ├── 📝 description: <![CDATA[...]]> (RU HTML)\n`;
    }
    if (firstOffer.description_ua) {
      tree += `           ├── 📝 description_ua: <![CDATA[...]]> (UA HTML)\n`;
    }
    
    // Характеристики
    firstOffer.characteristics.forEach((char, index) => {
      const isLastChar = index === firstOffer.characteristics.length - 1;
      const prefix = isLastChar ? '└──' : '├──';
      
      if (char.values.length === 1) {
        tree += `           ${prefix} 📏 param (name="${char.name}"): "${char.values[0].value}"\n`;
      } else if (char.values.length > 1) {
        tree += `           ${prefix} 🧺 param (name="${char.name}")\n`;
        char.values.forEach((val, valIndex) => {
          const isLastVal = valIndex === char.values.length - 1;
          const valPrefix = isLastVal ? '└──' : '├──';
          const flag = val.lang === 'uk' ? '🇺🇦' : val.lang === 'ru' ? '🇷🇺' : '🌍';
          tree += `           │    ${valPrefix} ${flag} value${val.lang ? ` (lang="${val.lang}")` : ''}: "${val.value}"\n`;
        });
      }
    });
  }
  
  return tree;
};
