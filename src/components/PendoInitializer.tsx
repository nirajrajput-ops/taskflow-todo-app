import { useEffect, useRef } from 'react';
import { useTasks } from '../context/TaskContext';
import { useNotifications } from '../context/NotificationContext';
import { isOverdue } from '../utils/dateUtils';

const VISITOR_ID_KEY = 'todo_app_pendo_visitor_id';

function getOrCreateVisitorId(): string {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = 'anon-' + crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

export function PendoInitializer() {
  const { tasks, categories } = useTasks();
  const { notifications, permissionStatus } = useNotifications();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const visitorId = getOrCreateVisitorId();

    const completedTasks = tasks.filter(t => t.status === 'completed');
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const overdueTasks = pendingTasks.filter(t => isOverdue(t.dueDate, t.dueTime, t.status));
    const highPriorityTasks = tasks.filter(t => t.priority === 'high');
    const hasCustomCategories = categories.some(c => !c.isDefault);
    const usesSubtasks = tasks.some(t => t.subtasks.length > 0);
    const usesReminders = tasks.some(t => t.reminder !== 'none');
    const usesDueDates = tasks.some(t => t.dueDate !== null);
    const unreadNotificationCount = notifications.filter(n => !n.read).length;
    const taskCompletionRate = tasks.length > 0
      ? Math.round((completedTasks.length / tasks.length) * 100)
      : 0;

    // Find most used category
    let mostUsedCategory = '';
    if (tasks.length > 0) {
      const categoryCounts: Record<string, number> = {};
      tasks.forEach(t => {
        categoryCounts[t.categoryId] = (categoryCounts[t.categoryId] || 0) + 1;
      });
      const topCategoryId = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      if (topCategoryId) {
        const cat = categories.find(c => c.id === topCategoryId);
        mostUsedCategory = cat ? cat.name : topCategoryId;
      }
    }

    pendo.initialize({
      visitor: {
        id: visitorId,
        totalTaskCount: tasks.length,
        completedTaskCount: completedTasks.length,
        pendingTaskCount: pendingTasks.length,
        overdueTaskCount: overdueTasks.length,
        categoryCount: categories.length,
        hasCustomCategories: hasCustomCategories,
        usesSubtasks: usesSubtasks,
        usesReminders: usesReminders,
        usesDueDates: usesDueDates,
        notificationPermission: permissionStatus,
        unreadNotificationCount: unreadNotificationCount,
        highPriorityTaskCount: highPriorityTasks.length,
        mostUsedCategory: mostUsedCategory,
        taskCompletionRate: taskCompletionRate,
      },
    });
  }, [tasks, categories, notifications, permissionStatus]);

  return null;
}
