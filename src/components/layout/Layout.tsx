import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useNotifications } from '../../context/NotificationContext';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useKeyboardShortcutsContext } from '../../context/KeyboardShortcutsContext';
import { KeyboardShortcutsModal } from '../common/KeyboardShortcutsModal';
import { useToast } from '../common/Toast';
import { ShortcutConfig } from '../../types';

export const Layout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { requestPermission, permissionStatus } = useNotifications();
  const { searchInputRef } = useKeyboardShortcutsContext();
  const { showToast } = useToast();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Request notification permission on mount
  useEffect(() => {
    if (permissionStatus === 'default') {
      requestPermission();
    }
  }, [permissionStatus, requestPermission]);

  // Global keyboard shortcuts
  const shortcuts: ShortcutConfig[] = [
    {
      key: 'n',
      description: 'Create new task',
      action: () => {
        navigate('/tasks/new');
        showToast('Navigating to new task', 'success');
      },
    },
    {
      key: 'n',
      ctrl: true,
      description: 'Create new task',
      action: () => {
        navigate('/tasks/new');
        showToast('Navigating to new task', 'success');
      },
    },
    {
      key: '/',
      description: 'Focus search input',
      action: () => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          showToast('Search focused', 'success');
        }
      },
    },
    {
      key: 'k',
      ctrl: true,
      description: 'Focus search input',
      action: () => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          showToast('Search focused', 'success');
        }
      },
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => {
        setIsShortcutsModalOpen(true);
      },
    },
  ];

  useKeyboardShortcuts(shortcuts);

  const handleMenuToggle = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuToggle={handleMenuToggle} isSidebarOpen={isSidebarOpen} />

      <div className="flex">
        <Sidebar isOpen={isSidebarOpen} onClose={handleSidebarClose} />

        <main className="flex-1 p-4 lg:p-6 min-h-[calc(100vh-4rem)]">
          <div className="max-w-5xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />
    </div>
  );
};
