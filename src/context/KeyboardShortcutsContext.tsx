import React, { createContext, useContext, useRef, ReactNode } from 'react';

interface KeyboardShortcutsContextType {
  searchInputRef: React.MutableRefObject<HTMLInputElement | null>;
  registerSearchInput: (element: HTMLInputElement | null) => void;
  unregisterSearchInput: () => void;
}

const KeyboardShortcutsContext = createContext<KeyboardShortcutsContextType | undefined>(undefined);

export const KeyboardShortcutsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const registerSearchInput = (element: HTMLInputElement | null) => {
    searchInputRef.current = element;
  };

  const unregisterSearchInput = () => {
    searchInputRef.current = null;
  };

  return (
    <KeyboardShortcutsContext.Provider
      value={{
        searchInputRef,
        registerSearchInput,
        unregisterSearchInput,
      }}
    >
      {children}
    </KeyboardShortcutsContext.Provider>
  );
};

export const useKeyboardShortcutsContext = () => {
  const context = useContext(KeyboardShortcutsContext);
  if (context === undefined) {
    throw new Error('useKeyboardShortcutsContext must be used within a KeyboardShortcutsProvider');
  }
  return context;
};
