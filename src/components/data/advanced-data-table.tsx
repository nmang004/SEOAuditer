'use client';

import * as React from 'react';
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  RowSelectionState,
  ColumnPinningState,
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronDown, MoreHorizontal, GripVertical, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { m, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem, pageTransitions } from '@/components/animations/animation-variants';

export interface AdvancedDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  defaultSorting?: SortingState;
  defaultColumnVisibility?: VisibilityState;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (rows: TData[]) => void;
  onRowClick?: (row: TData) => void;
  className?: string;
}

export function AdvancedDataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  defaultSorting = [],
  defaultColumnVisibility = {},
  enableRowSelection = false,
  onRowSelectionChange,
  onRowClick,
  className,
}: AdvancedDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(defaultSorting);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(defaultColumnVisibility);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({});

  // Update row selection callback
  React.useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
      onRowSelectionChange(selectedRows);
    }
  }, [rowSelection]);

  // Setup table
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnPinning,
    },
    enableRowSelection: enableRowSelection,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className={cn('space-y-4', className)}>
      {/* Table Toolbar */}
      <div className="flex items-center justify-between">
        {searchKey && (
          <div className="flex items-center space-x-2">
            <Input
              placeholder={`Filter ${searchKey}...`}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
          </div>
        )}
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                <Settings2 className="mr-2 h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[150px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <m.tr key={headerGroup.id} variants={staggerContainer}>
                {headerGroup.headers.map((header) => (
                  <m.th key={header.id} variants={staggerItem} className="relative">
                    {header.isPlaceholder
                      ? null
                      : <div className="flex items-center">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {/* Animated sort indicator */}
                          {header.column.getCanSort() && (
                            <m.span
                              animate={{ rotate: header.column.getIsSorted() === 'desc' ? 180 : 0, opacity: header.column.getIsSorted() ? 1 : 0.3 }}
                              transition={{ duration: 0.2 }}
                              className="ml-1"
                            >
                              <ArrowUpDown className="h-4 w-4" />
                            </m.span>
                          )}
                        </div>
                    }
                  </m.th>
                ))}
              </m.tr>
            ))}
          </TableHeader>
          <TableBody>
            <AnimatePresence initial={false}>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <m.tr
                    key={row.id}
                    layout
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    variants={pageTransitions}
                    className={cn(
                      'cursor-pointer transition-colors',
                      row.getIsSelected() ? 'bg-primary/10' : 'hover:bg-muted/50',
                      onRowClick && 'hover:bg-muted/50 cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <m.td key={cell.id} variants={staggerItem}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </m.td>
                    ))}
                  </m.tr>
                ))
              ) : (
                <m.tr>
                  <m.td colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </m.td>
                </m.tr>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Rows per page</p>
            <select
              className="h-8 w-[70px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
            >
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>
          <div className="flex w-[100px] items-center justify-center text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to previous page</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to next page</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
