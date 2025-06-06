
// Компонент таблиці параметрів XML-шаблону
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus } from 'lucide-react';
import { XMLTemplateParameter } from '@/types/xml-template';

interface TemplateParametersTableProps {
  parameters: XMLTemplateParameter[];
  onUpdateParameter: (id: string, updates: Partial<XMLTemplateParameter>) => void;
  onDeleteParameter: (id: string) => void;
  onAddParameter: () => void;
}

const TemplateParametersTable = ({ 
  parameters, 
  onUpdateParameter, 
  onDeleteParameter, 
  onAddParameter 
}: TemplateParametersTableProps) => {
  const handleActiveToggle = (id: string, isActive: boolean) => {
    console.log('Зміна активності параметру:', id, isActive);
    onUpdateParameter(id, { is_active: isActive });
  };

  const handleRequiredToggle = (id: string, isRequired: boolean) => {
    console.log('Зміна обов\'язковості параметру:', id, isRequired);
    onUpdateParameter(id, { is_required: isRequired });
  };

  const handleDelete = (id: string) => {
    console.log('Видалення параметру:', id);
    if (confirm('Ви впевнені, що хочете видалити цей параметр?')) {
      onDeleteParameter(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Параметри шаблону</h3>
        <Button 
          onClick={onAddParameter}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700"
          id="add-parameter-button"
          type="button"
        >
          <Plus className="h-4 w-4 mr-2" />
          Додати параметр
        </Button>
      </div>

      {parameters.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Параметри не знайдено. Додайте перший параметр.
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Назва параметру</TableHead>
                <TableHead>Значення</TableHead>
                <TableHead>XML шлях</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Активний</TableHead>
                <TableHead>Обов'язковий</TableHead>
                <TableHead>Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parameters.map((parameter) => (
                <TableRow key={parameter.id}>
                  <TableCell className="font-medium">
                    {parameter.parameter_name}
                  </TableCell>
                  <TableCell>
                    {parameter.parameter_value || '-'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {parameter.xml_path}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {parameter.parameter_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={parameter.is_active}
                      onCheckedChange={(checked) => handleActiveToggle(parameter.id, checked)}
                      id={`active-${parameter.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={parameter.is_required}
                      onCheckedChange={(checked) => handleRequiredToggle(parameter.id, checked)}
                      id={`required-${parameter.id}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(parameter.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      id={`delete-parameter-${parameter.id}`}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default TemplateParametersTable;
