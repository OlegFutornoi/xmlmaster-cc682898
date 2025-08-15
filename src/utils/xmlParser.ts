
// Утиліта для парсингу XML файлів з правильним збереженням структури та всіх параметрів

export interface ParsedXMLParameter {
  parameter_name: string;
  parameter_value: string | null;
  parameter_type: string;
  parameter_category: 'parameter' | 'characteristic' | 'category' | 'offer' | 'currency';
  xml_path: string;
  is_required: boolean;
  is_active: boolean;
  display_order: number;
  parent_parameter?: string;
  nested_values?: Array<{ lang?: string; value: string }>;
}

export const parseXMLToParameters = (xmlContent: string): ParsedXMLParameter[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
  const parameters: ParsedXMLParameter[] = [];
  let displayOrder = 0;

  // Функція для додавання параметру
  const addParameter = (
    name: string,
    value: string | null,
    category: ParsedXMLParameter['parameter_category'],
    xmlPath: string,
    type: string = 'text',
    isRequired: boolean = false,
    parentParam?: string,
    nestedValues?: Array<{ lang?: string; value: string }>
  ) => {
    parameters.push({
      parameter_name: name,
      parameter_value: value,
      parameter_type: type,
      parameter_category: category,
      xml_path: xmlPath,
      is_required: isRequired,
      is_active: true,
      display_order: displayOrder++,
      parent_parameter: parentParam,
      nested_values: nestedValues
    });
  };

  // 1. ОСНОВНА ІНФОРМАЦІЯ МАГАЗИНУ (shop level) - display_order: 0-99
  const shop = xmlDoc.querySelector('shop');
  if (shop) {
    const name = shop.querySelector('name');
    if (name) {
      addParameter('name', name.textContent, 'parameter', 'shop/name', 'text', true);
    }

    const company = shop.querySelector('company');
    if (company) {
      addParameter('company', company.textContent, 'parameter', 'shop/company', 'text', false);
    }

    const url = shop.querySelector('url');
    if (url) {
      addParameter('url', url.textContent, 'parameter', 'shop/url', 'url', false);
    }
  }

  // 2. ВАЛЮТИ (currencies level) - display_order: 100-199
  const currencies = xmlDoc.querySelectorAll('currencies currency');
  console.log('Found currencies:', currencies.length);
  currencies.forEach((currency, index) => {
    const currencyId = currency.getAttribute('id');
    const rate = currency.getAttribute('rate');
    
    if (currencyId) {
      // Додаємо ID валюти
      addParameter(`currency_${currencyId}_id`, currencyId, 'currency', `currencies/currency[${index + 1}]/@id`, 'text', true);
      // Додаємо курс валюти
      addParameter(`currency_${currencyId}_rate`, rate || '1', 'currency', `currencies/currency[${index + 1}]/@rate`, 'number', true);
    }
  });

  // 3. КАТЕГОРІЇ (categories level) - display_order: 200-299
  const categories = xmlDoc.querySelectorAll('categories category');
  console.log('Found categories:', categories.length);
  categories.forEach((category, index) => {
    const categoryId = category.getAttribute('id');
    const categoryName = category.textContent;
    
    if (categoryId) {
      // Додаємо ID категорії
      addParameter(`category_${categoryId}_id`, categoryId, 'category', `categories/category[${index + 1}]/@id`, 'text', true);
      // Додаємо назву категорії
      addParameter(`category_${categoryId}_name`, categoryName, 'category', `categories/category[${index + 1}]`, 'text', true);
    }
  });

  // 4. ТОВАРИ (offers level) - display_order: 300-999
  const offers = xmlDoc.querySelectorAll('offers offer');
  console.log('Found offers:', offers.length);
  
  if (offers.length > 0) {
    const offer = offers[0]; // Беремо перший товар як приклад структури
    const offerId = offer.getAttribute('id');
    const available = offer.getAttribute('available');
    
    if (offerId) {
      addParameter('offer_id', offerId, 'offer', 'offers/offer/@id', 'text', true);
    }
    if (available) {
      addParameter('available', available, 'offer', 'offers/offer/@available', 'boolean', false);
    }

    // Парсинг всіх дочірніх елементів товару в правильному порядку
    const offerChildren = offer.children;
    console.log('Offer children count:', offerChildren.length);
    
    // Обробляємо всі елементи у тому порядку, як вони йдуть у XML
    for (let i = 0; i < offerChildren.length; i++) {
      const child = offerChildren[i];
      const tagName = child.tagName.toLowerCase();
      
      // Пропускаємо param теги, їх обробимо окремо
      if (tagName === 'param') continue;
      
      const value = child.textContent;
      let paramType = 'text';
      
      // Визначаємо тип параметру
      if (tagName === 'price' || tagName === 'stock_quantity') {
        paramType = 'number';
      } else if (tagName === 'picture') {
        paramType = 'url';
      } else if (tagName === 'description' || tagName === 'description_ua') {
        paramType = 'textarea';
      }
      
      console.log(`Adding offer parameter: ${tagName} = ${value}`);
      addParameter(tagName, value, 'offer', `offers/offer/${tagName}`, paramType, false);
    }

    // 5. ХАРАКТЕРИСТИКИ ТОВАРУ (param elements) - display_order: 1000+
    const params = offer.querySelectorAll('param');
    console.log('Found params:', params.length);
    
    params.forEach((param, index) => {
      const paramName = param.getAttribute('name');
      if (!paramName) return;
      
      console.log(`Processing param: ${paramName}`);
      
      // Перевіряємо чи є вкладені value елементи
      const valueElements = param.querySelectorAll('value');
      if (valueElements.length > 0) {
        const nestedValues: Array<{ lang?: string; value: string }> = [];
        let mainValue = '';
        
        valueElements.forEach(valueEl => {
          const lang = valueEl.getAttribute('lang');
          const value = valueEl.textContent || '';
          nestedValues.push({ lang, value });
          if (!mainValue) mainValue = value; // Використовуємо перше значення як основне
        });
        
        console.log(`Adding param with nested values: ${paramName}`, nestedValues);
        addParameter(
          `param_${paramName}`, 
          mainValue, 
          'characteristic', 
          `offers/offer/param[@name="${paramName}"]`, 
          'text', 
          false,
          undefined,
          nestedValues
        );
      } else {
        // Звичайний параметр без вкладених значень
        const value = param.textContent;
        console.log(`Adding simple param: ${paramName} = ${value}`);
        addParameter(
          `param_${paramName}`, 
          value, 
          'characteristic', 
          `offers/offer/param[@name="${paramName}"]`, 
          'text', 
          false
        );
      }
    });
  }

  console.log(`Total parsed parameters: ${parameters.length}`);
  console.log('Parsed XML parameters:', parameters);
  return parameters;
};

export const importXMLParameters = async (
  xmlContent: string, 
  templateId: string, 
  createParameterFn: (parameter: any) => void
) => {
  try {
    console.log('Starting XML import process...');
    const parsedParameters = parseXMLToParameters(xmlContent);
    
    console.log(`Importing ${parsedParameters.length} parameters to template ${templateId}`);
    
    // Створюємо параметри в базі даних
    for (const param of parsedParameters) {
      const parameterData = {
        template_id: templateId,
        parameter_name: param.parameter_name,
        parameter_value: param.parameter_value,
        parameter_type: param.parameter_type,
        parameter_category: param.parameter_category,
        xml_path: param.xml_path,
        is_required: param.is_required,
        is_active: param.is_active,
        display_order: param.display_order
      };
      
      console.log('Creating parameter:', parameterData);
      createParameterFn(parameterData);
    }
    
    console.log(`Successfully imported ${parsedParameters.length} parameters`);
    return parsedParameters.length;
  } catch (error) {
    console.error('Error importing XML parameters:', error);
    throw error;
  }
};
