export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  priority: 'high' | 'medium' | 'low';
  categoryId: string;
  dueDate: string | null;
  dueTime: string | null;
  reminder: 'none' | '15min' | '1hour' | '1day';
  subtasks: Subtask[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  reminderTriggered: boolean;
  recurrencePattern: 'none' | 'daily' | 'weekly' | 'monthly';
  recurrenceInterval: number;
  recurrenceEndDate: string | null;
  occurrencesCompleted: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
}

export type TaskFilter = {
  status: 'all' | 'pending' | 'completed' | 'overdue';
  priority: 'all' | 'high' | 'medium' | 'low';
  categoryId: string;
  search: string;
};

export type TaskSort = 'dueDate' | 'priority' | 'createdAt' | 'title';

export interface Notification {
  id: string;
  taskId: string;
  taskTitle: string;
  message: string;
  type: 'reminder' | 'overdue';
  read: boolean;
  createdAt: string;
}
