
// Компактний компонент для редагування параметрів з іконками та меню
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Settings,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Store,
  DollarSign,
  Folder,
  Package,
  Settings2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ExpandableText from './ExpandableText';

interface CompactParameterItemProps {
  label: string;
  value: string;
  category: 'shop' | 'currency' | 'category' | 'offer' | 'characteristic';
  isEditing?: boolean;
  onEdit?: (newValue: string) => void;
  onDelete?: () => void;
  onAdd?: () => void;
  id?: string;
  isExpandable?: boolean;
}

const CATEGORY_ICONS = {
  shop: Store,
  currency: DollarSign,
  category: Folder,
  offer: Package,
  characteristic: Settings2
};

const CATEGORY_COLORS = {
  shop: 'text-blue-600',
  currency: 'text-green-600',
  category: 'text-purple-600',
  offer: 'text-orange-600',
  characteristic: 'text-pink-600'
};

const CompactParameterItem: React.FC<CompactParameterItemProps> = ({
  label,
  value,
  category,
  isEditing = false,
  onEdit,
  onDelete,
  onAdd,
  id,
  isExpandable = false
}) => {
  const [editingValue, setEditingValue] = useState(value);
  const [isEditMode, setIsEditMode] = useState(isEditing);

  const IconComponent = CATEGORY_ICONS[category];
  const colorClass = CATEGORY_COLORS[category];

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

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 group" id={id}>
      {/* Іконка категорії */}
      <div className={`flex-shrink-0 ${colorClass}`}>
        <IconComponent className="h-4 w-4" />
      </div>

      {/* Назва параметру */}
      <div className="min-w-0 w-32 flex-shrink-0">
        <span className="text-sm font-medium text-gray-700 truncate block">
          {label}
        </span>
      </div>

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
              className="h-8 w-8 p-0"
            >
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancelEdit}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ) : (
          isExpandable ? (
            <ExpandableText 
              text={value} 
              maxLength={60} 
              id={`${id}-expandable`}
            />
          ) : (
            <span className="text-sm text-gray-900 truncate block">
              {value || 'Не вказано'}
            </span>
          )
        )}
      </div>

      {/* Меню дій */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white shadow-lg border">
            {onEdit && (
              <DropdownMenuItem onClick={() => setIsEditMode(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Редагувати
              </DropdownMenuItem>
            )}
            {onAdd && (
              <DropdownMenuItem onClick={onAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Додати новий
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
    </div>
  );
};

export default CompactParameterItem;
