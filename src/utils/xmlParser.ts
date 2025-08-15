
// Повністю перероблена утиліта для парсингу XML файлів з правильним збереженням структури

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

  console.log('Starting XML parsing...');

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
    const parameter = {
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
    };
    
    parameters.push(parameter);
    console.log(`Added parameter: ${name} = ${value}, category: ${category}, order: ${parameter.display_order}`);
  };

  // 1. ОСНОВНА ІНФОРМАЦІЯ МАГАЗИНУ (shop level) - display_order: 0-99
  const shop = xmlDoc.querySelector('shop');
  if (shop) {
    console.log('Processing shop information...');
    
    const name = shop.querySelector('name');
    if (name) {
      addParameter('shop_name', name.textContent, 'parameter', 'shop/name', 'text', true);
    }

    const company = shop.querySelector('company');
    if (company) {
      addParameter('shop_company', company.textContent, 'parameter', 'shop/company', 'text', false);
    }

    const url = shop.querySelector('url');
    if (url) {
      addParameter('shop_url', url.textContent, 'parameter', 'shop/url', 'url', false);
    }
  }

  // 2. ВАЛЮТИ (currencies level) - display_order: 100-199
  const currencies = xmlDoc.querySelectorAll('currencies currency');
  console.log(`Found ${currencies.length} currencies`);
  
  currencies.forEach((currency, index) => {
    const currencyId = currency.getAttribute('id');
    const rate = currency.getAttribute('rate');
    
    if (currencyId) {
      console.log(`Processing currency: ${currencyId}, rate: ${rate}`);
      // Додаємо групуючий параметр для валюти
      addParameter(`currency_${currencyId}`, `${currencyId} (${rate})`, 'currency', `currencies/currency[${index + 1}]`, 'text', true);
      // Додаємо ID валюти як підпараметр
      addParameter(`currency_${currencyId}_id`, currencyId, 'currency', `currencies/currency[${index + 1}]/@id`, 'text', true, `currency_${currencyId}`);
      // Додаємо курс валюти як підпараметр
      addParameter(`currency_${currencyId}_rate`, rate || '1', 'currency', `currencies/currency[${index + 1}]/@rate`, 'number', true, `currency_${currencyId}`);
    }
  });

  // 3. КАТЕГОРІЇ (categories level) - display_order: 200-299
  const categories = xmlDoc.querySelectorAll('categories category');
  console.log(`Found ${categories.length} categories`);
  
  categories.forEach((category, index) => {
    const categoryId = category.getAttribute('id');
    const categoryName = category.textContent;
    
    if (categoryId) {
      console.log(`Processing category: ${categoryId} = ${categoryName}`);
      // Додаємо групуючий параметр для категорії
      addParameter(`category_${categoryId}`, `${categoryName} (ID: ${categoryId})`, 'category', `categories/category[${index + 1}]`, 'text', true);
      // Додаємо ID категорії як підпараметр
      addParameter(`category_${categoryId}_id`, categoryId, 'category', `categories/category[${index + 1}]/@id`, 'text', true, `category_${categoryId}`);
      // Додаємо назву категорії як підпараметр
      addParameter(`category_${categoryId}_name`, categoryName, 'category', `categories/category[${index + 1}]`, 'text', true, `category_${categoryId}`);
    }
  });

  // 4. ТОВАРИ (offers level) - display_order: 300-899
  const offers = xmlDoc.querySelectorAll('offers offer');
  console.log(`Found ${offers.length} offers`);
  
  if (offers.length > 0) {
    const offer = offers[0]; // Беремо перший товар як приклад структури
    const offerId = offer.getAttribute('id');
    const available = offer.getAttribute('available');
    
    console.log(`Processing offer: ${offerId}, available: ${available}`);
    
    // Додаємо атрибути товару
    if (offerId) {
      addParameter('offer_id', offerId, 'offer', 'offers/offer/@id', 'text', true);
    }
    if (available) {
      addParameter('offer_available', available, 'offer', 'offers/offer/@available', 'boolean', false);
    }

    // Обробляємо всі дочірні елементи товару в правильному порядку
    const offerChildren = offer.children;
    console.log(`Offer has ${offerChildren.length} child elements`);
    
    for (let i = 0; i < offerChildren.length; i++) {
      const child = offerChildren[i];
      const tagName = child.tagName.toLowerCase();
      
      // Пропускаємо param теги, їх обробимо окремо
      if (tagName === 'param') continue;
      
      const value = child.textContent?.trim();
      let paramType = 'text';
      
      // Визначаємо тип параметру
      if (tagName === 'price' || tagName === 'stock_quantity') {
        paramType = 'number';
      } else if (tagName === 'picture') {
        paramType = 'url';
      } else if (tagName === 'description' || tagName === 'description_ua') {
        paramType = 'textarea';
      }
      
      console.log(`Adding offer parameter: ${tagName} = ${value?.substring(0, 50)}...`);
      addParameter(tagName, value || null, 'offer', `offers/offer/${tagName}`, paramType, false);
    }
  }

  // 5. ХАРАКТЕРИСТИКИ ТОВАРУ (param elements) - display_order: 900+
  if (offers.length > 0) {
    const offer = offers[0];
    const params = offer.querySelectorAll('param');
    console.log(`Found ${params.length} product characteristics`);
    
    params.forEach((param, index) => {
      const paramName = param.getAttribute('name');
      if (!paramName) return;
      
      console.log(`Processing characteristic: ${paramName}`);
      
      // Перевіряємо чи є вкладені value елементи
      const valueElements = param.querySelectorAll('value');
      if (valueElements.length > 0) {
        const nestedValues: Array<{ lang?: string; value: string }> = [];
        let mainValue = '';
        
        valueElements.forEach(valueEl => {
          const lang = valueEl.getAttribute('lang');
          const value = valueEl.textContent?.trim() || '';
          nestedValues.push({ lang, value });
          if (!mainValue) mainValue = value; // Використовуємо перше значення як основне
        });
        
        console.log(`Adding characteristic with nested values: ${paramName}`, nestedValues);
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
        const value = param.textContent?.trim();
        console.log(`Adding simple characteristic: ${paramName} = ${value}`);
        addParameter(
          `param_${paramName}`, 
          value || null, 
          'characteristic', 
          `offers/offer/param[@name="${paramName}"]`, 
          'text', 
          false
        );
      }
    });
  }

  console.log(`Total parsed parameters: ${parameters.length}`);
  return parameters;
};

export const importXMLParameters = async (
  xmlContent: string, 
  templateId: string, 
  createParameterFn: (parameter: any) => Promise<void>
) => {
  try {
    console.log('Starting XML import process...');
    const parsedParameters = parseXMLToParameters(xmlContent);
    
    console.log(`Importing ${parsedParameters.length} parameters to template ${templateId}`);
    
    // Створюємо параметри в базі даних по черзі
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
        display_order: param.display_order,
        parent_parameter: param.parent_parameter,
        nested_values: param.nested_values ? JSON.stringify(param.nested_values) : null
      };
      
      console.log(`Creating parameter ${param.display_order}:`, parameterData);
      
      try {
        await createParameterFn(parameterData);
      } catch (error) {
        console.error(`Error creating parameter ${param.parameter_name}:`, error);
        // Продовжуємо створювати інші параметри навіть якщо один не вдалося створити
      }
    }
    
    console.log(`Successfully imported ${parsedParameters.length} parameters`);
    return parsedParameters.length;
  } catch (error) {
    console.error('Error importing XML parameters:', error);
    throw error;
  }
};
