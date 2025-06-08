
// Компонент картки XML-шаблону з покращеним дизайном та функціональністю
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileCode, Edit, Copy, Trash2 } from 'lucide-react';
import { XMLTemplate } from '@/types/xml-template';
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
    <TooltipProvider>
      <Card className="group bg-white hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-blue-300 h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileCode className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-base lg:text-lg text-gray-900 truncate group-hover:text-blue-600 transition-colors line-clamp-1">
                  {template.name}
                </CardTitle>
                {template.shop_name && (
                  <CardDescription className="text-xs lg:text-sm text-gray-600 mt-1 truncate">
                    {template.shop_name}
                  </CardDescription>
                )}
              </div>
            </div>
            <Badge 
              variant={template.is_active ? "default" : "secondary"}
              className={`flex-shrink-0 text-xs ${template.is_active 
                ? "bg-green-100 text-green-700 border-green-200" 
                : "bg-gray-100 text-gray-600 border-gray-200"
              }`}
            >
              {template.is_active ? 'Активний' : 'Неактивний'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Дії */}
          <div className="flex gap-1 lg:gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onEdit(template)}
                  size="sm"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-8 lg:h-9 px-2 lg:px-3"
                  id={`edit-template-${template.id}`}
                >
                  <Edit className="h-3 w-3 lg:h-4 lg:w-4" />
                  <span className="hidden lg:inline ml-2">Редагувати</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Редагувати</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => onDuplicate(template)}
                  size="sm"
                  variant="outline"
                  className="border-gray-300 hover:bg-gray-50 flex-shrink-0 h-8 lg:h-9 w-8 lg:w-9 p-0"
                  id={`duplicate-template-${template.id}`}
                >
                  <Copy className="h-3 w-3 lg:h-4 lg:w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Копіювати</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  size="sm"
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 flex-shrink-0 h-8 lg:h-9 w-8 lg:w-9 p-0"
                  id={`delete-template-${template.id}`}
                >
                  <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Видалити</p>
              </TooltipContent>
            </Tooltip>
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
    </TooltipProvider>
  );
};

export default XMLTemplateCard;
