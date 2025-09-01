
// Компонент таблиці розпарсеної структури XML з повною підтримкою всіх полів
import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Save, Copy, Eye } from 'lucide-react';
import { ParsedXMLStructure } from '@/utils/xmlParser';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ParsedStructureTableProps {
  structure: ParsedXMLStructure;
  onSaveTemplate: (templateData: any) => void;
  isSaving: boolean;
}

interface NewParameter {
  parameter_name: string;
  parameter_value: string;
  xml_path: string;
  parameter_type: 'parameter' | 'characteristic';
  parameter_category: 'shop' | 'currency' | 'category' | 'offer';
}

const ParsedStructureTable = ({ structure, onSaveTemplate, isSaving }: ParsedStructureTableProps) => {
  const [parameters, setParameters] = useState(structure.parameters || []);
  const [newParameter, setNewParameter] = useState<NewParameter>({
    parameter_name: '',
    parameter_value: '',
    xml_path: '',
    parameter_type: 'parameter',
    parameter_category: 'offer'
  });
  const [isAddingParameter, setIsAddingParameter] = useState(false);
  const [selectedParameter, setSelectedParameter] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const handleAddParameter = () => {
    if (!newParameter.parameter_name || !newParameter.xml_path) return;

    const updatedParameters = [...parameters, {
      ...newParameter,
      id: `temp_${Date.now()}`,
      is_active: true,
      is_required: false,
      display_order: parameters.length
    }];
    
    setParameters(updatedParameters);
    setNewParameter({
      parameter_name: '',
      parameter_value: '',
      xml_path: '',
      parameter_type: 'parameter',
      parameter_category: 'offer'
    });
    setIsAddingParameter(false);
  };

  const handleRemoveParameter = (index: number) => {
    const updatedParameters = parameters.filter((_, i) => i !== index);
    setParameters(updatedParameters);
  };

  const handleSaveTemplate = () => {
    console.log('Збереження шаблону з даними:', {
      structure: structure,
      parameters: parameters
    });

    const templateData = {
      structure: {
        shop: structure.shop,
        currencies: structure.currencies,
        categories: structure.categories,
        offers: structure.offers?.slice(0, 1)
      },
      parameters: parameters.map((param, index) => ({
        parameter_name: param.parameter_name || `Параметр ${index + 1}`,
        parameter_value: typeof param.parameter_value === 'object' ? JSON.stringify(param.parameter_value) : (param.parameter_value || ''),
        xml_path: param.xml_path || `/default/path/${index}`,
        parameter_type: param.parameter_type || 'text',
        parameter_category: param.parameter_category || 'parameter',
        multilingual_values: param.multilingual_values || null,
        cdata_content: param.cdata_content || null,
        element_attributes: param.element_attributes || null,
        is_active: true,
        is_required: false,
        display_order: index
      })),
      shop_info: structure.shop
    };

    console.log('Підготовлені дані для збереження:', templateData);
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

  const copyFullPath = (fullPath: string) => {
    navigator.clipboard.writeText(fullPath);
    toast({
      title: 'Скопійовано',
      description: 'Повний XML-шлях скопійовано в буфер обміну',
      duration: 2000
    });
  };

  const formatValue = (value: any) => {
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value || '');
  };

  const getShortPath = (fullPath: string) => {
    const parts = fullPath.split('/');
    return parts[parts.length - 1] || fullPath;
  };

  const showParameterDetails = (param: any) => {
    setSelectedParameter(param);
    setShowDetailsDialog(true);
  };

  return (
    <div className="space-y-6" id="parsed-structure-table">
      {/* Статистика парсингу */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900">Магазин</h3>
          <p className="text-2xl font-bold text-blue-700">
            {structure.shop ? '1' : '0'}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-900">Валюти</h3>
          <p className="text-2xl font-bold text-green-700">
            {structure.currencies?.length || 0}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="font-semibold text-purple-900">Категорії</h3>
          <p className="text-2xl font-bold text-purple-700">
            {structure.categories?.length || 0}
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-900">Товари</h3>
          <p className="text-2xl font-bold text-orange-700">
            {structure.offers?.length || 0}
          </p>
        </div>
      </div>

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
                {category.rz_id && ` RZ: ${category.rz_id}`}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Таблиця параметрів */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-lg font-semibold">
            Знайдено параметрів: {parameters.length}
            <span className="text-sm text-gray-500 ml-2">
              (Параметри: {parameters.filter(p => p.parameter_type === 'parameter').length}, 
              Характеристики: {parameters.filter(p => p.parameter_type === 'characteristic').length})
            </span>
          </h3>
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
                <TableHead className="min-w-[200px]">Назва параметру</TableHead>
                <TableHead className="min-w-[200px] hidden md:table-cell">Значення</TableHead>
                <TableHead className="min-w-[200px]">XML шлях</TableHead>
                <TableHead className="min-w-[100px] hidden sm:table-cell">Тип</TableHead>
                <TableHead className="min-w-[100px] hidden lg:table-cell">Категорія</TableHead>
                <TableHead className="w-[120px]">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parameters.map((param, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {param.parameter_name}
                    {param.multilingual_values && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Багатомовний
                      </Badge>
                    )}
                    {param.cdata_content && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        CDATA
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="max-w-xs truncate" title={formatValue(param.parameter_value)}>
                      {formatValue(param.parameter_value) || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-sm truncate" title={param.xml_path}>
                        {getShortPath(param.xml_path)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyFullPath(param.xml_path)}
                        className="p-1 h-6 w-6 flex-shrink-0"
                        id={`copy-path-${index}`}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge className={getTypeColor(param.parameter_type)}>
                      {param.parameter_type === 'parameter' ? 'Параметр' : 'Характеристика'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <Badge className={getCategoryColor(param.parameter_category)}>
                      {param.parameter_category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => showParameterDetails(param)}
                        className="h-8 w-8 p-0"
                        id={`view-parameter-${index}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveParameter(index)}
                        className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                        id={`remove-parameter-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              
              {isAddingParameter && (
                <TableRow>
                  <TableCell>
                    <Input
                      value={newParameter.parameter_name}
                      onChange={(e) => setNewParameter(prev => ({...prev, parameter_name: e.target.value}))}
                      placeholder="Назва параметру"
                      id="new-param-name"
                      className="min-w-[180px]"
                    />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Input
                      value={newParameter.parameter_value}
                      onChange={(e) => setNewParameter(prev => ({...prev, parameter_value: e.target.value}))}
                      placeholder="Значення"
                      id="new-param-value"
                      className="min-w-[180px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={newParameter.xml_path}
                      onChange={(e) => setNewParameter(prev => ({...prev, xml_path: e.target.value}))}
                      placeholder="/shop/offers/offer/name"
                      id="new-param-path"
                      className="min-w-[180px]"
                    />
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Select 
                      value={newParameter.parameter_type} 
                      onValueChange={(value: 'parameter' | 'characteristic') => 
                        setNewParameter(prev => ({...prev, parameter_type: value}))
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
                      value={newParameter.parameter_category} 
                      onValueChange={(value: 'shop' | 'currency' | 'category' | 'offer') => 
                        setNewParameter(prev => ({...prev, parameter_category: value}))
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
                        disabled={!newParameter.parameter_name || !newParameter.xml_path}
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

      {/* Діалог деталей параметру */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" id="parameter-details-dialog">
          <DialogHeader>
            <DialogTitle>Деталі параметру</DialogTitle>
          </DialogHeader>
          {selectedParameter && (
            <div className="space-y-4">
              <div>
                <label className="font-semibold">Назва:</label>
                <p className="mt-1">{selectedParameter.parameter_name}</p>
              </div>
              <div>
                <label className="font-semibold">Значення:</label>
                <pre className="mt-1 bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                  {formatValue(selectedParameter.parameter_value)}
                </pre>
              </div>
              <div>
                <label className="font-semibold">XML шлях:</label>
                <p className="mt-1 font-mono text-sm bg-gray-100 p-2 rounded">
                  {selectedParameter.xml_path}
                </p>
              </div>
              {selectedParameter.multilingual_values && (
                <div>
                  <label className="font-semibold">Багатомовні значення:</label>
                  <pre className="mt-1 bg-gray-100 p-2 rounded text-sm">
                    {JSON.stringify(selectedParameter.multilingual_values, null, 2)}
                  </pre>
                </div>
              )}
              {selectedParameter.cdata_content && (
                <div>
                  <label className="font-semibold">CDATA контент:</label>
                  <pre className="mt-1 bg-gray-100 p-2 rounded text-sm overflow-x-auto">
                    {selectedParameter.cdata_content}
                  </pre>
                </div>
              )}
              {selectedParameter.element_attributes && Object.keys(selectedParameter.element_attributes).length > 0 && (
                <div>
                  <label className="font-semibold">Атрибути:</label>
                  <pre className="mt-1 bg-gray-100 p-2 rounded text-sm">
                    {JSON.stringify(selectedParameter.element_attributes, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ParsedStructureTable;
