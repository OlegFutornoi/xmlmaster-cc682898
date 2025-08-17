
// Удосконалений парсер XML для витягування всіх параметрів Rozetka YML
import { XMLParser } from 'fast-xml-parser';

// Інтерфейси для структури магазину
export interface ShopInfo {
  name: string;
  company: string;
  url: string;
}

export interface CurrencyInfo {
  id: string;
  rate: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  parentId?: string;
  rz_id?: string;
}

export interface OfferCharacteristic {
  name: string;
  value: string;
  unit?: string;
  language?: string;
  paramid?: string;
  valueid?: string;
}

export interface OfferInfo {
  id: string;
  available: string;
  price: number;
  price_old?: number;
  price_promo?: number;
  currencyId: string;
  categoryId: string;
  pictures: string[];
  vendor?: string;
  article?: string;
  vendorCode?: string;
  stock_quantity?: number;
  quantity_in_stock?: number;
  name: string;
  name_ua?: string;
  model?: string;
  model_ua?: string;
  description?: string;
  description_ua?: string;
  state?: string;
  docket?: string;
  docket_ua?: string;
  url?: string;
  characteristics: OfferCharacteristic[];
  [key: string]: any;
}

export interface TemplateParameter {
  name: string;
  value: string;
  path: string;
  type: string;
  category: string;
  language?: string;
  unit?: string;
}

export interface ParsedXMLStructure {
  shop: ShopInfo;
  currencies: CurrencyInfo[];
  categories: CategoryInfo[];
  offers: OfferInfo[];
  parameters: TemplateParameter[];
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
  tree += `│   ├── Name: ${structure.shop?.name || 'Невідомо'}\n`;
  tree += `│   ├── Company: ${structure.shop?.company || 'Невідомо'}\n`;
  tree += `│   └── URL: ${structure.shop?.url || 'Невідомо'}\n`;
  
  tree += '├── 💱 Currencies\n';
  const currencies = structure.currencies || [];
  currencies.forEach((currency, index) => {
    const isLast = index === currencies.length - 1;
    const connector = isLast ? '└──' : '├──';
    tree += `│   ${connector} ${currency.id} (rate: ${currency.rate})\n`;
  });
  
  tree += '├── 📂 Categories\n';
  const categories = structure.categories || [];
  categories.forEach((category, index) => {
    const isLast = index === categories.length - 1;
    const connector = isLast ? '└──' : '├──';
    const parentInfo = category.parentId ? ` (parent: ${category.parentId})` : '';
    const rzInfo = category.rz_id ? ` [rz_id="${category.rz_id}"]` : '';
    tree += `│   ${connector} ${category.name} [id="${category.id}"]${parentInfo}${rzInfo}\n`;
  });
  
