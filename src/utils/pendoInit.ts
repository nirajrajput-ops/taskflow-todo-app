import { Task, Category, Notification } from '../types';
import { storage } from './storage';
import { isOverdue } from './dateUtils';

const VISITOR_ID_KEY = 'pendo_visitor_id';

function getOrCreateVisitorId(): string {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = 'visitor_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

function getMostUsedCategory(tasks: Task[], categories: Category[]): string {
  if (tasks.length === 0) return '';
  const counts: Record<string, number> = {};
  tasks.forEach(task => {
    counts[task.categoryId] = (counts[task.categoryId] || 0) + 1;
  });
  const topCategoryId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!topCategoryId) return '';
  const category = categories.find(c => c.id === topCategoryId);
  return category?.name || '';
}

export function initializePendo(): void {
  const visitorId = getOrCreateVisitorId();
  const tasks: Task[] = storage.getTasks();
  const categories: Category[] = storage.getCategories();
  const notifications: Notification[] = storage.getNotifications();

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const overdueTasks = pendingTasks.filter(t => isOverdue(t.dueDate, t.dueTime, t.status));
  const highPriorityTasks = tasks.filter(t => t.priority === 'high');
  const customCategories = categories.filter(c => !c.isDefault);
  const unreadNotifications = notifications.filter(n => !n.read);
  const usesReminders = tasks.some(t => t.reminder !== 'none');
  const usesSubtasks = tasks.some(t => t.subtasks.length > 0);

  const sortedByCreated = [...tasks].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const firstTaskCreatedAt = sortedByCreated.length > 0 ? sortedByCreated[0].createdAt : '';

  const taskCompletionRate = tasks.length > 0
    ? Math.round((completedTasks.length / tasks.length) * 100)
    : 0;

  const hasSeedData = tasks.length >= 20;

  const notificationPermissionStatus = 'Notification' in window
    ? window.Notification.permission
    : 'default';

  pendo.initialize({
    visitor: {
      id: visitorId,
      totalTasksCreated: tasks.length,
      completedTasksCount: completedTasks.length,
      pendingTasksCount: pendingTasks.length,
      overdueTasksCount: overdueTasks.length,
      categoriesUsed: categories.map(c => c.name),
      customCategoriesCount: customCategories.length,
      notificationPermissionStatus: notificationPermissionStatus,
      unreadNotificationsCount: unreadNotifications.length,
      highPriorityTasksCount: highPriorityTasks.length,
      usesReminders: usesReminders,
      usesSubtasks: usesSubtasks,
      hasSeedData: hasSeedData,
      firstTaskCreatedAt: firstTaskCreatedAt,
      mostUsedCategory: getMostUsedCategory(tasks, categories),
      taskCompletionRate: taskCompletionRate,
    },
  });
}
