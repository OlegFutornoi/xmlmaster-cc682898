// Сторінка редактора XML-шаблону з правильним парсингом та збереженням даних
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useXMLTemplates } from '@/hooks/xml-templates/useXMLTemplates';
import { useXMLTemplateParameters } from '@/hooks/xml-templates/useXMLTemplateParameters';
import { importXMLParameters } from '@/utils/xmlParser';
import TemplateParametersTable from '@/components/admin/xml-templates/TemplateParametersTable';
import ParsedStructureTable from '@/components/admin/xml-templates/ParsedStructureTable';
import { ArrowLeft, Upload, FileText, Save } from 'lucide-react';
import { XMLTemplate, ParsedXMLStructure } from '@/types/xml-template';

const XMLTemplateEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { templates, updateTemplate } = useXMLTemplates();
  const template = templates.find(t => t.id === id);
  const { 
    parameters, 
    createParameterAsync,
    isLoading: parametersLoading 
  } = useXMLTemplateParameters(id);

  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [parsedStructure, setParsedStructure] = useState<ParsedXMLStructure | null>(null);
  const [isParsingXML, setIsParsingXML] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [templateForm, setTemplateForm] = useState({
    name: template?.name || '',
    shop_name: template?.shop_name || '',
    shop_company: template?.shop_company || '',
    shop_url: template?.shop_url || ''
  });

  React.useEffect(() => {
    if (template) {
      setTemplateForm({
        name: template.name || '',
        shop_name: template.shop_name || '',
        shop_company: template.shop_company || '',
        shop_url: template.shop_url || ''
      });
    }
  }, [template]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/xml') {
      console.log('Файл обрано:', file.name);
      setXmlFile(file);
      setParsedStructure(null);
    } else {
      toast({
        title: "Помилка",
        description: "Будь ласка, оберіть XML файл",
        variant: "destructive",
      });
    }
  };

  const parseXMLFile = async () => {
    if (!xmlFile) return;

    setIsParsingXML(true);
    console.log('Розширений парсинг XML-контенту...');

    try {
      const xmlContent = await xmlFile.text();
      console.log('XML контент отримано, довжина:', xmlContent.length);

      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      // Перевіряємо на помилки парсингу
      const parserError = xmlDoc.querySelector('parsererror');
      if (parserError) {
        throw new Error('XML файл має неправильний формат');
      }

      console.log('XML документ розпарсено успішно');

      // Розширений парсинг структури
      const shop = xmlDoc.querySelector('shop');
      const currencies = Array.from(xmlDoc.querySelectorAll('currencies currency'));
      const categories = Array.from(xmlDoc.querySelectorAll('categories category'));
      const offers = Array.from(xmlDoc.querySelectorAll('offers offer'));

      console.log('Знайдено елементів:');
      console.log('- Магазин:', shop ? 'так' : 'ні');
      console.log('- Валюти:', currencies.length);
      console.log('- Категорії:', categories.length);
      console.log('- Товари:', offers.length);

      const parsedStructure: ParsedXMLStructure = {
        shop: shop ? {
          name: shop.querySelector('name')?.textContent || '',
          company: shop.querySelector('company')?.textContent || '',
          url: shop.querySelector('url')?.textContent || ''
        } : undefined,
        currencies: currencies.map(currency => ({
          id: currency.getAttribute('id') || '',
          rate: parseFloat(currency.getAttribute('rate') || '1')
        })),
        categories: categories.map(category => ({
          id: category.getAttribute('id') || '',
          name: category.textContent || '',
          rz_id: category.getAttribute('rz_id') || undefined
        })),
        offers: offers.slice(0, 5).map(offer => {
          const offerData: any = {
            id: offer.getAttribute('id') || '',
            available: offer.getAttribute('available') === 'true'
          };

          // Додаємо всі дочірні елементи
          Array.from(offer.children).forEach(child => {
            if (child.tagName.toLowerCase() !== 'param') {
              offerData[child.tagName.toLowerCase()] = child.textContent || '';
            }
          });

          return offerData;
        }),
        parameters: []
      };

      console.log('Розпарсена структура:', parsedStructure);
      setParsedStructure(parsedStructure);
      
      toast({
        title: "Успіх",
        description: `XML файл розпарсено: ${offers.length} товарів, ${categories.length} категорій, ${currencies.length} валют`,
      });

    } catch (error) {
      console.error('Помилка парсингу XML:', error);
      toast({
        title: "Помилка парсингу",
        description: error instanceof Error ? error.message : "Не вдалося розпарсити XML файл",
        variant: "destructive",
      });
    } finally {
      setIsParsingXML(false);
    }
  };

  const handleImportXML = async () => {
    if (!xmlFile || !id) return;

    setIsImporting(true);
    console.log('Початок імпорту XML параметрів...');

    try {
      const xmlContent = await xmlFile.text();
      console.log('Виклик функції importXMLParameters...');
      
      const importedCount = await importXMLParameters(
        xmlContent, 
        id, 
        createParameterAsync
      );

      console.log(`Імпорт завершено. Створено параметрів: ${importedCount}`);
      
      toast({
        title: "Успіх",
        description: `Імпортовано ${importedCount} параметрів з XML файлу`,
      });

      // Очищаємо стан після успішного імпорту
      setXmlFile(null);
      setParsedStructure(null);
      
      // Скидаємо input для вибору файлу
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

    } catch (error) {
      console.error('Помилка імпорту XML:', error);
      toast({
        title: "Помилка імпорту",
        description: error instanceof Error ? error.message : "Не вдалося імпортувати параметри",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!id) return;

    try {
      updateTemplate({
        id,
        updates: {
          name: templateForm.name,
          shop_name: templateForm.shop_name,
          shop_company: templateForm.shop_company,
          shop_url: templateForm.shop_url
        }
      });

      toast({
        title: "Успіх",
        description: "Шаблон оновлено успішно",
      });
    } catch (error) {
      console.error('Помилка оновлення шаблону:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося оновити шаблон",
        variant: "destructive",
      });
    }
  };

  if (parametersLoading) {
    return <div className="flex justify-center items-center h-64">Завантаження...</div>;
  }

  if (!template) {
    return <div className="text-center text-red-600">Шаблон не знайдено</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/xml-templates')}
            id="back-to-templates"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Button>
          <h1 className="text-2xl font-semibold">Редагування XML-шаблону</h1>
        </div>
      </div>

      {/* Основна інформація шаблону */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Основна інформація
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="template-name">Назва шаблону</Label>
              <Input
                id="template-name"
                value={templateForm.name}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Назва XML-шаблону"
              />
            </div>
            <div>
              <Label htmlFor="shop-name">Назва магазину</Label>
              <Input
                id="shop-name"
                value={templateForm.shop_name}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, shop_name: e.target.value }))}
                placeholder="Назва магазину"
              />
            </div>
            <div>
              <Label htmlFor="shop-company">Компанія</Label>
              <Input
                id="shop-company"
                value={templateForm.shop_company}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, shop_company: e.target.value }))}
                placeholder="Назва компанії"
              />
            </div>
            <div>
              <Label htmlFor="shop-url">URL магазину</Label>
              <Input
                id="shop-url"
                value={templateForm.shop_url}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, shop_url: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <Button onClick={handleUpdateTemplate} id="update-template-info">
            <Save className="h-4 w-4 mr-2" />
            Зберегти інформацію
          </Button>
        </CardContent>
      </Card>

      {/* Імпорт XML */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Імпорт XML файлу
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="xml-file">Оберіть XML файл</Label>
            <Input
              id="xml-file"
              type="file"
              accept=".xml"
              onChange={handleFileChange}
            />
          </div>
          
          {xmlFile && (
            <div className="flex gap-2">
              <Button
                onClick={parseXMLFile}
                disabled={isParsingXML}
                variant="outline"
                id="parse-xml-button"
              >
                {isParsingXML ? 'Парсинг...' : 'Розпарсити XML'}
              </Button>
              
              {parsedStructure && (
                <Button
                  onClick={handleImportXML}
                  disabled={isImporting}
                  id="import-xml-button"
                >
                  {isImporting ? 'Імпорт...' : 'Імпортувати параметри'}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Розпарсена структура */}
      {parsedStructure && (
        <Card>
          <CardHeader>
            <CardTitle>Розпарсена структура XML</CardTitle>
          </CardHeader>
          <CardContent>
            <ParsedStructureTable
              structure={parsedStructure}
              onSaveTemplate={() => {}}
              isSaving={false}
            />
          </CardContent>
        </Card>
      )}

      {/* Таблиця параметрів */}
      <Card>
        <CardHeader>
          <CardTitle>Параметри шаблону</CardTitle>
        </CardHeader>
        <CardContent>
          <TemplateParametersTable
            parameters={parameters}
            onUpdateParameter={() => {}}
            onDeleteParameter={() => {}}
            onCreateParameter={() => {}}
            templateId={id || ''}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default XMLTemplateEditor;
