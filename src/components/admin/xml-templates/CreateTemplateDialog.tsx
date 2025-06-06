
// Діалог створення нового XML-шаблону
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Link, FileCode } from 'lucide-react';

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/xml') {
      setSelectedFile(file);
      console.log('Файл обрано:', file.name);
    } else {
      alert('Будь ласка, оберіть XML-файл');
    }
  };

  const parseXMLToStructure = async (xmlContent: string) => {
    try {
      console.log('Парсинг XML-контенту...');
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      if (xmlDoc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Невірний XML-формат');
      }

      // Конвертуємо XML в структуру
      const convertElement = (element: Element): any => {
        const result: any = {
          tagName: element.tagName,
          attributes: {}
        };

        // Додаємо атрибути
        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          result.attributes[attr.name] = attr.value;
        }

        // Обробляємо дочірні елементи
        const children: any[] = [];
        const textContent = element.textContent?.trim();

        for (let i = 0; i < element.children.length; i++) {
          children.push(convertElement(element.children[i]));
        }

        if (children.length > 0) {
          result.children = children;
        } else if (textContent) {
          result.textContent = textContent;
        }

        return result;
      };

      const rootElement = xmlDoc.documentElement;
      return convertElement(rootElement);
    } catch (error) {
      console.error('Помилка парсингу XML:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
      
      const templateData = {
        name: templateName.trim(),
        structure: structure,
        is_active: true
      };

      console.log('Створення шаблону:', templateData);
      onCreateTemplate(templateData);
      
      // Очищуємо форму
      setTemplateName('');
      setSelectedFile(null);
      setXmlUrl('');
      onOpenChange(false);
      
    } catch (error) {
      console.error('Помилка створення шаблону:', error);
      alert('Помилка створення шаблону: ' + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCode className="h-5 w-5" />
            Створити новий XML-шаблон
          </DialogTitle>
          <DialogDescription>
            Завантажте XML-файл або вкажіть URL для створення шаблону
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              disabled={isCreating || isProcessing}
            >
              Скасувати
            </Button>
            <Button
              type="submit"
              disabled={isCreating || isProcessing}
              id="create-template-submit"
            >
              {isCreating || isProcessing ? 'Створення...' : 'Створити шаблон'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTemplateDialog;
