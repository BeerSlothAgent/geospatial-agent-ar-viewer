import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Wallet, ExternalLink, Copy, CircleCheck as CheckCircle, CircleAlert as AlertCircle, Coins, RefreshCw } from 'lucide-react-native';

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

  // Check if we're on web and if Lute wallet is available
  const isWeb = Platform.OS === 'web';
  const isLuteAvailable = isWeb && typeof window !== 'undefined' && (window as any).algorand;

  useEffect(() => {
    if (isLuteAvailable) {
      checkConnection();
    }
  }, [isLuteAvailable]);

  const checkConnection = async () => {
    try {
      if (!isLuteAvailable) return;
      
      // Check if already connected
      const algorand = (window as any).algorand;
      if (algorand && algorand.isConnected) {
        const accounts = await algorand.getAccounts();
        if (accounts && accounts.length > 0) {
          setWalletState(prev => ({
            ...prev,
            isConnected: true,
            address: accounts[0],
          }));
          
          // Fetch balance
          await fetchBalance(accounts[0]);
        }
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const fetchBalance = async (address: string) => {
    try {
      // For demo purposes, simulate fetching balance from Algorand TestNet
      // In a real implementation, you would use algosdk to fetch from TestNet
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
    if (!isWeb) {
      Alert.alert(
        'Web Only Feature',
        'Wallet connection is currently only available on web browsers. Please use a desktop or mobile browser to connect your Lute wallet.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!isLuteAvailable) {
      Alert.alert(
        'Lute Wallet Not Found',
        'Lute Wallet extension is not installed or not available. Please install the Lute Wallet browser extension.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Install Lute', onPress: openLuteWebsite },
        ]
      );
      return;
    }

    setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const algorand = (window as any).algorand;
      
      if (!algorand) {
        throw new Error('Algorand provider not found');
      }

      // Request connection
      const accounts = await algorand.enable();
      
      if (accounts && accounts.length > 0) {
        setWalletState(prev => ({
          ...prev,
          isConnected: true,
          address: accounts[0],
          isLoading: false,
        }));
        
        await fetchBalance(accounts[0]);
        
        Alert.alert('Success! 🎉', 'Lute Wallet connected successfully!');
      } else {
        throw new Error('No accounts returned from wallet');
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      
      let errorMessage = 'Failed to connect to Lute wallet';
      
      if (error.message?.includes('User rejected')) {
        errorMessage = 'Connection was cancelled by user';
      } else if (error.message?.includes('not found')) {
        errorMessage = 'Lute Wallet not found. Please install the extension.';
      }
      
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      
      Alert.alert('Connection Failed', errorMessage);
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
    if (walletState.address && isWeb && navigator.clipboard) {
      navigator.clipboard.writeText(walletState.address);
      Alert.alert('Copied! 📋', 'Address copied to clipboard');
    } else {
      Alert.alert('Address', walletState.address || 'No address available');
    }
  };

  const openLuteWebsite = () => {
    const url = 'https://lute.app';
    if (isWeb) {
      window.open(url, '_blank');
    }
  };

  const openTestnetDispenser = () => {
    if (walletState.address) {
      const url = `https://bank.testnet.algorand.network/?account=${walletState.address}`;
      if (isWeb) {
        window.open(url, '_blank');
      }
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
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
            Connect your Lute wallet to interact with Algorand TestNet and manage your digital assets
          </Text>
          
          {!isWeb && (
            <View style={styles.platformWarning}>
              <AlertCircle size={16} color="#f59e0b" strokeWidth={2} />
              <Text style={styles.platformWarningText}>
                Wallet connection requires a web browser
              </Text>
            </View>
          )}
          
          {walletState.error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color="#ef4444" strokeWidth={2} />
              <Text style={styles.errorText}>{walletState.error}</Text>
            </View>
          )}
          
          <TouchableOpacity
            style={[styles.connectButton, (walletState.isLoading || !isWeb) && styles.connectButtonDisabled]}
            onPress={connectWallet}
            disabled={walletState.isLoading || !isWeb}
            activeOpacity={0.8}
          >
            {walletState.isLoading ? (
              <RefreshCw size={20} color="#fff" strokeWidth={2} />
            ) : (
              <Wallet size={20} color="#fff" strokeWidth={2} />
            )}
            <Text style={styles.connectButtonText}>
              {walletState.isLoading ? 'Connecting...' : 'Connect Lute Wallet'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.installButton} onPress={openLuteWebsite}>
            <ExternalLink size={16} color="#9333ea" strokeWidth={2} />
            <Text style={styles.installButtonText}>Get Lute Wallet</Text>
          </TouchableOpacity>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Why Lute Wallet?</Text>
            <Text style={styles.infoText}>
              • Web-based wallet - no installation required{'\n'}
              • Easy TestNet/MainNet switching{'\n'}
              • Perfect for dApp development{'\n'}
              • Open source and secure
            </Text>
          </View>
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
            <Text style={styles.statusText}>Connected to TestNet</Text>
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
          <Text style={styles.fullAddress}>{walletState.address}</Text>
        </View>
        
        {walletState.balance !== null && (
          <View style={styles.balanceInfo}>
            <Text style={styles.balanceLabel}>TestNet Balance</Text>
            <Text style={styles.balanceAmount}>{formatBalance(walletState.balance)} ALGO</Text>
            <Text style={styles.balanceNote}>
              ≈ ${(parseFloat(formatBalance(walletState.balance)) * 0.25).toFixed(2)} USD (TestNet)
            </Text>
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
        
        <View style={styles.networkInfo}>
          <View style={styles.networkDot} />
          <Text style={styles.networkText}>Algorand TestNet</Text>
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
    maxWidth: 400,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  connectSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 20,
  },
  
  platformWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    alignSelf: 'stretch',
  },
  
  platformWarningText: {
    fontSize: 14,
    color: '#92400e',
    flex: 1,
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
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
  },
  
  connectButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#6b7280',
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
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9333ea',
    gap: 6,
    marginBottom: 20,
  },
  
  installButtonText: {
    color: '#9333ea',
    fontSize: 14,
    fontWeight: '500',
  },
  
  infoSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignSelf: 'stretch',
  },
  
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  
  infoText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  
  // Connected State
  connectedCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 350,
    maxWidth: 400,
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
    marginBottom: 20,
  },
  
  walletLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
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
    marginBottom: 8,
  },
  
  addressText: {
    fontSize: 16,
    fontFamily: 'monospace',
    color: '#374151',
    fontWeight: '600',
  },
  
  fullAddress: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#9ca3af',
    textAlign: 'center',
  },
  
  balanceInfo: {
    marginBottom: 20,
    alignItems: 'center',
  },
  
  balanceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  
  balanceNote: {
    fontSize: 14,
    color: '#9ca3af',
  },
  
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9333ea',
  },
  
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
  },
  
  networkText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});