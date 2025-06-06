
// Компонент карточки XML-шаблону
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileCode, Copy, Edit, Trash2 } from 'lucide-react';
import { XMLTemplate } from '@/types/xml-template';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

interface XMLTemplateCardProps {
  template: XMLTemplate;
  onEdit: (template: XMLTemplate) => void;
  onDuplicate: (template: XMLTemplate) => void;
  onDelete: (template: XMLTemplate) => void;
}

const XMLTemplateCard = ({ template, onEdit, onDuplicate, onDelete }: XMLTemplateCardProps) => {
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Редагування шаблону:', template.id);
    onEdit(template);
  };

  const handleDuplicate = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Дублювання шаблону:', template.id);
    onDuplicate(template);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Видалення шаблону:', template.id);
    onDelete(template);
  };

  const parametersCount = template.parameters?.length || 0;

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
            <FileCode className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg text-gray-900 line-clamp-1">{template.name}</CardTitle>
            <CardDescription className="text-sm text-gray-600">
              {format(new Date(template.created_at), 'dd.MM.yyyy HH:mm', { locale: uk })}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Badge 
              variant={template.is_active ? "default" : "secondary"}
              className={template.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}
            >
              {template.is_active ? 'Активний' : 'Неактивний'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-3 relative z-10">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Параметрів:</span> {parametersCount}
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleEdit}
            variant="outline"
            size="sm"
            className="flex-1 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors relative z-20"
            id={`edit-template-${template.id}`}
            type="button"
          >
            <Edit className="h-4 w-4 mr-2" />
            Редагувати
          </Button>
          
          <Button
            onClick={handleDuplicate}
            variant="outline"
            size="sm"
            className="border-green-200 hover:bg-green-50 hover:border-green-300 transition-colors relative z-20"
            id={`duplicate-template-${template.id}`}
            type="button"
          >
            <Copy className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={handleDelete}
            variant="outline"
            size="sm"
            className="border-red-200 hover:bg-red-50 hover:border-red-300 text-red-600 hover:text-red-700 transition-colors relative z-20"
            id={`delete-template-${template.id}`}
            type="button"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default XMLTemplateCard;
