import React from 'react';
import { ArrowUpDown } from 'lucide-react';
import './SortableHeader.css';

interface SortableHeaderProps {
  column: any;
  title: string;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ column, title }) => {
  return (
    <div
      className="sortable-header"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      <span className="sortable-header-title">{title}</span>
      <ArrowUpDown className="sortable-header-icon ml-2 h-4 w-4" />
    </div>
  );
};

export default SortableHeader;