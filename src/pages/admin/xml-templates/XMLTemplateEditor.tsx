
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { parseAdvancedXML } from '@/utils/xmlParser';
import ParsedStructureTable from '@/components/admin/xml-templates/ParsedStructureTable';
import { extendedSupabase } from '@/integrations/supabase/extended-client';

const XMLTemplateEditor = () => {
  const [templateName, setTemplateName] = useState('');
  const [xmlContent, setXMLContent] = useState('');
  const [parsedStructure, setParsedStructure] = useState<any>(null);
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
      
      console.log('Файл завантажено, розпочинаємо парсинг...');
      const structure = parseAdvancedXML(text);
      setParsedStructure(structure);
      
      toast({
        title: 'Успіх',
        description: `XML файл розпарсено. Знайдено ${structure.parameters.length} параметрів.`,
      });
    } catch (error: any) {
      console.error('Помилка парсингу XML:', error);
      toast({
        title: 'Помилка',
        description: `Не вдалося розпарсити XML: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setIsParsingFile(false);
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

      // Зберігаємо параметри
      if (templateData.parameters && templateData.parameters.length > 0) {
        const parametersWithTemplateId = templateData.parameters.map((param: any) => ({
          ...param,
          template_id: template.id
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
                Парсинг файлу...
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
                Результати парсингу
              </CardTitle>
              <CardDescription>
                Перегляньте та налаштуйте знайдені параметри
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
    </div>
  );
};

export default XMLTemplateEditor;
