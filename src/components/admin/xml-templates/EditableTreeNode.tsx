
// Компонент для редагування вузла дерева з меню дій
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Settings,
  Plus,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Check,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EditableTreeNodeProps {
  icon: string;
  label: string;
  value: string;
  isEditing?: boolean;
  onEdit?: (newValue: string) => void;
  onDelete?: () => void;
  onAddAbove?: () => void;
  onAddBelow?: () => void;
  onAddChild?: () => void;
  canHaveChildren?: boolean;
  children?: React.ReactNode;
  level?: number;
  id?: string;
}

const EditableTreeNode: React.FC<EditableTreeNodeProps> = ({
  icon,
  label,
  value,
  isEditing = false,
  onEdit,
  onDelete,
  onAddAbove,
  onAddBelow,
  onAddChild,
  canHaveChildren = false,
  children,
  level = 0,
  id
}) => {
  const [editingValue, setEditingValue] = useState(value);
  const [isEditMode, setIsEditMode] = useState(isEditing);

  const handleSaveEdit = () => {
    if (onEdit) {
      onEdit(editingValue);
    }
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditingValue(value);
    setIsEditMode(false);
  };

  const indent = level * 24;

  return (
    <div className="border-l-2 border-gray-200">
      <div 
        className="flex items-center gap-2 p-2 hover:bg-gray-50 group"
        style={{ paddingLeft: `${indent + 12}px` }}
        id={id}
      >
        {/* Іконка */}
        <span className="text-lg">{icon}</span>

        {/* Назва/Label */}
        <span className="text-sm text-gray-600 min-w-0 flex-shrink-0">
          {label}:
        </span>

        {/* Значення (редаговане або звичайне) */}
        <div className="flex-1 min-w-0">
          {isEditMode ? (
            <div className="flex items-center gap-2">
              <Input
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleSaveEdit}
                className="h-6 w-6 p-0"
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelEdit}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4 text-red-600" />
              </Button>
            </div>
          ) : (
            <span className="text-sm font-medium">{value}</span>
          )}
        </div>

        {/* Меню дій */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => setIsEditMode(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Редагувати
              </DropdownMenuItem>
            )}
            {onAddAbove && (
              <DropdownMenuItem onClick={onAddAbove}>
                <ArrowUp className="h-4 w-4 mr-2" />
                Додати вище
              </DropdownMenuItem>
            )}
            {onAddBelow && (
              <DropdownMenuItem onClick={onAddBelow}>
                <ArrowDown className="h-4 w-4 mr-2" />
                Додати нижче
              </DropdownMenuItem>
            )}
            {canHaveChildren && onAddChild && (
              <DropdownMenuItem onClick={onAddChild}>
                <Plus className="h-4 w-4 mr-2" />
                Додати піделемент
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Видалити
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Дочірні елементи */}
      {children && (
        <div className="ml-2">
          {children}
        </div>
      )}
    </div>
  );
};

export default EditableTreeNode;
