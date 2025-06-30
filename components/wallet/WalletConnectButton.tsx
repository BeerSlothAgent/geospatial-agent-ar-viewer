import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { useWallet } from '@txnlab/use-wallet-react';
import { Wallet, ExternalLink, Copy, LogOut, Coins, RefreshCw } from 'lucide-react-native';
import { formatAlgoAmount, formatAddress, getTestnetDispenserUrl, algodClient } from '@/lib/wallet';

export default function WalletConnectButton() {
  const { 
    wallets, 
    activeWallet, 
    activeAccount, 
    isActive, 
    isReady 
  } = useWallet();
  
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Fetch account balance
  const fetchBalance = async () => {
    if (!activeAccount) return;
    
    try {
      setIsLoading(true);
      const accountInfo = await algodClient.accountInformation(activeAccount.address).do();
      setBalance(accountInfo.amount);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch balance when account changes
  useEffect(() => {
    if (activeAccount) {
      fetchBalance();
    } else {
      setBalance(null);
    }
  }, [activeAccount]);

  // Connect wallet
  const handleConnect = async () => {
    try {
      const luteWallet = wallets.find(wallet => wallet.id === 'lute');
      if (luteWallet) {
        await luteWallet.connect();
      } else {
        Alert.alert(
          'Lute Wallet Not Found',
          'Please make sure Lute Wallet is available in your browser.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Connection error:', error);
      Alert.alert(
        'Connection Failed',
        'Failed to connect to Lute Wallet. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Disconnect wallet
  const handleDisconnect = async () => {
    try {
      if (activeWallet) {
        await activeWallet.disconnect();
        setShowDetails(false);
      }
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  // Copy address to clipboard
  const copyAddress = () => {
    if (activeAccount?.address) {
      // For web, we'll use the Clipboard API if available
      if (navigator.clipboard) {
        navigator.clipboard.writeText(activeAccount.address);
        Alert.alert('Copied!', 'Address copied to clipboard');
      } else {
        Alert.alert('Address', activeAccount.address);
      }
    }
  };

  // Open TestNet dispenser
  const openDispenser = () => {
    if (activeAccount?.address) {
      const url = getTestnetDispenserUrl(activeAccount.address);
      Linking.openURL(url);
    }
  };

  // Open Lute Wallet
  const openLuteWallet = () => {
    Linking.openURL('https://lute.app');
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <RefreshCw size={20} color="#9333ea" />
        <Text style={styles.loadingText}>Loading wallet...</Text>
      </View>
    );
  }

  if (!isActive || !activeAccount) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.connectButton} onPress={handleConnect}>
          <Wallet size={20} color="#fff" strokeWidth={2} />
          <Text style={styles.connectButtonText}>Connect Lute Wallet</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.setupButton} onPress={openLuteWallet}>
          <ExternalLink size={16} color="#9333ea" strokeWidth={2} />
          <Text style={styles.setupButtonText}>Setup Lute Wallet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.connectedButton} 
        onPress={() => setShowDetails(!showDetails)}
      >
        <View style={styles.connectedInfo}>
          <View style={styles.statusIndicator} />
          <View style={styles.accountInfo}>
            <Text style={styles.walletName}>Lute Wallet</Text>
            <Text style={styles.address}>{formatAddress(activeAccount.address)}</Text>
          </View>
        </View>
        <View style={styles.balanceInfo}>
          {isLoading ? (
            <RefreshCw size={16} color="#9333ea" />
          ) : (
            <>
              <Text style={styles.balanceAmount}>
                {balance !== null ? formatAlgoAmount(balance) : '0.000000'}
              </Text>
              <Text style={styles.balanceLabel}>ALGO</Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      {showDetails && (
        <View style={styles.detailsPanel}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>Wallet Details</Text>
            <TouchableOpacity onPress={fetchBalance} disabled={isLoading}>
              <RefreshCw 
                size={16} 
                color="#9333ea" 
                style={isLoading ? styles.spinning : undefined}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Address</Text>
            <TouchableOpacity style={styles.addressContainer} onPress={copyAddress}>
              <Text style={styles.fullAddress}>{activeAccount.address}</Text>
              <Copy size={16} color="#9333ea" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Balance</Text>
            <View style={styles.balanceContainer}>
              <Text style={styles.fullBalance}>
                {balance !== null ? formatAlgoAmount(balance) : '0.000000'} ALGO
              </Text>
              <Text style={styles.balanceUsd}>
                ≈ ${balance !== null ? (parseFloat(formatAlgoAmount(balance)) * 0.25).toFixed(2) : '0.00'} USD
              </Text>
            </View>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Network</Text>
            <View style={styles.networkContainer}>
              <View style={styles.networkDot} />
              <Text style={styles.networkText}>Algorand TestNet</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={openDispenser}>
              <Coins size={16} color="#9333ea" strokeWidth={2} />
              <Text style={styles.actionButtonText}>Get TestNet ALGO</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={openLuteWallet}>
              <ExternalLink size={16} color="#9333ea" strokeWidth={2} />
              <Text style={styles.actionButtonText}>Open Lute</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
              <LogOut size={16} color="#ef4444" strokeWidth={2} />
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
  },
  
  // Loading state
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  
  // Connect button
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9333ea',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Setup button
  setupButton: {
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
  setupButtonText: {
    color: '#9333ea',
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Connected state
  connectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  
  connectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  
  accountInfo: {
    gap: 2,
  },
  
  walletName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  
  address: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  
  balanceInfo: {
    alignItems: 'flex-end',
    gap: 2,
  },
  
  balanceAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'monospace',
  },
  
  balanceLabel: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  
  // Details panel
  detailsPanel: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    minWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  
  spinning: {
    // Add rotation animation if needed
  },
  
  detailItem: {
    marginBottom: 16,
  },
  
  detailLabel: {
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
  
  fullAddress: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  
  balanceContainer: {
    gap: 4,
  },
  
  fullBalance: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'monospace',
  },
  
  balanceUsd: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  networkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  networkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
  },
  
  networkText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  
  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    minWidth: 120,
  },
  
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9333ea',
  },
  
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
    flex: 1,
    minWidth: 120,
  },
  
  disconnectButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ef4444',
  },
});