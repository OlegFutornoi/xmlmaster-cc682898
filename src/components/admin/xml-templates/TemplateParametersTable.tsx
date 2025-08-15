
// Компонент для відображення параметрів XML-шаблону з підтримкою ієрархії
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Plus, ChevronRight, ChevronDown } from 'lucide-react';
import { XMLTemplateParameter } from '@/types/xml-template';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useIsMobile } from '@/hooks/use-mobile';

interface TemplateParametersTableProps {
  parameters: XMLTemplateParameter[];
  onUpdateParameter: (id: string, updates: any) => void;
  onDeleteParameter: (id: string) => void;
  onCreateParameter: (parameter: any) => void;
  templateId: string;
}

const TemplateParametersTable: React.FC<TemplateParametersTableProps> = ({
  parameters,
  onUpdateParameter,
  onDeleteParameter,
  onCreateParameter,
  templateId
}) => {
  const isMobile = useIsMobile();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  const [newParameter, setNewParameter] = useState({
    parameter_name: '',
    parameter_value: '',
    parameter_type: 'text',
    parameter_category: 'parameter' as const,
    xml_path: '',
    is_required: false,
    is_active: true
  });

  // Групуємо параметри за категоріями та батьківськими параметрами
  const groupedParameters = React.useMemo(() => {
    const groups: Record<string, {
      category: string;
      categoryLabel: string;
      order: number;
      parameters: XMLTemplateParameter[];
      children: Record<string, XMLTemplateParameter[]>;
    }> = {};

    // Визначаємо порядок та назви категорій
    const categoryInfo = {
      'parameter': { label: 'Основна інформація магазину', order: 0 },
      'currency': { label: 'Валюти', order: 1 },
      'category': { label: 'Категорії товарів', order: 2 },
      'offer': { label: 'Параметри товарів', order: 3 },
      'characteristic': { label: 'Характеристики товарів', order: 4 }
    };

    parameters.forEach(param => {
      const category = param.parameter_category || 'parameter';
      const info = categoryInfo[category as keyof typeof categoryInfo] || { label: category, order: 999 };
      
      if (!groups[category]) {
        groups[category] = {
          category,
          categoryLabel: info.label,
          order: info.order,
          parameters: [],
          children: {}
        };
      }

      if (param.parent_parameter) {
        // Це дочірній параметр
        if (!groups[category].children[param.parent_parameter]) {
          groups[category].children[param.parent_parameter] = [];
        }
        groups[category].children[param.parent_parameter].push(param);
      } else {
        // Це основний параметр
        groups[category].parameters.push(param);
      }
    });

    // Сортуємо групи за порядком
    return Object.values(groups).sort((a, b) => a.order - b.order);
  }, [parameters]);

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'parameter': return 'bg-blue-100 text-blue-800';
      case 'currency': return 'bg-green-100 text-green-800';
      case 'category': return 'bg-purple-100 text-purple-800';
      case 'offer': return 'bg-orange-100 text-orange-800';
      case 'characteristic': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateParameter = () => {
    onCreateParameter({
      template_id: templateId,
      ...newParameter,
      display_order: parameters.length
    });
    setNewParameter({
      parameter_name: '',
      parameter_value: '',
      parameter_type: 'text',
      parameter_category: 'parameter',
      xml_path: '',
      is_required: false,
      is_active: true
    });
    setIsCreateDialogOpen(false);
  };

  const renderParameter = (param: XMLTemplateParameter, level: number = 0) => (
    <TableRow key={param.id} className={level > 0 ? 'bg-gray-50' : ''} id={`parameter-row-${param.id}`}>
      <TableCell className={isMobile ? 'p-2' : ''}>
        <div className={`flex items-center ${level > 0 ? 'ml-6' : ''}`}>
          <Badge className={`${getCategoryBadgeColor(param.parameter_category)} mr-2 ${isMobile ? 'text-xs' : ''}`}>
            {param.parameter_category}
          </Badge>
          <span className={`font-medium ${isMobile ? 'text-sm' : ''}`}>
            {param.parameter_name}
          </span>
        </div>
      </TableCell>
      <TableCell className={isMobile ? 'p-2' : ''}>
        {editingId === param.id ? (
          <Input
            value={param.parameter_value || ''}
            onChange={(e) => onUpdateParameter(param.id, { parameter_value: e.target.value })}
            onBlur={() => setEditingId(null)}
            onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
            className={isMobile ? 'text-sm' : ''}
            id={`parameter-value-input-${param.id}`}
          />
        ) : (
          <div 
            onClick={() => setEditingId(param.id)}
            className={`cursor-pointer hover:bg-gray-100 p-1 rounded ${isMobile ? 'text-sm' : ''}`}
            id={`parameter-value-${param.id}`}
          >
            {param.parameter_value || 
              <span className="text-gray-400 italic">Клікніть для редагування</span>
            }
          </div>
        )}
        {param.nested_values && param.nested_values.length > 0 && (
          <div className={`mt-2 space-y-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            {param.nested_values.map((nested, index) => (
              <div key={index} className="bg-blue-50 p-2 rounded text-blue-800">
                {nested.lang && <span className="font-semibold">{nested.lang}:</span>} {nested.value}
              </div>
            ))}
          </div>
        )}
      </TableCell>
      <TableCell className={isMobile ? 'p-2' : ''}>
        <span className={`font-mono text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
          {param.xml_path}
        </span>
      </TableCell>
      <TableCell className={isMobile ? 'p-2' : ''}>
        <div className={`flex items-center gap-2 ${isMobile ? 'flex-col' : ''}`}>
          <Switch
            checked={param.is_active}
            onCheckedChange={(checked) => onUpdateParameter(param.id, { is_active: checked })}
            id={`parameter-active-${param.id}`}
          />
          <Switch
            checked={param.is_required}
            onCheckedChange={(checked) => onUpdateParameter(param.id, { is_required: checked })}
            id={`parameter-required-${param.id}`}
          />
        </div>
      </TableCell>
      <TableCell className={isMobile ? 'p-2' : ''}>
        <Button
          onClick={() => onDeleteParameter(param.id)}
          variant="destructive"
          size={isMobile ? "sm" : "sm"}
          id={`delete-parameter-${param.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );

  if (parameters.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 mb-4">Параметри не знайдено</p>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button id="create-parameter-button">
              <Plus className="h-4 w-4 mr-2" />
              Додати параметр
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Створити новий параметр</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-param-name">Назва параметру</Label>
                <Input
                  id="new-param-name"
                  value={newParameter.parameter_name}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, parameter_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="new-param-value">Значення</Label>
                <Input
                  id="new-param-value"
                  value={newParameter.parameter_value}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, parameter_value: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="new-param-category">Категорія</Label>
                <Select
                  value={newParameter.parameter_category}
                  onValueChange={(value) => setNewParameter(prev => ({ ...prev, parameter_category: value as any }))}
                >
                  <SelectTrigger id="new-param-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parameter">Основна інформація</SelectItem>
                    <SelectItem value="currency">Валюта</SelectItem>
                    <SelectItem value="category">Категорія</SelectItem>
                    <SelectItem value="offer">Товар</SelectItem>
                    <SelectItem value="characteristic">Характеристика</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="new-param-path">XML шлях</Label>
                <Input
                  id="new-param-path"
                  value={newParameter.xml_path}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, xml_path: e.target.value }))}
                />
              </div>
              <Button onClick={handleCreateParameter} className="w-full" id="confirm-create-parameter">
                Створити параметр
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>
          Параметри шаблону ({parameters.length})
        </h3>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size={isMobile ? "sm" : "default"} id="add-parameter-button">
              <Plus className="h-4 w-4 mr-2" />
              {isMobile ? 'Додати' : 'Додати параметр'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Створити новий параметр</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="new-param-name">Назва параметру</Label>
                <Input
                  id="new-param-name"
                  value={newParameter.parameter_name}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, parameter_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="new-param-value">Значення</Label>
                <Input
                  id="new-param-value"
                  value={newParameter.parameter_value}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, parameter_value: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="new-param-category">Категорія</Label>
                <Select
                  value={newParameter.parameter_category}
                  onValueChange={(value) => setNewParameter(prev => ({ ...prev, parameter_category: value as any }))}
                >
                  <SelectTrigger id="new-param-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parameter">Основна інформація</SelectItem>
                    <SelectItem value="currency">Валюта</SelectItem>
                    <SelectItem value="category">Категорія</SelectItem>
                    <SelectItem value="offer">Товар</SelectItem>
                    <SelectItem value="characteristic">Характеристика</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="new-param-path">XML шлях</Label>
                <Input
                  id="new-param-path"
                  value={newParameter.xml_path}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, xml_path: e.target.value }))}
                />
              </div>
              <Button onClick={handleCreateParameter} className="w-full" id="confirm-create-parameter">
                Створити параметр
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={isMobile ? 'p-2 text-xs' : ''}>Параметр</TableHead>
              <TableHead className={isMobile ? 'p-2 text-xs' : ''}>Значення</TableHead>
              <TableHead className={isMobile ? 'p-2 text-xs' : ''}>XML шлях</TableHead>
              <TableHead className={isMobile ? 'p-2 text-xs' : ''}>Статус</TableHead>
              <TableHead className={isMobile ? 'p-2 text-xs' : ''}>Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedParameters.map(group => (
              <React.Fragment key={group.category}>
                {/* Заголовок групи */}
                <TableRow className="bg-gray-100 hover:bg-gray-100">
                  <TableCell 
                    colSpan={5} 
                    className={`font-semibold cursor-pointer ${isMobile ? 'p-2 text-sm' : 'p-4'}`}
                    onClick={() => toggleGroup(group.category)}
                    id={`group-header-${group.category}`}
                  >
                    <div className="flex items-center gap-2">
                      {expandedGroups.has(group.category) ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                      {group.categoryLabel} ({group.parameters.length + Object.values(group.children).flat().length})
                    </div>
                  </TableCell>
                </TableRow>
                
                {/* Параметри групи */}
                {expandedGroups.has(group.category) && (
                  <>
                    {group.parameters.map(param => (
                      <React.Fragment key={param.id}>
                        {renderParameter(param)}
                        {/* Дочірні параметри */}
                        {group.children[param.parameter_name]?.map(child => 
                          renderParameter(child, 1)
                        )}
                      </React.Fragment>
                    ))}
                  </>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TemplateParametersTable;
