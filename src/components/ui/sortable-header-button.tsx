import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import './sortable-header-button.css';

interface SortableHeaderButtonProps {
  column: any;
  title: string;
}

const SortableHeaderButton: React.FC<SortableHeaderButtonProps> = ({ column, title }) => {
  return (
    <div
      className="sortable-header-button"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      <span className="sortable-header-title">{title}</span>
      <ArrowUpDown className="sortable-header-icon ml-2 h-4 w-4" />
    </div>
  );
};

export default SortableHeaderButton;