
// Сторінка управління XML-шаблонами в адміністративній панелі
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileCode, Plus, Search } from 'lucide-react';
import { useXMLTemplates } from '@/hooks/xml-templates/useXMLTemplates';
import XMLTemplateCard from '@/components/admin/xml-templates/XMLTemplateCard';
import CreateTemplateDialog from '@/components/admin/xml-templates/CreateTemplateDialog';
import { XMLTemplate } from '@/types/xml-template';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';

const AdminXMLTemplates = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  const {
    templates,
    isLoading,
    createTemplate,
    deleteTemplate,
    duplicateTemplate,
    isCreating,
    isDeleting,
    isDuplicating
  } = useXMLTemplates();

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditTemplate = (template: XMLTemplate) => {
    console.log('Перехід до редагування шаблону:', template.id);
    navigate(`/admin/xml-templates/${template.id}`);
  };

  const handleDuplicateTemplate = (template: XMLTemplate) => {
    console.log('Дублювання шаблону:', template.id);
    duplicateTemplate(template);
  };

  const handleDeleteTemplate = (template: XMLTemplate) => {
    console.log('Видалення шаблону:', template.id);
    if (confirm(`Ви впевнені, що хочете видалити шаблон "${template.name}"?`)) {
      deleteTemplate(template.id);
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AdminSidebar />
          <SidebarInset>
            <div className="flex items-center justify-center min-h-screen">
              <div className="text-center">
                <FileCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Завантаження XML-шаблонів...</p>
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between flex-1">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  XML-шаблони
                </h1>
                <p className="text-gray-600 mt-1">
                  Управління XML-шаблонами для маркетплейсів
                </p>
              </div>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700 text-white"
                id="create-template-button"
                type="button"
              >
                <Plus className="h-4 w-4 mr-2" />
                Створити шаблон
              </Button>
            </div>
          </header>

          <div className="flex-1 p-4 md:p-8 space-y-6">
            {/* Пошук */}
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Пошук шаблонів за назвою..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                    id="search-templates"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Список шаблонів */}
            {filteredTemplates.length === 0 ? (
              <Card className="border-0 shadow-sm bg-white">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <FileCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {searchQuery ? 'Шаблони не знайдено' : 'Немає XML-шаблонів'}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {searchQuery 
                        ? 'Спробуйте змінити критерії пошуку' 
                        : 'Створіть перший XML-шаблон для початку роботи'
                      }
                    </p>
                    {!searchQuery && (
                      <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        id="create-first-template-button"
                        type="button"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Створити перший шаблон
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <XMLTemplateCard
                    key={template.id}
                    template={template}
                    onEdit={handleEditTemplate}
                    onDuplicate={handleDuplicateTemplate}
                    onDelete={handleDeleteTemplate}
                  />
                ))}
              </div>
            )}

            {/* Статистика */}
            <Card className="border-0 shadow-sm bg-white">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{templates.length}</div>
                    <div className="text-sm text-gray-600">Всього шаблонів</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {templates.filter(t => t.is_active).length}
                    </div>
                    <div className="text-sm text-gray-600">Активних шаблонів</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {templates.reduce((acc, t) => acc + (t.parameters?.length || 0), 0)}
                    </div>
                    <div className="text-sm text-gray-600">Всього параметрів</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Діалог створення шаблону */}
          <CreateTemplateDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onCreateTemplate={createTemplate}
            isCreating={isCreating}
          />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default AdminXMLTemplates;
