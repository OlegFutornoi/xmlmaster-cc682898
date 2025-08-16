
// Компонент дерева параметрів XML шаблону з можливістю редагування
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Trash2, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Settings,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { XMLTemplateParameter } from '@/types/xml-template';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ParameterNode extends XMLTemplateParameter {
  children: ParameterNode[];
  level: number;
}

interface TemplateParameterTreeProps {
  parameters: XMLTemplateParameter[];
  onUpdateParameter: (id: string, updates: any) => void;
  onDeleteParameter: (id: string) => void;
  onCreateParameter: (parameter: any) => void;
  templateId: string;
}

const TemplateParameterTree: React.FC<TemplateParameterTreeProps> = ({
  parameters,
  onUpdateParameter,
  onDeleteParameter,
  onCreateParameter,
  templateId
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createContext, setCreateContext] = useState<{
    parentId?: string;
    position?: 'above' | 'below' | 'child';
    referenceId?: string;
  }>({});
  
  const [newParameter, setNewParameter] = useState({
    parameter_name: '',
    parameter_value: '',
    parameter_type: 'text',
    parameter_category: 'parameter' as const,
    xml_path: '',
    is_required: false,
    is_active: true,
    parent_parameter: ''
  });

  // Перетворюємо плоский список у дерево
  const buildTree = (): ParameterNode[] => {
    const nodeMap = new Map<string, ParameterNode>();
    const roots: ParameterNode[] = [];

    // Ініціалізуємо всі вузли
    parameters.forEach(param => {
      nodeMap.set(param.id, {
        ...param,
        children: [],
        level: 0
      });
    });

    // Будуємо дерево
    parameters.forEach(param => {
      const node = nodeMap.get(param.id)!;
      
      if (param.parent_parameter) {
        const parentNode = Array.from(nodeMap.values()).find(
          n => n.parameter_name === param.parent_parameter
        );
        if (parentNode) {
          node.level = parentNode.level + 1;
          parentNode.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'parameter': return '📋';
      case 'currency': return '💱';
      case 'category': return '📂';
      case 'offer': return '🎁';
      case 'characteristic': return '📏';
      default: return '📄';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'parameter': return 'bg-blue-100 text-blue-800';
      case 'currency': return 'bg-green-100 text-green-800';
      case 'category': return 'bg-purple-100 text-purple-800';
      case 'offer': return 'bg-orange-100 text-orange-800';
      case 'characteristic': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateParameter = (context: typeof createContext) => {
    setCreateContext(context);
    setNewParameter({
      parameter_name: '',
      parameter_value: '',
      parameter_type: 'text',
      parameter_category: 'parameter',
      xml_path: '',
      is_required: false,
      is_active: true,
      parent_parameter: context.parentId || ''
    });
    setIsCreateDialogOpen(true);
  };

  const handleSubmitCreate = () => {
    if (!newParameter.parameter_name.trim()) {
      return;
    }

    onCreateParameter({
      template_id: templateId,
      ...newParameter,
      display_order: parameters.length
    });
    
    setIsCreateDialogOpen(false);
    setCreateContext({});
  };

  const renderParameterNode = (node: ParameterNode): React.ReactNode => {
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const indent = node.level * 24;

    return (
      <div key={node.id} className="border-l-2 border-gray-200">
        <div 
          className="flex items-center gap-2 p-2 hover:bg-gray-50 group"
          style={{ paddingLeft: `${indent + 12}px` }}
          id={`parameter-node-${node.id}`}
        >
          {/* Розкриття/згортання */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded(node.id)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          )}
          {!hasChildren && <div className="w-6" />}

          {/* Іконка категорії */}
          <span className="text-lg">{getCategoryIcon(node.parameter_category)}</span>

          {/* Категорія */}
          <Badge className={`${getCategoryColor(node.parameter_category)} text-xs`}>
            {node.parameter_category}
          </Badge>

          {/* Назва параметру */}
          <div className="flex-1 min-w-0">
            <Input
              value={node.parameter_name}
              onChange={(e) => onUpdateParameter(node.id, { parameter_name: e.target.value })}
              className="h-8 text-sm font-medium"
              id={`parameter-name-${node.id}`}
            />
          </div>

          {/* Значення параметру */}
          <div className="flex-1 min-w-0">
            <Input
              value={node.parameter_value || ''}
              onChange={(e) => onUpdateParameter(node.id, { parameter_value: e.target.value })}
              placeholder="Значення"
              className="h-8 text-sm"
              id={`parameter-value-${node.id}`}
            />
          </div>

          {/* Статус переключники */}
          <div className="flex items-center gap-2">
            <Switch
              checked={node.is_active}
              onCheckedChange={(checked) => onUpdateParameter(node.id, { is_active: checked })}
              id={`parameter-active-${node.id}`}
            />
            <Switch
              checked={node.is_required}
              onCheckedChange={(checked) => onUpdateParameter(node.id, { is_required: checked })}
              id={`parameter-required-${node.id}`}
            />
          </div>

          {/* Меню дій */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                id={`parameter-actions-${node.id}`}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleCreateParameter({ referenceId: node.id, position: 'above' })}>
                <ArrowUp className="h-4 w-4 mr-2" />
                Додати параметр вище
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateParameter({ referenceId: node.id, position: 'below' })}>
                <ArrowDown className="h-4 w-4 mr-2" />
                Додати параметр нижче
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleCreateParameter({ parentId: node.parameter_name, position: 'child' })}>
                <Plus className="h-4 w-4 mr-2" />
                Додати підпараметр
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDeleteParameter(node.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Видалити параметр
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Дочірні вузли */}
        {hasChildren && isExpanded && (
          <div className="ml-2">
            {node.children.map(renderParameterNode)}
          </div>
        )}
      </div>
    );
  };

  const treeNodes = buildTree();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">
          Параметри шаблону ({parameters.length})
        </h3>
        <Button 
          onClick={() => handleCreateParameter({})} 
          className="gap-2"
          id="add-root-parameter"
        >
          <Plus className="h-4 w-4" />
          Додати параметр
        </Button>
      </div>

      <div className="border rounded-lg bg-white">
        {treeNodes.length > 0 ? (
          <div className="divide-y">
            {treeNodes.map(renderParameterNode)}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>Параметри відсутні</p>
            <Button 
              onClick={() => handleCreateParameter({})} 
              variant="outline" 
              className="mt-4"
              id="add-first-parameter"
            >
              Додати перший параметр
            </Button>
          </div>
        )}
      </div>

      {/* Діалог створення параметру */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {createContext.position === 'child' ? 'Створити підпараметр' : 'Створити параметр'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-param-name">Назва параметру *</Label>
              <Input
                id="new-param-name"
                value={newParameter.parameter_name}
                onChange={(e) => setNewParameter(prev => ({ ...prev, parameter_name: e.target.value }))}
                placeholder="Введіть назву параметру"
              />
            </div>
            <div>
              <Label htmlFor="new-param-value">Значення</Label>
              <Input
                id="new-param-value"
                value={newParameter.parameter_value}
                onChange={(e) => setNewParameter(prev => ({ ...prev, parameter_value: e.target.value }))}
                placeholder="Введіть значення параметру"
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
                  <SelectItem value="parameter">📋 Основна інформація</SelectItem>
                  <SelectItem value="currency">💱 Валюта</SelectItem>
                  <SelectItem value="category">📂 Категорія</SelectItem>
                  <SelectItem value="offer">🎁 Товар</SelectItem>
                  <SelectItem value="characteristic">📏 Характеристика</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="new-param-path">XML шлях</Label>
              <Input
                id="new-param-path"
                value={newParameter.xml_path}
                onChange={(e) => setNewParameter(prev => ({ ...prev, xml_path: e.target.value }))}
                placeholder="shop/name або offers/offer/param[@name='...']"
              />
            </div>
            
            {createContext.position === 'child' && (
              <div>
                <Label>Батьківський параметр</Label>
                <Input
                  value={newParameter.parent_parameter}
                  onChange={(e) => setNewParameter(prev => ({ ...prev, parent_parameter: e.target.value }))}
                  placeholder="Назва батьківського параметру"
                />
              </div>
            )}

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="new-param-required"
                  checked={newParameter.is_required}
                  onCheckedChange={(checked) => setNewParameter(prev => ({ ...prev, is_required: checked }))}
                />
                <Label htmlFor="new-param-required">Обов'язковий</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="new-param-active"
                  checked={newParameter.is_active}
                  onCheckedChange={(checked) => setNewParameter(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="new-param-active">Активний</Label>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={handleSubmitCreate} className="flex-1" id="confirm-create-parameter">
                Створити параметр
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                className="flex-1"
              >
                Скасувати
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateParameterTree;
