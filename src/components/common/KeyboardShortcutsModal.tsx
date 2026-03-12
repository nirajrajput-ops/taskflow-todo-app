import React from 'react';
import { Modal } from './Modal';
import { getModifierKey, getAltKey } from '../../hooks/useKeyboardShortcuts';
import { ShortcutGroup } from '../../types';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardKey: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded shadow-sm">
    {children}
  </kbd>
);

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const modifierKey = getModifierKey();
  const altKey = getAltKey();

  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'Navigation',
      shortcuts: [
        {
          keys: ['N'],
          description: 'Create new task',
        },
        {
          keys: [modifierKey, 'N'],
          description: 'Create new task',
        },
      ],
    },
    {
      title: 'Search',
      shortcuts: [
        {
          keys: ['/'],
          description: 'Focus search input (Tasks page)',
        },
        {
          keys: [modifierKey, 'K'],
          description: 'Focus search input (Tasks page)',
        },
      ],
    },
    {
      title: 'Priority Filters (Tasks page)',
      shortcuts: [
        {
          keys: ['1'],
          description: 'Show all priorities',
        },
        {
          keys: ['2'],
          description: 'Filter by High priority',
        },
        {
          keys: ['3'],
          description: 'Filter by Medium priority',
        },
        {
          keys: ['4'],
          description: 'Filter by Low priority',
        },
      ],
    },
    {
      title: 'Status Filters (Tasks page)',
      shortcuts: [
        {
          keys: [altKey, '1'],
          description: 'Show all statuses',
        },
        {
          keys: [altKey, '2'],
          description: 'Filter by Pending',
        },
        {
          keys: [altKey, '3'],
          description: 'Filter by Completed',
        },
        {
          keys: [altKey, '4'],
          description: 'Filter by Overdue',
        },
      ],
    },
    {
      title: 'General',
      shortcuts: [
        {
          keys: ['?'],
          description: 'Show keyboard shortcuts',
        },
        {
          keys: ['Esc'],
          description: 'Close modals / Clear filters',
        },
      ],
    },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" size="lg">
      <div className="space-y-6">
        {shortcutGroups.map((group) => (
          <div key={group.title}>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">{group.title}</h4>
            <div className="space-y-2">
              {group.shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                >
                  <span className="text-sm text-gray-700">{shortcut.description}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, keyIndex) => (
                      <React.Fragment key={keyIndex}>
                        {keyIndex > 0 && <span className="text-gray-500 mx-1">+</span>}
                        <KeyboardKey>{key}</KeyboardKey>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
