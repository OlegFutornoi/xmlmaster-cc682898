
// Вкладка інформації про магазин з компактним дизайном
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ParsedXMLStructure } from '@/utils/advancedXmlParser';
import { XMLTemplateParameter } from '@/types/xml-template';
import CompactParameterItem from '../CompactParameterItem';

interface ShopInfoTabProps {
  structure: ParsedXMLStructure;
  parameters: XMLTemplateParameter[];
  isEditable: boolean;
  onAddParameter: () => Promise<void>;
  onUpdateParameter: (id: string, updates: any) => void;
  onDeleteParameter: (id: string) => void;
}

const ShopInfoTab: React.FC<ShopInfoTabProps> = ({
  structure,
  parameters,
  isEditable,
  onAddParameter,
  onUpdateParameter,
  onDeleteParameter
}) => {
  const shopParameters = parameters.filter(p => p.parameter_category === 'parameter');

  return (
    <div className="space-y-4">
      {/* Заголовок з кнопкою додавання */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-semibold text-gray-900">Інформація про магазин</h3>
          <p className="text-sm text-gray-600">Основні налаштування магазину</p>
        </div>
        {isEditable && (
          <Button 
            onClick={onAddParameter} 
            size="sm" 
            className="gap-2"
            id="add-shop-parameter"
          >
            <Plus className="h-4 w-4" />
            Додати параметр
          </Button>
        )}
      </div>

      {/* Список параметрів */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Основні поля магазину */}
        <CompactParameterItem
          label="Назва магазину"
          value={structure.shop?.name || ''}
          category="shop"
          id="shop-name"
          onEdit={isEditable ? (newValue) => console.log('Edit shop name:', newValue) : undefined}
        />
        
        <CompactParameterItem
          label="Компанія"
          value={structure.shop?.company || ''}
          category="shop"
          id="shop-company"
          onEdit={isEditable ? (newValue) => console.log('Edit shop company:', newValue) : undefined}
        />
        
        <CompactParameterItem
          label="URL магазину"
          value={structure.shop?.url || ''}
          category="shop"
          id="shop-url"
          onEdit={isEditable ? (newValue) => console.log('Edit shop url:', newValue) : undefined}
          isExpandable
        />

        {/* Користувацькі параметри */}
        {shopParameters.map(param => (
          <CompactParameterItem
            key={param.id}
            label={param.parameter_name}
            value={param.parameter_value || ''}
            category="shop"
            id={`param-${param.id}`}
            onEdit={isEditable ? (newValue) => onUpdateParameter(param.id, { parameter_value: newValue }) : undefined}
            onDelete={isEditable ? () => onDeleteParameter(param.id) : undefined}
            onAdd={isEditable ? onAddParameter : undefined}
          />
        ))}

        {shopParameters.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            <p>Додаткові параметри магазину відсутні</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopInfoTab;
