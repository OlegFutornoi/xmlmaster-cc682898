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
const XMLTemplateCard = ({
  template,
  onEdit,
  onDuplicate,
  onDelete
}: XMLTemplateCardProps) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const handleDelete = () => {
    onDelete(template);
    setShowDeleteModal(false);
  };
  return <TooltipProvider>
      <Card className="group bg-white hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-blue-300 w-full max-w-sm mx-auto">
        <CardHeader className="pb-4 relative">
          <Badge 
            variant={template.is_active ? "default" : "secondary"} 
            className={`absolute top-3 right-3 text-xs z-10 ${
              template.is_active 
                ? "bg-green-100 text-green-700 border-green-200" 
                : "bg-gray-100 text-gray-600 border-gray-200"
            }`}
          >
            {template.is_active ? 'Активний' : 'Неактивний'}
          </Badge>
          
          <div className="flex items-start gap-3 pr-16">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <FileCode className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <CardTitle className="text-sm md:text-base text-gray-900 group-hover:text-blue-600 transition-colors cursor-pointer leading-tight truncate">
                    {template.name}
                  </CardTitle>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="break-words">{template.name}</p>
                </TooltipContent>
              </Tooltip>
              {template.shop_name && (
                <CardDescription className="text-xs text-gray-600 mt-1 truncate">
                  {template.shop_name}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-4">
          <div className="flex gap-2 justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={() => onEdit(template)} 
                  size="sm" 
                  variant="outline" 
                  className="border-gray-300 hover:bg-gray-50 h-8 w-8 p-0" 
                  id={`edit-template-${template.id}`}
                >
                  <Edit className="h-3.5 w-3.5" />
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
                  className="border-gray-300 hover:bg-gray-50 h-8 w-8 p-0" 
                  id={`duplicate-template-${template.id}`}
                >
                  <Copy className="h-3.5 w-3.5" />
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
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 h-8 w-8 p-0" 
                  id={`delete-template-${template.id}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Видалити</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>

      <DeleteConfirmModal open={showDeleteModal} onOpenChange={setShowDeleteModal} template={template} onConfirm={handleDelete} isDeleting={false} />
    </TooltipProvider>;
};
export default XMLTemplateCard;