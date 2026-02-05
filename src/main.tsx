import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { seedData } from './utils/seedData'

// Expose seed function for development
declare global {
  interface Window {
    seedData: () => void;
    pendo: any;
  }
}
window.seedData = seedData;

// Initialize Pendo with anonymous visitor and usage metadata
if (typeof window.pendo !== 'undefined') {
  const tasks = JSON.parse(localStorage.getItem('todo_app_tasks') || '[]');
  const categories = JSON.parse(localStorage.getItem('todo_app_categories') || '[]');

  window.pendo.initialize({
    visitor: {
      id: 'ANONYMOUS_VISITOR_ID',
      // Useful unstructured attributes for segmentation and analytics
      total_tasks: tasks.length,
      completed_tasks: tasks.filter((t: any) => t.status === 'completed').length,
      pending_tasks: tasks.filter((t: any) => t.status === 'pending').length,
      custom_categories_count: categories.filter((c: any) => !c.isDefault).length,
      has_tasks: tasks.length > 0,
      has_overdue_tasks: tasks.some((t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed')
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