  tree += '└── 🎁 Offers\n';
  const offers = structure.offers || [];
  offers.forEach((offer, index) => {
    const isLast = index === offers.length - 1;
    const connector = isLast ? '    └──' : '    ├──';
    tree += `${connector} offer (id="${offer.id}", available="${offer.available}")\n`;
    
    // Основні параметри товару
    const offerParams = [
      { name: 'price', value: offer.price },
      { name: 'price_old', value: offer.price_old },
      { name: 'price_promo', value: offer.price_promo },
      { name: 'currencyId', value: offer.currencyId },
      { name: 'categoryId', value: offer.categoryId },
      { name: 'name', value: offer.name },
      { name: 'name_ua', value: offer.name_ua },
      { name: 'model', value: offer.model },
      { name: 'model_ua', value: offer.model_ua },
      { name: 'vendor', value: offer.vendor },
      { name: 'article', value: offer.article },
      { name: 'vendorCode', value: offer.vendorCode },
      { name: 'stock_quantity', value: offer.stock_quantity },
      { name: 'quantity_in_stock', value: offer.quantity_in_stock },
      { name: 'state', value: offer.state },
      { name: 'docket', value: offer.docket },
      { name: 'docket_ua', value: offer.docket_ua },
      { name: 'url', value: offer.url },
      { name: 'description', value: offer.description ? 'HTML content' : undefined },
      { name: 'description_ua', value: offer.description_ua ? 'HTML content' : undefined }
    ];

    offerParams.forEach((param, paramIndex) => {
      if (param.value !== undefined && param.value !== null) {
        const paramConnector = (isLast ? '        ' : '    │   ') + '├──';
        tree += `${paramConnector} ${param.name}: ${param.value}\n`;
      }
    });

    // Зображення
    const pictures = offer.pictures || [];
    if (pictures.length > 0) {
      pictures.forEach((picture, picIndex) => {
        const pictureConnector = (isLast ? '        ' : '    │   ') + '├──';
        tree += `${pictureConnector} picture: ${picture}\n`;
      });
    }
    
    // Характеристики
    const characteristics = offer.characteristics || [];
    if (characteristics.length > 0) {
      characteristics.forEach((char, charIndex) => {
        const isLastChar = charIndex === characteristics.length - 1;
        const charConnector = (isLast ? '        ' : '    │   ') + (isLastChar ? '└──' : '├──');
        
        if (char.language) {
          const langFlag = char.language === 'uk' ? '🇺🇦' : char.language === 'ru' ? '🇷🇺' : '🏳️';
          tree += `${charConnector} param (name="${char.name}")\n`;
          const prefix = (isLast ? '        ' : '    │   ') + '    ';
          tree += `${prefix}└── ${langFlag} value (lang="${char.language}"): "${char.value}"\n`;
        } else {
          tree += `${charConnector} param (name="${char.name}"): ${char.value}\n`;
        }
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

    const currencies = parseCurrencies(shop.currencies || {});
    console.log('💱 Знайдено валют:', currencies.length);

    const categories = parseCategories(shop.categories || {});
    console.log('📂 Знайдено категорій:', categories.length);

    const offers = parseOffers(shop.offers || {});
    console.log('🎁 Знайдено товарів:', offers.length);

    const result: ParsedXMLStructure = {
      shop: shopInfo,
      currencies,
      categories,
      offers,
      parameters: []
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
    return value['#text'] || value._text || value.__cdata || String(value);
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
          rate: String(currency['@_rate'] || '1')
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
        
        if (category['@_rz_id']) {
          categoryInfo.rz_id = String(category['@_rz_id']);
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
          name: extractTextValue(offer.name || offer.model) || '',
          characteristics: parseCharacteristics(offer.param || [])
        };
        
        // Додаткові поля з підтримкою всіх варіантів Rozetka
        if (offer.price_old || offer.old_price) offerInfo.price_old = parseFloat(offer.price_old || offer.old_price);
        if (offer.price_promo || offer.promo_price) offerInfo.price_promo = parseFloat(offer.price_promo || offer.promo_price);
        if (offer.vendor) offerInfo.vendor = extractTextValue(offer.vendor);
        
        // ВАЖЛИВО: Додаємо article поле
        if (offer.article) offerInfo.article = extractTextValue(offer.article);
        
        if (offer.vendorCode || offer['vendor-code']) offerInfo.vendorCode = extractTextValue(offer.vendorCode || offer['vendor-code']);
        if (offer.stock_quantity) offerInfo.stock_quantity = parseInt(offer.stock_quantity) || 0;
        if (offer.quantity_in_stock) offerInfo.quantity_in_stock = parseInt(offer.quantity_in_stock) || 0;
        
        // ВАЖЛИВО: Додаємо name_ua поле
        if (offer.name_ua) offerInfo.name_ua = extractTextValue(offer.name_ua);
        
        if (offer.model) offerInfo.model = extractTextValue(offer.model);
        if (offer.model_ua) offerInfo.model_ua = extractTextValue(offer.model_ua);
        if (offer.description) offerInfo.description = extractTextValue(offer.description);
        
        // ВАЖЛИВО: Додаємо description_ua поле з підтримкою CDATA
        if (offer.description_ua) {
          const descUa = extractTextValue(offer.description_ua);
          offerInfo.description_ua = descUa;
        }
        
        if (offer.state) offerInfo.state = extractTextValue(offer.state);
        if (offer.docket) offerInfo.docket = extractTextValue(offer.docket);
        if (offer.docket_ua) offerInfo.docket_ua = extractTextValue(offer.docket_ua);
        if (offer.url) offerInfo.url = extractTextValue(offer.url);
        
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
  
  const characteristics: OfferCharacteristic[] = [];
  
  params.forEach((param: any) => {
    if (!param || !param['@_name']) return;
    
    const name = String(param['@_name']);
    
    // Перевіряємо чи є мультимовні значення
    if (param.value) {
      const values = Array.isArray(param.value) ? param.value : [param.value];
      
      values.forEach((value: any) => {
        const characteristic: OfferCharacteristic = {
          name,
          value: extractTextValue(value)
        };
        
        if (value['@_lang']) characteristic.language = String(value['@_lang']);
        if (param['@_paramid']) characteristic.paramid = String(param['@_paramid']);
        if (param['@_valueid']) characteristic.valueid = String(param['@_valueid']);
        if (param['@_unit']) characteristic.unit = String(param['@_unit']);
        
        characteristics.push(characteristic);
      });
    } else {
      // Звичайне значення параметру
      const characteristic: OfferCharacteristic = {
        name,
        value: extractTextValue(param)
      };
      
      if (param['@_paramid']) characteristic.paramid = String(param['@_paramid']);
      if (param['@_valueid']) characteristic.valueid = String(param['@_valueid']);
      if (param['@_unit']) characteristic.unit = String(param['@_unit']);
      
      characteristics.push(characteristic);
    }
  });
  
  return characteristics;
}
