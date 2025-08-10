
// Компонент для редагування XML-шаблону конкретного магазину з drag-and-drop функціональністю
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings, Plus, Trash2, Save, Edit, Copy, Building, ShoppingCart, DollarSign, FolderTree, Package, GripVertical } from 'lucide-react';
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
  } = useStoreTemplateParameters(store.id, store.template_id || '');
  
  const [editingParameter, setEditingParameter] = useState<any>(null);
  const [isAddingParameter, setIsAddingParameter] = useState(false);
  const [newParameter, setNewParameter] = useState({
    parameter_name: '',
    parameter_value: '',
    xml_path: '',
    parameter_type: 'text',
    parameter_category: 'parameter',
    is_active: true,
    is_required: true
  });

  // Состояние для drag and drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [sortedParameters, setSortedParameters] = useState<any[]>([]);

  const currentTemplate = templates.find(t => t.id === store.template_id);

  // Функція для сортування параметрів згідно з ієрархією XML
  const sortParametersByHierarchy = (params: any[]) => {
    const hierarchyOrder = {
      'parameter': {
        'shop_name': 1,
        'name': 2,
        'company': 3,
        'shop_company': 4,
        'url': 5,
        'shop_url': 6,
      },
      'currency': {
        'currencyId': 10,
        'currency_id': 11,
        'currency_rate': 12,
        'currency_code': 13,
        'rate': 14,
      },
      'category': {
        'category_id': 20,
        'categoryId': 21,
        'category_name': 22,
        'external_id': 23,
        'rz_id': 24,
      },
      'offer': {
        'offer_id': 30,
        'available': 31,
        'price': 32,
        'price_old': 33,
        'price_promo': 34,
        'currencyId': 35,
        'categoryId': 36,
        'picture': 37,
        'vendor': 38,
        'name': 39,
        'description': 40,
        'stock_quantity': 41,
        'url': 42,
      },
      'characteristic': {
        'param': 50,
      }
    };

    return params.sort((a, b) => {
      const categoryA = a.parameter_category || 'parameter';
      const categoryB = b.parameter_category || 'parameter';
      
      const orderA = hierarchyOrder[categoryA as keyof typeof hierarchyOrder]?.[a.parameter_name as keyof any] || 999;
      const orderB = hierarchyOrder[categoryB as keyof typeof hierarchyOrder]?.[b.parameter_name as keyof any] || 999;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      return a.parameter_name.localeCompare(b.parameter_name);
    });
  };

  // Обновляем отсортированные параметры при изменении данных
  useEffect(() => {
    setSortedParameters(sortParametersByHierarchy([...parameters]));
  }, [parameters]);

  const handleSaveParameter = async (parameterData: any) => {
    try {
      console.log('Saving parameter data:', parameterData);
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
        is_required: true
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

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newSortedParameters = [...sortedParameters];
    const draggedItem = newSortedParameters[draggedIndex];
    
    // Удаляем элемент из старой позиции
    newSortedParameters.splice(draggedIndex, 1);
    
    // Вставляем элемент в новую позицию
    newSortedParameters.splice(dropIndex, 0, draggedItem);
    
    setSortedParameters(newSortedParameters);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getParametersByCategory = (category: string) => {
    return parameters.filter(param => param.parameter_category === category);
  };

  const categories = [
    {
      value: 'parameter',
      label: 'Основна інформація',
      color: 'bg-blue-100 text-blue-800',
      count: getParametersByCategory('parameter').length,
      icon: Building,
      description: 'Назва, компанія, URL магазину'
    },
    {
      value: 'currency',
      label: 'Валюти',
      color: 'bg-green-100 text-green-800',
      count: getParametersByCategory('currency').length,
      icon: DollarSign,
      description: 'Валюти та курси обміну'
    },
    {
      value: 'category',
      label: 'Категорії',
      color: 'bg-purple-100 text-purple-800',
      count: getParametersByCategory('category').length,
      icon: FolderTree,
      description: 'Категорії товарів'
    },
    {
      value: 'offer',
      label: 'Товари',
      color: 'bg-orange-100 text-orange-800',
      count: getParametersByCategory('offer').length,
      icon: Package,
      description: 'Інформація про товари'
    },
    {
      value: 'characteristic',
      label: 'Характеристики',
      color: 'bg-red-100 text-red-800',
      count: getParametersByCategory('characteristic').length,
      icon: ShoppingCart,
      description: 'Характеристики товарів'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Налаштування шаблону: {store.name}
          </DialogTitle>
          <DialogDescription>
            {currentTemplate 
              ? `Налаштуйте параметри на основі шаблону "${currentTemplate.name}"` 
              : 'Цей магазин не має прив\'язаного шаблону'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <Tabs defaultValue="general-info" className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general-info" id="general-info-tab">Основна інформація</TabsTrigger>
              <TabsTrigger value="parameters" id="parameters-tab">Параметри шаблону</TabsTrigger>
              <TabsTrigger value="info" id="info-tab">Інформація</TabsTrigger>
            </TabsList>

            <TabsContent value="general-info" className="space-y-6 mt-4">
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
            </TabsContent>

            <TabsContent value="parameters" className="space-y-6 mt-4">
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
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {categories.map(category => {
                      const IconComponent = category.icon;
                      return (
                        <Card key={category.value} className="text-center">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-center mb-2">
                              <IconComponent className="h-6 w-6 text-gray-600" />
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{category.count}</div>
                            <div className="text-sm font-medium text-gray-600">{category.label}</div>
                            <div className="text-xs text-gray-500 mt-1">{category.description}</div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {sortedParameters.length > 0 ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Параметри шаблону (з можливістю перетягування)</CardTitle>
                        <CardDescription>
                          Перетягуйте рядки для зміни порядку. Параметри відсортовані згідно зі структурою XML.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="max-h-96 overflow-y-auto">
                          <Table>
                            <TableHeader className="sticky top-0 bg-white z-10">
                              <TableRow>
                                <TableHead className="w-8"></TableHead>
                                <TableHead>Назва параметру</TableHead>
                                <TableHead>Значення</TableHead>
                                <TableHead>XML шлях</TableHead>
                                <TableHead>Тип</TableHead>
                                <TableHead>Категорія</TableHead>
                                <TableHead>Статус</TableHead>
                                <TableHead>Дії</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sortedParameters.map((parameter, index) => (
                                <TableRow 
                                  key={parameter.id} 
                                  className={`hover:bg-gray-50 cursor-move ${
                                    dragOverIndex === index ? 'bg-blue-50 border-t-2 border-blue-400' : ''
                                  }`}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, index)}
                                  onDragOver={(e) => handleDragOver(e, index)}
                                  onDragLeave={handleDragLeave}
                                  onDrop={(e) => handleDrop(e, index)}
                                >
                                  <TableCell className="text-center">
                                    <GripVertical className="h-4 w-4 text-gray-400" />
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {parameter.parameter_name}
                                  </TableCell>
                                  <TableCell className="max-w-xs">
                                    <div className="truncate" title={parameter.parameter_value || ''}>
                                      {parameter.parameter_value || '-'}
                                    </div>
                                  </TableCell>
                                  <TableCell className="font-mono text-xs">
                                    <code className="bg-gray-100 px-2 py-1 rounded">
                                      {parameter.xml_path}
                                    </code>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="text-xs">
                                      {parameter.parameter_type === 'text' ? 'Текст' : 
                                       parameter.parameter_type === 'number' ? 'Число' : 
                                       parameter.parameter_type === 'boolean' ? 'Логічний' : 
                                       parameter.parameter_type === 'date' ? 'Дата' : 
                                       parameter.parameter_type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      className={
                                        parameter.parameter_category === 'parameter' ? 'bg-blue-100 text-blue-800' :
                                        parameter.parameter_category === 'currency' ? 'bg-green-100 text-green-800' :
                                        parameter.parameter_category === 'category' ? 'bg-purple-100 text-purple-800' :
                                        parameter.parameter_category === 'offer' ? 'bg-orange-100 text-orange-800' :
                                        parameter.parameter_category === 'characteristic' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                      }
                                    >
                                      {parameter.parameter_category === 'parameter' ? 'Основна інформація' :
                                       parameter.parameter_category === 'currency' ? 'Валюта' :
                                       parameter.parameter_category === 'category' ? 'Категорія' :
                                       parameter.parameter_category === 'offer' ? 'Товар' :
                                       parameter.parameter_category === 'characteristic' ? 'Характеристика' :
                                       parameter.parameter_category}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-1">
                                      {parameter.is_active && (
                                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                                          Активний
                                        </Badge>
                                      )}
                                      {parameter.is_required && (
                                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700">
                                          Обов'язковий
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
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
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
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
                    return <div key={category.value}>
                          <Label>{category.label}</Label>
                          <p className="font-medium">{category.count}</p>
                        </div>;
                  })}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

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

  useEffect(() => {
    setFormData(parameter);
  }, [parameter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form data:', formData);
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
                  <SelectItem value="parameter">Основна інформація</SelectItem>
                  <SelectItem value="currency">Валюта</SelectItem>
                  <SelectItem value="category">Категорія</SelectItem>
                  <SelectItem value="offer">Товар</SelectItem>
                  <SelectItem value="characteristic">Характеристика</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex flex-col items-start space-y-3">
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
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
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
