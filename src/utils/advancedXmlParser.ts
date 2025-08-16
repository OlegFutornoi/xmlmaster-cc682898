
import { XMLParser } from 'fast-xml-parser';

// Інтерфейси для структури магазину
export interface ShopInfo {
  name: string;
  company: string;
  url: string;
}

export interface CurrencyInfo {
  id: string;
  rate: string; // Змінено на string для сумісності
}

export interface CategoryInfo {
  id: string;
  name: string;
  parentId?: string;
}

export interface OfferCharacteristic {
  name: string;
  value: string;
  unit?: string;
  language?: string;
}

export interface OfferInfo {
  id: string;
  available: string;
  price: number;
  currencyId: string;
  categoryId: string;
  pictures: string[];
  vendor?: string;
  article?: string;
  stock_quantity?: number;
  name: string;
  name_ua?: string;
  description?: string;
  description_ua?: string;
  characteristics: OfferCharacteristic[];
  [key: string]: any;
}

// Додаємо інтерфейс для параметрів
export interface TemplateParameter {
  name: string;
  value: string;
  path: string;
  type: string;
  category: string;
}

export interface ParsedXMLStructure {
  shop: ShopInfo;
  currencies: CurrencyInfo[];
  categories: CategoryInfo[];
  offers: OfferInfo[];
  parameters: TemplateParameter[]; // Додаємо відсутню властивість
}

// Налаштування парсера XML
const parserOptions = {
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseAttributeValue: true,
  parseNodeValue: true,
  trimValues: true,
  cdataPropName: '__cdata',
  parseTrueNumberOnly: false
};

/**
 * Генерує текстове представлення структури XML шаблону у вигляді дерева
 */
export function generateTreeStructure(structure: ParsedXMLStructure): string {
  let tree = '';
  
  tree += '📋 XML Template Structure\n';
  tree += '├── 🏪 Shop Information\n';
  tree += `│   ├── Name: ${structure.shop.name}\n`;
  tree += `│   ├── Company: ${structure.shop.company}\n`;
  tree += `│   └── URL: ${structure.shop.url}\n`;
  
  tree += '├── 💱 Currencies\n';
  structure.currencies.forEach((currency, index) => {
    const isLast = index === structure.currencies.length - 1;
    const connector = isLast ? '└──' : '├──';
    tree += `│   ${connector} ${currency.id} (rate: ${currency.rate})\n`;
  });
  
  tree += '├── 📂 Categories\n';
  structure.categories.forEach((category, index) => {
    const isLast = index === structure.categories.length - 1;
    const connector = isLast ? '└──' : '├──';
    const parentInfo = category.parentId ? ` (parent: ${category.parentId})` : '';
    tree += `│   ${connector} ${category.name} [${category.id}]${parentInfo}\n`;
  });
  
  tree += '└── 🎁 Offers\n';
  structure.offers.forEach((offer, index) => {
    const isLast = index === structure.offers.length - 1;
    const connector = isLast ? '    └──' : '    ├──';
    tree += `${connector} ${offer.name} [${offer.id}]\n`;
    tree += `${isLast ? '        ' : '    │   '}├── Price: ${offer.price} (${offer.currencyId})\n`;
    tree += `${isLast ? '        ' : '    │   '}├── Category: ${offer.categoryId}\n`;
    tree += `${isLast ? '        ' : '    │   '}├── Available: ${offer.available}\n`;
    
    if (offer.characteristics.length > 0) {
      tree += `${isLast ? '        ' : '    │   '}└── Characteristics (${offer.characteristics.length})\n`;
      offer.characteristics.forEach((char, charIndex) => {
        const isLastChar = charIndex === offer.characteristics.length - 1;
        const charConnector = isLastChar ? '└──' : '├──';
        tree += `${isLast ? '        ' : '    │   '}    ${charConnector} ${char.name}: ${char.value}\n`;
      });
    }
  });
  
  return tree;
}

/**
 * Головна функція для парсингу XML в структуру
 */
export function parseXMLToStructure(xmlContent: string): ParsedXMLStructure {
  console.log('🚀 Розпочинаємо парсинг XML контенту...');
  
  try {
    const parser = new XMLParser(parserOptions);
    const parsedData = parser.parse(xmlContent);
    
    console.log('📊 XML успішно розпарсено в об\'єкт:', parsedData);
    
    // Знаходимо корневий елемент yml_catalog або shop
    const catalog = parsedData.yml_catalog || parsedData;
    const shop = catalog.shop || {};
    
    console.log('🏪 Знайдено магазин:', shop);

    // Парсимо основну інформацію про магазин
    const shopInfo: ShopInfo = {
      name: extractTextValue(shop.name) || 'Невідомий магазин',
      company: extractTextValue(shop.company) || 'Невідома компанія',
      url: extractTextValue(shop.url) || ''
    };
    
    console.log('✅ Інформація про магазин:', shopInfo);

    // Парсимо валюти
    const currencies = parseCurrencies(shop.currencies || {});
    console.log('💱 Знайдено валют:', currencies.length);

    // Парсимо категорії
    const categories = parseCategories(shop.categories || {});
    console.log('📂 Знайдено категорій:', categories.length);

    // Парсимо товари
    const offers = parseOffers(shop.offers || {});
    console.log('🎁 Знайдено товарів:', offers.length);

    const result: ParsedXMLStructure = {
      shop: shopInfo,
      currencies,
      categories,
      offers,
      parameters: [] // Ініціалізуємо порожній масив параметрів
    };
    
    console.log('🎯 Фінальна структура готова:', {
      shopName: result.shop.name,
      currenciesCount: result.currencies.length,
      categoriesCount: result.categories.length,
      offersCount: result.offers.length
    });
    
    return result;
    
  } catch (error) {
    console.error('❌ Помилка при парсингу XML:', error);
    throw new Error(`Помилка парсингу XML: ${error instanceof Error ? error.message : 'Невідома помилка'}`);
  }
}

