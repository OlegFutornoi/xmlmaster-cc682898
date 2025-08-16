
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
  onSave?: (updatedStructure: ParsedXMLStructure) => void;
  onSaveTemplate?: (templateData: any) => void;
  isSaving?: boolean;
  isEditable?: boolean;
}

const ParsedStructureTable = ({ 
  structure, 
  templateName = "XML Template",
  onSave,
  onSaveTemplate, 
  isSaving = false,
  isEditable = false
}: ParsedStructureTableProps) => {
  const treeStructure = generateTreeStructure(structure);

  // Підрахунок загальної кількості характеристик
  const totalCharacteristics = structure.offers.reduce(
    (total, offer) => total + offer.characteristics.length, 
    0
  );

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
              <CardDescription>
                Повний аналіз та редагування XML структури
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <TemplateTreeView 
                treeStructure={treeStructure} 
                templateName={templateName} 
              />
              {onSaveTemplate && (
                <Button 
                  onClick={handleSaveTemplate}
                  disabled={isSaving}
                  id="save-template-button"
                >
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
                {structure.currencies.length}
              </div>
              <div className="text-sm text-gray-600">💱 Валют</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {structure.categories.length}
              </div>
              <div className="text-sm text-gray-600">📂 Категорій</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {structure.offers.length}
              </div>
              <div className="text-sm text-gray-600">🎁 Товарів</div>
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
        onSave={handleSave}
        isEditable={isEditable}
      />
    </div>
  );
};

export default ParsedStructureTable;
