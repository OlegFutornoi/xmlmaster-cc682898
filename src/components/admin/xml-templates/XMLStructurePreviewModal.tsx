
// Компонент модального вікна для перегляду структури XML перед збереженням
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ParsedTreeStructure, ParsedTreeNode } from '@/utils/xmlParser';

interface XMLStructurePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  treeStructure: ParsedTreeStructure[];
  isProcessing?: boolean;
}

const XMLStructurePreviewModal = ({ 
  isOpen, 
  onClose, 
  onContinue, 
  treeStructure, 
  isProcessing = false 
}: XMLStructurePreviewModalProps) => {
  
  const renderTreeNode = (node: ParsedTreeNode, depth: number = 0): JSX.Element => {
    const indent = '│    '.repeat(depth);
    const connector = depth > 0 ? '├── ' : '';
    
    return (
      <div key={`${node.type}-${node.name}-${depth}`} className="font-mono text-sm">
        <div className="flex items-start gap-2 py-1">
          <span className="text-gray-400 whitespace-pre">{indent}{connector}</span>
          <span className="text-lg">{node.icon}</span>
          <span className="font-semibold text-blue-600">{node.name}</span>
          {node.value && (
            <>
              <span className="text-gray-500">:</span>
              <span className="text-green-700 break-all">{node.value}</span>
            </>
          )}
          {node.cdata && (
            <Badge variant="outline" className="text-xs ml-2">CDATA</Badge>
          )}
          {node.multilingual && (
            <Badge variant="outline" className="text-xs ml-2 bg-blue-50">Багатомовний</Badge>
          )}
        </div>
        
        {node.children && node.children.map((child, index) => (
          <div key={`${child.type}-${index}`}>
            {renderTreeNode(child, depth + 1)}
          </div>
        ))}
      </div>
    );
  };

  const renderSection = (section: ParsedTreeStructure): JSX.Element => {
    return (
      <div key={section.type} className="mb-6">
        <div className="flex items-center gap-2 py-2 font-mono text-sm">
          <span className="text-xl">{section.icon}</span>
          <span className="font-bold text-purple-600 text-base">{section.name}</span>
        </div>
        
        {section.children.map((child, index) => (
          <div key={`${child.type}-${index}`} className="ml-4">
            {renderTreeNode(child, 1)}
          </div>
        ))}
      </div>
    );
  };

  const getTotalStats = () => {
    let totalElements = 0;
    let totalParams = 0;
    let totalMultilingual = 0;
    let totalCDATA = 0;

    const countElements = (nodes: ParsedTreeNode[]) => {
      nodes.forEach(node => {
        totalElements++;
        if (node.type === 'param') totalParams++;
        if (node.multilingual) totalMultilingual++;
        if (node.cdata) totalCDATA++;
        if (node.children) countElements(node.children);
      });
    };

    treeStructure.forEach(section => {
      totalElements++; // Рахуємо саму секцію
      countElements(section.children);
    });

    return { totalElements, totalParams, totalMultilingual, totalCDATA };
  };

  const stats = getTotalStats();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col" id="xml-structure-preview-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🔍 Структура розпарсеного XML
          </DialogTitle>
        </DialogHeader>

        {/* Статистика */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalElements}</div>
            <div className="text-sm text-blue-800">Всього елементів</div>
          </div>
          <div className="bg-green-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalParams}</div>
            <div className="text-sm text-green-800">Параметрів</div>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.totalMultilingual}</div>
            <div className="text-sm text-purple-800">Багатомовних</div>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.totalCDATA}</div>
            <div className="text-sm text-orange-800">CDATA</div>
          </div>
        </div>

        {/* Структура XML */}
        <ScrollArea className="flex-1 border rounded-md p-4 bg-gray-50">
          <div className="space-y-4">
            {treeStructure.length > 0 ? (
              treeStructure.map(section => renderSection(section))
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">📄</div>
                <p>Структура XML не знайдена</p>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isProcessing}
            id="cancel-structure-preview"
          >
            Скасувати
          </Button>
          <Button 
            onClick={onContinue}
            disabled={isProcessing || treeStructure.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white"
            id="continue-with-structure"
          >
            {isProcessing ? 'Обробка...' : 'Продовжити'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default XMLStructurePreviewModal;
