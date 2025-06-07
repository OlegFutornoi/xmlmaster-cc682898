
// Компонент модального вікна підтвердження видалення шаблону
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { XMLTemplate } from '@/types/xml-template';

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: XMLTemplate | null;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteConfirmModal = ({ 
  open, 
  onOpenChange, 
  template, 
  onConfirm, 
  isDeleting 
}: DeleteConfirmModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Підтвердження видалення
          </DialogTitle>
          <DialogDescription>
            Ця дія незворотна. Шаблон та всі пов'язані з ним дані будуть видалені назавжди.
          </DialogDescription>
        </DialogHeader>
        
        {template && (
          <div className="py-4">
            <p className="text-sm text-gray-700">
              Ви впевнені, що хочете видалити шаблон <span className="font-semibold">"{template.name}"</span>?
            </p>
          </div>
        )}
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            id="cancel-delete-button"
          >
            Скасувати
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            id="confirm-delete-button"
          >
            {isDeleting ? 'Видалення...' : 'Видалити'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmModal;
