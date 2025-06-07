
// Компонент таблиці параметрів шаблону для редагування без стовпчика "Тип"
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Trash2, Save, Copy, Edit } from 'lucide-react';
import { XMLTemplateParameter } from '@/types/xml-template';
import { toast } from '@/hooks/use-toast';

interface TemplateParametersTableProps {
  parameters: XMLTemplateParameter[];
  onUpdateParameter: (updates: any) => void;
  onDeleteParameter: (id: string) => void;
}

const TemplateParametersTable = ({ 
  parameters, 
  onUpdateParameter, 
  onDeleteParameter 
}: TemplateParametersTableProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<XMLTemplateParameter>>({});

  const handleEdit = (parameter: XMLTemplateParameter) => {
    setEditingId(parameter.id);
    setEditForm(parameter);
  };

  const handleSave = () => {
    if (editingId && editForm) {
      onUpdateParameter({
        id: editingId,
        updates: editForm
      });
      setEditingId(null);
      setEditForm({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const getShortPath = (fullPath: string) => {
    const parts = fullPath.split('/');
    return parts[parts.length - 1] || fullPath;
  };

  const copyFullPath = (fullPath: string) => {
    navigator.clipboard.writeText(fullPath);
    toast({
      title: 'Скопійовано',
      description: 'Повний XML-шлях скопійовано в буфер обміну',
      duration: 2000
    });
  };

  if (parameters.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Параметри не знайдено</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[150px]">Назва параметру</TableHead>
            <TableHead className="min-w-[120px] hidden md:table-cell">Значення</TableHead>
            <TableHead className="min-w-[200px]">XML шлях</TableHead>
            <TableHead className="min-w-[80px] hidden sm:table-cell">Активний</TableHead>
            <TableHead className="min-w-[100px] hidden lg:table-cell">Обов'язковий</TableHead>
            <TableHead className="w-[120px]">Дії</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parameters.map((parameter) => (
            <TableRow key={parameter.id}>
              <TableCell>
                {editingId === parameter.id ? (
                  <Input
                    value={editForm.parameter_name || ''}
                    onChange={(e) => setEditForm(prev => ({...prev, parameter_name: e.target.value}))}
                    className="min-w-0"
                  />
                ) : (
                  <span className="font-medium">{parameter.parameter_name}</span>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {editingId === parameter.id ? (
                  <Input
                    value={editForm.parameter_value || ''}
                    onChange={(e) => setEditForm(prev => ({...prev, parameter_value: e.target.value}))}
                    className="min-w-0"
                  />
                ) : (
                  <span>{parameter.parameter_value || '-'}</span>
                )}
              </TableCell>
              <TableCell>
                {editingId === parameter.id ? (
                  <Input
                    value={editForm.xml_path || ''}
                    onChange={(e) => setEditForm(prev => ({...prev, xml_path: e.target.value}))}
                    className="min-w-0"
                  />
                ) : (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-sm truncate" title={parameter.xml_path}>
                      {getShortPath(parameter.xml_path)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyFullPath(parameter.xml_path)}
                      className="p-1 h-6 w-6 flex-shrink-0"
                      id={`copy-path-${parameter.id}`}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {editingId === parameter.id ? (
                  <Switch
                    checked={editForm.is_active ?? false}
                    onCheckedChange={(checked) => setEditForm(prev => ({...prev, is_active: checked}))}
                  />
                ) : (
                  <Badge variant={parameter.is_active ? "default" : "secondary"}>
                    {parameter.is_active ? 'Так' : 'Ні'}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {editingId === parameter.id ? (
                  <Switch
                    checked={editForm.is_required ?? false}
                    onCheckedChange={(checked) => setEditForm(prev => ({...prev, is_required: checked}))}
                  />
                ) : (
                  <Badge variant={parameter.is_required ? "default" : "secondary"}>
                    {parameter.is_required ? 'Так' : 'Ні'}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {editingId === parameter.id ? (
                    <>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        className="h-8 w-8 p-0"
                        id={`save-parameter-${parameter.id}`}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancel}
                        className="h-8 w-8 p-0"
                        id={`cancel-edit-${parameter.id}`}
                      >
                        ✕
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(parameter)}
                        className="h-8 w-8 p-0"
                        id={`edit-parameter-${parameter.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeleteParameter(parameter.id)}
                        className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                        id={`delete-parameter-${parameter.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default TemplateParametersTable;
