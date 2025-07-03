// Редактор XML-шаблонів в адміністративній панелі з розширеною функціональністю
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Upload, Building, FileCode } from 'lucide-react';
import { useXMLTemplates } from '@/hooks/xml-templates/useXMLTemplates';
import { useXMLTemplateParameters } from '@/hooks/xml-templates/useXMLTemplateParameters';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { toast } from '@/hooks/use-toast';
import TemplateParametersTable from '@/components/admin/xml-templates/TemplateParametersTable';
import { useIsMobile } from '@/hooks/use-mobile';
const XMLTemplateEditor = () => {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isXMLImportDialogOpen, setIsXMLImportDialogOpen] = useState(false);
  const [importMethod, setImportMethod] = useState<'file' | 'url'>('file');
  const [xmlUrl, setXmlUrl] = useState('');
  const [xmlFile, setXmlFile] = useState<File | null>(null);

  // Форма для редагування шаблону
  const [templateForm, setTemplateForm] = useState({
    name: '',
    shop_name: '',
    shop_company: '',
    shop_url: '',
    is_active: true
  });
  const {
    templates,
    updateTemplate,
    isUpdating
  } = useXMLTemplates();
  const {
    parameters,
    isLoading: isLoadingParameters,
    createParameter,
    updateParameter,
    deleteParameter,
    isCreating,
    isUpdating: isUpdatingParameter,
    isDeleting
  } = useXMLTemplateParameters(id);
  const currentTemplate = templates.find(t => t.id === id);
  useEffect(() => {
    if (currentTemplate) {
      setTemplateForm({
        name: currentTemplate.name,
        shop_name: currentTemplate.shop_name || '',
        shop_company: currentTemplate.shop_company || '',
        shop_url: currentTemplate.shop_url || '',
        is_active: currentTemplate.is_active
      });
    }
  }, [currentTemplate]);
  const handleSaveTemplate = () => {
    if (!id) return;
    updateTemplate({
      id,
      updates: {
        name: templateForm.name,
        shop_name: templateForm.shop_name,
        shop_company: templateForm.shop_company,
        shop_url: templateForm.shop_url,
        is_active: templateForm.is_active
      }
    });
  };
  const handleCreateParameter = (parameter: any) => {
    createParameter(parameter);
  };
  const handleDeleteParameter = (parameterId: string) => {
    deleteParameter(parameterId);
  };
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/xml') {
      setXmlFile(file);
    }
  };
  const handleImportXML = async () => {
    console.log('Імпорт XML:', {
      method: importMethod,
      url: xmlUrl,
      file: xmlFile
    });
    // TODO: Реалізувати парсинг XML та створення параметрів
    setIsXMLImportDialogOpen(false);
  };
  if (!currentTemplate) {
    return <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AdminSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <FileCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Шаблон не знайдено</p>
                <Button onClick={() => navigate('/admin/xml-templates')} className="mt-4" variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Повернутися до списку
                </Button>
              </div>
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>;
  }
  return <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <SidebarInset>
          {/* Header */}
          <header className="flex h-16 shrink-0 items-center gap-2 px-4 border-b">
            <SidebarTrigger className="-ml-1" />
            <div className={`flex ${isMobile ? 'flex-col gap-2' : 'flex-col md:flex-row md:items-center md:justify-between'} flex-1`}>
              <div className={`flex items-center ${isMobile ? 'gap-2' : 'gap-4'}`}>
                <Button onClick={() => navigate('/admin/xml-templates')} variant="outline" size={isMobile ? "sm" : "sm"} id="back-button">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {isMobile ? '' : 'Назад'}
                </Button>
                <div>
                  <h1 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-gray-900 md:text-xl`}>
                    {isMobile ? 'Редагування' : 'Редагування шаблону'}
                  </h1>
                </div>
              </div>
              <div className={`flex gap-2 ${isMobile ? 'mt-2' : 'mt-4 md:mt-0'}`}>
                <Button onClick={handleSaveTemplate} disabled={isUpdating} className="bg-blue-600 hover:bg-blue-700 text-white" id="save-template-button" size={isMobile ? "sm" : "default"}>
                  <Save className="h-4 w-4 mr-2" />
                  {isUpdating ? 'Збереження...' : 'Зберегти'}
                </Button>
              </div>
            </div>
          </header>

          <div className={`flex-1 ${isMobile ? 'p-3' : 'p-4 md:p-8'} space-y-${isMobile ? '4' : '6'}`}>
            {/* Основна інформація про шаблон */}
            <Card className="border-0 shadow-sm bg-white">
              <CardHeader className={isMobile ? 'p-4' : ''}>
                <CardTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}>
                  <Building className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'}`} />
                  Основна інформація
                </CardTitle>
                <CardDescription className={isMobile ? 'text-sm' : ''}>
                  Налаштуйте назву, інформацію про магазин та статус XML-шаблону
                </CardDescription>
              </CardHeader>
              <CardContent className={`space-y-4 ${isMobile ? 'p-4' : ''}`}>
                <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'md:grid-cols-2 gap-4'}`}>
                  <div>
                    <Label htmlFor="template-name">Назва шаблону</Label>
                    <Input id="template-name" value={templateForm.name} onChange={e => setTemplateForm(prev => ({
                    ...prev,
                    name: e.target.value
                  }))} placeholder="Введіть назву шаблону" />
                  </div>
                  <div>
                    <Label htmlFor="shop-name">Назва магазину</Label>
                    <Input id="shop-name" value={templateForm.shop_name} onChange={e => setTemplateForm(prev => ({
                    ...prev,
                    shop_name: e.target.value
                  }))} placeholder="Назва магазину з XML" />
                  </div>
                  <div>
                    <Label htmlFor="shop-company">Назва компанії</Label>
                    <Input id="shop-company" value={templateForm.shop_company} onChange={e => setTemplateForm(prev => ({
                    ...prev,
                    shop_company: e.target.value
                  }))} placeholder="Юридична назва компанії" />
                  </div>
                  <div>
                    <Label htmlFor="shop-url">URL магазину</Label>
                    <Input id="shop-url" value={templateForm.shop_url} onChange={e => setTemplateForm(prev => ({
                    ...prev,
                    shop_url: e.target.value
                  }))} placeholder="https://example.com" />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="template-active" checked={templateForm.is_active} onCheckedChange={checked => setTemplateForm(prev => ({
                  ...prev,
                  is_active: checked
                }))} />
                  <Label htmlFor="template-active">Активний шаблон</Label>
                </div>
              </CardContent>
            </Card>

            {/* Структура параметрів */}
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="p-6">
                {isLoadingParameters ? <div className="text-center py-8">
                    <p className="text-gray-600">Завантаження параметрів...</p>
                  </div> : <TemplateParametersTable parameters={parameters} onUpdateParameter={updateParameter} onDeleteParameter={handleDeleteParameter} onCreateParameter={handleCreateParameter} templateId={id || ''} />}
              </CardContent>
            </Card>
          </div>

          {/* Діалог імпорту XML */}
          <Dialog open={isXMLImportDialogOpen} onOpenChange={setIsXMLImportDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Імпорт XML-структури</DialogTitle>
                <DialogDescription>
                  Завантажте XML-файл або вкажіть URL для оновлення структури шаблону
                </DialogDescription>
              </DialogHeader>
              <Tabs value={importMethod} onValueChange={value => setImportMethod(value as 'file' | 'url')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">Завантаження файлу</TabsTrigger>
                  <TabsTrigger value="url">URL посилання</TabsTrigger>
                </TabsList>
                <TabsContent value="file" className="space-y-4">
                  <div>
                    <Label htmlFor="xml-file">XML файл</Label>
                    <Input id="xml-file" type="file" accept=".xml" onChange={handleFileUpload} />
                  </div>
                </TabsContent>
                <TabsContent value="url" className="space-y-4">
                  <div>
                    <Label htmlFor="xml-url">URL посилання</Label>
                    <Input id="xml-url" value={xmlUrl} onChange={e => setXmlUrl(e.target.value)} placeholder="https://example.com/catalog.xml" />
                  </div>
                </TabsContent>
              </Tabs>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsXMLImportDialogOpen(false)}>
                  Скасувати
                </Button>
                <Button onClick={handleImportXML} disabled={importMethod === 'file' ? !xmlFile : !xmlUrl} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Імпортувати XML
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </SidebarInset>
      </div>
    </SidebarProvider>;
};
export default XMLTemplateEditor;