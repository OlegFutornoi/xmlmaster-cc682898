// Покращений парсер XML для детального аналізу структури YML/XML файлів
import { XMLParser } from 'fast-xml-parser';

export interface ShopInfo {
  name: string;
  company: string;
  url: string;
}

export interface Currency {
  id: string;
  rate: string;
}

export interface Category {
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

export interface Offer {
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
  [key: string]: any; // Для додаткових полів
}

export interface ParsedXMLStructure {
  shop: ShopInfo; // Тепер обов'язкове поле
  currencies: Currency[];
  categories: Category[];
  offers: Offer[];
}

export const parseXMLToStructure = (xmlContent: string): ParsedXMLStructure => {
  console.log('🔄 Початок парсингу XML контенту...');
  
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseAttributeValue: true,
    trimValues: true,
    parseTrueNumberOnly: false,
    allowBooleanAttributes: true
  });

  try {
    const parsed = parser.parse(xmlContent);
    console.log('📋 Розпарсений XML об\'єкт:', parsed);

    let rootData;
    
    // Знаходимо корінь документа (може бути yml_catalog або shop)
    if (parsed.yml_catalog) {
      rootData = parsed.yml_catalog;
    } else if (parsed.shop) {
      rootData = parsed.shop;
    } else {
      throw new Error('Не знайдено корінь XML документа (yml_catalog або shop)');
    }

    console.log('🏗️ Корінь документа знайдено:', rootData);

    // Парсимо інформацію про магазин (обов'язково)
    const shopInfo: ShopInfo = {
      name: rootData.name || rootData['@_name'] || 'Невідомий магазин',
      company: rootData.company || rootData['@_company'] || 'Невідома компанія',
      url: rootData.url || rootData['@_url'] || ''
    };

    console.log('🏪 Інформація про магазин:', shopInfo);

    // Парсимо валюти
    const currencies: Currency[] = [];
    if (rootData.currencies && rootData.currencies.currency) {
      const currencyData = Array.isArray(rootData.currencies.currency) 
        ? rootData.currencies.currency 
        : [rootData.currencies.currency];
      
      currencyData.forEach((currency: any, index: number) => {
        console.log(`💱 Обробка валюти ${index + 1}:`, currency);
        currencies.push({
          id: currency['@_id'] || currency.id || `CURRENCY_${index + 1}`,
          rate: currency['@_rate']?.toString() || currency.rate?.toString() || '1'
        });
      });
    }

    console.log(`💰 Знайдено ${currencies.length} валют:`, currencies);

    // Парсимо категорії
    const categories: Category[] = [];
    if (rootData.categories && rootData.categories.category) {
      const categoryData = Array.isArray(rootData.categories.category) 
        ? rootData.categories.category 
        : [rootData.categories.category];
      
      categoryData.forEach((category: any, index: number) => {
        console.log(`📂 Обробка категорії ${index + 1}:`, category);
        categories.push({
          id: category['@_id']?.toString() || category.id?.toString() || `CAT_${index + 1}`,
          name: category['#text'] || category.name || `Категорія ${index + 1}`,
          parentId: category['@_parentId']?.toString() || category.parentId?.toString()
        });
      });
    }

    console.log(`📁 Знайдено ${categories.length} категорій:`, categories);

    // Парсимо товари (офери)
    const offers: Offer[] = [];
    if (rootData.offers && rootData.offers.offer) {
      const offerData = Array.isArray(rootData.offers.offer) 
        ? rootData.offers.offer 
        : [rootData.offers.offer];
      
      offerData.forEach((offer: any, index: number) => {
        console.log(`🎁 Обробка товару ${index + 1}:`, offer);
        
        // Збираємо картинки
        const pictures: string[] = [];
        if (offer.picture) {
          const pictureData = Array.isArray(offer.picture) ? offer.picture : [offer.picture];
          pictureData.forEach((pic: any) => {
            const url = typeof pic === 'string' ? pic : pic['#text'] || pic.url;
            if (url) pictures.push(url);
          });
        }

        // Збираємо характеристики (param елементи)
        const characteristics: OfferCharacteristic[] = [];
        if (offer.param) {
          const paramData = Array.isArray(offer.param) ? offer.param : [offer.param];
          
          paramData.forEach((param: any) => {
            console.log('📏 Обробка характеристики:', param);
            
            const paramName = param['@_name'] || param.name || 'Невідома характеристика';
            
            // Якщо є вкладені значення з мовами
            if (param.value && Array.isArray(param.value)) {
              param.value.forEach((value: any) => {
                characteristics.push({
                  name: paramName,
                  value: value['#text'] || value.toString(),
                  language: value['@_lang'] || 'uk'
                });
              });
            } else if (param.value) {
              // Одне значення
              characteristics.push({
                name: paramName,
                value: param.value['#text'] || param.value.toString(),
                language: param.value['@_lang'] || 'uk'
              });
            } else {
              // Значення безпосередньо в param
              const value = param['#text'] || param.toString();
              if (value && value !== paramName) {
                characteristics.push({
                  name: paramName,
                  value: value,
                  unit: param['@_unit'],
                  language: 'uk'
                });
              }
            }
          });
        }

        const processedOffer: Offer = {
          id: offer['@_id']?.toString() || offer.id?.toString() || `OFFER_${index + 1}`,
          available: offer['@_available']?.toString() || offer.available?.toString() || 'true',
          price: parseFloat(offer.price?.toString() || '0'),
          currencyId: offer.currencyId || offer.currency_id || 'UAH',
          categoryId: offer.categoryId?.toString() || offer.category_id?.toString() || '1',
          pictures,
          vendor: offer.vendor || offer.brand,
          article: offer.article?.toString() || offer.sku?.toString(),
          stock_quantity: parseInt(offer.stock_quantity?.toString() || offer.quantity?.toString() || '0'),
          name: offer.name || `Товар ${index + 1}`,
          name_ua: offer.name_ua || offer.name_uk,
          description: offer.description,
          description_ua: offer.description_ua || offer.description_uk,
          characteristics
        };

        offers.push(processedOffer);
        console.log(`✅ Товар ${index + 1} оброблено:`, processedOffer);
      });
    }

    console.log(`🛍️ Знайдено ${offers.length} товарів`);

    const result: ParsedXMLStructure = {
      shop: shopInfo,
      currencies,
      categories,
      offers
    };

    console.log('🎉 Парсинг завершено успішно:', result);
    return result;

  } catch (error: any) {
    console.error('❌ Помилка парсингу XML:', error);
    throw new Error(`Помилка парсингу XML: ${error.message}`);
  }
};

