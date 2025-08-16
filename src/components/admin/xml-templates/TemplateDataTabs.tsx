
// Компонент з вкладками для відображення всіх даних XML шаблону
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Save, Plus, Trash2, Edit } from 'lucide-react';
import { ParsedXMLStructure } from '@/utils/advancedXmlParser';

interface TemplateDataTabsProps {
  structure: ParsedXMLStructure;
  onSave: (structure: ParsedXMLStructure) => void;
  isEditable?: boolean;
}

const TemplateDataTabs = ({ structure, onSave, isEditable = true }: TemplateDataTabsProps) => {
  const [editableStructure, setEditableStructure] = useState<ParsedXMLStructure>(structure);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    onSave(editableStructure);
    setHasChanges(false);
  };

  const updateShopInfo = (field: keyof typeof editableStructure.shop, value: string) => {
    setEditableStructure(prev => ({
      ...prev,
      shop: { ...prev.shop, [field]: value }
    }));
    setHasChanges(true);
  };

  const updateCurrency = (index: number, field: 'id' | 'rate', value: string) => {
    setEditableStructure(prev => ({
      ...prev,
      currencies: prev.currencies.map((currency, i) => 
        i === index ? { ...currency, [field]: value } : currency
      )
    }));
    setHasChanges(true);
  };

  const addCurrency = () => {
    setEditableStructure(prev => ({
      ...prev,
      currencies: [...prev.currencies, { id: '', rate: '1' }]
    }));
    setHasChanges(true);
  };

  const removeCurrency = (index: number) => {
    setEditableStructure(prev => ({
      ...prev,
      currencies: prev.currencies.filter((_, i) => i !== index)
    }));
    setHasChanges(true);
  };

  const updateCategory = (index: number, field: 'id' | 'name', value: string) => {
    setEditableStructure(prev => ({
      ...prev,
      categories: prev.categories.map((category, i) => 
        i === index ? { ...category, [field]: value } : category
      )
    }));
    setHasChanges(true);
  };

  const addCategory = () => {
    setEditableStructure(prev => ({
      ...prev,
      categories: [...prev.categories, { id: '', name: '' }]
    }));
    setHasChanges(true);
  };

  const removeCategory = (index: number) => {
    setEditableStructure(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index)
    }));
    setHasChanges(true);
  };

  return (
    <div className="space-y-4">
      {hasChanges && isEditable && (
        <div className="flex justify-end">
          <Button onClick={handleSave} className="gap-2" id="save-template-changes">
            <Save className="h-4 w-4" />
            Зберегти зміни
          </Button>
        </div>
      )}

      <Tabs defaultValue="shop" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="shop">Основна інформація</TabsTrigger>
          <TabsTrigger value="currencies">
            Валюти 
            <Badge variant="secondary" className="ml-2">
              {editableStructure.currencies.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="categories">
            Категорії 
            <Badge variant="secondary" className="ml-2">
              {editableStructure.categories.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="offers">
            Товари 
            <Badge variant="secondary" className="ml-2">
              {editableStructure.offers.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="characteristics">Характеристики</TabsTrigger>
        </TabsList>

        <TabsContent value="shop" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🏪 Основна інформація магазину
              </CardTitle>
              <CardDescription>
                Налаштування основної інформації про магазин
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shop-name">Назва магазину</Label>
                  <Input
                    id="shop-name"
                    value={editableStructure.shop.name || ''}
                    onChange={(e) => updateShopInfo('name', e.target.value)}
                    placeholder="Введіть назву магазину"
                    disabled={!isEditable}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop-company">Назва компанії</Label>
                  <Input
                    id="shop-company"
                    value={editableStructure.shop.company || ''}
                    onChange={(e) => updateShopInfo('company', e.target.value)}
                    placeholder="Введіть назву компанії"
                    disabled={!isEditable}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop-url">URL магазину</Label>
                <Input
                  id="shop-url"
                  value={editableStructure.shop.url || ''}
                  onChange={(e) => updateShopInfo('url', e.target.value)}
                  placeholder="https://www.example.com"
                  disabled={!isEditable}
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
                    💱 Валюти
                  </CardTitle>
                  <CardDescription>
                    Налаштування валют та їх курсів
                  </CardDescription>
                </div>
                {isEditable && (
                  <Button onClick={addCurrency} size="sm" className="gap-2" id="add-currency-button">
                    <Plus className="h-4 w-4" />
                    Додати валюту
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editableStructure.currencies.map((currency, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Код валюти</Label>
                      <Input
                        value={currency.id}
                        onChange={(e) => updateCurrency(index, 'id', e.target.value)}
                        placeholder="USD, EUR, UAH..."
                        disabled={!isEditable}
                        id={`currency-id-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Курс</Label>
                      <Input
                        value={currency.rate}
                        onChange={(e) => updateCurrency(index, 'rate', e.target.value)}
                        placeholder="1.00"
                        disabled={!isEditable}
                        id={`currency-rate-${index}`}
                      />
                    </div>
                  </div>
                  {isEditable && (
                    <Button
                      onClick={() => removeCurrency(index)}
                      variant="destructive"
                      size="sm"
                      id={`remove-currency-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {editableStructure.currencies.length === 0 && (
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
                    📂 Категорії
                  </CardTitle>
                  <CardDescription>
                    Категорії товарів з магазину
                  </CardDescription>
                </div>
                {isEditable && (
                  <Button onClick={addCategory} size="sm" className="gap-2" id="add-category-button">
                    <Plus className="h-4 w-4" />
                    Додати категорію
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editableStructure.categories.map((category, index) => (
                <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>ID категорії</Label>
                      <Input
                        value={category.id}
                        onChange={(e) => updateCategory(index, 'id', e.target.value)}
                        placeholder="1, 2, 3..."
                        disabled={!isEditable}
                        id={`category-id-${index}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Назва категорії</Label>
                      <Input
                        value={category.name}
                        onChange={(e) => updateCategory(index, 'name', e.target.value)}
                        placeholder="Назва категорії"
                        disabled={!isEditable}
                        id={`category-name-${index}`}
                      />
                    </div>
                  </div>
                  {isEditable && (
                    <Button
                      onClick={() => removeCategory(index)}
                      variant="destructive"
                      size="sm"
                      id={`remove-category-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {editableStructure.categories.length === 0 && (
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
                🎁 Товари
              </CardTitle>
              <CardDescription>
                Перелік товарів з повною інформацією
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editableStructure.offers.length > 0 ? (
                <div className="space-y-6">
                  {editableStructure.offers.slice(0, 3).map((offer, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg">
                          📦 Товар #{offer.id} 
                          {offer.available === 'false' && (
                            <Badge variant="destructive" className="ml-2">Недоступний</Badge>
                          )}
                        </h4>
                        <Badge variant="outline">Офер {index + 1}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div><strong>💲 Ціна:</strong> {offer.price || 'Не вказано'}</div>
                        <div><strong>💱 Валюта:</strong> {offer.currencyId || 'Не вказано'}</div>
                        <div><strong>🗂️ Категорія:</strong> {offer.categoryId || 'Не вказано'}</div>
                        <div><strong>🏷️ Виробник:</strong> {offer.vendor || 'Не вказано'}</div>
                        <div><strong>🔖 Артикул:</strong> {offer.article || 'Не вказано'}</div>
                        <div><strong>📦 Кількість:</strong> {offer.stock_quantity || 'Не вказано'}</div>
                      </div>

                      {offer.name && (
                        <div><strong>🏷️ Назва (RU):</strong> {offer.name}</div>
                      )}
                      {offer.name_ua && (
                        <div><strong>🏷️ Назва (UA):</strong> {offer.name_ua}</div>
                      )}

                      {offer.pictures.length > 0 && (
                        <div>
                          <strong>🖼️ Зображення ({offer.pictures.length}):</strong>
                          <div className="mt-2 space-y-1">
                            {offer.pictures.map((picture, picIndex) => (
                              <div key={picIndex} className="text-xs text-blue-600 break-all">
                                {picture}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {offer.characteristics.length > 0 && (
                        <div>
                          <strong>📏 Характеристики ({offer.characteristics.length}):</strong>
                          <div className="mt-2 grid gap-2">
                            {offer.characteristics.map((char, charIndex) => (
                              <div key={charIndex} className="text-sm border-l-2 pl-3">
                                <div className="font-medium">{char.name}:</div>
                                {char.values.map((val, valIndex) => (
                                  <div key={valIndex} className="text-gray-600 ml-2">
                                    {val.lang && (
                                      <Badge variant="outline" className="mr-2 text-xs">
                                        {val.lang.toUpperCase()}
                                      </Badge>
                                    )}
                                    {val.value}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {editableStructure.offers.length > 3 && (
                    <div className="text-center py-4 text-gray-500">
                      ... та ще {editableStructure.offers.length - 3} товарів
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

        <TabsContent value="characteristics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📏 Характеристики
              </CardTitle>
              <CardDescription>
                Всі характеристики товарів згруповані по назвах
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Групуємо всі характеристики по назвах
                const groupedCharacteristics = editableStructure.offers
                  .flatMap(offer => offer.characteristics)
                  .reduce((acc, char) => {
                    if (!acc[char.name]) {
                      acc[char.name] = [];
                    }
                    acc[char.name].push(...char.values);
                    return acc;
                  }, {} as Record<string, Array<{ value: string; lang?: string }>>);

                const characteristicNames = Object.keys(groupedCharacteristics);

                return characteristicNames.length > 0 ? (
                  <div className="space-y-4">
                    {characteristicNames.map((name, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-2">📏 {name}</h4>
                        <div className="space-y-2">
                          {Array.from(new Set(
                            groupedCharacteristics[name].map(v => `${v.value}|${v.lang || ''}`)
                          )).map((uniqueValue, valueIndex) => {
                            const [value, lang] = uniqueValue.split('|');
                            return (
                              <div key={valueIndex} className="flex items-center gap-2">
                                {lang && (
                                  <Badge variant="outline" className="text-xs">
                                    {lang.toUpperCase()}
                                  </Badge>
                                )}
                                <span className="text-sm">{value}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Характеристики не знайдено
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TemplateDataTabs;
