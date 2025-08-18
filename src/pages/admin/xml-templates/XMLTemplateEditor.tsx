
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

    console.log('=== ПОЧАТОК ЗАВАНТАЖЕННЯ ФАЙЛУ ===');
    console.log('Обрано файл:', file.name, 'розмір:', file.size);

    setIsParsingFile(true);

    try {
      const text = await file.text();
      console.log('Файл прочитано, розмір:', text.length, 'символів');
      console.log('Перші 1000 символів файлу:', text.substring(0, 1000));
      
      if (!text.trim()) {
        throw new Error('Файл порожній');
      }

      // Перевіряємо базову структуру XML
      if (!text.includes('<shop') && !text.includes('<yml_catalog')) {
        throw new Error('Файл не містить очікувану XML структуру (shop або yml_catalog)');
      }
      
      setXMLContent(text);
      setTemplateName(file.name.replace(/\.[^/.]+$/, ''));
      
      console.log('Створюємо структуру дерева для модального вікна...');
      
      // Створюємо структуру дерева для відображення в модальному вікні
      const tree = createXMLTreeStructure(text);
      console.log('Структура дерева створена:', tree);
      
      if (!tree || tree.length === 0) {
        throw new Error('Не вдалося створити структуру дерева з XML файлу');
      }
      
      setTreeStructure(tree);
      
      console.log('Відкриваємо модальне вікно з структурою...');
      setShowPreviewModal(true);
      
      toast({
        title: 'Успіх',
        description: `XML файл завантажено та розпарсено. Показую структуру для перегляду.`,
      });
    } catch (error: any) {
      console.error('Помилка завантаження/парсингу XML:', error);
      toast({
        title: 'Помилка парсингу',
        description: `Не вдалося обробити XML файл: ${error.message}`,
        variant: 'destructive',
      });
      
      // Очищаємо стан при помилці
      setXMLContent('');
      setTreeStructure([]);
      setParsedStructure(null);
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleContinueFromPreview = async () => {
    if (!xmlContent) {
      console.error('Немає XML контенту для парсингу');
      return;
    }

    console.log('=== ПРОДОВЖЕННЯ З ПОПЕРЕДНЬОГО ПЕРЕГЛЯДУ ===');
    console.log('Розмір XML контенту:', xmlContent.length);

    try {
      console.log('Створюємо повну структуру шаблону...');
      const structure = parseAdvancedXML(xmlContent);
      console.log('Структура шаблону створена:', structure);
      
      if (!structure || !structure.parameters || structure.parameters.length === 0) {
        throw new Error('Не вдалося створити структуру параметрів з XML');
      }
      
      setParsedStructure(structure);
      setShowPreviewModal(false);
      
      toast({
        title: 'Успіх',
        description: `XML розпарсено успішно. Знайдено ${structure.parameters.length} параметрів для створення шаблону.`,
      });
    } catch (error: any) {
      console.error('Помилка створення структури шаблону:', error);
      toast({
        title: 'Помилка',
        description: `Не вдалося створити структуру шаблону: ${error.message}`,
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

    console.log('=== ЗБЕРЕЖЕННЯ ШАБЛОНУ ===');
    console.log('Дані шаблону для збереження:', templateData);

    setIsSaving(true);

    try {
      // Зберігаємо основну інформацію про шаблон
      const { data: template, error: templateError } = await extendedSupabase
        .from('template_xml')
        .insert([{
          name: templateName,
          structure: templateData.structure || {},
          shop_name: templateData.shop_info?.name,
          shop_company: templateData.shop_info?.company,
          shop_url: templateData.shop_info?.url,
          is_active: true
        }])
        .select()
        .single();

      if (templateError) {
        console.error('Помилка збереження основного шаблону:', templateError);
        throw templateError;
      }

      console.log('Основний шаблон збережено:', template);

      // Зберігаємо параметри
      if (templateData.parameters && templateData.parameters.length > 0) {
        console.log(`Зберігаємо ${templateData.parameters.length} параметрів...`);
        
        const parametersWithTemplateId = templateData.parameters.map((param: any) => ({
          template_id: template.id,
          parameter_name: param.parameter_name,
          parameter_value: param.parameter_value,
          xml_path: param.xml_path,
          parameter_type: param.parameter_type || 'text',
          parameter_category: param.parameter_category || 'parameter',
          multilingual_values: param.multilingual_values || null,
          cdata_content: param.cdata_content || null,
          element_attributes: param.element_attributes || null,
          param_id: param.param_id || null,
          value_id: param.value_id || null,
          is_active: param.is_active !== false,
          is_required: param.is_required === true,
          display_order: param.display_order || 0
        }));

        const { error: parametersError } = await extendedSupabase
          .from('template_xml_parameters')
          .insert(parametersWithTemplateId);

        if (parametersError) {
          console.error('Помилка збереження параметрів:', parametersError);
          throw parametersError;
        }

        console.log('Параметри збережено успішно');
      }

      toast({
        title: 'Успіх',
        description: `Шаблон "${templateName}" створено з ${templateData.parameters?.length || 0} параметрами`,
      });

      // Очищаємо форму після успішного збереження
      setTemplateName('');
      setXMLContent('');
      setParsedStructure(null);
      setTreeStructure([]);

    } catch (error: any) {
      console.error('Помилка збереження шаблону:', error);
      toast({
        title: 'Помилка збереження',
        description: `Не вдалося зберегти шаблон: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseModal = () => {
    console.log('Закриття модального вікна користувачем');
    setShowPreviewModal(false);
  };

  console.log('Поточний стан XMLTemplateEditor:', {
    showPreviewModal,
    treeStructureLength: treeStructure.length,
    hasXMLContent: !!xmlContent,
    hasParsedStructure: !!parsedStructure,
    isParsingFile
  });

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
              Завантажте YML файл для створення шаблону. Після завантаження з'явиться вікно попереднього перегляду структури.
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
              <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-3 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span>Завантаження та аналіз XML файлу...</span>
              </div>
            )}

            {treeStructure.length > 0 && !showPreviewModal && !parsedStructure && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-green-800">✅ XML файл розпарсено. Структура готова до перегляду.</p>
                <Button 
                  onClick={() => setShowPreviewModal(true)}
                  className="mt-2"
                  variant="outline"
                  size="sm"
                >
                  Показати структуру знову
                </Button>
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
        onClose={handleCloseModal}
        onContinue={handleContinueFromPreview}
        treeStructure={treeStructure}
        isProcessing={false}
      />
    </div>
  );
};

export default XMLTemplateEditor;
