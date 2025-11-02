/**
 * Backend Status Context
 * ======================
 * Tracks online/offline status and mock mode state
 * Provides connection state to entire app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import BackendStatusTracker, { ConnectionStatus } from '../services/BackendStatusTracker';
import { createLogger } from '../services/Logger';

const logger = createLogger('BackendStatusContext');

export interface BackendStatusContextType {
  status: ConnectionStatus;
  isOnline: boolean;
  isMockMode: boolean;
  lastSyncTime: Date | null;
  updateStatus: (status: ConnectionStatus) => void;
  updateLastSync: () => void;
}

const BackendStatusContext = createContext<BackendStatusContextType | undefined>(undefined);

interface BackendStatusProviderProps {
  children: ReactNode;
}

export const BackendStatusProvider: React.FC<BackendStatusProviderProps> = ({ children }) => {
  const tracker = BackendStatusTracker.getInstance();
  const [status, setStatus] = useState<ConnectionStatus>(tracker.getStatus());
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(tracker.getLastSyncTime());

  const isOnline = status === 'online';
  const isMockMode = status === 'mock' || status === 'offline';

  useEffect(() => {
    // Subscribe to status changes from tracker
    const unsubscribe = tracker.subscribe((newStatus, newLastSync) => {
      setStatus(newStatus);
      setLastSyncTime(newLastSync);
    });

    return unsubscribe;
  }, []);

  const updateStatus = (newStatus: ConnectionStatus) => {
    tracker.setStatus(newStatus);
  };

  const updateLastSync = () => {
    tracker.updateLastSync();
  };

  const value: BackendStatusContextType = {
    status,
    isOnline,
    isMockMode,
    lastSyncTime,
    updateStatus,
    updateLastSync,
  };

  return (
    <BackendStatusContext.Provider value={value}>
      {children}
    </BackendStatusContext.Provider>
  );
};

export const useBackendStatus = (): BackendStatusContextType => {
  const context = useContext(BackendStatusContext);
  if (context === undefined) {
    throw new Error('useBackendStatus must be used within a BackendStatusProvider');
  }
  return context;
};
