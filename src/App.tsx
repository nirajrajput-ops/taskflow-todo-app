import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TaskProvider } from './context/TaskContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './components/common/Toast';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/TasksPage';
import { TaskDetailPage } from './pages/TaskDetailPage';
import { TaskFormPage } from './pages/TaskFormPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { storage } from './utils/storage';
import { isOverdue } from './utils/dateUtils';
import { Task, Category } from './types';

const PENDO_VISITOR_ID_KEY = 'pendo_visitor_id';

function getOrCreateVisitorId(): string {
  let visitorId = localStorage.getItem(PENDO_VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = 'visitor-' + crypto.randomUUID();
    localStorage.setItem(PENDO_VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

function computePendoVisitorMetadata() {
  const tasks: Task[] = storage.getTasks();
  const categories: Category[] = storage.getCategories();
  const notifications = storage.getNotifications();

  const totalTaskCount = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const completedTaskCount = completedTasks.length;
  const pendingTaskCount = pendingTasks.length;
  const overdueTaskCount = tasks.filter(t => isOverdue(t.dueDate, t.dueTime, t.status)).length;
  const categoryCount = categories.length;
  const hasCustomCategories = categories.some(c => !c.isDefault);
  const usesSubtasks = tasks.some(t => t.subtasks && t.subtasks.length > 0);
  const usesReminders = tasks.some(t => t.reminder !== 'none');
  const notificationPermissionStatus = ('Notification' in window) ? Notification.permission : 'default';
  const unreadNotificationCount = notifications.filter(n => !n.read).length;
  const taskCompletionRate = totalTaskCount > 0 ? Math.round((completedTaskCount / totalTaskCount) * 100) : 0;
  const highPriorityTaskCount = tasks.filter(t => t.priority === 'high').length;
  const usesDueDates = tasks.some(t => t.dueDate !== null);

  // Compute most used category
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

  return {
    totalTaskCount,
    completedTaskCount,
    pendingTaskCount,
    overdueTaskCount,
    categoryCount,
    hasCustomCategories,
    usesSubtasks,
    usesReminders,
    notificationPermissionStatus,
    unreadNotificationCount,
    taskCompletionRate,
    highPriorityTaskCount,
    mostUsedCategory,
    usesDueDates,
  };
}

function initializePendo() {
  const visitorId = getOrCreateVisitorId();
  const metadata = computePendoVisitorMetadata();

  pendo.initialize({
    visitor: {
      id: visitorId,
      ...metadata,
    },
  });
}

function App() {
  useEffect(() => {
    initializePendo();
  }, []);

  return (
    <BrowserRouter>
      <TaskProvider>
        <NotificationProvider>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="tasks" element={<TasksPage />} />
                <Route path="tasks/new" element={<TaskFormPage />} />
                <Route path="tasks/:id" element={<TaskDetailPage />} />
                <Route path="tasks/:id/edit" element={<TaskFormPage />} />
                <Route path="categories" element={<CategoriesPage />} />
              </Route>
            </Routes>
          </ToastProvider>
        </NotificationProvider>
      </TaskProvider>
    </BrowserRouter>
  );
}

export default App;
