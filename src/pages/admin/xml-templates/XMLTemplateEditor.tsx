
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { parseAdvancedXML, createXMLTreeStructure, ParsedTreeStructure } from '@/utils/xmlParser';
import ParsedStructureTable from '@/components/admin/xml-templates/ParsedStructureTable';
import XMLStructurePreviewModal from '@/components/admin/xml-templates/XMLStructurePreviewModal';
import { extendedSupabase } from '@/integrations/supabase/extended-client';

const XMLTemplateEditor = () => {
  const [templateName, setTemplateName] = useState('');
  const [xmlContent, setXMLContent] = useState('');
  const [parsedStructure, setParsedStructure] = useState<any>(null);
  const [treeStructure, setTreeStructure] = useState<ParsedTreeStructure[]>([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsingFile(true);

    try {
      const text = await file.text();
      setXMLContent(text);
      setTemplateName(file.name.replace(/\.[^/.]+$/, ''));
      
      console.log('Файл завантажено, створюємо структуру дерева...');
      
      // Створюємо структуру дерева для відображення в модальному вікні
      const tree = createXMLTreeStructure(text);
      setTreeStructure(tree);
      
      // Показуємо модальне вікно з структурою
      setShowPreviewModal(true);
      
      toast({
        title: 'Успіх',
        description: `XML файл завантажено. Структура готова для перегляду.`,
      });
    } catch (error: any) {
      console.error('Помилка завантаження XML:', error);
      toast({
        title: 'Помилка',
        description: `Не вдалося завантажити XML: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleContinueFromPreview = async () => {
    if (!xmlContent) return;

    try {
      console.log('Парсинг XML для створення шаблону...');
      const structure = parseAdvancedXML(xmlContent);
      setParsedStructure(structure);
      setShowPreviewModal(false);
      
      toast({
        title: 'Успіх',
        description: `XML розпарсено. Знайдено ${structure.parameters.length} параметрів.`,
      });
    } catch (error: any) {
      console.error('Помилка парсингу XML:', error);
      toast({
        title: 'Помилка',
        description: `Не вдалося розпарсити XML: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleSaveTemplate = async (templateData: any) => {
    if (!templateName.trim()) {
      toast({
        title: 'Помилка',
        description: 'Будь ласка, введіть назву шаблону',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      console.log('Збереження шаблону з даними:', templateData);

      // Зберігаємо основну інформацію про шаблон
      const { data: template, error: templateError } = await extendedSupabase
        .from('template_xml')
        .insert([{
          name: templateName,
          structure: templateData.structure,
          shop_name: templateData.shop_info?.name,
          shop_company: templateData.shop_info?.company,
          shop_url: templateData.shop_info?.url,
          is_active: true
        }])
        .select()
        .single();

      if (templateError) throw templateError;

      // Зберігаємо параметри з усіма новими полями
      if (templateData.parameters && templateData.parameters.length > 0) {
        const parametersWithTemplateId = templateData.parameters.map((param: any) => ({
          template_id: template.id,
          parameter_name: param.parameter_name,
          parameter_value: param.parameter_value,
          xml_path: param.xml_path,
          parameter_type: param.parameter_type || 'text',
          parameter_category: param.parameter_category,
          multilingual_values: param.multilingual_values,
          cdata_content: param.cdata_content,
          element_attributes: param.element_attributes,
          param_id: param.param_id,
          value_id: param.value_id,
          is_active: param.is_active !== false,
          is_required: param.is_required === true,
          display_order: param.display_order || 0
        }));

        const { error: parametersError } = await extendedSupabase
          .from('template_xml_parameters')
          .insert(parametersWithTemplateId);

        if (parametersError) throw parametersError;
      }

      toast({
        title: 'Успіх',
        description: `Шаблон "${templateName}" створено з ${templateData.parameters?.length || 0} параметрами`,
      });

      // Очищаємо форму
      setTemplateName('');
      setXMLContent('');
      setParsedStructure(null);
      setTreeStructure([]);

    } catch (error: any) {
      console.error('Помилка збереження шаблону:', error);
      toast({
        title: 'Помилка',
        description: `Не вдалося зберегти шаблон: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6" id="xml-template-editor">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Редактор XML Шаблонів</h1>
      </div>

      <div className="grid gap-6">
        {/* Форма завантаження */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Завантаження XML файлу
            </CardTitle>
            <CardDescription>
              Завантажте YML файл для створення шаблону
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="template-name">Назва шаблону</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Введіть назву шаблону"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="xml-file">XML/YML файл</Label>
              <Input
                id="xml-file"
                type="file"
                accept=".xml,.yml,.yaml"
                onChange={handleFileUpload}
                disabled={isParsingFile}
                className="mt-1"
              />
            </div>

            {isParsingFile && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Завантаження та аналіз файлу...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Результати парсингу */}
        {parsedStructure && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Шаблон параметрів
              </CardTitle>
              <CardDescription>
                Перегляньте та налаштуйте знайдені параметри перед створенням шаблону
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ParsedStructureTable
                structure={parsedStructure}
                onSaveTemplate={handleSaveTemplate}
                isSaving={isSaving}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Модальне вікно перегляду структури */}
      <XMLStructurePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onContinue={handleContinueFromPreview}
        treeStructure={treeStructure}
        isProcessing={false}
      />
    </div>
  );
};

export default XMLTemplateEditor;
