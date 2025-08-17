
// Оновлені вкладки даних шаблону з компактним дизайном
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ParsedXMLStructure } from '@/utils/advancedXmlParser';
import { useXMLTemplateParameters } from '@/hooks/xml-templates/useXMLTemplateParameters';
import ShopInfoTab from './tabs/ShopInfoTab';
import OffersTab from './tabs/OffersTab';
import CharacteristicsTab from './tabs/CharacteristicsTab';
import CompactParameterItem from './CompactParameterItem';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface TemplateDataTabsProps {
  structure: ParsedXMLStructure;
  templateId?: string;
  templateName: string;
  onSave?: (updatedStructure: ParsedXMLStructure) => void;
  isEditable?: boolean;
}

const TemplateDataTabs: React.FC<TemplateDataTabsProps> = ({
  structure,
  templateId,
  templateName,
  onSave,
  isEditable = false
}) => {
  const [activeTab, setActiveTab] = useState('shop');
  const {
    parameters = [],
    createParameterAsync,
    updateParameter: updateParameterMutation,
    deleteParameter: deleteParameterMutation
  } = useXMLTemplateParameters(templateId);

  // Wrapper functions for proper parameter passing
  const updateParameter = (id: string, updates: any) => {
    updateParameterMutation({
      id,
      updates
    });
  };
  
  const deleteParameter = (id: string) => {
    deleteParameterMutation(id);
  };

  // Захищаємо від undefined values
  const safeCurrencies = structure.currencies || [];
  const safeCategories = structure.categories || [];
  const safeOffers = structure.offers || [];

  // Підраховуємо кількість параметрів кожної категорії
  const offerParametersCount = (parameters || []).filter(p => p.parameter_category === 'offer').length;

  // Handler functions for adding parameters
  const handleAddShopParameter = async () => {
    if (!templateId) return;
    try {
      await createParameterAsync({
        template_id: templateId,
        parameter_name: 'Новий параметр магазину',
        parameter_value: '',
        parameter_type: 'text',
        parameter_category: 'parameter',
        xml_path: 'shop/',
        is_active: true,
        is_required: false,
        display_order: 0
      });
    } catch (error) {
      console.error('Помилка створення параметру:', error);
    }
  };
  
  const handleAddCurrencyParameter = async () => {
    if (!templateId) return;
    try {
      await createParameterAsync({
        template_id: templateId,
        parameter_name: 'Нова валюта',
        parameter_value: '',
        parameter_type: 'text',
        parameter_category: 'currency',
        xml_path: 'shop/currencies/currency',
        is_active: true,
        is_required: false,
        display_order: 0
      });
    } catch (error) {
      console.error('Помилка створення валюти:', error);
    }
  };
  
  const handleAddCategoryParameter = async () => {
    if (!templateId) return;
    try {
      await createParameterAsync({
        template_id: templateId,
        parameter_name: 'Нова категорія',
        parameter_value: '',
        parameter_type: 'text',
        parameter_category: 'category',
        xml_path: 'shop/categories/category',
        is_active: true,
        is_required: false,
        display_order: 0
      });
    } catch (error) {
      console.error('Помилка створення категорії:', error);
    }
  };
  
  const handleAddOfferParameter = async () => {
    if (!templateId) return;
    try {
      await createParameterAsync({
        template_id: templateId,
        parameter_name: 'Новий параметр товару',
        parameter_value: '',
        parameter_type: 'text',
        parameter_category: 'offer',
        xml_path: 'shop/offers/offer/',
        is_active: true,
        is_required: false,
        display_order: 0
      });
    } catch (error) {
      console.error('Помилка створення параметру товару:', error);
    }
  };
  
  const handleAddCharacteristic = async () => {
    if (!templateId) return;
    try {
      await createParameterAsync({
        template_id: templateId,
        parameter_name: 'Нова характеристика',
        parameter_value: '',
        parameter_type: 'text',
        parameter_category: 'characteristic',
        xml_path: 'shop/offers/offer/param',
        is_active: true,
        is_required: false,
        display_order: 0
      });
    } catch (error) {
      console.error('Помилка створення характеристики:', error);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="shop" className="text-sm">🏪 Магазин</TabsTrigger>
              <TabsTrigger value="currencies" className="text-sm">💱 Валюти</TabsTrigger>
              <TabsTrigger value="categories" className="text-sm">📂 Категорії</TabsTrigger>
              <TabsTrigger value="offers" className="text-sm">⚙️ Параметри</TabsTrigger>
              <TabsTrigger value="characteristics" className="text-sm">📏 Характеристики</TabsTrigger>
            </TabsList>

            {/* Вкладка магазину */}
            <TabsContent value="shop" className="mt-6">
              <ShopInfoTab 
                structure={structure}
                parameters={parameters || []}
                isEditable={isEditable}
                onAddParameter={handleAddShopParameter}
                onUpdateParameter={updateParameter}
                onDeleteParameter={deleteParameter}
              />
            </TabsContent>

            {/* Вкладка валют */}
            <TabsContent value="currencies" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">Валюти ({safeCurrencies.length})</h3>
                    <p className="text-sm text-gray-600">Налаштування валют магазину</p>
                  </div>
                  {isEditable && (
                    <Button 
                      onClick={handleAddCurrencyParameter} 
                      size="sm" 
                      className="gap-2"
                      id="add-currency-parameter"
                    >
                      <Plus className="h-4 w-4" />
                      Додати валюту
                    </Button>
                  )}
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {safeCurrencies.map(currency => (
                    <CompactParameterItem
                      key={currency.id}
                      label={`Валюта ${currency.id}`}
                      value={`Курс: ${currency.rate}`}
                      category="currency"
                      id={`currency-${currency.id}`}
                      onEdit={isEditable ? (newValue) => console.log('Edit currency:', newValue) : undefined}
                    />
                  ))}
                  
                  {(parameters || []).filter(p => p.parameter_category === 'currency').map(param => (
                    <CompactParameterItem
                      key={param.id}
                      label={param.parameter_name}
                      value={param.parameter_value || ''}
                      category="currency"
                      id={`currency-param-${param.id}`}
                      onEdit={isEditable ? (newValue) => updateParameter(param.id, { parameter_value: newValue }) : undefined}
                      onDelete={isEditable ? () => deleteParameter(param.id) : undefined}
                      onAdd={isEditable ? handleAddCurrencyParameter : undefined}
                    />
                  ))}
                  
                  {safeCurrencies.length === 0 && (parameters || []).filter(p => p.parameter_category === 'currency').length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                      <p>Валюти відсутні</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Вкладка категорій */}
            <TabsContent value="categories" className="mt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">Категорії ({safeCategories.length})</h3>
                    <p className="text-sm text-gray-600">Структура категорій товарів</p>
                  </div>
                  {isEditable && (
                    <Button 
                      onClick={handleAddCategoryParameter} 
                      size="sm" 
                      className="gap-2"
                      id="add-category-parameter"
                    >
                      <Plus className="h-4 w-4" />
                      Додати категорію
                    </Button>
                  )}
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {safeCategories.map(category => (
                    <CompactParameterItem
                      key={category.id}
                      label={category.name}
                      value={`ID: ${category.id}${category.parentId ? `, Батьківська: ${category.parentId}` : ''}`}
                      category="category"
                      id={`category-${category.id}`}
                      onEdit={isEditable ? (newValue) => console.log('Edit category:', newValue) : undefined}
                    />
                  ))}
                  
                  {(parameters || []).filter(p => p.parameter_category === 'category').map(param => (
                    <CompactParameterItem
                      key={param.id}
                      label={param.parameter_name}
                      value={param.parameter_value || ''}
                      category="category"
                      id={`category-param-${param.id}`}
                      onEdit={isEditable ? (newValue) => updateParameter(param.id, { parameter_value: newValue }) : undefined}
                      onDelete={isEditable ? () => deleteParameter(param.id) : undefined}
                      onAdd={isEditable ? handleAddCategoryParameter : undefined}
                    />
                  ))}
                  
                  {safeCategories.length === 0 && (parameters || []).filter(p => p.parameter_category === 'category').length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                      <p>Категорії відсутні</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Вкладка параметрів товарів (переіменовано з "товари" на "параметри") */}
            <TabsContent value="offers" className="mt-6">
              <OffersTab 
                structure={structure}
                parameters={parameters || []}
                isEditable={isEditable}
                onAddParameter={handleAddOfferParameter}
                onUpdateParameter={updateParameter}
                onDeleteParameter={deleteParameter}
              />
            </TabsContent>

            {/* Вкладка характеристик */}
            <TabsContent value="characteristics" className="mt-6">
              <CharacteristicsTab 
                structure={structure}
                parameters={parameters || []}
                isEditable={isEditable}
                onAddParameter={handleAddCharacteristic}
                onUpdateParameter={updateParameter}
                onDeleteParameter={deleteParameter}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateDataTabs;
