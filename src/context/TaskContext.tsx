import React, { createContext, useContext, useReducer, useEffect, useRef, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Task, Category } from '../types';
import { storage } from '../utils/storage';

interface TaskState {
  tasks: Task[];
  categories: Category[];
}

type TaskAction =
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'TOGGLE_TASK_STATUS'; payload: string }
  | { type: 'TOGGLE_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'MARK_REMINDER_TRIGGERED'; payload: string }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: { categoryId: string; reassignTo: string } };

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };

    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };

    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        ),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };

    case 'TOGGLE_TASK_STATUS': {
      return {
        ...state,
        tasks: state.tasks.map(task => {
          if (task.id === action.payload) {
            const newStatus = task.status === 'pending' ? 'completed' : 'pending';
            return {
              ...task,
              status: newStatus,
              completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
              updatedAt: new Date().toISOString(),
            };
          }
          return task;
        }),
      };
    }

    case 'TOGGLE_SUBTASK': {
      return {
        ...state,
        tasks: state.tasks.map(task => {
          if (task.id === action.payload.taskId) {
            return {
              ...task,
              subtasks: task.subtasks.map(subtask =>
                subtask.id === action.payload.subtaskId
                  ? { ...subtask, completed: !subtask.completed }
                  : subtask
              ),
              updatedAt: new Date().toISOString(),
            };
          }
          return task;
        }),
      };
    }

    case 'MARK_REMINDER_TRIGGERED':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? { ...task, reminderTriggered: true, updatedAt: new Date().toISOString() }
            : task
        ),
      };

    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };

    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };

    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(cat =>
          cat.id === action.payload.id ? action.payload : cat
        ),
      };

    case 'DELETE_CATEGORY': {
      const { categoryId, reassignTo } = action.payload;
      return {
        ...state,
        categories: state.categories.filter(cat => cat.id !== categoryId),
        tasks: state.tasks.map(task =>
          task.categoryId === categoryId ? { ...task, categoryId: reassignTo } : task
        ),
      };
    }

    default:
      return state;
  }
};

interface TaskContextValue {
  tasks: Task[];
  categories: Category[];
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'reminderTriggered'>) => void;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  toggleTaskStatus: (taskId: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  markReminderTriggered: (taskId: string) => void;
  getTaskById: (taskId: string) => Task | undefined;
  addCategory: (name: string, color: string) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string, reassignTo: string) => void;
  getCategoryById: (categoryId: string) => Category | undefined;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

