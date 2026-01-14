/**
 * SortableTable Component
 *
 * A reusable table component with sortable columns. Click on any column header
 * to sort by that column in ascending order. Click again to sort in descending order.
 *
 * @example
 * ```tsx
 * const columns: ColumnDef<MyDataType>[] = [
 *   {
 *     key: 'name',
 *     label: 'Name',
 *     accessor: (row) => row.name,
 *     render: (row) => <span>{row.name}</span>
 *   },
 *   {
 *     key: 'age',
 *     label: 'Age',
 *     accessor: (row) => row.age,
 *     render: (row) => <span>{row.age}</span>
 *   },
 *   {
 *     key: 'actions',
 *     label: 'Actions',
 *     sortable: false, // Disable sorting for this column
 *     render: (row) => <Button onClick={() => handleAction(row)}>Edit</Button>
 *   }
 * ];
 *
 * <SortableTable
 *   columns={columns}
 *   data={myData}
 *   getRowKey={(row) => row.id}
 * />
 * ```
 */
import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<T> {
  /**
   * Unique identifier for the column
   */
  key: string;
  /**
   * Display label for the column header
   */
  label: React.ReactNode;
  /**
   * Whether this column is sortable (default: true)
   */
  sortable?: boolean;
  /**
   * Custom sort function. If not provided, will use default comparison
   */
  sortFn?: (a: T, b: T, direction: 'asc' | 'desc') => number;
  /**
   * Function to extract the value for sorting from the row data
   */
  accessor?: (row: T) => any;
  /**
   * Function to render the cell content
   */
  render: (row: T, index: number) => React.ReactNode;
  /**
   * Custom className for the header cell
   */
  headerClassName?: string;
  /**
   * Custom className for the body cells
   */
  cellClassName?: string;
  /**
   * Alignment for the column
   */
  align?: 'left' | 'center' | 'right';
}

export interface SortableTableProps<T> {
  /**
   * Column definitions
   */
  columns: ColumnDef<T>[];
  /**
   * Table data
   */
  data: T[];
  /**
   * Optional key extractor for row keys (defaults to index)
   */
  getRowKey?: (row: T, index: number) => string | number;
  /**
   * Optional className for the table
   */
  className?: string;
  /**
   * Optional className for the table header
   */
  headerClassName?: string;
  /**
   * Optional className for table rows
   */
  rowClassName?: string | ((row: T, index: number) => string);
  /**
   * Default sort column key
   */
  defaultSortKey?: string;
  /**
   * Default sort direction
   */
  defaultSortDirection?: 'asc' | 'desc';
  /**
   * Callback when sort changes
   */
  onSortChange?: (key: string, direction: 'asc' | 'desc') => void;
}

export function SortableTable<T>({
  columns,
  data,
  getRowKey,
  className,
  headerClassName,
  rowClassName,
  defaultSortKey,
  defaultSortDirection = 'asc',
  onSortChange,
}: SortableTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey || null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    defaultSortDirection
  );

  // Handle column header click
  const handleSort = (columnKey: string, column: ColumnDef<T>) => {
    if (column.sortable === false) return;

    let newDirection: 'asc' | 'desc' = 'asc';

    if (sortKey === columnKey) {
      // Toggle direction if clicking the same column
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }

    setSortKey(columnKey);
    setSortDirection(newDirection);
    onSortChange?.(columnKey, newDirection);
  };

  // Sort the data
  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    const column = columns.find((col) => col.key === sortKey);
    if (!column) return data;

    const sorted = [...data].sort((a, b) => {
      // Use custom sort function if provided
      if (column.sortFn) {
        return column.sortFn(a, b, sortDirection);
      }

      // Get values to compare
      let aValue: any;
      let bValue: any;

      if (column.accessor) {
        aValue = column.accessor(a);
        bValue = column.accessor(b);
      } else {
        // Fallback to using the key as property accessor
        aValue = (a as any)[sortKey];
        bValue = (b as any)[sortKey];
      }

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      // Default comparison
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // For dates
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === 'asc'
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      // Default: convert to string and compare
      const aStr = String(aValue);
      const bStr = String(bValue);
      const comparison = aStr.localeCompare(bStr);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [data, sortKey, sortDirection, columns]);

  // Render sort indicator
  const renderSortIndicator = (columnKey: string, column: ColumnDef<T>) => {
    if (column.sortable === false) return null;

    if (sortKey !== columnKey) {
      return <ChevronsUpDown className="h-3 w-3 text-gray-400" />;
    }

    return sortDirection === 'asc' ? (
      <ChevronUp className="h-3 w-3 text-gray-700" />
    ) : (
      <ChevronDown className="h-3 w-3 text-gray-700" />
    );
  };

  return (
    <table className={cn('w-full border-collapse', className)}>
      <thead className={cn('bg-gray-50', headerClassName)}>
        <tr>
          {columns.map((column) => {
            const isSortable = column.sortable !== false;
            const alignClass =
              column.align === 'right'
                ? 'text-right'
                : column.align === 'center'
                ? 'text-center'
                : 'text-left';

            return (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-2 text-xs font-medium text-gray-500',
                  alignClass,
                  isSortable && 'cursor-pointer select-none hover:bg-gray-100',
                  column.headerClassName
                )}
                onClick={() => handleSort(column.key, column)}
              >
                <div
                  className={cn(
                    'flex items-center gap-2',
                    column.align === 'right' && 'justify-end',
                    column.align === 'center' && 'justify-center'
                  )}
                >
                  {column.label}
                  {renderSortIndicator(column.key, column)}
                </div>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>
        {sortedData.map((row, index) => {
          const key = getRowKey ? getRowKey(row, index) : index;
          const rowClass =
            typeof rowClassName === 'function'
              ? rowClassName(row, index)
              : rowClassName;

          return (
            <tr key={key} className={rowClass}>
              {columns.map((column) => {
                const alignClass =
                  column.align === 'right'
                    ? 'text-right'
                    : column.align === 'center'
                    ? 'text-center'
                    : 'text-left';

                return (
                  <td
                    key={column.key}
                    className={cn(
                      'px-4 py-2 text-sm',
                      alignClass,
                      column.cellClassName
                    )}
                  >
                    {column.render(row, index)}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
