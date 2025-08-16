
// Компонент для відображення структури XML шаблону у вигляді дерева
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TreePine, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TemplateTreeViewProps {
  treeStructure: string;
  templateName: string;
}

const TemplateTreeView = ({ treeStructure, templateName }: TemplateTreeViewProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(treeStructure);
      toast({
        title: "Скопійовано",
        description: "Структуру шаблону скопійовано в буфер обміну",
      });
    } catch (error) {
      console.error('Помилка копіювання:', error);
      toast({
        title: "Помилка",
        description: "Не вдалося скопіювати структуру",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          id="view-template-structure"
        >
          <TreePine className="h-4 w-4" />
          Структура шаблону
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TreePine className="h-5 w-5" />
            Структура шаблону: {templateName}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Повна структура XML шаблону з усіма елементами та атрибутами
            </p>
            <Button
              onClick={handleCopyToClipboard}
              size="sm"
              variant="outline"
              className="gap-2"
              id="copy-structure-button"
            >
              <Copy className="h-4 w-4" />
              Копіювати
            </Button>
          </div>
          <ScrollArea className="h-[60vh] w-full border rounded-lg p-4 bg-slate-50">
            <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed">
              {treeStructure}
            </pre>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateTreeView;
