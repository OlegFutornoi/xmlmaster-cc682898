// Компонент для редагування XML-шаблону конкретного магазину
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Plus, Trash2, Save, Edit, Copy, Eye, EyeOff } from 'lucide-react';
import { useStoreTemplateParameters } from '@/hooks/xml-templates/useStoreTemplateParameters';
import { useUserXMLTemplates } from '@/hooks/xml-templates/useUserXMLTemplates';
import { useToast } from '@/hooks/use-toast';

interface UserStore {
  id: string;
  name: string;
  template_id: string | null;
  created_at: string;
}

interface StoreTemplateEditorProps {
  store: UserStore;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const StoreTemplateEditor: React.FC<StoreTemplateEditorProps> = ({
  store,
  isOpen,
  onOpenChange
}) => {
  const { toast } = useToast();
  const { templates } = useUserXMLTemplates();
  const { 
    parameters, 
    isLoading, 
    isSaving, 
    saveParameter, 
    deleteParameter,
    copyTemplateParameters 
  } = useStoreTemplateParameters(store.id);

  const [editingParameter, setEditingParameter] = useState<any>(null);
  const [isAddingParameter, setIsAddingParameter] = useState(false);
  const [newParameter, setNewParameter] = useState({
    parameter_name: '',
    parameter_value: '',
    xml_path: '',
    parameter_type: 'text',
    parameter_category: 'parameter',
    is_active: true,
    is_required: false
  });

  const currentTemplate = templates.find(t => t.id === store.template_id);

  const handleSaveParameter = async (parameterData: any) => {
    try {
      await saveParameter({
        ...parameterData,
        store_id: store.id,
        template_id: store.template_id || ''
      });
      setEditingParameter(null);
      setIsAddingParameter(false);
      setNewParameter({
        parameter_name: '',
        parameter_value: '',
        xml_path: '',
        parameter_type: 'text',
        parameter_category: 'parameter',
        is_active: true,
        is_required: false
      });
    } catch (error) {
      console.error('Error saving parameter:', error);
    }
  };

  const handleDeleteParameter = async (parameterId: string) => {
    try {
      await deleteParameter(parameterId);
    } catch (error) {
      console.error('Error deleting parameter:', error);
    }
  };

  const handleCopyTemplateParameters = async () => {
    if (!store.template_id) return;
    
    try {
      await copyTemplateParameters(store.template_id, store.id);
      toast({
        title: 'Успішно',
        description: 'Параметри шаблону скопійовано'
      });
    } catch (error) {
      console.error('Error copying parameters:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося скопіювати параметри',
        variant: 'destructive'
      });
    }
  };

  const getParametersByCategory = (category: string) => {
    return parameters.filter(param => param.parameter_category === category);
  };

  const categories = [
    { value: 'parameter', label: 'Параметри', color: 'bg-blue-100 text-blue-800', count: getParametersByCategory('parameter').length },
    { value: 'characteristic', label: 'Характеристики', color: 'bg-green-100 text-green-800', count: getParametersByCategory('characteristic').length },
    { value: 'category', label: 'Категорії', color: 'bg-purple-100 text-purple-800', count: getParametersByCategory('category').length },
    { value: 'offer', label: 'Товари', color: 'bg-orange-100 text-orange-800', count: getParametersByCategory('offer').length }
  ];

