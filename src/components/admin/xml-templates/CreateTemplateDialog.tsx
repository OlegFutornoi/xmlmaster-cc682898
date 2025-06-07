
// Діалог створення нового XML-шаблону з розширеним парсингом
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Link, FileCode } from 'lucide-react';
import { ParsedXMLStructure } from '@/types/xml-template';
import ParsedStructureTable from './ParsedStructureTable';

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateTemplate: (data: any) => void;
  isCreating: boolean;
}

const CreateTemplateDialog = ({ open, onOpenChange, onCreateTemplate, isCreating }: CreateTemplateDialogProps) => {
  const [templateName, setTemplateName] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'file' | 'url'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [xmlUrl, setXmlUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedStructure, setParsedStructure] = useState<ParsedXMLStructure | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/xml') {
      setSelectedFile(file);
      console.log('Файл обрано:', file.name);
    } else {
      alert('Будь ласка, оберіть XML-файл');
    }
  };

  const parseXMLToStructure = async (xmlContent: string): Promise<ParsedXMLStructure> => {
    try {
      console.log('Розширений парсинг XML-контенту...');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Невірний XML-формат');
      }

      const structure: ParsedXMLStructure = {
        parameters: []
      };

      // Парсинг інформації про магазин
      const shopElement = xmlDoc.querySelector('shop');
      if (shopElement) {
        structure.shop = {
          name: shopElement.querySelector('name')?.textContent || '',
          company: shopElement.querySelector('company')?.textContent || '',
          url: shopElement.querySelector('url')?.textContent || ''
        };

        // Додаємо параметри магазину
        if (structure.shop.name) {
          structure.parameters.push({
            name: 'name',
            value: structure.shop.name,
            path: '/yml_catalog/shop/name',
            type: 'parameter',
            category: 'shop'
          });
        }
        if (structure.shop.company) {
          structure.parameters.push({
            name: 'company',
            value: structure.shop.company,
            path: '/yml_catalog/shop/company',
            type: 'parameter',
            category: 'shop'
          });
        }
        if (structure.shop.url) {
          structure.parameters.push({
            name: 'url',
            value: structure.shop.url,
            path: '/yml_catalog/shop/url',
            type: 'parameter',
            category: 'shop'
          });
        }
      }

      // Парсинг валют
      const currencies = xmlDoc.querySelectorAll('currency');
      if (currencies.length > 0) {
        structure.currencies = Array.from(currencies).map(currency => ({
          id: currency.getAttribute('id') || '',
          rate: parseFloat(currency.getAttribute('rate') || '1')
        }));

        // Додаємо параметри валют (тільки перші як приклад)
        const firstCurrency = currencies[0];
        if (firstCurrency) {
          structure.parameters.push({
            name: 'currency_id',
            value: firstCurrency.getAttribute('id') || '',
            path: '/yml_catalog/shop/currencies/currency[@id]',
            type: 'parameter',
            category: 'currency'
          });
          structure.parameters.push({
            name: 'currency_rate',
            value: firstCurrency.getAttribute('rate') || '1',
            path: '/yml_catalog/shop/currencies/currency[@rate]',
            type: 'parameter',
            category: 'currency'
          });
        }
      }

      // Парсинг категорій
      const categories = xmlDoc.querySelectorAll('category');
      if (categories.length > 0) {
        structure.categories = Array.from(categories).map(category => ({
          id: category.getAttribute('id') || '',
          name: category.textContent || '',
          rz_id: category.getAttribute('rz_id') || undefined
        }));

        // Додаємо параметри категорій (тільки перші як приклад)
        const firstCategory = categories[0];
        if (firstCategory) {
          structure.parameters.push({
            name: 'category_id',
            value: firstCategory.getAttribute('id') || '',
            path: '/yml_catalog/shop/categories/category[@id]',
            type: 'parameter',
            category: 'category'
          });
          structure.parameters.push({
            name: 'category_name',
            value: firstCategory.textContent || '',
            path: '/yml_catalog/shop/categories/category',
            type: 'parameter',
            category: 'category'
          });
          if (firstCategory.getAttribute('rz_id')) {
            structure.parameters.push({
              name: 'category_rz_id',
              value: firstCategory.getAttribute('rz_id') || '',
              path: '/yml_catalog/shop/categories/category[@rz_id]',
              type: 'parameter',
              category: 'category'
            });
          }
        }
      }

      // Парсинг товарів
      const offers = xmlDoc.querySelectorAll('offer');
      if (offers.length > 0) {
        structure.offers = Array.from(offers).map(offer => {
          const offerData: any = {
            id: offer.getAttribute('id') || '',
            available: offer.getAttribute('available') === 'true'
          };

          // Збираємо всі дочірні елементи
          Array.from(offer.children).forEach(child => {
            if (child.tagName === 'param') {
              // Обробляємо характеристики окремо
              const paramName = child.getAttribute('name');
              if (paramName && !offerData.params) {
                offerData.params = {};
              }
              if (paramName) {
                offerData.params[paramName] = child.textContent;
              }
            } else {
              offerData[child.tagName] = child.textContent;
            }
          });

          return offerData;
        });

        // Додаємо параметри товарів на основі першого товару
        const firstOffer = offers[0];
        if (firstOffer) {
          // Основні параметри товару
          const basicFields = ['price', 'price_old', 'price_promo', 'currencyId', 'categoryId', 'picture', 'vendor', 'name', 'description', 'stock_quantity', 'available', 'url'];
          
          basicFields.forEach(field => {
            const element = firstOffer.querySelector(field);
            if (element) {
              structure.parameters.push({
                name: field,
                value: element.textContent || '',
                path: `/yml_catalog/shop/offers/offer/${field}`,
                type: 'parameter',
                category: 'offer'
              });
            }
          });

          // Характеристики товару (param elements)
          const params = firstOffer.querySelectorAll('param');
          if (params.length > 0) {
            // Додаємо тільки перший param як приклад структури характеристик
            const firstParam = params[0];
            const paramName = firstParam.getAttribute('name');
            if (paramName) {
              structure.parameters.push({
                name: 'param_name',
                value: paramName,
                path: '/yml_catalog/shop/offers/offer/param[@name]',
                type: 'characteristic',
                category: 'offer'
              });
              structure.parameters.push({
                name: 'param_value',
                value: firstParam.textContent || '',
                path: '/yml_catalog/shop/offers/offer/param',
                type: 'characteristic',
                category: 'offer'
              });
            }
          }

          // Атрибути offer
          structure.parameters.push({
            name: 'offer_id',
            value: firstOffer.getAttribute('id') || '',
            path: '/yml_catalog/shop/offers/offer[@id]',
            type: 'parameter',
            category: 'offer'
          });
          structure.parameters.push({
            name: 'offer_available',
            value: firstOffer.getAttribute('available') || 'true',
            path: '/yml_catalog/shop/offers/offer[@available]',
            type: 'parameter',
            category: 'offer'
          });
        }
      }

      return structure;
    } catch (error) {
      console.error('Помилка парсингу XML:', error);
      throw error;
    }
  };

  const handleParseXML = async () => {
    if (!templateName.trim()) {
      alert('Будь ласка, введіть назву шаблону');
      return;
    }

    setIsProcessing(true);
    
    try {
      let xmlContent = '';

      if (uploadMethod === 'file' && selectedFile) {
        xmlContent = await selectedFile.text();
      } else if (uploadMethod === 'url' && xmlUrl.trim()) {
        console.log('Завантаження XML з URL:', xmlUrl);
        const response = await fetch(xmlUrl);
        if (!response.ok) {
          throw new Error('Не вдалося завантажити файл з URL');
        }
        xmlContent = await response.text();
      } else {
        alert('Будь ласка, оберіть файл або введіть URL');
        return;
      }

      const structure = await parseXMLToStructure(xmlContent);
      setParsedStructure(structure);
      
    } catch (error) {
      console.error('Помилка парсингу XML:', error);
      alert('Помилка парсингу XML: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTemplate = (templateData: any) => {
    const finalTemplateData = {
      name: templateName.trim(),
      structure: templateData.structure,
      shop_name: templateData.structure?.shop?.name,
      shop_company: templateData.structure?.shop?.company,
      shop_url: templateData.structure?.shop?.url,
      is_active: true,
      parameters: templateData.parameters
    };

    console.log('Створення шаблону:', finalTemplateData);
    onCreateTemplate(finalTemplateData);
    
    // Очищуємо форму
    setTemplateName('');
    setSelectedFile(null);
    setXmlUrl('');
    setParsedStructure(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Створити новий XML-шаблон
          </DialogTitle>
          <DialogDescription>
            Завантажте XML-файл або вкажіть URL для створення шаблону з розширеним парсингом
          </DialogDescription>
        </DialogHeader>

        {!parsedStructure ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="template-name">Назва шаблону</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="Введіть назву шаблону"
                required
              />
            </div>

            <Tabs value={uploadMethod} onValueChange={(value) => setUploadMethod(value as 'file' | 'url')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Завантажити файл
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  URL посилання
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="file">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="xml-file">XML-файл</Label>
                      <Input
                        id="xml-file"
                        type="file"
                        accept=".xml,text/xml"
                        onChange={handleFileChange}
                        required={uploadMethod === 'file'}
                      />
                      {selectedFile && (
                        <p className="text-sm text-green-600">
                          Обрано файл: {selectedFile.name}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="url">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="xml-url">URL до XML-файлу</Label>
                      <Input
                        id="xml-url"
                        type="url"
                        value={xmlUrl}
                        onChange={(e) => setXmlUrl(e.target.value)}
                        placeholder="https://example.com/catalog.xml"
                        required={uploadMethod === 'url'}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isProcessing}
              >
                Скасувати
              </Button>
              <Button
                onClick={handleParseXML}
                disabled={isProcessing}
                id="parse-xml-button"
              >
                {isProcessing ? 'Парсинг...' : 'Парсувати XML'}
              </Button>
            </div>
          </div>
        ) : (
          <ParsedStructureTable 
            structure={parsedStructure}
            onSaveTemplate={handleCreateTemplate}
            isSaving={isCreating}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateTemplateDialog;
