
// Компонент з вкладками для відображення всіх даних XML шаблону в деревоподібній структурі
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ParsedXMLStructure } from '@/utils/advancedXmlParser';
import EditableTreeNode from './EditableTreeNode';

interface TemplateDataTabsProps {
  structure: ParsedXMLStructure;
  onSave: (structure: ParsedXMLStructure) => void;
  isEditable?: boolean;
  templateId?: string;
}

const TemplateDataTabs = ({ structure, onSave, isEditable = true }: TemplateDataTabsProps) => {
  const [editableStructure, setEditableStructure] = useState<ParsedXMLStructure>(structure);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    onSave(editableStructure);
    setHasChanges(false);
  };

  // Функції для редагування основної інформації
  const updateShopInfo = (field: keyof typeof editableStructure.shop, value: string) => {
    setEditableStructure(prev => ({
      ...prev,
      shop: { ...prev.shop, [field]: value }
    }));
    setHasChanges(true);
  };

  // Функції для валют
  const updateCurrency = (index: number, field: 'id' | 'rate', value: string) => {
    setEditableStructure(prev => ({
      ...prev,
      currencies: (prev.currencies || []).map((currency, i) => 
        i === index ? { ...currency, [field]: value } : currency
      )
    }));
    setHasChanges(true);
  };

  const addCurrency = (position?: { index?: number; type: 'above' | 'below' | 'child' }) => {
    const newCurrency = { id: 'NEW', rate: '1' };
    setEditableStructure(prev => {
      const currencies = [...(prev.currencies || [])];
      if (position && position.index !== undefined) {
        const insertIndex = position.type === 'above' ? position.index : position.index + 1;
        currencies.splice(insertIndex, 0, newCurrency);
      } else {
        currencies.push(newCurrency);
      }
      return { ...prev, currencies };
    });
    setHasChanges(true);
  };

  const deleteCurrency = (index: number) => {
    setEditableStructure(prev => ({
      ...prev,
      currencies: (prev.currencies || []).filter((_, i) => i !== index)
    }));
    setHasChanges(true);
  };

  // Функції для категорій
  const updateCategory = (index: number, field: 'id' | 'name' | 'rz_id', value: string) => {
    setEditableStructure(prev => ({
      ...prev,
      categories: (prev.categories || []).map((category, i) => 
        i === index ? { ...category, [field]: value } : category
      )
    }));
    setHasChanges(true);
  };

  const addCategory = (position?: { index?: number; type: 'above' | 'below' | 'child' }) => {
    const newCategory = { id: '', name: 'Нова категорія' };
    setEditableStructure(prev => {
      const categories = [...(prev.categories || [])];
      if (position && position.index !== undefined) {
        const insertIndex = position.type === 'above' ? position.index : position.index + 1;
        categories.splice(insertIndex, 0, newCategory);
      } else {
        categories.push(newCategory);
      }
      return { ...prev, categories };
    });
    setHasChanges(true);
  };

  const deleteCategory = (index: number) => {
    setEditableStructure(prev => ({
      ...prev,
      categories: (prev.categories || []).filter((_, i) => i !== index)
    }));
    setHasChanges(true);
  };

  // Функція для рендерингу HTML опису
  const renderDescription = (html: string) => {
    if (!html) return 'Немає опису';
    
    // Видаляємо CDATA обгортку якщо є
    const cleanHtml = html.replace(/<!\\[CDATA\\[|\\]\\]>/g, '');
    
    return (
      <div 
        className="prose prose-sm max-w-none text-sm"
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  };

  return (
    <div className="space-y-4">
      {hasChanges && isEditable && (
        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2" id="save-template-changes">
            💾 Зберегти зміни
          </Button>
        </div>
      )}

      <Tabs defaultValue="shop" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="shop">🛍️ Основна інформація</TabsTrigger>
          <TabsTrigger value="currencies">
            💱 Валюти 
            <Badge variant="secondary" className="ml-2">
              {(editableStructure.currencies || []).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="categories">
            📂 Категорії 
            <Badge variant="secondary" className="ml-2">
              {(editableStructure.categories || []).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="offers">
            🎁 Товари 
            <Badge variant="secondary" className="ml-2">
              {(editableStructure.offers || []).length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shop" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    🛍️ shop
                  </CardTitle>
                  <CardDescription>
                    Основна інформація про магазин
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <EditableTreeNode
                  icon="🏪"
                  label="name"
                  value={editableStructure.shop?.name || ''}
                  onEdit={(value) => updateShopInfo('name', value)}
                  id="shop-name-node"
                />
                <EditableTreeNode
                  icon="🏢"
                  label="company"
                  value={editableStructure.shop?.company || ''}
                  onEdit={(value) => updateShopInfo('company', value)}
                  id="shop-company-node"
                />
                <EditableTreeNode
                  icon="🌐"
                  label="url"
                  value={editableStructure.shop?.url || ''}
                  onEdit={(value) => updateShopInfo('url', value)}
                  id="shop-url-node"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="currencies" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    💱 currencies
                  </CardTitle>
                  <CardDescription>
                    Валюти та їх курси
                  </CardDescription>
                </div>
                {isEditable && (
                  <Button onClick={() => addCurrency()} size="sm" className="gap-2" id="add-currency-root">
                    <Plus className="h-4 w-4" />
                    Додати валюту
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {(editableStructure.currencies || []).length > 0 ? (
                <div className="space-y-2">
                  {(editableStructure.currencies || []).map((currency, index) => (
                    <EditableTreeNode
                      key={index}
                      icon={currency.id === 'UAH' ? '💰' : currency.id === 'USD' ? '💵' : currency.id === 'EUR' ? '💶' : '💱'}
                      label="currency"
                      value={`(id="${currency.id}", rate="${currency.rate}")`}
                      onAddAbove={() => addCurrency({ index, type: 'above' })}
                      onAddBelow={() => addCurrency({ index, type: 'below' })}
                      onDelete={() => deleteCurrency(index)}
                      id={`currency-node-${index}`}
                    >
                      <EditableTreeNode
                        icon="🆔"
                        label="id"
                        value={currency.id}
                        onEdit={(value) => updateCurrency(index, 'id', value)}
                        level={1}
                        id={`currency-id-${index}`}
                      />
                      <EditableTreeNode
                        icon="📈"
                        label="rate"
                        value={currency.rate}
                        onEdit={(value) => updateCurrency(index, 'rate', value)}
                        level={1}
                        id={`currency-rate-${index}`}
                      />
                    </EditableTreeNode>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Валюти не знайдено. Додайте першу валюту.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    📂 categories
                  </CardTitle>
                  <CardDescription>
                    Категорії товарів з магазину
                  </CardDescription>
                </div>
                {isEditable && (
                  <Button onClick={() => addCategory()} size="sm" className="gap-2" id="add-category-root">
                    <Plus className="h-4 w-4" />
                    Додати категорію
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {(editableStructure.categories || []).length > 0 ? (
                <div className="space-y-2">
                  {(editableStructure.categories || []).map((category, index) => (
                    <EditableTreeNode
                      key={index}
                      icon="📁"
                      label="category"
                      value={`(id="${category.id}"): "${category.name}"`}
                      onAddAbove={() => addCategory({ index, type: 'above' })}
                      onAddBelow={() => addCategory({ index, type: 'below' })}
                      onDelete={() => deleteCategory(index)}
                      id={`category-node-${index}`}
                    >
                      <EditableTreeNode
                        icon="🆔"
                        label="id"
                        value={category.id}
                        onEdit={(value) => updateCategory(index, 'id', value)}
                        level={1}
                        id={`category-id-${index}`}
                      />
                      <EditableTreeNode
                        icon="📝"
                        label="name"
                        value={category.name}
                        onEdit={(value) => updateCategory(index, 'name', value)}
                        level={1}
                        id={`category-name-${index}`}
                      />
                      {category.rz_id && (
                        <EditableTreeNode
                          icon="🔗"
                          label="rz_id"
                          value={category.rz_id}
                          onEdit={(value) => updateCategory(index, 'rz_id', value)}
                          level={1}
                          id={`category-rzid-${index}`}
                        />
                      )}
                    </EditableTreeNode>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Категорії не знайдено. Додайте першу категорію.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎁 offers
              </CardTitle>
              <CardDescription>
                Перелік товарів з повною інформацією
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(editableStructure.offers || []).length > 0 ? (
                <div className="space-y-6">
                  {(editableStructure.offers || []).slice(0, 3).map((offer, index) => (
                    <div key={index} className="space-y-2">
                      <EditableTreeNode
                        icon="📦"
                        label="offer"
                        value={`(id="${offer.id}", available="${offer.available}")`}
                        id={`offer-node-${index}`}
                      >
                        {/* Основні параметри товару */}
                        <EditableTreeNode icon="💲" label="price" value={String(offer.price)} level={1} />
                        {offer.price_old && <EditableTreeNode icon="💲" label="price_old" value={String(offer.price_old)} level={1} />}
                        {offer.price_promo && <EditableTreeNode icon="💲" label="price_promo" value={String(offer.price_promo)} level={1} />}
                        <EditableTreeNode icon="💱" label="currencyId" value={offer.currencyId} level={1} />
                        <EditableTreeNode icon="🗂️" label="categoryId" value={String(offer.categoryId)} level={1} />
                        
                        {/* Зображення */}
                        {(offer.pictures || []).map((picture, picIndex) => (
                          <EditableTreeNode 
                            key={picIndex}
                            icon="🖼️" 
                            label="picture" 
                            value={picture} 
                            level={1} 
                          />
                        ))}
                        
                        {/* Інформація про товар */}
                        {offer.vendor && <EditableTreeNode icon="🏷️" label="vendor" value={offer.vendor} level={1} />}
                        {offer.article && <EditableTreeNode icon="🔖" label="article" value={String(offer.article)} level={1} />}
                        {offer.vendorCode && <EditableTreeNode icon="📦" label="vendorCode" value={offer.vendorCode} level={1} />}
                        {(offer.stock_quantity || offer.quantity_in_stock) && (
                          <EditableTreeNode 
                            icon="📦" 
                            label="stock_quantity" 
                            value={String(offer.stock_quantity || offer.quantity_in_stock)} 
                            level={1} 
                          />
                        )}
                        {offer.state && <EditableTreeNode icon="📋" label="state" value={offer.state} level={1} />}
                        {offer.url && <EditableTreeNode icon="🔗" label="url" value={offer.url} level={1} />}
                        
                        {/* Назви */}
                        <EditableTreeNode icon="🏷️" label="name" value={offer.name} level={1} />
                        {offer.name_ua && <EditableTreeNode icon="🏷️" label="name_ua" value={offer.name_ua} level={1} />}
                        {offer.model && <EditableTreeNode icon="🏷️" label="model" value={offer.model} level={1} />}
                        {offer.model_ua && <EditableTreeNode icon="🏷️" label="model_ua" value={offer.model_ua} level={1} />}
                        
                        {/* Описи */}
                        {offer.description && (
                          <div className="pl-6 border-l-2 border-gray-200">
                            <div className="flex items-start gap-2 p-2">
                              <span className="text-lg">📝</span>
                              <span className="text-sm text-gray-600">description:</span>
                              <div className="flex-1 text-sm">
                                {renderDescription(offer.description)}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {offer.description_ua && (
                          <div className="pl-6 border-l-2 border-gray-200">
                            <div className="flex items-start gap-2 p-2">
                              <span className="text-lg">📝</span>
                              <span className="text-sm text-gray-600">description_ua:</span>
                              <div className="flex-1 text-sm">
                                {renderDescription(offer.description_ua)}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Коротки описи */}
                        {offer.docket && <EditableTreeNode icon="📄" label="docket" value={offer.docket} level={1} />}
                        {offer.docket_ua && <EditableTreeNode icon="📄" label="docket_ua" value={offer.docket_ua} level={1} />}

                        {/* Характеристики */}
                        {(offer.characteristics || []).map((char, charIndex) => (
                          <EditableTreeNode
                            key={charIndex}
                            icon="📏"
                            label="param"
                            value={`(name="${char.name}")`}
                            level={1}
                          >
                            {char.language ? (
                              <EditableTreeNode
                                icon={char.language === 'uk' ? '🇺🇦' : char.language === 'ru' ? '🇷🇺' : '🏳️'}
                                label={`value (lang="${char.language}")`}
                                value={`"${char.value}"`}
                                level={2}
                              />
                            ) : (
                              <EditableTreeNode
                                icon="📊"
                                label="value"
                                value={`"${char.value}"`}
                                level={2}
                              />
                            )}
                            {char.unit && (
                              <EditableTreeNode
                                icon="📐"
                                label="unit"
                                value={char.unit}
                                level={2}
                              />
                            )}
                          </EditableTreeNode>
                        ))}
                      </EditableTreeNode>
                    </div>
                  ))}
                  
                  {(editableStructure.offers || []).length > 3 && (
                    <div className="text-center py-4 text-gray-500">
                      ... та ще {(editableStructure.offers || []).length - 3} товарів
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Товари не знайдено
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TemplateDataTabs;
