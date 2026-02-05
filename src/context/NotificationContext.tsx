import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Notification as AppNotification } from '../types';
import { storage } from '../utils/storage';
import { shouldTriggerReminder, isOverdue } from '../utils/dateUtils';
import { useTasks } from './TaskContext';

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (taskId: string, taskTitle: string, message: string, type: 'reminder' | 'overdue') => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  requestPermission: () => Promise<boolean>;
  permissionStatus: NotificationPermission | 'default';
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'default'>('default');
  const { tasks, markReminderTriggered } = useTasks();

  // Load notifications from localStorage
  useEffect(() => {
    const stored = storage.getNotifications();
    setNotifications(stored);

    // Check notification permission
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    storage.setNotifications(notifications);
  }, [notifications]);

  const addNotification = useCallback((
    taskId: string,
    taskTitle: string,
    message: string,
    type: 'reminder' | 'overdue'
  ) => {
    const newNotification: AppNotification = {
      id: uuidv4(),
      taskId,
      taskTitle,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(taskTitle, {
        body: message,
        icon: '/vite.svg',
        tag: taskId,
      });

      // Track browser_notification_shown event
      if (typeof window !== 'undefined' && (window as any).pendo) {
        (window as any).pendo.track('browser_notification_shown', {
          task_id: taskId,
          task_title: taskTitle.substring(0, 100),
          notification_type: type,
          message: message.substring(0, 100),
        });
      }
    }
  }, []);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    setPermissionStatus(permission);

    // Track notification_permission_requested event
    if (typeof window !== 'undefined' && (window as any).pendo) {
      (window as any).pendo.track('notification_permission_requested', {
        permission_result: permission,
        request_trigger: 'user_action'
      });
    }

    return permission === 'granted';
  };

  // Check for reminders every minute
  useEffect(() => {
    const checkReminders = () => {
      tasks.forEach(task => {
        if (task.status === 'pending') {
          // Check for reminder
          if (shouldTriggerReminder(task.dueDate, task.dueTime, task.reminder, task.reminderTriggered)) {
            addNotification(
              task.id,
              task.title,
              `Reminder: Task "${task.title}" is due soon!`,
              'reminder'
            );
            markReminderTriggered(task.id);

            // Track task_reminder_triggered event
            if (typeof window !== 'undefined' && (window as any).pendo) {
              const category = tasks.find(t => t.id === task.id);
              (window as any).pendo.track('task_reminder_triggered', {
                task_id: task.id,
                task_title: task.title.substring(0, 100),
                reminder_type: task.reminder,
                due_date: task.dueDate || '',
                due_time: task.dueTime || '',
                priority: task.priority,
                category_id: task.categoryId,
              });
            }
          }

          // Check for overdue (only notify once per task per session)
          if (isOverdue(task.dueDate, task.dueTime, task.status) && !task.reminderTriggered) {
            const existingOverdueNotification = notifications.find(
              n => n.taskId === task.id && n.type === 'overdue'
            );
            if (!existingOverdueNotification) {
              addNotification(
                task.id,
                task.title,
                `Task "${task.title}" is overdue!`,
                'overdue'
              );

              // Track task_overdue_notification event
              if (typeof window !== 'undefined' && (window as any).pendo && task.dueDate) {
                const dueDate = new Date(task.dueDate);
                const daysOverdue = Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

                (window as any).pendo.track('task_overdue_notification', {
                  task_id: task.id,
                  task_title: task.title.substring(0, 100),
                  due_date: task.dueDate,
                  due_time: task.dueTime || '',
                  days_overdue: daysOverdue,
                  priority: task.priority,
                  category_id: task.categoryId,
                });
              }
            }
          }
        }
      });
    };

    // Check immediately
    checkReminders();

    // Check every minute
    const interval = setInterval(checkReminders, 60000);

    return () => clearInterval(interval);
  }, [tasks, addNotification, markReminderTriggered, notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        requestPermission,
        permissionStatus,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextValue => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
