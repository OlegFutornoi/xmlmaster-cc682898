
// Компонент для відображення тексту з можливістю розгортання
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  id?: string;
}

const ExpandableText: React.FC<ExpandableTextProps> = ({ 
  text, 
  maxLength = 100,
  id 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!text || text.length <= maxLength) {
    return <span className="text-sm">{text}</span>;
  }
  
  const truncatedText = text.slice(0, maxLength);
  
  return (
    <div className="space-y-1">
      <div className="text-sm">
        {isExpanded ? text : `${truncatedText}...`}
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-6 px-2 text-xs"
        id={id}
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-3 w-3 mr-1" />
            Згорнути
          </>
        ) : (
          <>
            <ChevronDown className="h-3 w-3 mr-1" />
            Показати все
          </>
        )}
      </Button>
    </div>
  );
};

export default ExpandableText;
