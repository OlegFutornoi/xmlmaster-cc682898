
// Вкладка характеристик з компактним дизайном
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ParsedXMLStructure } from '@/utils/advancedXmlParser';
import { XMLTemplateParameter } from '@/types/xml-template';
import CompactParameterItem from '../CompactParameterItem';

interface CharacteristicsTabProps {
  structure: ParsedXMLStructure;
  parameters: XMLTemplateParameter[];
  isEditable: boolean;
  onAddParameter: () => Promise<void>;
  onUpdateParameter: (id: string, updates: any) => void;
  onDeleteParameter: (id: string) => void;
}

const CharacteristicsTab: React.FC<CharacteristicsTabProps> = ({
  structure,
  parameters,
  isEditable,
  onAddParameter,
  onUpdateParameter,
  onDeleteParameter
}) => {
  const offers = structure.offers || [];
  const characteristicParameters = parameters.filter(p => p.parameter_category === 'characteristic');
  
  // Збираємо всі характеристики з усіх товарів
  const allCharacteristics = offers.flatMap(offer => offer.characteristics || []);
  const uniqueCharacteristics = allCharacteristics.reduce((acc, char) => {
    const key = `${char.name}_${char.language || 'default'}`;
    if (!acc[key]) {
      acc[key] = char;
    }
    return acc;
  }, {} as Record<string, any>);

  return (
    <div className="space-y-4">
      {/* Заголовок з кнопкою додавання */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h3 className="font-semibold text-gray-900">
            Характеристики товарів ({Object.keys(uniqueCharacteristics).length})
          </h3>
          <p className="text-sm text-gray-600">Параметри та властивості товарів</p>
        </div>
        {isEditable && (
          <Button 
            onClick={onAddParameter} 
            size="sm" 
            className="gap-2"
            id="add-characteristic-parameter"
          >
            <Plus className="h-4 w-4" />
            Додати характеристику
          </Button>
        )}
      </div>

      {/* Характеристики з XML */}
      {Object.keys(uniqueCharacteristics).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-3 bg-gray-100 border-b">
            <h4 className="font-medium text-gray-900">Характеристики з XML файлу</h4>
          </div>
          
          {Object.values(uniqueCharacteristics).map((char: any, index) => (
            <CompactParameterItem
              key={index}
              label={`${char.name}${char.language ? ` (${char.language === 'uk' ? '🇺🇦' : char.language === 'ru' ? '🇷🇺' : '🏳️'})` : ''}`}
              value={char.value}
              category="characteristic"
              id={`char-${index}`}
              isExpandable
            />
          ))}
        </div>
      )}

      {/* Користувацькі характеристики */}
      {characteristicParameters.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-3 bg-gray-100 border-b">
            <h4 className="font-medium text-gray-900">Додаткові характеристики</h4>
          </div>
          
          {characteristicParameters.map(param => (
            <CompactParameterItem
              key={param.id}
              label={param.parameter_name}
              value={param.parameter_value || ''}
              category="characteristic"
              id={`characteristic-${param.id}`}
              onEdit={isEditable ? (newValue) => onUpdateParameter(param.id, { parameter_value: newValue }) : undefined}
              onDelete={isEditable ? () => onDeleteParameter(param.id) : undefined}
              onAdd={isEditable ? onAddParameter : undefined}
            />
          ))}
        </div>
      )}

      {Object.keys(uniqueCharacteristics).length === 0 && characteristicParameters.length === 0 && (
        <div className="p-6 text-center text-gray-500 bg-white border border-gray-200 rounded-lg">
          <p>Характеристики відсутні</p>
        </div>
      )}
    </div>
  );
};

export default CharacteristicsTab;
