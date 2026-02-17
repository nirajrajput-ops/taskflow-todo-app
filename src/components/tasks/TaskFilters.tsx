import React, { useRef, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { TaskFilter, TaskSort, Category } from '../../types';
import { Select } from '../common/Input';
import { Button } from '../common/Button';

interface TaskFiltersProps {
  filter: TaskFilter;
  sort: TaskSort;
  categories: Category[];
  onFilterChange: (filter: TaskFilter) => void;
  onSortChange: (sort: TaskSort) => void;
  onClearFilters: () => void;
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filter,
  sort,
  categories,
  onFilterChange,
  onSortChange,
  onClearFilters,
}) => {
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFilterChange({ ...filter, search: value });

    // Pendo Track Event: task_search_performed (debounced 500ms)
    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    if (value.trim()) {
      searchTimerRef.current = setTimeout(() => {
        if (typeof pendo !== 'undefined') {
          pendo.track('task_search_performed', {
            search_query: value.trim().substring(0, 100),
            active_status_filter: filter.status,
            active_priority_filter: filter.priority,
            active_category_filter: filter.categoryId,
          });
        }
      }, 500);
    }
  }, [filter, onFilterChange]);

  const hasActiveFilters =
    filter.status !== 'all' ||
    filter.priority !== 'all' ||
    filter.categoryId !== 'all' ||
    filter.search !== '';

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'overdue', label: 'Overdue' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat.id, label: cat.name })),
  ];

  const sortOptions = [
    { value: 'dueDate', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'title', label: 'Alphabetical' },
  ];

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search tasks..."
          value={filter.search}
          onChange={handleSearchChange}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[140px]">
          <Select
            options={statusOptions}
            value={filter.status}
            onChange={e => {
              const newValue = e.target.value as TaskFilter['status'];
              // Pendo Track Event: task_filter_applied
              if (typeof pendo !== 'undefined') {
                pendo.track('task_filter_applied', {
                  filter_type: 'status',
                  filter_value: newValue,
                  all_active_filters: JSON.stringify({
                    status: newValue,
                    priority: filter.priority,
                    categoryId: filter.categoryId,
                  }),
                });
              }
              onFilterChange({ ...filter, status: newValue });
            }}
          />
        </div>

        <div className="flex-1 min-w-[140px]">
          <Select
            options={priorityOptions}
            value={filter.priority}
            onChange={e => {
              const newValue = e.target.value as TaskFilter['priority'];
              // Pendo Track Event: task_filter_applied
              if (typeof pendo !== 'undefined') {
                pendo.track('task_filter_applied', {
                  filter_type: 'priority',
                  filter_value: newValue,
                  all_active_filters: JSON.stringify({
                    status: filter.status,
                    priority: newValue,
                    categoryId: filter.categoryId,
                  }),
                });
              }
              onFilterChange({ ...filter, priority: newValue });
            }}
          />
        </div>

        <div className="flex-1 min-w-[140px]">
          <Select
            options={categoryOptions}
            value={filter.categoryId}
            onChange={e => {
              const newValue = e.target.value;
              // Pendo Track Event: task_filter_applied
              if (typeof pendo !== 'undefined') {
                pendo.track('task_filter_applied', {
                  filter_type: 'category',
                  filter_value: newValue,
                  all_active_filters: JSON.stringify({
                    status: filter.status,
                    priority: filter.priority,
                    categoryId: newValue,
                  }),
                });
              }
              onFilterChange({ ...filter, categoryId: newValue });
            }}
          />
        </div>

        <div className="flex-1 min-w-[140px]">
          <Select
            options={sortOptions}
            value={sort}
            onChange={e => {
              const newValue = e.target.value as TaskSort;
              // Pendo Track Event: task_sort_changed
              if (typeof pendo !== 'undefined') {
                pendo.track('task_sort_changed', {
                  sort_value: newValue,
                  previous_sort_value: sort,
                });
              }
              onSortChange(newValue);
            }}
          />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};
