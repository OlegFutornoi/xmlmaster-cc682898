
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

  console.log('Розпочинаємо детальний парсинг XML...');

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
    console.log(`✅ Додано параметр [${displayOrder-1}]: ${name} = "${value}" (${category}) -> ${xmlPath}`);
  };

  // 1. ОСНОВНА ІНФОРМАЦІЯ МАГАЗИНУ (shop level)
  console.log('🏪 Обробка інформації магазину...');
  const shop = xmlDoc.querySelector('shop');
  if (shop) {
    const name = shop.querySelector('name');
    if (name?.textContent) {
      addParameter('shop_name', name.textContent.trim(), 'parameter', 'shop/name', 'text', true);
    }

    const company = shop.querySelector('company');
    if (company?.textContent) {
      addParameter('shop_company', company.textContent.trim(), 'parameter', 'shop/company', 'text', false);
    }

    const url = shop.querySelector('url');
    if (url?.textContent) {
      addParameter('shop_url', url.textContent.trim(), 'parameter', 'shop/url', 'url', false);
    }
  }

  // 2. ВАЛЮТИ (currencies level)
  console.log('💱 Обробка валют...');
  const currencies = xmlDoc.querySelectorAll('currencies currency');
  console.log(`Знайдено ${currencies.length} валют`);
  
  currencies.forEach((currency, index) => {
    const currencyId = currency.getAttribute('id');
    const rate = currency.getAttribute('rate') || '1';
    
    if (currencyId) {
      console.log(`💰 Обробка валюти: ${currencyId}, курс: ${rate}`);
      
      // Додаємо групуючий параметр для валюти
      const groupName = `currency_${currencyId}`;
      addParameter(groupName, `${currencyId} (курс: ${rate})`, 'currency', `currencies/currency[@id="${currencyId}"]`, 'text', true);
      
      // Додаємо ID валюти як підпараметр
      addParameter(`${groupName}_id`, currencyId, 'currency', `currencies/currency[@id="${currencyId}"]/@id`, 'text', true, groupName);
      
      // Додаємо курс валюти як підпараметр
      addParameter(`${groupName}_rate`, rate, 'currency', `currencies/currency[@id="${currencyId}"]/@rate`, 'number', true, groupName);
    }
  });

  // 3. КАТЕГОРІЇ (categories level)
  console.log('📂 Обробка категорій...');
  const categories = xmlDoc.querySelectorAll('categories category');
  console.log(`Знайдено ${categories.length} категорій`);
  
  categories.forEach((category, index) => {
    const categoryId = category.getAttribute('id');
    const categoryName = category.textContent?.trim();
    const rzId = category.getAttribute('rz_id');
    
    if (categoryId && categoryName) {
      console.log(`📋 Обробка категорії: ${categoryId} = "${categoryName}"${rzId ? ` (rz_id: ${rzId})` : ''}`);
      
      // Додаємо групуючий параметр для категорії
      const groupName = `category_${categoryId}`;
      addParameter(groupName, `${categoryName} (ID: ${categoryId})`, 'category', `categories/category[@id="${categoryId}"]`, 'text', true);
      
      // Додаємо ID категорії як підпараметр
      addParameter(`${groupName}_id`, categoryId, 'category', `categories/category[@id="${categoryId}"]/@id`, 'text', true, groupName);
      
      // Додаємо назву категорії як підпараметр
      addParameter(`${groupName}_name`, categoryName, 'category', `categories/category[@id="${categoryId}"]`, 'text', true, groupName);
      
      // Додаємо rz_id якщо є
      if (rzId) {
        addParameter(`${groupName}_rz_id`, rzId, 'category', `categories/category[@id="${categoryId}"]/@rz_id`, 'text', false, groupName);
      }
    }
  });

  // 4. ТОВАРИ (offers level) - обробляємо перший товар як зразок
  console.log('🛍️ Обробка товарів...');
  const offers = xmlDoc.querySelectorAll('offers offer');
  console.log(`Знайдено ${offers.length} товарів`);
  
  if (offers.length > 0) {
    const offer = offers[0]; // Беремо перший товар як зразок структури
    const offerId = offer.getAttribute('id');
    const available = offer.getAttribute('available');
    
    console.log(`🎯 Обробка товару-зразка: ${offerId}, доступний: ${available}`);
    
    // Додаємо атрибути товару
    if (offerId) {
      addParameter('offer_id', offerId, 'offer', 'offers/offer/@id', 'text', true);
    }
    if (available) {
      addParameter('offer_available', available, 'offer', 'offers/offer/@available', 'boolean', false);
    }

    // Обробляємо всі дочірні елементи товару в правильному порядку
    const offerChildren = Array.from(offer.children);
    console.log(`Товар має ${offerChildren.length} дочірніх елементів`);
    
    offerChildren.forEach((child, childIndex) => {
      const tagName = child.tagName.toLowerCase();
      
      // Пропускаємо param теги, їх обробимо окремо
      if (tagName === 'param') return;
      
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
      
      console.log(`📝 Додаємо параметр товару: ${tagName} = "${value?.substring(0, 50)}${value && value.length > 50 ? '...' : ''}"`);
      addParameter(tagName, value || null, 'offer', `offers/offer/${tagName}`, paramType, false);
    });

    // 5. ХАРАКТЕРИСТИКИ ТОВАРУ (param elements)
    console.log('🔧 Обробка характеристик товару...');
    const params = offer.querySelectorAll('param');
    console.log(`Знайдено ${params.length} характеристик`);
    
    params.forEach((param, paramIndex) => {
      const paramName = param.getAttribute('name');
      if (!paramName) {
        console.log(`⚠️ Пропускаємо param без атрибуту name`);
        return;
      }
      
      console.log(`🏷️ Обробка характеристики: ${paramName}`);
      
      // Перевіряємо чи є вкладені value елементи
      const valueElements = param.querySelectorAll('value');
      if (valueElements.length > 0) {
        const nestedValues: Array<{ lang?: string; value: string }> = [];
        let mainValue = '';
        
        valueElements.forEach((valueEl, valueIndex) => {
          const lang = valueEl.getAttribute('lang');
          const value = valueEl.textContent?.trim() || '';
          nestedValues.push({ lang: lang || undefined, value });
          if (!mainValue) mainValue = value; // Використовуємо перше значення як основне
          
          console.log(`  📌 Вкладене значення [${valueIndex}]: ${lang ? `${lang}:` : ''} "${value}"`);
        });
        
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
        console.log(`  📋 Просте значення: "${value}"`);
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

  console.log(`✨ Парсинг завершено! Всього створено параметрів: ${parameters.length}`);
  console.log('📊 Статистика по категоріях:');
  const stats = parameters.reduce((acc, param) => {
    acc[param.parameter_category] = (acc[param.parameter_category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  Object.entries(stats).forEach(([category, count]) => {
    console.log(`  - ${category}: ${count} параметрів`);
  });

  return parameters;
};

export const importXMLParameters = async (
  xmlContent: string, 
  templateId: string, 
  createParameterFn: (parameter: any) => Promise<void>
) => {
  try {
    console.log('🚀 Розпочинаємо імпорт XML параметрів...');
    console.log(`📄 Template ID: ${templateId}`);
    console.log(`📏 Розмір XML контенту: ${xmlContent.length} символів`);
    
    const parsedParameters = parseXMLToParameters(xmlContent);
    console.log(`📦 Розпарсено ${parsedParameters.length} параметрів`);
    
    if (parsedParameters.length === 0) {
      console.log('⚠️ Немає параметрів для імпорту');
      return 0;
    }
    
    // Створюємо параметри в базі даних по черзі
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < parsedParameters.length; i++) {
      const param = parsedParameters[i];
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
      
      console.log(`💾 Створюємо параметр ${i + 1}/${parsedParameters.length}: ${param.parameter_name}`);
      
      try {
        await createParameterFn(parameterData);
        successCount++;
        console.log(`✅ Успішно створено: ${param.parameter_name}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Помилка створення параметру ${param.parameter_name}:`, error);
        // Продовжуємо створювати інші параметри навіть якщо один не вдалося створити
      }
    }
    
    console.log(`🎉 Імпорт завершено!`);
    console.log(`✅ Успішно створено: ${successCount} параметрів`);
    console.log(`❌ Помилок: ${errorCount}`);
    
    return successCount;
  } catch (error) {
    console.error('💥 Критична помилка імпорту XML параметрів:', error);
    throw error;
  }
};
