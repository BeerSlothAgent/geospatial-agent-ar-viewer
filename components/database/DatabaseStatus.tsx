import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Database, Wifi, WifiOff, RefreshCw, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Settings } from 'lucide-react-native';
import { DatabaseState } from '@/hooks/useDatabase';
import { isSupabaseConfigured } from '@/lib/supabase';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface DatabaseStatusProps {
  state: DatabaseState;
  onRefresh?: () => void;
  onClearError?: () => void;
  compact?: boolean;
}

export default function DatabaseStatus({
  state,
  onRefresh,
  onClearError,
  compact = false,
}: DatabaseStatusProps) {
  const { isConnected, isLoading, error, lastSync } = state;

  const getStatusIcon = () => {
    if (isLoading) {
      return <LoadingSpinner size={20} color="#00d4ff" />;
    }
    
    if (error) {
      return <AlertCircle size={20} color="#ff6b35" strokeWidth={2} />;
    }
    
    if (isConnected) {
      return <CheckCircle size={20} color="#00ff88" strokeWidth={2} />;
    }
    
    return <WifiOff size={20} color="#666" strokeWidth={2} />;
  };

  const getStatusText = () => {
    if (!isSupabaseConfigured) return 'Not Configured';
    if (isLoading) return 'Connecting...';
    if (error) return 'Connection Error';
    if (isConnected) return 'Connected (Direct Query)';
    return 'Disconnected';
  };

  const getStatusColor = () => {
    if (!isSupabaseConfigured) return '#ff9500';
    if (error) return '#ff6b35';
    if (isConnected) return '#00ff88';
    return '#666';
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <Database size={16} color="#00d4ff" strokeWidth={2} />
          <Text style={styles.compactTitle}>Database</Text>
          {getStatusIcon()}
        </View>
        
        <Text style={[styles.compactStatus, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
        
        {lastSync && (
          <Text style={styles.compactSync}>
            Last sync: {new Date(lastSync).toLocaleTimeString()}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Database size={24} color="#00d4ff" strokeWidth={2} />
          </View>
          <View>
            <Text style={styles.title}>Database Connection</Text>
            <Text style={[styles.subtitle, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          {getStatusIcon()}
        </View>
      </View>

      {/* Configuration Status */}
      {!isSupabaseConfigured && (
        <View style={styles.configSection}>
          <View style={styles.configHeader}>
            <Settings size={16} color="#ff9500" strokeWidth={2} />
            <Text style={styles.configTitle}>Configuration Required</Text>
          </View>
          <Text style={styles.configMessage}>
            Supabase environment variables are not configured. Please set your Supabase URL and API key in the .env file.
          </Text>
          <View style={styles.configSteps}>
            <Text style={styles.configStep}>1. Open your .env file</Text>
            <Text style={styles.configStep}>2. Set EXPO_PUBLIC_SUPABASE_URL</Text>
            <Text style={styles.configStep}>3. Set EXPO_PUBLIC_SUPABASE_ANON_KEY</Text>
            <Text style={styles.configStep}>4. Restart the development server</Text>
          </View>
        </View>
      )}

      {/* Connection Details */}
      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Status</Text>
          <View style={styles.statusContainer}>
            {isConnected ? (
              <Wifi size={16} color="#00ff88" strokeWidth={2} />
            ) : (
              <WifiOff size={16} color="#ff6b35" strokeWidth={2} />
            )}
            <Text style={[styles.detailValue, { color: getStatusColor() }]}>
              {isConnected ? 'Online (Direct Query)' : 'Offline'}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Query Method</Text>
          <Text style={styles.detailValue}>
            Direct Table Query (RPC Disabled)
          </Text>
        </View>

        {lastSync && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Sync</Text>
            <Text style={styles.detailValue}>
              {new Date(lastSync).toLocaleString()}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Service</Text>
          <Text style={styles.detailValue}>
            {isSupabaseConfigured ? 'Supabase' : 'Not Configured'}
          </Text>
        </View>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorSection}>
          <View style={styles.errorHeader}>
            <AlertCircle size={16} color="#ff6b35" strokeWidth={2} />
            <Text style={styles.errorTitle}>Connection Error</Text>
          </View>
          <Text style={styles.errorMessage}>{error.message}</Text>
          {error.code && (
            <Text style={styles.errorCode}>Error Code: {error.code}</Text>
          )}
          
          {onClearError && (
            <TouchableOpacity
              style={styles.clearErrorButton}
              onPress={onClearError}
              activeOpacity={0.7}
            >
              <Text style={styles.clearErrorText}>Dismiss</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <RefreshCw size={16} color="#00d4ff" strokeWidth={2} />
          <Text style={styles.refreshButtonText}>
            {isLoading ? 'Connecting...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          {isSupabaseConfigured 
            ? 'Database connection uses direct table queries for maximum reliability. RPC functions are disabled to avoid column errors.'
            : 'Configure Supabase credentials to connect to your database and load real AR objects.'
          }
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Compact styles
  compactContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
  },
  compactStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  compactSync: {
    fontSize: 10,
    color: '#666',
  },

  // Full styles
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#00d4ff20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },

  // Configuration section
  configSection: {
    backgroundColor: '#ff950020',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff9500',
  },
  configMessage: {
    fontSize: 14,
    color: '#ff9500',
    lineHeight: 20,
    marginBottom: 12,
  },
  configSteps: {
    gap: 4,
  },
  configStep: {
    fontSize: 12,
    color: '#ff9500',
    opacity: 0.8,
  },
  
  // Details section
  detailsSection: {
    gap: 12,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  // Error section
  errorSection: {
    backgroundColor: '#ff6b3520',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b35',
  },
  errorMessage: {
    fontSize: 14,
    color: '#ff6b35',
    lineHeight: 20,
    marginBottom: 8,
  },
  errorCode: {
    fontSize: 12,
    color: '#ff6b35',
    opacity: 0.8,
    marginBottom: 12,
  },
  clearErrorButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ff6b35',
    borderRadius: 6,
  },
  clearErrorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  
  // Controls
  controls: {
    marginBottom: 16,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00d4ff',
  },
  
  // Info
  infoSection: {
    backgroundColor: '#00d4ff20',
    borderRadius: 8,
    padding: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#00d4ff',
    lineHeight: 16,
    textAlign: 'center',
  },
});