// Initialize state from localStorage
const getInitialState = (): TaskState => {
  return {
    tasks: storage.getTasks(),
    categories: storage.getCategories(),
  };
};

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, null, getInitialState);
  const isFirstRender = useRef(true);

  // Save tasks to localStorage whenever they change (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    storage.setTasks(state.tasks);
  }, [state.tasks]);

  // Save categories to localStorage whenever they change
  useEffect(() => {
    storage.setCategories(state.categories);
  }, [state.categories]);

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'completedAt' | 'reminderTriggered'>) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      reminderTriggered: false,
    };
    dispatch({ type: 'ADD_TASK', payload: newTask });

    // Track task_created event
    if (typeof window !== 'undefined' && (window as any).pendo) {
      (window as any).pendo.track('task_created', {
        task_priority: newTask.priority,
        has_due_date: !!newTask.dueDate,
        has_description: !!newTask.description && newTask.description.length > 0,
        category_id: newTask.categoryId,
        has_subtasks: newTask.subtasks.length > 0,
        subtask_count: newTask.subtasks.length,
        has_reminder: newTask.reminder !== 'none',
        reminder_type: newTask.reminder,
        creation_method: 'form' // This will be overridden by quick_add_task_used for quick adds
      });
    }
  };

  const updateTask = (task: Task) => {
    const updatedTask = { ...task, updatedAt: new Date().toISOString() };
    const originalTask = state.tasks.find(t => t.id === task.id);

    dispatch({ type: 'UPDATE_TASK', payload: updatedTask });

    // Track task_updated event
    if (typeof window !== 'undefined' && (window as any).pendo && originalTask) {
      const fieldsChanged: string[] = [];
      if (originalTask.title !== task.title) fieldsChanged.push('title');
      if (originalTask.description !== task.description) fieldsChanged.push('description');
      if (originalTask.priority !== task.priority) fieldsChanged.push('priority');
      if (originalTask.categoryId !== task.categoryId) fieldsChanged.push('category');
      if (originalTask.dueDate !== task.dueDate) fieldsChanged.push('due_date');
      if (originalTask.dueTime !== task.dueTime) fieldsChanged.push('due_time');
      if (originalTask.reminder !== task.reminder) fieldsChanged.push('reminder');
      if (JSON.stringify(originalTask.subtasks) !== JSON.stringify(task.subtasks)) fieldsChanged.push('subtasks');

      (window as any).pendo.track('task_updated', {
        task_id: updatedTask.id,
        task_priority: updatedTask.priority,
        has_due_date: !!updatedTask.dueDate,
        category_id: updatedTask.categoryId,
        fields_changed: fieldsChanged.join(','),
        has_subtasks: updatedTask.subtasks.length > 0,
        subtask_count: updatedTask.subtasks.length
      });
    }
  };

  const deleteTask = (taskId: string) => {
    const task = state.tasks.find(t => t.id === taskId);

    dispatch({ type: 'DELETE_TASK', payload: taskId });

    // Track task_deleted event
    if (typeof window !== 'undefined' && (window as any).pendo && task) {
      const taskAgeDays = Math.floor(
        (new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      (window as any).pendo.track('task_deleted', {
        task_id: taskId,
        task_status: task.status,
        task_priority: task.priority,
        category_id: task.categoryId,
        had_subtasks: task.subtasks.length > 0,
        subtask_count: task.subtasks.length,
        deletion_location: 'context', // Will be overridden by specific locations
        task_age_days: taskAgeDays
      });
    }
  };

  const toggleTaskStatus = (taskId: string) => {
    const task = state.tasks.find(t => t.id === taskId);

    dispatch({ type: 'TOGGLE_TASK_STATUS', payload: taskId });

    // Track task_completed or task_uncompleted event
    if (typeof window !== 'undefined' && (window as any).pendo && task) {
      if (task.status === 'pending') {
        // Task is being marked as completed
        const wasOverdue = task.dueDate ? new Date(task.dueDate) < new Date() : false;
        const daysToComplete = Math.floor(
          (new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)
        );
        const allSubtasksCompleted = task.subtasks.length > 0
          ? task.subtasks.every(st => st.completed)
          : true;

        (window as any).pendo.track('task_completed', {
          task_id: taskId,
          task_priority: task.priority,
          category_id: task.categoryId,
          was_overdue: wasOverdue,
          had_due_date: !!task.dueDate,
          completion_location: 'context', // Will be overridden by specific locations
          days_to_complete: daysToComplete,
          had_subtasks: task.subtasks.length > 0,
          all_subtasks_completed: allSubtasksCompleted
        });
      } else {
        // Task is being marked back to pending
        const wasCompletedForDays = task.completedAt
          ? Math.floor((new Date().getTime() - new Date(task.completedAt).getTime()) / (1000 * 60 * 60 * 24))
          : 0;

        (window as any).pendo.track('task_uncompleted', {
          task_id: taskId,
          task_priority: task.priority,
          category_id: task.categoryId,
          was_completed_for_days: wasCompletedForDays
        });
      }
    }
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    const task = state.tasks.find(t => t.id === taskId);
    const subtask = task?.subtasks.find(st => st.id === subtaskId);

    dispatch({ type: 'TOGGLE_SUBTASK', payload: { taskId, subtaskId } });

    // Track subtask_completed or subtask_uncompleted event
    if (typeof window !== 'undefined' && (window as any).pendo && task && subtask) {
      const totalSubtasks = task.subtasks.length;
      const completedSubtasks = task.subtasks.filter(st => st.completed).length;

      if (!subtask.completed) {
        // Subtask is being marked as completed
        const newCompletedCount = completedSubtasks + 1;
        const subtaskCompletionPercentage = Math.round((newCompletedCount / totalSubtasks) * 100);

        (window as any).pendo.track('subtask_completed', {
          task_id: taskId,
          subtask_id: subtaskId,
          total_subtasks: totalSubtasks,
          completed_subtasks: newCompletedCount,
          subtask_completion_percentage: subtaskCompletionPercentage
        });
      } else {
        // Subtask is being marked back to incomplete
        (window as any).pendo.track('subtask_uncompleted', {
          task_id: taskId,
          subtask_id: subtaskId,
          total_subtasks: totalSubtasks,
          completed_subtasks: completedSubtasks - 1
        });
      }
    }
  };

  const markReminderTriggered = (taskId: string) => {
    dispatch({ type: 'MARK_REMINDER_TRIGGERED', payload: taskId });
  };

  const getTaskById = (taskId: string) => {
    return state.tasks.find(task => task.id === taskId);
  };

  const addCategory = (name: string, color: string) => {
    const newCategory: Category = {
      id: uuidv4(),
      name,
      color,
      isDefault: false,
    };
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory });

    // Track category_created event
    if (typeof window !== 'undefined' && (window as any).pendo) {
      const customCategories = state.categories.filter(c => !c.isDefault);
      const isFirstCustomCategory = customCategories.length === 0;

      (window as any).pendo.track('category_created', {
        category_name: name,
        category_color: color,
        is_first_custom_category: isFirstCustomCategory,
        total_categories: state.categories.length + 1
      });
    }
  };

  const updateCategory = (category: Category) => {
    const originalCategory = state.categories.find(c => c.id === category.id);

    dispatch({ type: 'UPDATE_CATEGORY', payload: category });

    // Track category_updated event
    if (typeof window !== 'undefined' && (window as any).pendo && originalCategory) {
      const fieldsChanged: string[] = [];
      if (originalCategory.name !== category.name) fieldsChanged.push('name');
      if (originalCategory.color !== category.color) fieldsChanged.push('color');

      (window as any).pendo.track('category_updated', {
        category_id: category.id,
        category_name: category.name,
        category_color: category.color,
        fields_changed: fieldsChanged.join(',')
      });
    }
  };

  const deleteCategory = (categoryId: string, reassignTo: string) => {
    const affectedTaskCount = state.tasks.filter(t => t.categoryId === categoryId).length;

    dispatch({ type: 'DELETE_CATEGORY', payload: { categoryId, reassignTo } });

    // Track category_deleted event
    if (typeof window !== 'undefined' && (window as any).pendo) {
      (window as any).pendo.track('category_deleted', {
        category_id: categoryId,
        reassign_to_category_id: reassignTo,
        affected_task_count: affectedTaskCount
      });
    }
  };

  const getCategoryById = (categoryId: string) => {
    return state.categories.find(cat => cat.id === categoryId);
  };

  return (
    <TaskContext.Provider
      value={{
        tasks: state.tasks,
        categories: state.categories,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        toggleSubtask,
        markReminderTriggered,
        getTaskById,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryById,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextValue => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};
