import { useState, type ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';

type CollapsibleCardProps = {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  maxBodyHeightClass?: string; // e.g., "max-h-80"
  onToggle?: (isOpen: boolean) => void;
  children: ReactNode;
};

export function CollapsibleCard({
  title,
  icon,
  defaultOpen = false,
  maxBodyHeightClass,
  onToggle,
  children,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  
  const handleToggle = () => {
    const newOpen = !open;
    setOpen(newOpen);
    onToggle?.(newOpen);
  };

  return (
    <Card>
      <div className="px-6">
        <button
          type="button"
          onClick={handleToggle}
          className="flex items-center gap-2 w-full text-left"
        >
          <ChevronDown
            className={`h-5 w-5 transition-transform ${
              open ? 'rotate-180' : ''
            }`}
          />
          <div className="flex items-center gap-2">
            {icon}
            <span>{title}</span>
          </div>
        </button>
      </div>
      {open && (
        <div
          className={
            maxBodyHeightClass
              ? `px-6 pb-6 pt-2 ${maxBodyHeightClass} overflow-y-auto`
              : 'px-6 pb-6 pt-2'
          }
        >
          {children}
        </div>
      )}
    </Card>
  );
}

export default CollapsibleCard;
