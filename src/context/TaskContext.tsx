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
      const task = state.tasks.find(t => t.id === action.payload);
      return {
        ...state,
        tasks: state.tasks.map(t => {
          if (t.id === action.payload) {
            const newStatus = t.status === 'pending' ? 'completed' : 'pending';
            const updatedTask = {
              ...t,
              status: newStatus,
              completedAt: newStatus === 'completed' ? new Date().toISOString() : null,
              updatedAt: new Date().toISOString(),
            };

            // Track task_completed or task_reopened event
            if (typeof window !== 'undefined' && (window as any).pendo && task) {
              const category = state.categories.find(c => c.id === task.categoryId);

              if (newStatus === 'completed') {
                // Task is being marked as completed
                const wasOverdue = task.dueDate ? new Date(task.dueDate) < new Date() : false;
                const daysToComplete = Math.floor(
                  (new Date().getTime() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                );
                const completedSubtasks = task.subtasks.filter(st => st.completed).length;

                (window as any).pendo.track('task_completed', {
                  task_id: task.id,
                  priority: task.priority,
                  category_id: task.categoryId,
                  category_name: category?.name || 'Unknown',
                  had_due_date: !!task.dueDate,
                  was_overdue: wasOverdue,
                  days_to_complete: daysToComplete,
                  had_subtasks: task.subtasks.length > 0,
                  subtasks_completed: completedSubtasks,
                  completion_location: 'context',
                });
              } else {
                // Task is being reopened (marked back to pending)
                const daysSinceCompletion = task.completedAt
                  ? Math.floor((new Date().getTime() - new Date(task.completedAt).getTime()) / (1000 * 60 * 60 * 24))
                  : 0;

                (window as any).pendo.track('task_reopened', {
                  task_id: task.id,
                  priority: task.priority,
                  category_id: task.categoryId,
                  days_since_completion: daysSinceCompletion,
                  reopened_location: 'context',
                });
              }
            }

            return updatedTask;
          }
          return t;
        }),
      };
    }

    case 'TOGGLE_SUBTASK': {
      const task = state.tasks.find(t => t.id === action.payload.taskId);
      const subtask = task?.subtasks.find(st => st.id === action.payload.subtaskId);

      return {
        ...state,
        tasks: state.tasks.map(t => {
          if (t.id === action.payload.taskId) {
            const updatedSubtasks = t.subtasks.map(st =>
              st.id === action.payload.subtaskId
                ? { ...st, completed: !st.completed }
                : st
            );

            // Track subtask_toggled event
            if (typeof window !== 'undefined' && (window as any).pendo && task && subtask) {
              const totalSubtasks = t.subtasks.length;
              const currentCompletedCount = t.subtasks.filter(st => st.completed).length;
              const newCompletedCount = !subtask.completed
                ? currentCompletedCount + 1
                : currentCompletedCount - 1;
              const subtaskCompletionPercentage = Math.round((newCompletedCount / totalSubtasks) * 100);

              (window as any).pendo.track('subtask_toggled', {
                task_id: action.payload.taskId,
                subtask_id: action.payload.subtaskId,
                subtask_completed: !subtask.completed,
                total_subtasks: totalSubtasks,
                completed_subtasks: newCompletedCount,
                subtask_completion_percentage: subtaskCompletionPercentage,
              });
            }

            return {
              ...t,
              subtasks: updatedSubtasks,
              updatedAt: new Date().toISOString(),
            };
          }
          return t;
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
  };

  const updateTask = (task: Task) => {
    const updatedTask = { ...task, updatedAt: new Date().toISOString() };
    dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
  };

  const deleteTask = (taskId: string) => {
    dispatch({ type: 'DELETE_TASK', payload: taskId });
  };

  const toggleTaskStatus = (taskId: string) => {
    dispatch({ type: 'TOGGLE_TASK_STATUS', payload: taskId });
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    dispatch({ type: 'TOGGLE_SUBTASK', payload: { taskId, subtaskId } });
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
  };

  const updateCategory = (category: Category) => {
    dispatch({ type: 'UPDATE_CATEGORY', payload: category });
  };

  const deleteCategory = (categoryId: string, reassignTo: string) => {
    dispatch({ type: 'DELETE_CATEGORY', payload: { categoryId, reassignTo } });
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