  const renderParameterRow = (parameter: any, index: number) => (
    <tr key={parameter.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {parameter.parameter_name}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        {parameter.xml_path}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        <Badge variant="outline" className="text-xs">
          {parameter.parameter_type}
        </Badge>
      </td>
      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
        {parameter.parameter_value || '-'}
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <Badge 
            variant={parameter.is_active ? "default" : "secondary"} 
            className="text-xs"
          >
            {parameter.is_active ? (
              <>
                <Eye className="h-3 w-3 mr-1" />
                Активний
              </>
            ) : (
              <>
                <EyeOff className="h-3 w-3 mr-1" />
                Неактивний
              </>
            )}
          </Badge>
          {parameter.is_required && (
            <Badge variant="destructive" className="text-xs">
              Обов'язковий
            </Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditingParameter(parameter)}
            className="h-8 w-8 p-0"
            type="button"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteParameter(parameter.id)}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </td>
    </tr>
  );

  const renderParameterForm = (parameter: any, isNew: boolean = false) => (
    <Card className="border-2 border-dashed border-emerald-200 bg-emerald-50/50 mb-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-emerald-700">
          {isNew ? <Plus className="h-5 w-5" /> : <Edit className="h-5 w-5" />}
          {isNew ? 'Додати параметр' : 'Редагувати параметр'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="param-name">Назва параметра *</Label>
            <Input
              id="param-name"
              value={parameter.parameter_name}
              onChange={(e) => {
                if (isNew) {
                  setNewParameter(prev => ({ ...prev, parameter_name: e.target.value }));
                } else {
                  setEditingParameter(prev => ({ ...prev, parameter_name: e.target.value }));
                }
              }}
              placeholder="category_id, item_name, price..."
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="param-path">XML шлях *</Label>
            <Input
              id="param-path"
              value={parameter.xml_path}
              onChange={(e) => {
                if (isNew) {
                  setNewParameter(prev => ({ ...prev, xml_path: e.target.value }));
                } else {
                  setEditingParameter(prev => ({ ...prev, xml_path: e.target.value }));
                }
              }}
              placeholder="/yml_catalog/shop/offers/offer/name"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="param-value">Значення за замовчуванням</Label>
          <Textarea
            id="param-value"
            value={parameter.parameter_value || ''}
            onChange={(e) => {
              if (isNew) {
                setNewParameter(prev => ({ ...prev, parameter_value: e.target.value }));
              } else {
                setEditingParameter(prev => ({ ...prev, parameter_value: e.target.value }));
              }
            }}
            placeholder="Значення параметра (необов'язково)"
            rows={2}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="param-type">Тип параметра</Label>
            <Select 
              value={parameter.parameter_type} 
              onValueChange={(value) => {
                if (isNew) {
                  setNewParameter(prev => ({ ...prev, parameter_type: value }));
                } else {
                  setEditingParameter(prev => ({ ...prev, parameter_type: value }));
                }
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Текст</SelectItem>
                <SelectItem value="number">Число</SelectItem>
                <SelectItem value="boolean">Логічний</SelectItem>
                <SelectItem value="date">Дата</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="param-category">Категорія</Label>
            <Select 
              value={parameter.parameter_category} 
              onValueChange={(value) => {
                if (isNew) {
                  setNewParameter(prev => ({ ...prev, parameter_category: value }));
                } else {
                  setEditingParameter(prev => ({ ...prev, parameter_category: value }));
                }
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parameter">Параметр</SelectItem>
                <SelectItem value="characteristic">Характеристика</SelectItem>
                <SelectItem value="category">Категорія</SelectItem>
                <SelectItem value="offer">Товар</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="param-active"
                checked={parameter.is_active}
                onCheckedChange={(checked) => {
                  if (isNew) {
                    setNewParameter(prev => ({ ...prev, is_active: checked }));
                  } else {
                    setEditingParameter(prev => ({ ...prev, is_active: checked }));
                  }
                }}
              />
              <Label htmlFor="param-active" className="text-sm">Активний</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="param-required"
                checked={parameter.is_required}
                onCheckedChange={(checked) => {
                  if (isNew) {
                    setNewParameter(prev => ({ ...prev, is_required: checked }));
                  } else {
                    setEditingParameter(prev => ({ ...prev, is_required: checked }));
                  }
                }}
              />
              <Label htmlFor="param-required" className="text-sm">Обов'язковий</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditingParameter(null);
                setIsAddingParameter(false);
              }}
              type="button"
            >
              Скасувати
            </Button>
            <Button
              onClick={() => handleSaveParameter(parameter)}
              disabled={isSaving || !parameter.parameter_name || !parameter.xml_path}
              className="bg-emerald-500 hover:bg-emerald-600"
              type="button"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Збереження...' : 'Зберегти'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Налаштування шаблону: {store.name}
          </DialogTitle>
          <DialogDescription>
            {currentTemplate ? 
              `Налаштуйте параметри на основі шаблону "${currentTemplate.name}"` :
              'Цей магазин не має прив\'язаного шаблону'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <Tabs defaultValue="parameters" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="parameters">Параметри шаблону</TabsTrigger>
              <TabsTrigger value="info">Інформація</TabsTrigger>
            </TabsList>

            <TabsContent value="parameters" className="space-y-6 mt-4">
              {/* Header з кнопками */}
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Параметри шаблону ({parameters.length})</h3>
                <div className="flex gap-2">
                  {store.template_id && (
                    <Button
                      variant="outline"
                      onClick={handleCopyTemplateParameters}
                      className="flex items-center gap-2"
                      type="button"
                    >
                      <Copy className="h-4 w-4" />
                      Копіювати з шаблону
                    </Button>
                  )}
                  <Button
                    onClick={() => setIsAddingParameter(true)}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600"
                    type="button"
                  >
                    <Plus className="h-4 w-4" />
                    Додати параметр
                  </Button>
                </div>
              </div>

              {/* Форма додавання/редагування */}
              {isAddingParameter && renderParameterForm(newParameter, true)}
              {editingParameter && renderParameterForm(editingParameter)}

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Завантаження параметрів...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Статистика за категоріями */}
                  <div className="grid grid-cols-4 gap-4">
                    {categories.map(category => (
                      <Card key={category.value}>
                        <CardContent className="p-4 text-center">
                          <Badge className={`${category.color} mb-2`}>
                            {category.label}
                          </Badge>
                          <p className="text-2xl font-bold text-gray-900">{category.count}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Таблиця параметрів */}
                  {parameters.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Усі параметри</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Назва
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  XML Шлях
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Тип
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Значення
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Статус
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Дії
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {parameters.map((parameter, index) => renderParameterRow(parameter, index))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="text-center py-12">
                      <CardContent>
                        <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Немає налаштованих параметрів</p>
                        <Button
                          onClick={() => setIsAddingParameter(true)}
                          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600"
                          type="button"
                        >
                          <Plus className="h-4 w-4" />
                          Додати перший параметр
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="info" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Інформація про магазин</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Назва магазину</Label>
                      <p className="font-medium text-lg">{store.name}</p>
                    </div>
                    <div>
                      <Label>Поточний шаблон</Label>
                      <p className="font-medium">
                        {currentTemplate?.name || 'Шаблон не вибрано'}
                      </p>
                    </div>
                    <div>
                      <Label>Дата створення</Label>
                      <p className="font-medium">
                        {new Date(store.created_at).toLocaleDateString('uk-UA')}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Статистика параметрів</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Всього параметрів</Label>
                      <p className="font-medium text-lg">{parameters.length}</p>
                    </div>
                    <div>
                      <Label>Активних параметрів</Label>
                      <p className="font-medium text-green-600">
                        {parameters.filter(p => p.is_active).length}
                      </p>
                    </div>
                    <div>
                      <Label>Обов'язкових параметрів</Label>
                      <p className="font-medium text-red-600">
                        {parameters.filter(p => p.is_required).length}
                      </p>
                    </div>
                    {categories.map(category => {
                      if (category.count === 0) return null;
                      return (
                        <div key={category.value}>
                          <Label>{category.label}</Label>
                          <p className="font-medium">{category.count}</p>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoreTemplateEditor;