export const generateTreeStructure = (structure: ParsedXMLStructure): string => {
  let tree = '🛍️ shop\n';
  tree += ` ├── 🏪 name: "${structure.shop.name}"\n`;
  tree += ` ├── 🏢 company: "${structure.shop.company}"\n`;
  tree += ` ├── 🌐 url: "${structure.shop.url}"\n`;
  
  // Валюти
  if (structure.currencies.length > 0) {
    tree += ` ├── 💱 currencies\n`;
    structure.currencies.forEach((currency, index) => {
      const isLast = index === structure.currencies.length - 1;
      const prefix = isLast ? '     └── ' : '     ├── ';
      tree += `${prefix}💰 currency (id="${currency.id}", rate="${currency.rate}")\n`;
    });
  }
  
  // Категорії
  if (structure.categories.length > 0) {
    tree += ` ├── 📂 categories\n`;
    structure.categories.forEach((category, index) => {
      const isLast = index === structure.categories.length - 1;
      const prefix = isLast ? '     └── ' : '     ├── ';
      tree += `${prefix}📁 category (id="${category.id}"): "${category.name}"\n`;
    });
  }
  
  // Товари
  if (structure.offers.length > 0) {
    tree += ` └── 🎁 offers\n`;
    structure.offers.forEach((offer, offerIndex) => {
      const isLastOffer = offerIndex === structure.offers.length - 1;
      const offerPrefix = isLastOffer ? '     └── ' : '     ├── ';
      tree += `${offerPrefix}📦 offer (id="${offer.id}", available="${offer.available}")\n`;
      
      const baseIndent = isLastOffer ? '          ' : '     │    ';
      
      // Основні поля товару
      tree += `${baseIndent}├── 💲 price: ${offer.price}\n`;
      tree += `${baseIndent}├── 💱 currencyId: "${offer.currencyId}"\n`;
      tree += `${baseIndent}├── 🗂️ categoryId: ${offer.categoryId}\n`;
      
      // Картинки
      offer.pictures.forEach((picture, picIndex) => {
        tree += `${baseIndent}├── 🖼️ picture: "${picture}"\n`;
      });
      
      // Інші поля
      if (offer.vendor) tree += `${baseIndent}├── 🏷️ vendor: "${offer.vendor}"\n`;
      if (offer.article) tree += `${baseIndent}├── 🔖 article: ${offer.article}\n`;
      if (offer.stock_quantity) tree += `${baseIndent}├── 📦 stock_quantity: ${offer.stock_quantity}\n`;
      
      tree += `${baseIndent}├── 🏷️ name: "${offer.name}"\n`;
      if (offer.name_ua) tree += `${baseIndent}├── 🏷️ name_ua: "${offer.name_ua}"\n`;
      if (offer.description) tree += `${baseIndent}├── 📝 description: <![CDATA[...]]> (RU HTML)\n`;
      if (offer.description_ua) tree += `${baseIndent}├── 📝 description_ua: <![CDATA[...]]> (UA HTML)\n`;
      
      // Характеристики
      offer.characteristics.forEach((char, charIndex) => {
        const isLastChar = charIndex === offer.characteristics.length - 1;
        const charPrefix = isLastChar ? '└── ' : '├── ';
        
        let emoji = '📏'; // За замовчуванням
        if (char.name.toLowerCase().includes('колір') || char.name.toLowerCase().includes('цвет')) emoji = '🎨';
        else if (char.name.toLowerCase().includes('сезон')) emoji = '🍂';
        else if (char.name.toLowerCase().includes('склад') || char.name.toLowerCase().includes('состав')) emoji = '🧵';
        else if (char.name.toLowerCase().includes('догляд') || char.name.toLowerCase().includes('уход')) emoji = '🧺';
        else if (char.name.toLowerCase().includes('країна') || char.name.toLowerCase().includes('страна')) emoji = '🌍';
        else if (char.name.toLowerCase().includes('особливості') || char.name.toLowerCase().includes('особенности')) emoji = '👕';
        
        tree += `${baseIndent}${charPrefix}${emoji} param (name="${char.name}")`;
        if (char.language) tree += `: "${char.value}" (${char.language.toUpperCase()})`;
        else tree += `: "${char.value}"`;
        tree += '\n';
      });
    });
  }
  
  return tree;
};