// Допоміжні функції для парсингу

function extractTextValue(value: any): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null) {
    return value['#text'] || value._text || String(value);
  }
  return String(value || '');
}

function parseCurrencies(currenciesData: any): CurrencyInfo[] {
  console.log('💱 Парсинг валют:', currenciesData);
  
  const currencies: CurrencyInfo[] = [];
  
  if (currenciesData && currenciesData.currency) {
    const currencyList = Array.isArray(currenciesData.currency) 
      ? currenciesData.currency 
      : [currenciesData.currency];
    
    currencyList.forEach((currency: any) => {
      if (currency && currency['@_id']) {
        currencies.push({
          id: String(currency['@_id']),
          rate: String(currency['@_rate'] || '1') // Конвертуємо в string
        });
      }
    });
  }
  
  console.log('✅ Розпарсено валют:', currencies);
  return currencies;
}

function parseCategories(categoriesData: any): CategoryInfo[] {
  console.log('📂 Парсинг категорій:', categoriesData);
  
  const categories: CategoryInfo[] = [];
  
  if (categoriesData && categoriesData.category) {
    const categoryList = Array.isArray(categoriesData.category) 
      ? categoriesData.category 
      : [categoriesData.category];
    
    categoryList.forEach((category: any) => {
      if (category && category['@_id']) {
        const categoryInfo: CategoryInfo = {
          id: String(category['@_id']),
          name: extractTextValue(category)
        };
        
        if (category['@_parentId']) {
          categoryInfo.parentId = String(category['@_parentId']);
        }
        
        categories.push(categoryInfo);
      }
    });
  }
  
  console.log('✅ Розпарсено категорій:', categories);
  return categories;
}

function parseOffers(offersData: any): OfferInfo[] {
  console.log('🎁 Парсинг товарів:', offersData);
  
  const offers: OfferInfo[] = [];
  
  if (offersData && offersData.offer) {
    const offerList = Array.isArray(offersData.offer) 
      ? offersData.offer 
      : [offersData.offer];
    
    offerList.forEach((offer: any) => {
      if (offer && offer['@_id']) {
        const offerInfo: OfferInfo = {
          id: String(offer['@_id']),
          available: String(offer['@_available'] || 'true'),
          price: parseFloat(offer.price) || 0,
          currencyId: String(offer.currencyId || offer.currency_id || ''),
          categoryId: String(offer.categoryId || offer.category_id || ''),
          pictures: parsePictures(offer.picture),
          name: extractTextValue(offer.name) || '',
          characteristics: parseCharacteristics(offer.param || [])
        };
        
        // Додаткові поля
        if (offer.vendor) offerInfo.vendor = extractTextValue(offer.vendor);
        if (offer.article) offerInfo.article = extractTextValue(offer.article);
        if (offer.stock_quantity) offerInfo.stock_quantity = parseInt(offer.stock_quantity) || 0;
        if (offer.name_ua) offerInfo.name_ua = extractTextValue(offer.name_ua);
        if (offer.description) offerInfo.description = extractTextValue(offer.description);
        if (offer.description_ua) offerInfo.description_ua = extractTextValue(offer.description_ua);
        
        offers.push(offerInfo);
      }
    });
  }
  
  console.log('✅ Розпарсено товарів:', offers);
  return offers;
}

function parsePictures(pictureData: any): string[] {
  if (!pictureData) return [];
  
  const pictures = Array.isArray(pictureData) ? pictureData : [pictureData];
  return pictures.map(pic => extractTextValue(pic)).filter(url => url.trim());
}

function parseCharacteristics(paramData: any): OfferCharacteristic[] {
  if (!paramData) return [];
  
  const params = Array.isArray(paramData) ? paramData : [paramData];
  
  return params.map((param: any) => {
    const characteristic: OfferCharacteristic = {
      name: String(param['@_name'] || 'Невідома характеристика'),
      value: extractTextValue(param)
    };
    
    if (param['@_unit']) characteristic.unit = String(param['@_unit']);
    if (param['@_lang']) characteristic.language = String(param['@_lang']);
    
    return characteristic;
  });
}
