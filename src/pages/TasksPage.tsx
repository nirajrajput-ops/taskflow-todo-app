import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { TaskFilter, TaskSort } from '../types';
import { TaskList } from '../components/tasks/TaskList';
import { TaskFilters } from '../components/tasks/TaskFilters';
import { Button } from '../components/common/Button';
import { ConfirmModal } from '../components/common/Modal';
import { useToast } from '../components/common/Toast';
import { isOverdue } from '../utils/dateUtils';

export const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { tasks, categories, toggleTaskStatus, deleteTask } = useTasks();
  const { showToast } = useToast();
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);

  // Derive filter directly from URL params (single source of truth)
  const filter: TaskFilter = useMemo(() => ({
    status: (searchParams.get('status') as TaskFilter['status']) || 'all',
    priority: (searchParams.get('priority') as TaskFilter['priority']) || 'all',
    categoryId: searchParams.get('category') || 'all',
    search: searchParams.get('search') || '',
  }), [searchParams]);

  const sort: TaskSort = (searchParams.get('sort') as TaskSort) || 'createdAt';

  // Update URL when filter changes
  const setFilter = useCallback((newFilter: TaskFilter) => {
    const params = new URLSearchParams();
    if (newFilter.status !== 'all') params.set('status', newFilter.status);
    if (newFilter.priority !== 'all') params.set('priority', newFilter.priority);
    if (newFilter.categoryId !== 'all') params.set('category', newFilter.categoryId);
    if (newFilter.search) params.set('search', newFilter.search);
    const currentSort = searchParams.get('sort');
    if (currentSort && currentSort !== 'createdAt') params.set('sort', currentSort);
    setSearchParams(params, { replace: true });

    // Pendo Track Event: task_filters_applied (only for non-search filter changes)
    const isFilterChange =
      newFilter.status !== filter.status ||
      newFilter.priority !== filter.priority ||
      newFilter.categoryId !== filter.categoryId;
    if (isFilterChange && typeof pendo !== 'undefined') {
      pendo.track('task_filters_applied', {
        status_filter: newFilter.status,
        priority_filter: newFilter.priority,
        category_filter: newFilter.categoryId,
        sort_order: currentSort || 'createdAt',
        results_count: tasks.length,
      });
    }
  }, [searchParams, setSearchParams, filter, tasks.length]);

  const setSort = useCallback((newSort: TaskSort) => {
    const params = new URLSearchParams(searchParams);
    if (newSort !== 'createdAt') {
      params.set('sort', newSort);
    } else {
      params.delete('sort');
    }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Filter by status
    if (filter.status !== 'all') {
      if (filter.status === 'overdue') {
        result = result.filter(
          t => t.status === 'pending' && isOverdue(t.dueDate, t.dueTime, t.status)
        );
      } else {
        result = result.filter(t => t.status === filter.status);
      }
    }

    // Filter by priority
    if (filter.priority !== 'all') {
      result = result.filter(t => t.priority === filter.priority);
    }

    // Filter by category
    if (filter.categoryId !== 'all') {
      result = result.filter(t => t.categoryId === filter.categoryId);
    }

    // Filter by search
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      result = result.filter(
        t =>
          t.title.toLowerCase().includes(searchLower) ||
          t.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sort) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();

        case 'priority': {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }

        case 'title':
          return a.title.localeCompare(b.title);

        case 'createdAt':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [tasks, filter, sort]);

  const handleToggleStatus = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      if (task.status === 'pending') {
        // Pendo Track Event: task_completed
        if (typeof pendo !== 'undefined') {
          const completedSubtasksCount = task.subtasks.filter(s => s.completed).length;
          pendo.track('task_completed', {
            task_id: task.id,
            task_priority: task.priority,
            task_category: task.categoryId,
            had_due_date: !!task.dueDate,
            was_overdue: isOverdue(task.dueDate, task.dueTime, task.status),
            subtask_count: task.subtasks.length,
            completed_subtasks: completedSubtasksCount,
            source_page: 'tasks_list',
          });
        }
      } else {
        // Pendo Track Event: task_reopened
        if (typeof pendo !== 'undefined') {
          const timeSinceCompletion = task.completedAt
            ? Math.round((Date.now() - new Date(task.completedAt).getTime()) / 1000)
            : null;
          pendo.track('task_reopened', {
            task_id: task.id,
            task_priority: task.priority,
            task_category: task.categoryId,
            time_since_completion: timeSinceCompletion,
            source_page: 'tasks_list',
          });
        }
      }
    }

    toggleTaskStatus(taskId);
    if (task?.status === 'pending') {
      showToast('Task completed!', 'success');
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTaskId) {
      // Pendo Track Event: task_deleted
      const taskToDelete = tasks.find(t => t.id === deleteTaskId);
      if (typeof pendo !== 'undefined' && taskToDelete) {
        pendo.track('task_deleted', {
          task_id: taskToDelete.id,
          task_status: taskToDelete.status,
          task_priority: taskToDelete.priority,
          task_category: taskToDelete.categoryId,
          had_subtasks: taskToDelete.subtasks.length > 0,
          source_page: 'tasks_list',
        });
      }

      deleteTask(deleteTaskId);
      showToast('Task deleted', 'success');
      setDeleteTaskId(null);
    }
  };

  const handleClearFilters = () => {
    setFilter({
      status: 'all',
      priority: 'all',
      categoryId: 'all',
      search: '',
    });
    setSort('createdAt');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Tasks</h1>
          <p className="text-gray-500 mt-1">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button onClick={() => navigate('/tasks/new')}>
          <Plus className="h-4 w-4 mr-1" />
          New Task
        </Button>
      </div>

      {/* Filters */}
      <TaskFilters
        filter={filter}
        sort={sort}
        categories={categories}
        resultCount={filteredTasks.length}
        onFilterChange={setFilter}
        onSortChange={setSort}
        onClearFilters={handleClearFilters}
      />

      {/* Task List */}
      <TaskList
        tasks={filteredTasks}
        onToggleStatus={handleToggleStatus}
        onDelete={setDeleteTaskId}
        emptyMessage={
          filter.status !== 'all' ||
          filter.priority !== 'all' ||
          filter.categoryId !== 'all' ||
          filter.search
            ? 'No tasks match your filters'
            : 'No tasks yet. Create your first task!'
        }
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteTaskId}
        onClose={() => setDeleteTaskId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
