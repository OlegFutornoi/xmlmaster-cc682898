
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

interface Supplier {
  id: string;
  name: string;
  [key: string]: any;
}

interface DeleteSupplierDialogProps {
  supplier: Supplier;
  onClose: () => void;
  onDelete: (supplierId: string) => Promise<boolean>;
}

// Компонент діалогу видалення постачальника
const DeleteSupplierDialog: React.FC<DeleteSupplierDialogProps> = ({
  supplier,
  onClose,
  onDelete,
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await onDelete(supplier.id);
      if (success) {
        onClose();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent id="delete-supplier-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>Видалити постачальника</AlertDialogTitle>
          <AlertDialogDescription>
            Ви впевнені, що хочете видалити постачальника "{supplier.name}"? Ця дія не може бути скасована.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Скасувати</AlertDialogCancel>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isDeleting}
          >
            {isDeleting ? 'Видалення...' : 'Видалити'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteSupplierDialog;
