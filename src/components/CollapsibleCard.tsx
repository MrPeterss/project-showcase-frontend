import { useState, type ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';

type CollapsibleCardProps = {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  open?: boolean; // Controlled open state
  maxBodyHeightClass?: string;
  onToggle?: (isOpen: boolean) => void;
  children: ReactNode;
};

export function CollapsibleCard({
  title,
  icon,
  defaultOpen = false,
  open: controlledOpen,
  maxBodyHeightClass,
  onToggle,
  children,
}: CollapsibleCardProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleToggle = () => {
    const newOpen = !open;
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
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
