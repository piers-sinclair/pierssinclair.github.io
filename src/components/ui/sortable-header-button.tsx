import React from 'react';
import { Button } from './button';
import { ArrowUpDown } from 'lucide-react';

interface SortableHeaderButtonProps {
  column: any;
  title: string;
}

const SortableHeaderButton: React.FC<SortableHeaderButtonProps> = ({ column, title }) => {
  return (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );
};

export default SortableHeaderButton;