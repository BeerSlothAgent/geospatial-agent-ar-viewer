import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp: number;
}

export interface LocationError {
  code: string;
  message: string;
  details?: any;
}

export interface LocationState {
  location: LocationData | null;
  error: LocationError | null;
  isLoading: boolean;
  hasPermission: boolean;
  isWatching: boolean;
}

export interface UseLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  distanceInterval?: number;
  timeInterval?: number;
  watchPosition?: boolean;
}

const DEFAULT_OPTIONS: UseLocationOptions = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 10000,
  distanceInterval: 1, // 1 meter
  timeInterval: 5000, // 5 seconds
  watchPosition: false,
};

export function useLocation(options: UseLocationOptions = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  const [state, setState] = useState<LocationState>({
    location: null,
    error: null,
    isLoading: false,
    hasPermission: false,
    isWatching: false,
  });

  const watchSubscription = useRef<Location.LocationSubscription | null>(null);
  const isMounted = useRef(true);

  // Request location permissions
  const requestPermissions = async (): Promise<boolean> => {
    try {
      if (isMounted.current) {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        const error: LocationError = {
          code: 'PERMISSION_DENIED',
          message: 'Location permission denied. Please enable location access in your device settings.',
        };
        if (isMounted.current) {
          setState(prev => ({ 
            ...prev, 
            error, 
            isLoading: false, 
            hasPermission: false 
          }));
        }
        return false;
      }

      if (isMounted.current) {
        setState(prev => ({ 
          ...prev, 
          hasPermission: true, 
          isLoading: false, 
          error: null 
        }));
      }
      return true;
    } catch (error) {
      const locationError: LocationError = {
        code: 'PERMISSION_ERROR',
        message: 'Failed to request location permissions',
        details: error,
      };
      if (isMounted.current) {
        setState(prev => ({ 
          ...prev, 
          error: locationError, 
          isLoading: false, 
          hasPermission: false 
        }));
      }
      return false;
    }
  };

  // Get current position once
  const getCurrentPosition = async (): Promise<LocationData | null> => {
    try {
      if (isMounted.current) {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
      }

      const hasPermission = await requestPermissions();
      if (!hasPermission) return null;

      const locationResult = await Location.getCurrentPositionAsync({
        accuracy: opts.enableHighAccuracy 
          ? Location.Accuracy.BestForNavigation 
          : Location.Accuracy.Balanced,
        maximumAge: opts.maximumAge,
        timeout: opts.timeout,
      });

      const locationData: LocationData = {
        latitude: locationResult.coords.latitude,
        longitude: locationResult.coords.longitude,
        altitude: locationResult.coords.altitude || undefined,
        accuracy: locationResult.coords.accuracy || undefined,
        timestamp: locationResult.timestamp,
      };

      if (isMounted.current) {
        setState(prev => ({ 
          ...prev, 
          location: locationData, 
          isLoading: false, 
          error: null 
        }));
      }

      return locationData;
    } catch (error: any) {
      const locationError: LocationError = {
        code: error.code || 'LOCATION_ERROR',
        message: getLocationErrorMessage(error),
        details: error,
      };

      if (isMounted.current) {
        setState(prev => ({ 
          ...prev, 
          error: locationError, 
          isLoading: false 
        }));
      }
      return null;
    }
  };

  // Start watching position
  const startWatching = async (): Promise<boolean> => {
    try {
      if (watchSubscription.current) {
        stopWatching();
      }

      const hasPermission = await requestPermissions();
      if (!hasPermission) return false;

      if (isMounted.current) {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
      }

      watchSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: opts.enableHighAccuracy 
            ? Location.Accuracy.BestForNavigation 
            : Location.Accuracy.Balanced,
          timeInterval: opts.timeInterval,
          distanceInterval: opts.distanceInterval,
        },
        (locationResult) => {
          const locationData: LocationData = {
            latitude: locationResult.coords.latitude,
            longitude: locationResult.coords.longitude,
            altitude: locationResult.coords.altitude || undefined,
            accuracy: locationResult.coords.accuracy || undefined,
            timestamp: locationResult.timestamp,
          };

          if (isMounted.current) {
            setState(prev => ({ 
              ...prev, 
              location: locationData, 
              isLoading: false, 
              error: null,
              isWatching: true,
            }));
          }
        }
      );

      return true;
    } catch (error: any) {
      const locationError: LocationError = {
        code: error.code || 'WATCH_ERROR',
        message: getLocationErrorMessage(error),
        details: error,
      };

      if (isMounted.current) {
        setState(prev => ({ 
          ...prev, 
          error: locationError, 
          isLoading: false,
          isWatching: false,
        }));
      }
      return false;
    }
  };

  // Stop watching position
  const stopWatching = () => {
    if (watchSubscription.current) {
      watchSubscription.current.remove();
      watchSubscription.current = null;
      if (isMounted.current) {
        setState(prev => ({ ...prev, isWatching: false }));
      }
    }
  };

  // Get location error message
  const getLocationErrorMessage = (error: any): string => {
    if (Platform.OS === 'web') {
      switch (error.code) {
        case 1: // PERMISSION_DENIED
          return 'Location access denied. Please enable location permissions in your browser.';
        case 2: // POSITION_UNAVAILABLE
          return 'Location information unavailable. Please check your internet connection.';
        case 3: // TIMEOUT
          return 'Location request timed out. Please try again.';
        default:
          return 'Unable to retrieve location. Please try again.';
      }
    }

    // Mobile error handling
    switch (error.code) {
      case 'E_LOCATION_SERVICES_DISABLED':
        return 'Location services are disabled. Please enable them in your device settings.';
      case 'E_LOCATION_UNAVAILABLE':
        return 'Location is currently unavailable. Please try again later.';
      case 'E_LOCATION_TIMEOUT':
        return 'Location request timed out. Please try again.';
      default:
        return error.message || 'Unable to retrieve location. Please try again.';
    }
  };

  // Initialize location on mount if watchPosition is enabled
  useEffect(() => {
    isMounted.current = true;

    if (opts.watchPosition) {
      startWatching();
    }

    return () => {
      isMounted.current = false;
      stopWatching();
    };
  }, [opts.watchPosition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      stopWatching();
    };
  }, []);

  return {
    ...state,
    getCurrentPosition,
    startWatching,
    stopWatching,
    requestPermissions,
  };
}