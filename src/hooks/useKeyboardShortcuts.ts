import { useEffect } from 'react';
import { ShortcutConfig } from '../types';

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

const isInputElement = (element: EventTarget | null): boolean => {
  if (!element || !(element instanceof HTMLElement)) {
    return false;
  }

  const tagName = element.tagName.toLowerCase();
  const isContentEditable = element.contentEditable === 'true';

  return tagName === 'input' || tagName === 'textarea' || isContentEditable;
};

export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in input fields
      if (isInputElement(event.target)) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlKey = isMac ? event.metaKey : event.ctrlKey;
        const matchesKey = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchesCtrl = shortcut.ctrl ? ctrlKey : !ctrlKey;
        const matchesAlt = shortcut.alt ? event.altKey : !event.altKey;
        const matchesShift = shortcut.shift ? event.shiftKey : !event.shiftKey;

        if (matchesKey && matchesCtrl && matchesAlt && matchesShift) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]);
};

export const getModifierKey = (): string => {
  return isMac ? '⌘' : 'Ctrl';
};

export const getAltKey = (): string => {
  return isMac ? '⌥' : 'Alt';
};
