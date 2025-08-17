
// Оновлений компонент вкладок даних шаблону з параметрами та характеристиками
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import { ParsedXMLStructure } from '@/utils/advancedXmlParser';
import { useXMLTemplateParameters } from '@/hooks/xml-templates/useXMLTemplateParameters';
import CompactTreeNode from './CompactTreeNode';
import ExpandableText from './ExpandableText';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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

  // Фільтруємо параметри за категоріями
  const getParametersByCategory = (category: string) => {
    return (parameters || []).filter(p => p.parameter_category === category);
  };

  // Захищаємо від undefined values
  const safeCurrencies = structure.currencies || [];
  const safeCategories = structure.categories || [];
  const safeOffers = structure.offers || [];

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
        <CardContent className="p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="shop" className="text-xs">🛍️ Магазин</TabsTrigger>
              <TabsTrigger value="currencies" className="text-xs">💱 Валюти</TabsTrigger>
              <TabsTrigger value="categories" className="text-xs">📂 Категорії</TabsTrigger>
              <TabsTrigger value="offers" className="text-xs">🎁 Товари</TabsTrigger>
              <TabsTrigger value="parameters" className="text-xs">📋 Параметри</TabsTrigger>
              <TabsTrigger value="characteristics" className="text-xs">📏 Характеристики</TabsTrigger>
            </TabsList>

            {/* Вкладка магазину */}
            <TabsContent value="shop" className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Основна інформація</h3>
                {isEditable && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleAddShopParameter}>
                        <Plus className="h-3 w-3 mr-2" />
                        Додати параметр магазину
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              <div className="border rounded-lg bg-white">
                <CompactTreeNode
                  icon="🏪"
                  label="name"
                  value={structure.shop?.name || ''}
                  id="shop-name"
                  onEdit={isEditable ? (newValue) => console.log('Edit shop name:', newValue) : undefined}
                />
                <CompactTreeNode
                  icon="🏢"
                  label="company"
                  value={structure.shop?.company || ''}
                  id="shop-company"
                  onEdit={isEditable ? (newValue) => console.log('Edit shop company:', newValue) : undefined}
                />
                <CompactTreeNode
                  icon="🌐"
                  label="url"
                  value={structure.shop?.url || ''}
                  id="shop-url"
                  onEdit={isEditable ? (newValue) => console.log('Edit shop url:', newValue) : undefined}
                />
                
                {/* Параметри магазину */}
                {getParametersByCategory('parameter').map((param) => (
                  <CompactTreeNode
                    key={param.id}
                    icon="📋"
                    label={param.parameter_name}
                    value={param.parameter_value || ''}
                    id={`param-${param.id}`}
                    onEdit={isEditable ? (newValue) => updateParameter(param.id, { parameter_value: newValue }) : undefined}
                    onDelete={isEditable ? () => deleteParameter(param.id) : undefined}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Вкладка валют */}
            <TabsContent value="currencies" className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Валюти ({safeCurrencies.length})</h3>
                {isEditable && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleAddCurrencyParameter}>
                        <Plus className="h-3 w-3 mr-2" />
                        Додати валюту
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              <div className="border rounded-lg bg-white">
                {safeCurrencies.map((currency) => (
                  <CompactTreeNode
                    key={currency.id}
                    icon="💰"
                    label="currency"
                    value={`id="${currency.id}", rate="${currency.rate}"`}
                    id={`currency-${currency.id}`}
                    onEdit={isEditable ? (newValue) => console.log('Edit currency:', newValue) : undefined}
                    onDelete={isEditable ? () => console.log('Delete currency:', currency.id) : undefined}
                    onAddAbove={isEditable ? handleAddCurrencyParameter : undefined}
                    onAddBelow={isEditable ? handleAddCurrencyParameter : undefined}
                  />
                ))}
                
                {/* Параметри валют */}
                {getParametersByCategory('currency').map((param) => (
                  <CompactTreeNode
                    key={param.id}
                    icon="💱"
                    label={param.parameter_name}
                    value={param.parameter_value || ''}
                    id={`currency-param-${param.id}`}
                    onEdit={isEditable ? (newValue) => updateParameter(param.id, { parameter_value: newValue }) : undefined}
                    onDelete={isEditable ? () => deleteParameter(param.id) : undefined}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Вкладка категорій */}
            <TabsContent value="categories" className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Категорії ({safeCategories.length})</h3>
                {isEditable && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleAddCategoryParameter}>
                        <Plus className="h-3 w-3 mr-2" />
                        Додати категорію
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              <div className="border rounded-lg bg-white">
                {safeCategories.map((category) => (
                  <CompactTreeNode
                    key={category.id}
                    icon="📂"
                    label="category"
                    value={`id="${category.id}": "${category.name}"`}
                    id={`category-${category.id}`}
                    onEdit={isEditable ? (newValue) => console.log('Edit category:', newValue) : undefined}
                    onDelete={isEditable ? () => console.log('Delete category:', category.id) : undefined}
                    onAddAbove={isEditable ? handleAddCategoryParameter : undefined}
                    onAddBelow={isEditable ? handleAddCategoryParameter : undefined}
                  />
                ))}
                
                {/* Параметри категорій */}
                {getParametersByCategory('category').map((param) => (
                  <CompactTreeNode
                    key={param.id}
                    icon="📂"
                    label={param.parameter_name}
                    value={param.parameter_value || ''}
                    id={`category-param-${param.id}`}
                    onEdit={isEditable ? (newValue) => updateParameter(param.id, { parameter_value: newValue }) : undefined}
                    onDelete={isEditable ? () => deleteParameter(param.id) : undefined}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Вкладка товарів */}
            <TabsContent value="offers" className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Товари ({safeOffers.length})</h3>
                {isEditable && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <Settings className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleAddOfferParameter}>
                        <Plus className="h-3 w-3 mr-2" />
                        Додати параметр товару
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              <div className="border rounded-lg bg-white max-h-96 overflow-y-auto">
                {safeOffers.slice(0, 3).map((offer) => (
                  <div key={offer.id} className="border-b last:border-b-0">
                    <CompactTreeNode
                      icon="📦"
                      label="offer"
                      value={`id="${offer.id}", available="${offer.available}"`}
                      id={`offer-${offer.id}`}
                      level={0}
                    >
                      {/* Основні поля товару */}
                      <CompactTreeNode icon="💲" label="price" value={String(offer.price)} level={1} />
                      {offer.price_old && <CompactTreeNode icon="💰" label="price_old" value={String(offer.price_old)} level={1} />}
                      {offer.price_promo && <CompactTreeNode icon="🏷️" label="price_promo" value={String(offer.price_promo)} level={1} />}
                      <CompactTreeNode icon="💱" label="currencyId" value={offer.currencyId} level={1} />
                      <CompactTreeNode icon="🗂️" label="categoryId" value={String(offer.categoryId)} level={1} />
                      
                      {/* Зображення */}
                      {(offer.pictures || []).map((pic, picIndex) => (
                        <CompactTreeNode
                          key={picIndex}
                          icon="🖼️"
                          label="picture"
                          value={pic}
                          level={1}
                          isExpandable={true}
                        />
                      ))}
                      
                      {/* Основна інформація */}
                      {offer.vendor && <CompactTreeNode icon="🏷️" label="vendor" value={offer.vendor} level={1} />}
                      {offer.article && <CompactTreeNode icon="🔖" label="article" value={offer.article} level={1} />}
                      {offer.vendorCode && <CompactTreeNode icon="📄" label="vendorCode" value={offer.vendorCode} level={1} />}
                      {offer.stock_quantity && <CompactTreeNode icon="📦" label="stock_quantity" value={String(offer.stock_quantity)} level={1} />}
                      {offer.quantity_in_stock && <CompactTreeNode icon="🏬" label="quantity_in_stock" value={String(offer.quantity_in_stock)} level={1} />}
                      
                      <CompactTreeNode icon="🏷️" label="name" value={offer.name} level={1} isExpandable={true} />
                      {offer.name_ua && <CompactTreeNode icon="🏷️" label="name_ua" value={offer.name_ua} level={1} isExpandable={true} />}
                      {offer.model && <CompactTreeNode icon="📱" label="model" value={offer.model} level={1} />}
                      {offer.model_ua && <CompactTreeNode icon="📱" label="model_ua" value={offer.model_ua} level={1} />}
                      
                      {/* Описи з HTML обробкою */}
                      {offer.description && (
                        <CompactTreeNode
                          icon="📝"
                          label="description"
                          value={offer.description.replace(/<[^>]*>/g, '')}
                          level={1}
                          isExpandable={true}
                        />
                      )}
                      {offer.description_ua && (
                        <CompactTreeNode
                          icon="📝"
                          label="description_ua"
                          value={offer.description_ua.replace(/<[^>]*>/g, '')}
                          level={1}
                          isExpandable={true}
                        />
                      )}
                      
                      {/* Інші поля */}
                      {offer.state && <CompactTreeNode icon="📋" label="state" value={offer.state} level={1} />}
                      {offer.docket && <CompactTreeNode icon="📄" label="docket" value={offer.docket} level={1} isExpandable={true} />}
                      {offer.docket_ua && <CompactTreeNode icon="📄" label="docket_ua" value={offer.docket_ua} level={1} isExpandable={true} />}
                      {offer.url && <CompactTreeNode icon="🌐" label="url" value={offer.url} level={1} isExpandable={true} />}
                    </CompactTreeNode>
                  </div>
                ))}
                
                {/* Параметри товарів */}
                {getParametersByCategory('offer').map((param) => (
                  <CompactTreeNode
                    key={param.id}
                    icon="📋"
                    label={param.parameter_name}
                    value={param.parameter_value || ''}
                    id={`offer-param-${param.id}`}
                    onEdit={isEditable ? (newValue) => updateParameter(param.id, { parameter_value: newValue }) : undefined}
                    onDelete={isEditable ? () => deleteParameter(param.id) : undefined}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Вкладка параметрів */}
            <TabsContent value="parameters" className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  Параметри товарів ({getParametersByCategory('offer').length})
                </h3>
                {isEditable && (
                  <Button onClick={handleAddOfferParameter} size="sm" className="gap-1 h-6">
                    <Plus className="h-3 w-3" />
                    Додати параметр
                  </Button>
                )}
              </div>
              
              <div className="border rounded-lg bg-white">
                {getParametersByCategory('offer').map((param) => (
                  <CompactTreeNode
                    key={param.id}
                    icon="📋"
                    label={param.parameter_name}
                    value={param.parameter_value || ''}
                    id={`param-${param.id}`}
                    onEdit={isEditable ? (newValue) => updateParameter(param.id, { parameter_value: newValue }) : undefined}
                    onDelete={isEditable ? () => deleteParameter(param.id) : undefined}
                    onAddAbove={isEditable ? handleAddOfferParameter : undefined}
                    onAddBelow={isEditable ? handleAddOfferParameter : undefined}
                  />
                ))}
                
                {getParametersByCategory('offer').length === 0 && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Параметри товарів відсутні
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Вкладка характеристик */}
            <TabsContent value="characteristics" className="space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  Характеристики ({getParametersByCategory('characteristic').length})
                </h3>
                {isEditable && (
                  <Button onClick={handleAddCharacteristic} size="sm" className="gap-1 h-6">
                    <Plus className="h-3 w-3" />
                    Додати характеристику
                  </Button>
                )}
              </div>
              
              <div className="border rounded-lg bg-white">
                {/* Характеристики з XML */}
                {safeOffers.length > 0 && safeOffers[0].characteristics && safeOffers[0].characteristics.map((char, index) => (
                  <CompactTreeNode
                    key={index}
                    icon="📏"
                    label={char.name}
                    value={char.value}
                    id={`char-${index}`}
                    level={0}
                  >
                    {char.language && (
                      <CompactTreeNode
                        icon={char.language === 'uk' ? '🇺🇦' : char.language === 'ru' ? '🇷🇺' : '🏳️'}
                        label={`value (lang="${char.language}")`}
                        value={char.value}
                        level={1}
                      />
                    )}
                  </CompactTreeNode>
                ))}
                
                {/* Користувацькі характеристики */}
                {getParametersByCategory('characteristic').map((param) => (
                  <CompactTreeNode
                    key={param.id}
                    icon="📏"
                    label={param.parameter_name}
                    value={param.parameter_value || ''}
                    id={`characteristic-${param.id}`}
                    onEdit={isEditable ? (newValue) => updateParameter(param.id, { parameter_value: newValue }) : undefined}
                    onDelete={isEditable ? () => deleteParameter(param.id) : undefined}
                    onAddAbove={isEditable ? handleAddCharacteristic : undefined}
                    onAddBelow={isEditable ? handleAddCharacteristic : undefined}
                  />
                ))}
                
                {safeOffers.length === 0 && getParametersByCategory('characteristic').length === 0 && (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Характеристики відсутні
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TemplateDataTabs;
