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
import { Settings, Plus, Trash2, Save, Edit, Copy, Eye, EyeOff, Building } from 'lucide-react';
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
      toast({
        title: 'Успішно',
        description: 'Параметр збережено'
      });
    } catch (error) {
      console.error('Error saving parameter:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося зберегти параметр',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteParameter = async (parameterId: string) => {
    try {
      await deleteParameter(parameterId);
      toast({
        title: 'Успішно',
        description: 'Параметр видалено'
      });
    } catch (error) {
      console.error('Error deleting parameter:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося видалити параметр',
        variant: 'destructive'
      });
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

  const handleUpdateParameter = (updatedParameter: any) => {
    handleSaveParameter(updatedParameter);
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
              {/* Основна інформація про шаблон */}
              <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Основна інформація
                  </CardTitle>
                  <CardDescription>
                    Налаштуйте назву, інформацію про магазин та статус XML-шаблону
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template-name">Назва шаблону</Label>
                      <Input 
                        id="template-name" 
                        value={currentTemplate?.name || ''} 
                        disabled
                        placeholder="Назва шаблону" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="shop-name">Назва магазину</Label>
                      <Input 
                        id="shop-name" 
                        value={currentTemplate?.shop_name || ''} 
                        disabled
                        placeholder="Назва магазину з XML" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="shop-company">Назва компанії</Label>
                      <Input 
                        id="shop-company" 
                        value={currentTemplate?.shop_company || ''} 
                        disabled
                        placeholder="Юридична назва компанії" 
                      />
                    </div>
                    <div>
                      <Label htmlFor="shop-url">URL магазину</Label>
                      <Input 
                        id="shop-url" 
                        value={currentTemplate?.shop_url || ''} 
                        disabled
                        placeholder="https://example.com" 
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="template-active" 
                      checked={currentTemplate?.is_active || false} 
                      disabled
                    />
                    <Label htmlFor="template-active">Активний шаблон</Label>
                  </div>
                </CardContent>
              </Card>

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
                      id="copy-template-params"
                    >
                      <Copy className="h-4 w-4" />
                      Копіювати з шаблону
                    </Button>
                  )}
                  <Button
                    onClick={() => setIsAddingParameter(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                    type="button"
                    id="add-parameter-button"
                  >
                    <Plus className="h-4 w-4" />
                    Додати параметр
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
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
                        <CardTitle>Параметри шаблону</CardTitle>
                        <CardDescription>
                          Налаштуйте параметри XML-шаблону для вашого магазину
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Назва параметру
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Значення
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  XML шлях
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Тип
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Категорія
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Дії
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {parameters.map((parameter, index) => (
                                <tr key={parameter.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                    {parameter.parameter_name}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                                    <div className="truncate" title={parameter.parameter_value || ''}>
                                      {parameter.parameter_value || '-'}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600 font-mono text-xs">
                                    <code className="bg-gray-100 px-2 py-1 rounded">
                                      {parameter.xml_path}
                                    </code>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    <Badge variant="outline" className="text-xs">
                                      {parameter.parameter_type === 'text' ? 'Текст' :
                                       parameter.parameter_type === 'number' ? 'Число' :
                                       parameter.parameter_type === 'boolean' ? 'Логічний' :
                                       parameter.parameter_type === 'date' ? 'Дата' :
                                       parameter.parameter_type}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <Badge 
                                      className={
                                        parameter.parameter_category === 'parameter' ? 'bg-blue-100 text-blue-800' :
                                        parameter.parameter_category === 'characteristic' ? 'bg-green-100 text-green-800' :
                                        parameter.parameter_category === 'category' ? 'bg-purple-100 text-purple-800' :
                                        parameter.parameter_category === 'offer' ? 'bg-orange-100 text-orange-800' :
                                        'bg-gray-100 text-gray-800'
                                      }
                                    >
                                      {parameter.parameter_category === 'parameter' ? 'Параметр' :
                                       parameter.parameter_category === 'characteristic' ? 'Характеристика' :
                                       parameter.parameter_category === 'category' ? 'Категорія' :
                                       parameter.parameter_category === 'offer' ? 'Товар' :
                                       parameter.parameter_category}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-3 text-sm">
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setEditingParameter(parameter)}
                                        className="h-8 w-8 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                        type="button"
                                        id={`edit-param-${parameter.id}`}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteParameter(parameter.id)}
                                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                        type="button"
                                        id={`delete-param-${parameter.id}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
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
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                          type="button"
                          id="add-first-param"
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

        {/* Діалог редагування/додавання параметру */}
        {(isAddingParameter || editingParameter) && (
          <StoreParameterForm
            parameter={editingParameter || newParameter}
            isEditing={!!editingParameter}
            onSave={handleSaveParameter}
            onCancel={() => {
              setEditingParameter(null);
              setIsAddingParameter(false);
            }}
            isSaving={isSaving}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

// Окремий компонент для форми параметру
interface StoreParameterFormProps {
  parameter: any;
  isEditing: boolean;
  onSave: (parameter: any) => void;
  onCancel: () => void;
  isSaving: boolean;
}

const StoreParameterForm: React.FC<StoreParameterFormProps> = ({
  parameter,
  isEditing,
  onSave,
  onCancel,
  isSaving
}) => {
  const [formData, setFormData] = useState(parameter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Редагувати параметр' : 'Додати параметр'}
          </DialogTitle>
          <DialogDescription>
            Налаштуйте параметри XML-шаблону для вашого магазину
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="param-name">Назва параметра *</Label>
              <Input
                id="param-name"
                value={formData.parameter_name}
                onChange={(e) => setFormData(prev => ({ ...prev, parameter_name: e.target.value }))}
                placeholder="category_id, item_name, price..."
                required
              />
            </div>
            <div>
              <Label htmlFor="param-path">XML шлях *</Label>
              <Input
                id="param-path"
                value={formData.xml_path}
                onChange={(e) => setFormData(prev => ({ ...prev, xml_path: e.target.value }))}
                placeholder="/yml_catalog/shop/offers/offer/name"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="param-value">Значення за замовчуванням</Label>
            <Textarea
              id="param-value"
              value={formData.parameter_value || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, parameter_value: e.target.value }))}
              placeholder="Значення параметра (необов'язково)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="param-type">Тип параметра</Label>
              <Select 
                value={formData.parameter_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, parameter_type: value }))}
              >
                <SelectTrigger id="param-type">
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
                value={formData.parameter_category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, parameter_category: value }))}
              >
                <SelectTrigger id="param-category">
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
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="param-active" className="text-sm">Активний</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="param-required"
                  checked={formData.is_required}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: checked }))}
                />
                <Label htmlFor="param-required" className="text-sm">Обов'язковий</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
              >
                Скасувати
              </Button>
              <Button
                type="submit"
                disabled={isSaving || !formData.parameter_name || !formData.xml_path}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Збереження...' : 'Зберегти'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default StoreTemplateEditor;
