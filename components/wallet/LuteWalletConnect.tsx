import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Wallet, ExternalLink, Copy, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Coins } from 'lucide-react-native';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: number | null;
  isLoading: boolean;
  error: string | null;
}

export default function LuteWalletConnect() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    isLoading: false,
    error: null,
  });

  // Check if Lute wallet is available (web only)
  const isLuteAvailable = Platform.OS === 'web' && typeof window !== 'undefined' && (window as any).lute;

  useEffect(() => {
    if (isLuteAvailable) {
      checkConnection();
    }
  }, [isLuteAvailable]);

  const checkConnection = async () => {
    try {
      if (!isLuteAvailable) return;
      
      const lute = (window as any).lute;
      const accounts = await lute.getAccounts();
      
      if (accounts && accounts.length > 0) {
        setWalletState(prev => ({
          ...prev,
          isConnected: true,
          address: accounts[0],
        }));
        
        // Fetch balance
        await fetchBalance(accounts[0]);
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const fetchBalance = async (address: string) => {
    try {
      // In a real implementation, you would fetch from Algorand TestNet
      // For demo purposes, we'll simulate a balance
      const mockBalance = Math.random() * 1000;
      setWalletState(prev => ({
        ...prev,
        balance: mockBalance,
      }));
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const connectWallet = async () => {
    if (!isLuteAvailable) {
      Alert.alert(
        'Lute Wallet Not Found',
        'Please install the Lute Wallet browser extension to connect.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Install Lute', onPress: openLuteWebsite },
        ]
      );
      return;
    }

    setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const lute = (window as any).lute;
      const accounts = await lute.connect();
      
      if (accounts && accounts.length > 0) {
        setWalletState(prev => ({
          ...prev,
          isConnected: true,
          address: accounts[0],
          isLoading: false,
        }));
        
        await fetchBalance(accounts[0]);
        
        Alert.alert('Success', 'Wallet connected successfully!');
      }
    } catch (error: any) {
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to connect wallet',
      }));
      
      Alert.alert('Connection Failed', error.message || 'Failed to connect to Lute wallet');
    }
  };

  const disconnectWallet = () => {
    setWalletState({
      isConnected: false,
      address: null,
      balance: null,
      isLoading: false,
      error: null,
    });
    
    Alert.alert('Disconnected', 'Wallet disconnected successfully');
  };

  const copyAddress = () => {
    if (walletState.address && Platform.OS === 'web' && navigator.clipboard) {
      navigator.clipboard.writeText(walletState.address);
      Alert.alert('Copied', 'Address copied to clipboard');
    }
  };

  const openLuteWebsite = () => {
    const url = 'https://lute.app';
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    }
  };

  const openTestnetDispenser = () => {
    if (walletState.address) {
      const url = `https://bank.testnet.algorand.network/?account=${walletState.address}`;
      if (Platform.OS === 'web') {
        window.open(url, '_blank');
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: number) => {
    return balance.toFixed(6);
  };

  if (!walletState.isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.connectCard}>
          <View style={styles.walletIcon}>
            <Wallet size={32} color="#9333ea" strokeWidth={2} />
          </View>
          
          <Text style={styles.connectTitle}>Connect Lute Wallet</Text>
          <Text style={styles.connectSubtitle}>
            Connect your Lute wallet to interact with Algorand TestNet
          </Text>
          
          {walletState.error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color="#ef4444" strokeWidth={2} />
              <Text style={styles.errorText}>{walletState.error}</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.connectButton, walletState.isLoading && styles.connectButtonDisabled]}
            onPress={connectWallet}
            disabled={walletState.isLoading}
            activeOpacity={0.8}
          >
            <Wallet size={20} color="#fff" strokeWidth={2} />
            <Text style={styles.connectButtonText}>
              {walletState.isLoading ? 'Connecting...' : 'Connect Wallet'}
            </Text>
          </TouchableOpacity>
          
          {!isLuteAvailable && (
            <TouchableOpacity style={styles.installButton} onPress={openLuteWebsite}>
              <ExternalLink size={16} color="#9333ea" strokeWidth={2} />
              <Text style={styles.installButtonText}>Install Lute Wallet</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.connectedCard}>
        <View style={styles.connectedHeader}>
          <View style={styles.statusIndicator}>
            <CheckCircle size={16} color="#10b981" strokeWidth={2} />
            <Text style={styles.statusText}>Connected</Text>
          </View>
          
          <TouchableOpacity onPress={disconnectWallet} style={styles.disconnectButton}>
            <Text style={styles.disconnectText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.walletInfo}>
          <Text style={styles.walletLabel}>Wallet Address</Text>
          <TouchableOpacity style={styles.addressContainer} onPress={copyAddress}>
            <Text style={styles.addressText}>{formatAddress(walletState.address!)}</Text>
            <Copy size={16} color="#6b7280" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        
        {walletState.balance !== null && (
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>TestNet Balance</Text>
            <Text style={styles.balanceAmount}>{formatBalance(walletState.balance)} ALGO</Text>
          </View>
        )}
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={openTestnetDispenser}>
            <Coins size={16} color="#9333ea" strokeWidth={2} />
            <Text style={styles.actionButtonText}>Get TestNet ALGO</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={openLuteWebsite}>
            <ExternalLink size={16} color="#9333ea" strokeWidth={2} />
            <Text style={styles.actionButtonText}>Open Lute</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  
  // Connect State
  connectCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  walletIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  connectTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  connectSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    alignSelf: 'stretch',
  },
  
  errorText: {
    fontSize: 14,
    color: '#ef4444',
    flex: 1,
  },
  
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9333ea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  
  connectButtonDisabled: {
    opacity: 0.6,
  },
  
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  installButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9333ea',
    gap: 6,
  },
  
  installButtonText: {
    color: '#9333ea',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Connected State
  connectedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  connectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  
  disconnectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  
  disconnectText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
  },
  
  walletInfo: {
    marginBottom: 16,
  },
  
  walletLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  
  addressText: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#374151',
    fontWeight: '500',
  },
  
  balanceInfo: {
    marginBottom: 20,
  },
  
  balanceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  balanceAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'monospace',
  },
  
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9333ea',
  },
});