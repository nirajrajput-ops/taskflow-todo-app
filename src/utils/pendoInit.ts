import { Task, Category } from '../types';
import { isOverdue } from './dateUtils';

const VISITOR_ID_KEY = 'todo_app_pendo_visitor_id';

function getOrCreateVisitorId(): string {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = 'visitor_' + crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

export function initializePendo(
  tasks: Task[],
  categories: Category[],
  permissionStatus: NotificationPermission | 'default',
  unreadCount: number
): void {
  const visitorId = getOrCreateVisitorId();

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const overdueTasks = pendingTasks.filter(t => isOverdue(t.dueDate, t.dueTime, t.status));
  const highPriorityTasks = tasks.filter(t => t.priority === 'high');

  const categoriesUsed = [
    ...new Set(
      tasks.map(t => {
        const cat = categories.find(c => c.id === t.categoryId);
        return cat ? cat.name : null;
      }).filter(Boolean)
    ),
  ] as string[];

  const customCategoriesCount = categories.filter(c => !c.isDefault).length;

  const usesSubtasks = tasks.some(t => t.subtasks.length > 0);
  const usesReminders = tasks.some(t => t.reminder !== 'none');

  // Compute most used priority
  let mostUsedPriority = 'medium';
  if (tasks.length > 0) {
    const priorityCounts: Record<string, number> = { high: 0, medium: 0, low: 0 };
    tasks.forEach(t => {
      priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
    });
    mostUsedPriority = Object.entries(priorityCounts).sort((a, b) => b[1] - a[1])[0][0];
  }

  // Find first and last task creation dates
  const sortedByCreation = [...tasks].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const firstTaskCreatedAt = sortedByCreation.length > 0 ? sortedByCreation[0].createdAt : null;
  const lastTaskCreatedAt =
    sortedByCreation.length > 0 ? sortedByCreation[sortedByCreation.length - 1].createdAt : null;

  // Task completion rate
  const taskCompletionRate =
    tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 1000) / 10 : 0;

  pendo.initialize({
    visitor: {
      id: visitorId,
      totalTasksCreated: tasks.length,
      completedTasksCount: completedTasks.length,
      pendingTasksCount: pendingTasks.length,
      overdueTasksCount: overdueTasks.length,
      categoriesUsed: categoriesUsed,
      customCategoriesCount: customCategoriesCount,
      notificationPermissionStatus: permissionStatus,
      unreadNotificationsCount: unreadCount,
      highPriorityTasksCount: highPriorityTasks.length,
      usesSubtasks: usesSubtasks,
      usesReminders: usesReminders,
      mostUsedPriority: mostUsedPriority,
      firstTaskCreatedAt: firstTaskCreatedAt,
      lastTaskCreatedAt: lastTaskCreatedAt,
      taskCompletionRate: taskCompletionRate,
    },
  });
}
