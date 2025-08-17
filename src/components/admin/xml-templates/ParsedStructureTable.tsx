
// Оновлений компонент для відображення розпарсеної XML структури з вкладками
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ParsedXMLStructure, generateTreeStructure } from '@/utils/advancedXmlParser';
import TemplateTreeView from './TemplateTreeView';
import TemplateDataTabs from './TemplateDataTabs';

interface ParsedStructureTableProps {
  structure: ParsedXMLStructure;
  templateName?: string;
  templateId?: string;
  onSave?: (updatedStructure: ParsedXMLStructure) => void;
  onSaveTemplate?: (templateData: any) => void;
  isSaving?: boolean;
  isEditable?: boolean;
}

const ParsedStructureTable = ({
  structure,
  templateName = "XML Template",
  templateId,
  onSave,
  onSaveTemplate,
  isSaving = false,
  isEditable = false
}: ParsedStructureTableProps) => {
  const treeStructure = generateTreeStructure(structure);

  // Підрахунок загальної кількості характеристик з перевірками на undefined
  const totalCharacteristics = (structure.offers || []).reduce((total, offer) => total + (offer.characteristics || []).length, 0);
  
  // Підрахунок параметрів товарів з XML
  const offerParametersFromXML = (structure.offers || []).reduce((total, offer) => {
    let count = 0;
    if (offer.name) count++;
    if (offer.name_ua) count++;
    if (offer.article) count++;
    if (offer.vendor) count++;
    if (offer.description) count++;
    if (offer.description_ua) count++;
    if (offer.price) count++;
    return total + count;
  }, 0);
  
  const handleSaveTemplate = () => {
    if (onSaveTemplate) {
      onSaveTemplate({
        structure,
        parameters: structure.parameters || []
      });
    }
  };
  
  const handleSave = (updatedStructure: ParsedXMLStructure) => {
    if (onSave) {
      onSave(updatedStructure);
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок з основною статистикою */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                📊 Структура XML шаблону
              </CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <TemplateTreeView treeStructure={treeStructure} templateName={templateName} />
              {onSaveTemplate && (
                <Button onClick={handleSaveTemplate} disabled={isSaving} id="save-template-button">
                  {isSaving ? 'Збереження...' : 'Зберегти шаблон'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(structure.currencies || []).length}
              </div>
              <div className="text-sm text-gray-600">💱 Валют</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(structure.categories || []).length}
              </div>
              <div className="text-sm text-gray-600">📂 Категорій</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {offerParametersFromXML}
              </div>
              <div className="text-sm text-gray-600">⚙️ Параметрів</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {totalCharacteristics}
              </div>
              <div className="text-sm text-gray-600">📏 Характеристик</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Детальна інформація з вкладками */}
      <TemplateDataTabs 
        structure={structure} 
        templateName={templateName}
        templateId={templateId}
        onSave={handleSave} 
        isEditable={isEditable} 
      />
    </div>
  );
};

export default ParsedStructureTable;
