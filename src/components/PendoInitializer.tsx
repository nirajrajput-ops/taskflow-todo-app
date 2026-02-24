import { useEffect, useRef } from 'react';
import { useTasks } from '../context/TaskContext';
import { useNotifications } from '../context/NotificationContext';
import { isOverdue } from '../utils/dateUtils';

const VISITOR_ID_KEY = 'pendo_visitor_id';

function getOrCreateVisitorId(): string {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = 'anon_' + crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

export const PendoInitializer: React.FC = () => {
  const { tasks, categories } = useTasks();
  const { unreadCount, permissionStatus } = useNotifications();
  const initialized = useRef(false);

  // Initialize Pendo once on first render
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const visitorId = getOrCreateVisitorId();
    pendo.initialize({
      visitor: {
        id: visitorId,
      },
    });
  }, []);

  // Update Pendo visitor metadata whenever task/category/notification data changes
  useEffect(() => {
    if (!initialized.current) return;

    const visitorId = getOrCreateVisitorId();

    const totalTaskCount = tasks.length;
    const completedTaskCount = tasks.filter(t => t.status === 'completed').length;
    const pendingTaskCount = tasks.filter(t => t.status === 'pending').length;
    const overdueTaskCount = tasks.filter(
      t => t.status === 'pending' && isOverdue(t.dueDate, t.dueTime, t.status)
    ).length;

    const categoryCount = categories.length;
    const customCategoryCount = categories.filter(c => !c.isDefault).length;

    const hasHighPriorityTasks = tasks.some(t => t.priority === 'high');
    const usesReminders = tasks.some(t => t.reminder !== 'none');
    const usesSubtasks = tasks.some(t => t.subtasks.length > 0);

    const taskCompletionRate = totalTaskCount > 0
      ? Math.round((completedTaskCount / totalTaskCount) * 100)
      : 0;

    const usedPriorityLevels = [...new Set(tasks.map(t => t.priority))];

    // Calculate most used category
    let mostUsedCategory = '';
    if (tasks.length > 0) {
      const categoryCounts: Record<string, number> = {};
      tasks.forEach(t => {
        categoryCounts[t.categoryId] = (categoryCounts[t.categoryId] || 0) + 1;
      });
      const topCategoryId = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0];
      if (topCategoryId) {
        const cat = categories.find(c => c.id === topCategoryId);
        mostUsedCategory = cat ? cat.name : topCategoryId;
      }
    }

    pendo.identify({
      visitor: {
        id: visitorId,
        totalTaskCount,
        completedTaskCount,
        pendingTaskCount,
        overdueTaskCount,
        categoryCount,
        customCategoryCount,
        hasHighPriorityTasks,
        notificationPermission: permissionStatus,
        unreadNotificationCount: unreadCount,
        usesReminders,
        usesSubtasks,
        mostUsedCategory,
        taskCompletionRate,
        usedPriorityLevels,
      },
    });
  }, [tasks, categories, unreadCount, permissionStatus]);

  return null;
};
