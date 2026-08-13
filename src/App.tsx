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

const VISITOR_ID_KEY = 'pendo_visitor_id';

function getOrCreateVisitorId(): string {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = 'anon_' + crypto.randomUUID();
    localStorage.setItem(VISITOR_ID_KEY, visitorId);
  }
  return visitorId;
}

function getPendoVisitorMetadata() {
  const tasks = storage.getTasks();
  const categories = storage.getCategories();
  const notifications = storage.getNotifications();

  const completedTasks = tasks.filter(t => t.status === 'completed');
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const highPriorityTasks = tasks.filter(t => t.priority === 'high');
  const totalTaskCount = tasks.length;
  const completedTaskCount = completedTasks.length;
  const pendingTaskCount = pendingTasks.length;
  const taskCompletionRate = totalTaskCount > 0 ? (completedTaskCount / totalTaskCount) * 100 : 0;
  const categoryCount = categories.length;
  const customCategoryCount = categories.filter(c => !c.isDefault).length;
  const highPriorityTaskCount = highPriorityTasks.length;
  const hasOverdueTasks = pendingTasks.some(t => isOverdue(t.dueDate, t.dueTime, t.status));
  const usesReminders = tasks.some(t => t.reminder !== 'none');
  const usesSubtasks = tasks.some(t => t.subtasks.length > 0);

  const usedCategoryIds = new Set(tasks.map(t => t.categoryId));
  const categoriesUsed = categories
    .filter(c => usedCategoryIds.has(c.id))
    .map(c => c.name);

  const taskDates = tasks.map(t => t.createdAt).sort();
  const firstTaskCreatedAt = taskDates.length > 0 ? taskDates[0] : null;
  const latestTaskCreatedAt = taskDates.length > 0 ? taskDates[taskDates.length - 1] : null;

  const notificationCount = notifications.length;
  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  return {
    totalTaskCount,
    completedTaskCount,
    pendingTaskCount,
    taskCompletionRate,
    categoryCount,
    customCategoryCount,
    highPriorityTaskCount,
    hasOverdueTasks,
    usesReminders,
    usesSubtasks,
    categoriesUsed,
    firstTaskCreatedAt,
    latestTaskCreatedAt,
    notificationCount,
    unreadNotificationCount,
  };
}

function PendoInitializer() {
  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    const metadata = getPendoVisitorMetadata();

    pendo.initialize({
      visitor: {
        id: visitorId,
        totalTaskCount: metadata.totalTaskCount,
        completedTaskCount: metadata.completedTaskCount,
        pendingTaskCount: metadata.pendingTaskCount,
        taskCompletionRate: metadata.taskCompletionRate,
        categoryCount: metadata.categoryCount,
        customCategoryCount: metadata.customCategoryCount,
        highPriorityTaskCount: metadata.highPriorityTaskCount,
        hasOverdueTasks: metadata.hasOverdueTasks,
        usesReminders: metadata.usesReminders,
        usesSubtasks: metadata.usesSubtasks,
        categoriesUsed: metadata.categoriesUsed,
        firstTaskCreatedAt: metadata.firstTaskCreatedAt,
        latestTaskCreatedAt: metadata.latestTaskCreatedAt,
        notificationCount: metadata.notificationCount,
        unreadNotificationCount: metadata.unreadNotificationCount,
      },
    });
  }, []);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <TaskProvider>
        <NotificationProvider>
          <ToastProvider>
            <PendoInitializer />
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
