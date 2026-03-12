import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TaskProvider } from './context/TaskContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './components/common/Toast';
import { KeyboardShortcutsProvider } from './context/KeyboardShortcutsContext';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/TasksPage';
import { TaskDetailPage } from './pages/TaskDetailPage';
import { TaskFormPage } from './pages/TaskFormPage';
import { CategoriesPage } from './pages/CategoriesPage';


function App() {
  return (
    <BrowserRouter>
      <KeyboardShortcutsProvider>
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
      </KeyboardShortcutsProvider>
    </BrowserRouter>
  );
}

export default App;
