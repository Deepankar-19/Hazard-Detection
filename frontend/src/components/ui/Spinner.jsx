import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/utils';

export function Spinner({ size = 'default', className }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    default: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex justify-center items-center h-full w-full">
      <Loader2 
        className={cn(
          "animate-spin text-primary-600",
          sizeClasses[size],
          className
        )} 
      />
    </div>
  );
}
