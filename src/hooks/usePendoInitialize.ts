import { useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { useNotifications } from '../context/NotificationContext';
import { isOverdue } from '../utils/dateUtils';

const VISITOR_ID_KEY = 'pendo_visitor_id';

function getOrCreateVisitorId(): string {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = 'anon-' + crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

export function usePendoInitialize() {
  const { tasks, categories } = useTasks();
  const { notifications } = useNotifications();

  useEffect(() => {
    const visitorId = getOrCreateVisitorId();

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const overdueTasks = pendingTasks.filter(t => isOverdue(t.dueDate, t.dueTime, t.status));
    const highPriorityTasks = tasks.filter(t => t.priority === 'high');
    const hasCustomCategories = categories.some(c => !c.isDefault);
    const usesSubtasks = tasks.some(t => t.subtasks.length > 0);
    const usesReminders = tasks.some(t => t.reminder !== 'none');
    const usesDueDates = tasks.some(t => t.dueDate !== null);
    const unreadNotifications = notifications.filter(n => !n.read);

    // Compute most used category
    let mostUsedCategory = '';
    if (tasks.length > 0) {
      const categoryCounts: Record<string, number> = {};
      tasks.forEach(t => {
        categoryCounts[t.categoryId] = (categoryCounts[t.categoryId] || 0) + 1;
      });
      mostUsedCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';
    }

    const totalTaskCount = tasks.length;
    const taskCompletionRate = totalTaskCount > 0
      ? Math.round((completedTasks.length / totalTaskCount) * 100)
      : 0;

    pendo.initialize({
      visitor: {
        id: visitorId,
        totalTaskCount,
        completedTaskCount: completedTasks.length,
        pendingTaskCount: pendingTasks.length,
        overdueTaskCount: overdueTasks.length,
        categoryCount: categories.length,
        hasCustomCategories,
        usesSubtasks,
        usesReminders,
        highPriorityTaskCount: highPriorityTasks.length,
        notificationCount: notifications.length,
        unreadNotificationCount: unreadNotifications.length,
        mostUsedCategory,
        taskCompletionRate,
        usesDueDates,
      },
    });
  }, []); // Initialize once on mount
}
