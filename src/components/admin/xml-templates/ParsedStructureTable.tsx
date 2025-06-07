
// Компонент таблиці розпарсеної структури XML з покращеним відображенням та адаптивністю
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Copy } from 'lucide-react';
import { ParsedXMLStructure } from '@/types/xml-template';
import { toast } from '@/hooks/use-toast';

interface ParsedStructureTableProps {
  structure: ParsedXMLStructure;
  onSaveTemplate: (templateData: any) => void;
  isSaving: boolean;
}

interface NewParameter {
  name: string;
  value: string;
  path: string;
  type: 'parameter' | 'characteristic';
  category: 'shop' | 'currency' | 'category' | 'offer';
}

const ParsedStructureTable = ({ structure, onSaveTemplate, isSaving }: ParsedStructureTableProps) => {
  const [parameters, setParameters] = useState(structure.parameters || []);
  const [newParameter, setNewParameter] = useState<NewParameter>({
    name: '',
    value: '',
    path: '',
    type: 'parameter',
    category: 'offer'
  });
  const [isAddingParameter, setIsAddingParameter] = useState(false);

  const handleAddParameter = () => {
    if (!newParameter.name || !newParameter.path) return;

    const updatedParameters = [...parameters, {
      ...newParameter,
      id: `temp_${Date.now()}`
    }];
    
    setParameters(updatedParameters);
    setNewParameter({
      name: '',
      value: '',
      path: '',
      type: 'parameter',
      category: 'offer'
    });
    setIsAddingParameter(false);
  };

  const handleRemoveParameter = (index: number) => {
    const updatedParameters = parameters.filter((_, i) => i !== index);
    setParameters(updatedParameters);
  };

  const handleSaveTemplate = () => {
    const templateData = {
      structure: {
        shop: structure.shop,
        currencies: structure.currencies,
        categories: structure.categories,
        offers: structure.offers?.slice(0, 1) // Зберігаємо тільки один offer як приклад структури
      },
      parameters: parameters.map(param => ({
        parameter_name: param.name,
        parameter_value: param.value,
        xml_path: param.path,
        parameter_type: 'text',
        parameter_category: param.type,
        is_active: true,
        is_required: false
      })),
      shop_info: structure.shop
    };

    onSaveTemplate(templateData);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'shop': return 'bg-blue-100 text-blue-700';
      case 'currency': return 'bg-green-100 text-green-700';
      case 'category': return 'bg-purple-100 text-purple-700';
      case 'offer': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'parameter' 
      ? 'bg-indigo-100 text-indigo-700' 
      : 'bg-pink-100 text-pink-700';
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

  return (
    <div className="space-y-6">
      {/* Інформація про магазин */}
      {structure.shop && (
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Інформація про магазин</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Назва:</span> {structure.shop.name || '-'}
            </div>
            <div>
              <span className="font-medium">Компанія:</span> {structure.shop.company || '-'}
            </div>
            <div>
              <span className="font-medium">URL:</span> {structure.shop.url || '-'}
            </div>
          </div>
        </div>
      )}

      {/* Валюти */}
      {structure.currencies && structure.currencies.length > 0 && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">Валюти ({structure.currencies.length})</h3>
          <div className="flex flex-wrap gap-2">
            {structure.currencies.map((currency, index) => (
              <Badge key={index} variant="outline" className="bg-white">
                {currency.id}: {currency.rate}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Категорії */}
      {structure.categories && structure.categories.length > 0 && (
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-900 mb-2">Категорії ({structure.categories.length})</h3>
          <div className="flex flex-wrap gap-2">
            {structure.categories.map((category, index) => (
              <Badge key={index} variant="outline" className="bg-white">
                {category.name} (ID: {category.id})
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Товари */}
      {structure.offers && structure.offers.length > 0 && (
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-900 mb-2">
            Знайдено товарів: {structure.offers.length}
          </h3>
          <p className="text-sm text-orange-700">
            Перший товар буде використаний як шаблон структури
          </p>
        </div>
      )}

      {/* Таблиця параметрів */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold">Структура параметрів</h3>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsAddingParameter(true)}
              size="sm"
              variant="outline"
              id="add-parameter-button"
            >
              <Plus className="h-4 w-4 mr-2" />
              Додати параметр
            </Button>
            <Button
              onClick={handleSaveTemplate}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              id="save-template-button"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Збереження...' : 'Створити шаблон'}
            </Button>
          </div>
        </div>

        <div className="border rounded-md overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Назва параметру</TableHead>
                <TableHead className="min-w-[120px] hidden md:table-cell">Значення</TableHead>
                <TableHead className="min-w-[200px]">XML шлях</TableHead>
                <TableHead className="min-w-[100px] hidden sm:table-cell">Тип</TableHead>
                <TableHead className="min-w-[100px] hidden lg:table-cell">Категорія</TableHead>
                <TableHead className="w-[80px]">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parameters.map((param, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{param.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{param.value || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-sm truncate" title={param.path}>
                        {getShortPath(param.path)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyFullPath(param.path)}
                        className="p-1 h-6 w-6 flex-shrink-0"
                        id={`copy-path-${index}`}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge className={getTypeColor(param.type)}>
                      {param.type === 'parameter' ? 'Параметр' : 'Характеристика'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge className={getCategoryColor(param.category)}>
                      {param.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveParameter(index)}
                      className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                      id={`remove-parameter-${index}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              
              {isAddingParameter && (
                <TableRow>
                  <TableCell>
                    <Input
                      value={newParameter.name}
                      onChange={(e) => setNewParameter(prev => ({...prev, name: e.target.value}))}
                      placeholder="Назва параметру"
                      id="new-param-name"
                      className="min-w-0"
                    />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Input
                      value={newParameter.value}
                      onChange={(e) => setNewParameter(prev => ({...prev, value: e.target.value}))}
                      placeholder="Значення"
                      id="new-param-value"
                      className="min-w-0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={newParameter.path}
                      onChange={(e) => setNewParameter(prev => ({...prev, path: e.target.value}))}
                      placeholder="/price/items/item/name"
                      id="new-param-path"
                      className="min-w-0"
                    />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Select 
                      value={newParameter.type} 
                      onValueChange={(value: 'parameter' | 'characteristic') => 
                        setNewParameter(prev => ({...prev, type: value}))
                      }
                    >
                      <SelectTrigger className="min-w-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="parameter">Параметр</SelectItem>
                        <SelectItem value="characteristic">Характеристика</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Select 
                      value={newParameter.category} 
                      onValueChange={(value: 'shop' | 'currency' | 'category' | 'offer') => 
                        setNewParameter(prev => ({...prev, category: value}))
                      }
                    >
                      <SelectTrigger className="min-w-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shop">Магазин</SelectItem>
                        <SelectItem value="currency">Валюта</SelectItem>
                        <SelectItem value="category">Категорія</SelectItem>
                        <SelectItem value="offer">Товар</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={handleAddParameter}
                        disabled={!newParameter.name || !newParameter.path}
                        id="confirm-add-parameter"
                        className="h-8 w-8 p-0"
                      >
                        ✓
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsAddingParameter(false)}
                        id="cancel-add-parameter"
                        className="h-8 w-8 p-0"
                      >
                        ✕
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ParsedStructureTable;
