
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
import { Settings, Plus, Trash2, Save } from 'lucide-react';
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
        template_id: store.template_id
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

  const renderParameterForm = (parameter: any, isNew: boolean = false) => (
    <Card className="border-2 border-dashed border-emerald-200">
      <CardHeader>
        <CardTitle className="text-lg">
          {isNew ? 'Новий параметр' : 'Редагування параметра'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="param-name">Назва параметра</Label>
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
              placeholder="Наприклад: title, price, description"
            />
          </div>
          <div>
            <Label htmlFor="param-path">XML шлях</Label>
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
              placeholder="Наприклад: /yml_catalog/shop/offers/offer/name"
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
            rows={3}
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
              <SelectTrigger>
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
              <SelectTrigger>
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

        <div className="flex items-center justify-between">
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
              <Label htmlFor="param-active">Активний</Label>
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
              <Label htmlFor="param-required">Обов'язковий</Label>
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
              disabled={isSaving}
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Налаштування шаблону: {store.name}
          </DialogTitle>
          <DialogDescription>
            {currentTemplate ? 
              `Редагуйте параметри шаблону "${currentTemplate.name}" для цього магазину` :
              'Цей магазин не має прив\'язаного шаблону'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <Tabs defaultValue="parameters" className="h-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="parameters">Параметри</TabsTrigger>
              <TabsTrigger value="info">Інформація</TabsTrigger>
            </TabsList>

            <TabsContent value="parameters" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Параметри шаблону</h3>
                <div className="flex gap-2">
                  {store.template_id && (
                    <Button
                      variant="outline"
                      onClick={handleCopyTemplateParameters}
                      type="button"
                    >
                      Копіювати з шаблону
                    </Button>
                  )}
                  <Button
                    onClick={() => setIsAddingParameter(true)}
                    type="button"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Додати параметр
                  </Button>
                </div>
              </div>

              {isAddingParameter && renderParameterForm(newParameter, true)}

              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                  <p>Завантаження параметрів...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {parameters.map((parameter) => (
                    <div key={parameter.id}>
                      {editingParameter?.id === parameter.id ? 
                        renderParameterForm(editingParameter) : (
                        <Card>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="flex items-center gap-2">
                                  {parameter.parameter_name}
                                  <Badge variant={parameter.is_active ? "default" : "secondary"}>
                                    {parameter.is_active ? 'Активний' : 'Неактивний'}
                                  </Badge>
                                  {parameter.is_required && (
                                    <Badge variant="destructive">Обов'язковий</Badge>
                                  )}
                                </CardTitle>
                                <CardDescription>
                                  {parameter.xml_path} | {parameter.parameter_category}
                                </CardDescription>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setEditingParameter(parameter)}
                                  type="button"
                                >
                                  Редагувати
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteParameter(parameter.id)}
                                  type="button"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardHeader>
                          {parameter.parameter_value && (
                            <CardContent>
                              <p className="text-sm text-gray-600">
                                <strong>Значення:</strong> {parameter.parameter_value}
                              </p>
                            </CardContent>
                          )}
                        </Card>
                      )}
                    </div>
                  ))}

                  {parameters.length === 0 && !isAddingParameter && (
                    <Card>
                      <CardContent className="text-center py-8">
                        <p className="text-gray-600 mb-4">Немає налаштованих параметрів</p>
                        <Button
                          onClick={() => setIsAddingParameter(true)}
                          type="button"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Додати перший параметр
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="info" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Інформація про магазин</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Назва магазину</Label>
                    <p className="font-medium">{store.name}</p>
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
                  <div>
                    <Label>Кількість параметрів</Label>
                    <p className="font-medium">{parameters.length}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoreTemplateEditor;
