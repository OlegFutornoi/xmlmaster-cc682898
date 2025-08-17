
// Вкладка параметрів товарів з компактним дизайном
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ParsedXMLStructure } from '@/utils/advancedXmlParser';
import { XMLTemplateParameter } from '@/types/xml-template';
import CompactParameterItem from '../CompactParameterItem';

interface OffersTabProps {
  structure: ParsedXMLStructure;
  parameters: XMLTemplateParameter[];
  isEditable: boolean;
  onAddParameter: () => Promise<void>;
  onUpdateParameter: (id: string, updates: any) => void;
  onDeleteParameter: (id: string) => void;
}

const OffersTab: React.FC<OffersTabProps> = ({
  structure,
  parameters,
  isEditable,
  onAddParameter,
  onUpdateParameter,
  onDeleteParameter
}) => {
  const offers = structure.offers || [];
  const offerParameters = parameters.filter(p => p.parameter_category === 'offer');

  return (
    <div className="space-y-4">
      {/* Заголовок з кнопкою додавання */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-semibold text-gray-900">Параметри товарів ({offerParameters.length})</h3>
          <p className="text-sm text-gray-600">Налаштування полів товарів</p>
        </div>
        {isEditable && (
          <Button 
            onClick={onAddParameter} 
            size="sm" 
            className="gap-2"
            id="add-offer-parameter"
          >
            <Plus className="h-4 w-4" />
            Додати параметр
          </Button>
        )}
      </div>

      {/* Приклад товару (перший) - якщо є товари в XML */}
      {offers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-3 bg-gray-100 border-b">
            <h4 className="font-medium text-gray-900">Приклад товару з XML (ID: {offers[0].id})</h4>
          </div>
          
          <CompactParameterItem
            label="Назва товару"
            value={offers[0].name}
            category="offer"
            id={`offer-name-${offers[0].id}`}
            isExpandable
          />
          
          {offers[0].name_ua && (
            <CompactParameterItem
              label="Назва товару (UA)"
              value={offers[0].name_ua}
              category="offer"
              id={`offer-name-ua-${offers[0].id}`}
              isExpandable
            />
          )}
          
          <CompactParameterItem
            label="Ціна"
            value={String(offers[0].price)}
            category="offer"
            id={`offer-price-${offers[0].id}`}
          />
          
          {offers[0].article && (
            <CompactParameterItem
              label="Артикул"
              value={offers[0].article}
              category="offer"
              id={`offer-article-${offers[0].id}`}
            />
          )}
          
          {offers[0].vendor && (
            <CompactParameterItem
              label="Виробник"
              value={offers[0].vendor}
              category="offer"
              id={`offer-vendor-${offers[0].id}`}
            />
          )}
          
          {offers[0].description && (
            <CompactParameterItem
              label="Опис"
              value={offers[0].description.replace(/<[^>]*>/g, '')}
              category="offer"
              id={`offer-description-${offers[0].id}`}
              isExpandable
            />
          )}
          
          {offers[0].description_ua && (
            <CompactParameterItem
              label="Опис (UA)"
              value={offers[0].description_ua.replace(/<[^>]*>/g, '')}
              category="offer"
              id={`offer-description-ua-${offers[0].id}`}
              isExpandable
            />
          )}
        </div>
      )}

      {/* Користувацькі параметри товарів */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-3 bg-gray-100 border-b">
          <h4 className="font-medium text-gray-900">Налаштовані параметри товарів ({offerParameters.length})</h4>
        </div>
        
        {offerParameters.map(param => (
          <CompactParameterItem
            key={param.id}
            label={param.parameter_name}
            value={param.parameter_value || ''}
            category="offer"
            id={`offer-param-${param.id}`}
            onEdit={isEditable ? (newValue) => onUpdateParameter(param.id, { parameter_value: newValue }) : undefined}
            onDelete={isEditable ? () => onDeleteParameter(param.id) : undefined}
            onAdd={isEditable ? onAddParameter : undefined}
          />
        ))}
        
        {offerParameters.length === 0 && (
          <div className="p-6 text-center text-gray-500">
            <p>Додаткові параметри товарів не налаштовані</p>
            <p className="text-xs mt-1">Натисніть "Додати параметр" щоб створити новий</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OffersTab;
