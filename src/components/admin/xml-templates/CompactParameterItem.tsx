
// Компонент компактного відображення параметра з іконкою та меню налаштувань
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Settings, Edit, Trash2, Plus, Copy } from 'lucide-react';

interface CompactParameterItemProps {
  key: string;
  label: string;
  value: string;
  category?: string;
  type?: string;
  id: string;
  onEdit: (newValue: string) => void;
  onDelete: () => void;
  onAddAbove: () => Promise<void>;
  onAddBelow: () => Promise<void>;
}

const CompactParameterItem = ({ 
  label, 
  value, 
  category, 
  type, 
  id, 
  onEdit, 
  onDelete, 
  onAddAbove, 
  onAddBelow 
}: CompactParameterItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onEdit(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const getCategoryColor = (cat?: string) => {
    switch (cat) {
      case 'shop': return 'bg-blue-100 text-blue-700';
      case 'currency': return 'bg-green-100 text-green-700';
      case 'category': return 'bg-purple-100 text-purple-700';
      case 'offer': return 'bg-orange-100 text-orange-700';
      case 'characteristic': return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 border rounded-md hover:bg-gray-50" id={`parameter-${id}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm truncate" title={label}>
            {label}
          </span>
          {category && (
            <Badge variant="outline" className={`text-xs ${getCategoryColor(category)}`}>
              {category}
            </Badge>
          )}
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="h-7 text-xs"
              id={`edit-value-${id}`}
            />
            <Button size="sm" onClick={handleSave} className="h-7 px-2" id={`save-${id}`}>
              ✓
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel} className="h-7 px-2" id={`cancel-${id}`}>
              ✕
            </Button>
          </div>
        ) : (
          <span className="text-xs text-gray-600 truncate block" title={value}>
            {value || '—'}
          </span>
        )}
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" id={`settings-${id}`}>
            <Settings className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditing(true)} id={`edit-menu-${id}`}>
            <Edit className="h-3 w-3 mr-2" />
            Редагувати
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigator.clipboard.writeText(value)} id={`copy-${id}`}>
            <Copy className="h-3 w-3 mr-2" />
            Копіювати значення
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onAddAbove} id={`add-above-${id}`}>
            <Plus className="h-3 w-3 mr-2" />
            Додати вище
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onAddBelow} id={`add-below-${id}`}>
            <Plus className="h-3 w-3 mr-2" />
            Додати нижче
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDelete} className="text-red-600" id={`delete-menu-${id}`}>
            <Trash2 className="h-3 w-3 mr-2" />
            Видалити
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default CompactParameterItem;
