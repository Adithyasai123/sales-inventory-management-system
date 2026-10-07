import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface CustomLoaderState {
  isOpen: boolean;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

interface EventLoadingContextType {
  customLoader: CustomLoaderState;
  isGlobalMutating: boolean;
  isGlobalFetching: boolean;
  showMainLoader: (title?: string, description?: string, icon?: React.ReactNode) => void;
  hideMainLoader: () => void;
  withEventLoading: <T>(fn: () => Promise<T>, title?: string, description?: string) => Promise<T>;
}

const EventLoadingContext = createContext<EventLoadingContextType | undefined>(undefined);

export const EventLoadingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customLoader, setCustomLoader] = useState<CustomLoaderState>({ isOpen: false });
  const [isGlobalMutating, setIsGlobalMutating] = useState<boolean>(false);
  const [isGlobalFetching, setIsGlobalFetching] = useState<boolean>(false);

  useEffect(() => {
    const handleApiActive = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setIsGlobalMutating(detail.activeMutationCount > 0);
        setIsGlobalFetching(detail.activeRequestCount > 0);
      }
    };

    window.addEventListener('sims:api-active', handleApiActive);
    return () => window.removeEventListener('sims:api-active', handleApiActive);
  }, []);

  const showMainLoader = useCallback((title?: string, description?: string, icon?: React.ReactNode) => {
    setCustomLoader({ isOpen: true, title, description, icon });
  }, []);

  const hideMainLoader = useCallback(() => {
    setCustomLoader({ isOpen: false });
  }, []);

  const withEventLoading = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      title?: string,
      description?: string
    ): Promise<T> => {
      showMainLoader(title, description);
      try {
        return await fn();
      } finally {
        hideMainLoader();
      }
    },
    [showMainLoader, hideMainLoader]
  );

  return (
    <EventLoadingContext.Provider
      value={{
        customLoader,
        isGlobalMutating,
        isGlobalFetching,
        showMainLoader,
        hideMainLoader,
        withEventLoading,
      }}
    >
      {children}
    </EventLoadingContext.Provider>
  );
};

export const useEventLoader = () => {
  const context = useContext(EventLoadingContext);
  if (!context) {
    throw new Error('useEventLoader must be used within an EventLoadingProvider');
  }
  return context;
};
