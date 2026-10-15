/**
 * VAMO — useNetwork Hook & NetworkProvider
 *
 * Provides reactive network status, active reachability checks,
 * retry throttling, and simulated offline mode for developer testing.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {
  subscribeToNetworkState,
  testActualInternetReachability,
  VamoNetworkState,
} from '@/lib/network';

export interface NetworkContextValue extends VamoNetworkState {
  checkConnectivity: (forceActiveProbe?: boolean) => Promise<boolean>;
  simulateOffline: (simulate: boolean) => void;
  isSimulatedOffline: boolean;
}

const defaultState: VamoNetworkState = {
  isConnected: true,
  isInternetReachable: true,
  isOffline: false,
  connectionType: 'wifi',
  isChecking: false,
  lastCheckedAt: Date.now(),
};

export const NetworkContext = createContext<NetworkContextValue>({
  ...defaultState,
  checkConnectivity: async () => true,
  simulateOffline: () => {},
  isSimulatedOffline: false,
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [networkState, setNetworkState] = useState<VamoNetworkState>(defaultState);
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const isCheckingRef = useRef(false);

  // Initial fetch and continuous subscription
  useEffect(() => {
    let isMounted = true;

    // Check immediately on mount
    NetInfo.fetch().then((state) => {
      if (!isMounted) return;
      const isOffline = !state.isConnected || state.isInternetReachable === false;
      setNetworkState({
        isConnected: Boolean(state.isConnected),
        isInternetReachable: Boolean(state.isInternetReachable ?? state.isConnected),
        isOffline,
        connectionType: state.type,
        isChecking: false,
        lastCheckedAt: Date.now(),
      });
    });

    const unsubscribe = subscribeToNetworkState((newState) => {
      if (!isMounted) return;
      setNetworkState(newState);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const checkConnectivity = useCallback(
    async (forceActiveProbe = true): Promise<boolean> => {
      // If currently simulating offline mode in dev, respect the simulation
      if (isSimulatedOffline) {
        return false;
      }

      if (isCheckingRef.current) {
        return !networkState.isOffline;
      }

      isCheckingRef.current = true;
      setNetworkState((prev) => ({ ...prev, isChecking: true }));

      try {
        const netState = await NetInfo.fetch();
        const baseConnected = Boolean(netState.isConnected);

        if (!baseConnected) {
          setNetworkState({
            isConnected: false,
            isInternetReachable: false,
            isOffline: true,
            connectionType: netState.type,
            isChecking: false,
            lastCheckedAt: Date.now(),
          });
          return false;
        }

        let isActuallyReachable = Boolean(netState.isInternetReachable ?? true);

        if (forceActiveProbe) {
          isActuallyReachable = await testActualInternetReachability(3500);
        }

        const isOffline = !baseConnected || !isActuallyReachable;

        setNetworkState({
          isConnected: baseConnected,
          isInternetReachable: isActuallyReachable,
          isOffline,
          connectionType: netState.type,
          isChecking: false,
          lastCheckedAt: Date.now(),
        });

        return !isOffline;
      } catch {
        setNetworkState((prev) => ({
          ...prev,
          isChecking: false,
          lastCheckedAt: Date.now(),
        }));
        return false;
      } finally {
        isCheckingRef.current = false;
      }
    },
    [isSimulatedOffline, networkState.isOffline]
  );

  const simulateOffline = useCallback((simulate: boolean) => {
    setIsSimulatedOffline(simulate);
  }, []);

  const effectiveOffline = isSimulatedOffline || networkState.isOffline;

  const value: NetworkContextValue = {
    ...networkState,
    isOffline: effectiveOffline,
    isConnected: isSimulatedOffline ? false : networkState.isConnected,
    isInternetReachable: isSimulatedOffline ? false : networkState.isInternetReachable,
    checkConnectivity,
    simulateOffline,
    isSimulatedOffline,
  };

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
};

export const useNetwork = (): NetworkContextValue => useContext(NetworkContext);
