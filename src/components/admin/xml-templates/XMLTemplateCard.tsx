
// Компонент картки XML-шаблону з покращеним дизайном та функціональністю
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileCode, Edit, Copy, Trash2, Calendar, Hash } from 'lucide-react';
import { XMLTemplate } from '@/types/xml-template';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';
import DeleteConfirmModal from './DeleteConfirmModal';

interface XMLTemplateCardProps {
  template: XMLTemplate;
  onEdit: (template: XMLTemplate) => void;
  onDuplicate: (template: XMLTemplate) => void;
  onDelete: (template: XMLTemplate) => void;
}

const XMLTemplateCard = ({ template, onEdit, onDuplicate, onDelete }: XMLTemplateCardProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = () => {
    onDelete(template);
    setShowDeleteModal(false);
  };

  return (
    <>
      <Card className="group bg-white hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-blue-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileCode className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {template.name}
                </CardTitle>
                <CardDescription className="text-sm text-gray-600 mt-1">
                  {template.shop_name || 'XML шаблон'}
                </CardDescription>
              </div>
            </div>
            <Badge 
              variant={template.is_active ? "default" : "secondary"}
              className={template.is_active 
                ? "bg-green-100 text-green-700 border-green-200" 
                : "bg-gray-100 text-gray-600 border-gray-200"
              }
            >
              {template.is_active ? 'Активний' : 'Неактивний'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Статистика */}
          <div className="grid grid-cols-2 gap-4 py-3 px-3 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                <Hash className="h-3 w-3" />
                Параметрів
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {template.parameters?.length || 0}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm text-gray-600 mb-1">
                <Calendar className="h-3 w-3" />
                Створено
              </div>
              <div className="text-sm font-medium text-gray-900">
                {format(new Date(template.created_at), "dd.MM.yy", { locale: uk })}
              </div>
            </div>
          </div>

          {/* Дії */}
          <div className="flex gap-2">
            <Button
              onClick={() => onEdit(template)}
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              id={`edit-template-${template.id}`}
            >
              <Edit className="h-4 w-4 mr-2" />
              Редагувати
            </Button>
            <Button
              onClick={() => onDuplicate(template)}
              size="sm"
              variant="outline"
              className="border-gray-300 hover:bg-gray-50"
              id={`duplicate-template-${template.id}`}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => setShowDeleteModal(true)}
              size="sm"
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              id={`delete-template-${template.id}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        template={template}
        onConfirm={handleDelete}
        isDeleting={false}
      />
    </>
  );
};

export default XMLTemplateCard;
