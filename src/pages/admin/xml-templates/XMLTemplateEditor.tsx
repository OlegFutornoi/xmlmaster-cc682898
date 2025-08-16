
// Оновлений редактор XML-шаблону з новою системою парсингу та відображення
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useXMLTemplates } from '@/hooks/xml-templates/useXMLTemplates';
import { parseXMLToStructure, ParsedXMLStructure } from '@/utils/advancedXmlParser';
import ParsedStructureTable from '@/components/admin/xml-templates/ParsedStructureTable';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { ArrowLeft, Upload, Save, FileText } from 'lucide-react';

const XMLTemplateEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { templates, updateTemplate } = useXMLTemplates();
  const template = templates.find(t => t.id === id);

  const [xmlContent, setXmlContent] = useState('');
  const [parsedStructure, setParsedStructure] = useState<ParsedXMLStructure | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    shop_name: '',
    shop_company: '',
    shop_url: ''
  });
  const [isParsingXML, setIsParsingXML] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (template) {
      console.log('📋 Завантаження шаблону для редагування:', template);
      setTemplateForm({
        name: template.name || '',
        shop_name: template.shop_name || '',
        shop_company: template.shop_company || '',
        shop_url: template.shop_url || ''
      });

      // Якщо є структура в шаблоні, показуємо її
      if (template.structure) {
        try {
          setParsedStructure(template.structure as ParsedXMLStructure);
        } catch (error) {
          console.error('Помилка завантаження структури шаблону:', error);
        }
      }
    }
  }, [template]);

  const handleXMLFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('📁 Завантажено XML файл:', file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setXmlContent(content);
    };
    reader.readAsText(file);
  };

  const handleParseXML = async () => {
    if (!xmlContent.trim()) {
      toast({
        title: 'Помилка',
        description: 'Будь ласка, завантажте XML файл або введіть XML контент',
        variant: 'destructive'
      });
      return;
    }

    setIsParsingXML(true);
    console.log('🔍 Розпочинаємо парсинг XML контенту...');
    
    try {
      const structure = parseXMLToStructure(xmlContent);
      setParsedStructure(structure);
      
      // Автоматично заповнюємо основну інформацію з XML
      if (structure.shop) {
        setTemplateForm(prev => ({
          ...prev,
          shop_name: structure.shop.name || prev.shop_name,
          shop_company: structure.shop.company || prev.shop_company,
          shop_url: structure.shop.url || prev.shop_url
        }));
      }
      
      toast({
        title: 'Успіх',
        description: `XML успішно розпарсено! Знайдено: ${structure.currencies.length} валют, ${structure.categories.length} категорій, ${structure.offers.length} товарів`,
        duration: 5000
      });
    } catch (error: any) {
      console.error('❌ Помилка парсингу XML:', error);
      toast({
        title: 'Помилка парсингу',
        description: error.message || 'Не вдалося розпарсити XML файл',
        variant: 'destructive'
      });
    } finally {
      setIsParsingXML(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!id || !parsedStructure) {
      toast({
        title: 'Помилка',
        description: 'Відсутні необхідні дані для збереження',
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    console.log('💾 Збереження шаблону з новою структурою...');

    try {
      updateTemplate({
        id,
        updates: {
          name: templateForm.name,
          shop_name: templateForm.shop_name,
          shop_company: templateForm.shop_company,
          shop_url: templateForm.shop_url,
          structure: parsedStructure
        }
      });

      toast({
        title: 'Успіх',
        description: 'Шаблон успішно збережено з новою структурою',
      });
    } catch (error: any) {
      console.error('❌ Помилка збереження шаблону:', error);
      toast({
        title: 'Помилка',
        description: 'Не вдалося зберегти шаблон',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStructureSave = (updatedStructure: ParsedXMLStructure) => {
    setParsedStructure(updatedStructure);
    // Автоматично зберігаємо зміни
    if (id) {
      updateTemplate({
        id,
        updates: {
          structure: updatedStructure
        }
      });
    }
  };

  if (!template) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AdminSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Шаблон не знайдено</p>
                <Button
                  onClick={() => navigate('/admin/xml-templates')}
                  className="mt-4"
                >
                  Повернутись до списку
                </Button>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <SidebarInset>
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
            <SidebarTrigger className="-ml-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/xml-templates')}
              className="gap-2"
              id="back-to-templates"
            >
              <ArrowLeft className="h-4 w-4" />
              Назад до шаблонів
            </Button>
            <div className="flex-1 text-center">
              <h1 className="text-xl font-semibold">
                Редагування: {template.name}
              </h1>
            </div>
          </header>

          <div className="flex-1 p-4 lg:p-8 space-y-6">
            {/* Основна інформація про шаблон */}
            <Card>
              <CardHeader>
                <CardTitle>Основні налаштування шаблону</CardTitle>
                <CardDescription>
                  Налаштування основної інформації про XML шаблон
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Назва шаблону</Label>
                    <Input
                      id="template-name"
                      value={templateForm.name}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Введіть назву шаблону"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shop-name">Назва магазину</Label>
                    <Input
                      id="shop-name"
                      value={templateForm.shop_name}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, shop_name: e.target.value }))}
                      placeholder="Назва магазину з XML"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shop-company">Компанія</Label>
                    <Input
                      id="shop-company"
                      value={templateForm.shop_company}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, shop_company: e.target.value }))}
                      placeholder="Назва компанії"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shop-url">URL магазину</Label>
                    <Input
                      id="shop-url"
                      value={templateForm.shop_url}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, shop_url: e.target.value }))}
                      placeholder="https://www.example.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Завантаження та парсинг XML */}
            <Card>
              <CardHeader>
                <CardTitle>Завантаження XML файлу</CardTitle>
                <CardDescription>
                  Завантажте новий XML файл для оновлення структури шаблону
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="xml-file">XML файл</Label>
                    <Input
                      id="xml-file"
                      type="file"
                      accept=".xml,.yml"
                      onChange={handleXMLFileUpload}
                      className="mt-2"
                    />
                  </div>
                  
                  {xmlContent && (
                    <div className="space-y-2">
                      <Label>Попередній перегляд XML</Label>
                      <Textarea
                        value={xmlContent.slice(0, 500) + (xmlContent.length > 500 ? '...' : '')}
                        readOnly
                        rows={8}
                        className="font-mono text-sm"
                      />
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleParseXML}
                      disabled={!xmlContent.trim() || isParsingXML}
                      className="gap-2"
                      id="parse-xml-button"
                    >
                      <Upload className="h-4 w-4" />
                      {isParsingXML ? 'Парсинг...' : 'Розпарсити XML'}
                    </Button>
                    
                    {parsedStructure && (
                      <Button
                        onClick={handleSaveTemplate}
                        disabled={isSaving}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                        id="save-template-button"
                      >
                        <Save className="h-4 w-4" />
                        {isSaving ? 'Збереження...' : 'Зберегти шаблон'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Відображення розпарсеної структури */}
            {parsedStructure && (
              <ParsedStructureTable
                structure={parsedStructure}
                templateName={template.name}
                onSave={handleStructureSave}
                isEditable={true}
              />
            )}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default XMLTemplateEditor;
