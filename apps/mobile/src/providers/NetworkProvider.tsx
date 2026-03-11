import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as Network from 'expo-network';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  isOffline: boolean;
  refresh: () => Promise<void>;
}

const NetworkContext = createContext<NetworkState | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setIsConnected(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? null);
    } catch {
      // If we can't read network state, assume connected
    }
  }, []);

  useEffect(() => {
    // Read initial state
    refresh();

    // Subscribe to changes
    const subscription = Network.addNetworkStateListener((state) => {
      setIsConnected(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? null);
    });

    return () => {
      subscription.remove();
    };
  }, [refresh]);

  // Only show offline when clearly offline, not when unknown
  const isOffline = !isConnected || isInternetReachable === false;

  return (
    <NetworkContext.Provider value={{ isConnected, isInternetReachable, isOffline, refresh }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
