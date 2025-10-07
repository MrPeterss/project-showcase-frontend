import { useState, type ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ChevronDown } from 'lucide-react';

type CollapsibleCardProps = {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  maxBodyHeightClass?: string; // e.g., "max-h-80"
  children: ReactNode;
};

export function CollapsibleCard({
  title,
  icon,
  defaultOpen = false,
  maxBodyHeightClass,
  children,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
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
        </CardTitle>
      </CardHeader>
      {open && (
        <CardContent
          className={
            maxBodyHeightClass
              ? `${maxBodyHeightClass} overflow-y-auto`
              : undefined
          }
        >
          {children}
        </CardContent>
      )}
    </Card>
  );
}

export default CollapsibleCard;
