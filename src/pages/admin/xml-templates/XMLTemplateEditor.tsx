
// Редактор XML-шаблону
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, FileCode } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useXMLTemplates } from '@/hooks/xml-templates/useXMLTemplates';
import { useXMLTemplateParameters } from '@/hooks/xml-templates/useXMLTemplateParameters';
import TemplateParametersTable from '@/components/admin/xml-templates/TemplateParametersTable';
import { useState, useEffect } from 'react';

const XMLTemplateEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [templateName, setTemplateName] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const { updateTemplate, isUpdating } = useXMLTemplates();
  const { 
    parameters, 
    createParameter, 
    updateParameter, 
    deleteParameter,
    isLoading: isLoadingParameters 
  } = useXMLTemplateParameters(id);

  // Завантаження даних шаблону
  const { data: template, isLoading } = useQuery({
    queryKey: ['xml-template', id],
    queryFn: async () => {
      if (!id) throw new Error('Template ID is required');
      
      console.log('Завантаження шаблону:', id);
      
      const { data, error } = await supabase
        .from('template_xml')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Помилка завантаження шаблону:', error);
        throw error;
      }

      console.log('Шаблон завантажено:', data);
      return data;
    },
    enabled: !!id
  });

  useEffect(() => {
    if (template) {
      setTemplateName(template.name);
      setIsActive(template.is_active);
    }
  }, [template]);

  const handleSaveTemplate = () => {
    if (!id || !templateName.trim()) return;
    
    console.log('Збереження шаблону:', id);
    updateTemplate({
      id,
      updates: {
        name: templateName.trim(),
        is_active: isActive
      }
    });
  };

  const handleAddParameter = () => {
    if (!id) return;
    
    console.log('Додавання нового параметру');
    const newParameter = {
      template_id: id,
      parameter_name: 'Новий параметр',
      parameter_value: '',
      xml_path: '/root/element',
      parameter_type: 'text',
      is_active: true,
      is_required: false
    };
    
    createParameter(newParameter);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Завантаження шаблону...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FileCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Шаблон не знайдено</p>
          <Button 
            onClick={() => navigate('/admin/xml-templates')}
            className="mt-4"
            id="back-to-templates"
            type="button"
          >
            Повернутися до шаблонів
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Заголовок */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin/xml-templates')}
                  className="border-blue-200 hover:bg-blue-50"
                  id="back-button"
                  type="button"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад
                </Button>
                <div>
                  <CardTitle className="flex items-center gap-3 text-2xl text-gray-900">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <FileCode className="h-6 w-6 text-white" />
                    </div>
                    Редагування шаблону
                  </CardTitle>
                  <CardDescription className="text-gray-600 mt-2">
                    Налаштування параметрів XML-шаблону
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={handleSaveTemplate}
                disabled={isUpdating || !templateName.trim()}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                id="save-template-button"
                type="button"
              >
                <Save className="h-4 w-4 mr-2" />
                {isUpdating ? 'Збереження...' : 'Зберегти'}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Основні налаштування шаблону */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle>Основні налаштування</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Назва шаблону</Label>
                <Input
                  id="template-name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Введіть назву шаблону"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="is-active">Активний</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <span className="text-sm text-gray-600">
                    {isActive ? 'Шаблон активний' : 'Шаблон неактивний'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Таблиця параметрів */}
        <Card className="bg-white/70 backdrop-blur-sm border-blue-200 shadow-lg">
          <CardContent className="pt-6">
            {isLoadingParameters ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Завантаження параметрів...</p>
              </div>
            ) : (
              <TemplateParametersTable
                parameters={parameters}
                onUpdateParameter={updateParameter}
                onDeleteParameter={deleteParameter}
                onAddParameter={handleAddParameter}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default XMLTemplateEditor;
