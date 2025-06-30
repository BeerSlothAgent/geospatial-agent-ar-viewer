import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ScrollView } from 'react-native';
import { 
  Wallet, 
  ExternalLink, 
  Copy, 
  CircleCheck as CheckCircle, 
  CircleAlert as AlertCircle, 
  Coins, 
  RefreshCw,
  Eye,
  Download,
  Globe,
  Smartphone,
  Monitor
} from 'lucide-react-native';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: number | null;
  isLoading: boolean;
  error: string | null;
  isDemoMode: boolean;
}

// Declare global types for Algorand wallet providers
declare global {
  interface Window {
    algorand?: any;
    AlgoSigner?: any;
    lute?: any;
  }
}

export default function LuteWalletConnect() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    address: null,
    balance: null,
    isLoading: false,
    error: null,
    isDemoMode: false,
  });

  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [walletProvider, setWalletProvider] = useState<any>(null);

  // Check if we're on web and if any Algorand wallet is available
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (isWeb && typeof window !== 'undefined') {
      checkWalletAvailability();
    }
  }, [isWeb]);

  const checkWalletAvailability = () => {
    // Check for various Algorand wallet providers
    if (window.algorand) {
      console.log('✅ Found window.algorand provider');
      setWalletProvider(window.algorand);
      return true;
    }
    
    if (window.AlgoSigner) {
      console.log('✅ Found AlgoSigner provider');
      setWalletProvider(window.AlgoSigner);
      return true;
    }
    
    if (window.lute) {
      console.log('✅ Found Lute provider');
      setWalletProvider(window.lute);
      return true;
    }

    console.log('ℹ️ No Algorand wallet provider detected');
    return false;
  };

  const connectWallet = async () => {
    if (!isWeb) {
      Alert.alert(
        'Web Only Feature',
        'Wallet connection is currently only available on web browsers. Please use a desktop or mobile browser to connect your wallet.',
        [{ text: 'OK' }]
      );
      return;
    }

    setWalletState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let accounts: string[] = [];

      // Check if any wallet provider is available before attempting connection
      if (!walletProvider && !window.algorand && !window.AlgoSigner && !window.lute) {
        // Handle gracefully without throwing error
        setWalletState(prev => ({
          ...prev,
          isLoading: false,
          error: 'No wallet detected',
        }));
        return;
      }

      // Try different connection methods
      if (walletProvider) {
        console.log('🔄 Attempting to connect with detected provider...');
        
        // Method 1: Standard enable() method
        if (typeof walletProvider.enable === 'function') {
          accounts = await walletProvider.enable();
        }
        // Method 2: connect() method (some wallets use this)
        else if (typeof walletProvider.connect === 'function') {
          const result = await walletProvider.connect();
          accounts = result.accounts || result;
        }
        // Method 3: getAccounts() method
        else if (typeof walletProvider.getAccounts === 'function') {
          accounts = await walletProvider.getAccounts();
        }
      }

      console.log('📋 Received accounts:', accounts);

      if (accounts && accounts.length > 0) {
        const address = typeof accounts[0] === 'string' ? accounts[0] : accounts[0].address;
        
        setWalletState(prev => ({
          ...prev,
          isConnected: true,
          address: address,
          isLoading: false,
          isDemoMode: false,
        }));
        
        await fetchBalance(address);
        
        Alert.alert('Success! 🎉', `Wallet connected successfully!\n\nAddress: ${address.slice(0, 8)}...${address.slice(-6)}`);
      } else {
        throw new Error('No accounts returned from wallet');
      }
    } catch (error: any) {
      console.log('ℹ️ Wallet connection attempt failed:', error.message);
      
      let errorMessage = 'Connection failed';
      
      if (error.message?.includes('User rejected') || error.message?.includes('denied')) {
        errorMessage = 'Connection was cancelled by user';
      } else if (error.message?.includes('not found') || error.message?.includes('No wallet')) {
        errorMessage = 'No wallet detected';
      } else if (error.message?.includes('enable')) {
        errorMessage = 'Wallet connection method not supported';
      }
      
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  };

  const enableDemoMode = () => {
    const demoAddress = 'DEMO7XAMPLE8WALLET9ADDRESS0ALGORAND1TESTNET2DEMO3EXAMPLE4ADDR';
    const demoBalance = 1234.567890;
    
    setWalletState({
      isConnected: true,
      address: demoAddress,
      balance: demoBalance,
      isLoading: false,
      error: null,
      isDemoMode: true,
    });
    
    Alert.alert(
      'Demo Mode Enabled 🎭', 
      'You\'re now viewing the app with a simulated wallet connection. This shows how the interface looks when a real wallet is connected.',
      [{ text: 'Got it!' }]
    );
  };

  const fetchBalance = async (address: string) => {
    try {
      console.log('💰 Fetching balance for:', address);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockBalance = Math.random() * 1000;
      setWalletState(prev => ({
        ...prev,
        balance: mockBalance,
      }));
      
      console.log('✅ Balance fetched:', mockBalance);
    } catch (error) {
      console.error('❌ Error fetching balance:', error);
    }
  };

  const disconnectWallet = () => {
    setWalletState({
      isConnected: false,
      address: null,
      balance: null,
      isLoading: false,
      error: null,
      isDemoMode: false,
    });
    
    Alert.alert('Disconnected', walletState.isDemoMode ? 'Demo mode disabled' : 'Wallet disconnected successfully');
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

  const openPeraWallet = () => {
    const url = 'https://perawallet.app';
    if (isWeb) {
      window.open(url, '_blank');
    }
  };

  const openDeflyWallet = () => {
    const url = 'https://defly.app';
    if (isWeb) {
      window.open(url, '_blank');
    }
  };

  const openTestnetDispenser = () => {
    if (walletState.address && !walletState.isDemoMode) {
      const url = `https://bank.testnet.algorand.network/?account=${walletState.address}`;
      if (isWeb) {
        window.open(url, '_blank');
      }
    } else if (walletState.isDemoMode) {
      Alert.alert('Demo Mode', 'This is a demo wallet. Connect a real wallet to access the TestNet dispenser.');
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  const formatBalance = (balance: number) => {
    return balance.toFixed(6);
  };

  const refreshWalletDetection = () => {
    const detected = checkWalletAvailability();
    setWalletState(prev => ({ ...prev, error: null }));
    
    if (detected) {
      Alert.alert('Wallet Detected! 🎉', 'A wallet was found. You can now try connecting.');
    } else {
      Alert.alert('No Wallet Found', 'Still no wallet detected. Make sure you have installed a compatible Algorand wallet extension.');
    }
  };

  // Connected state (both real and demo)
  if (walletState.isConnected) {
    return (
      <View style={styles.container}>
        <View style={styles.connectedCard}>
          <View style={styles.connectedHeader}>
            <View style={styles.statusIndicator}>
              <CheckCircle size={16} color={walletState.isDemoMode ? "#f59e0b" : "#10b981"} strokeWidth={2} />
              <Text style={[styles.statusText, { color: walletState.isDemoMode ? "#f59e0b" : "#10b981" }]}>
                {walletState.isDemoMode ? 'Demo Mode' : 'Connected to TestNet'}
              </Text>
            </View>
            
            <TouchableOpacity onPress={disconnectWallet} style={styles.disconnectButton}>
              <Text style={styles.disconnectText}>
                {walletState.isDemoMode ? 'Exit Demo' : 'Disconnect'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {walletState.isDemoMode && (
            <View style={styles.demoNotice}>
              <Eye size={16} color="#f59e0b" strokeWidth={2} />
              <Text style={styles.demoNoticeText}>
                This is a demo showing how the app looks with a connected wallet
              </Text>
            </View>
          )}
          
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
              <Text style={styles.balanceLabel}>
                {walletState.isDemoMode ? 'Demo Balance' : 'TestNet Balance'}
              </Text>
              <Text style={styles.balanceAmount}>{formatBalance(walletState.balance)} ALGO</Text>
              <Text style={styles.balanceNote}>
                ≈ ${(parseFloat(formatBalance(walletState.balance)) * 0.25).toFixed(2)} USD 
                {walletState.isDemoMode ? ' (Demo)' : ' (TestNet)'}
              </Text>
            </View>
          )}
          
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, walletState.isDemoMode && styles.actionButtonDisabled]} 
              onPress={openTestnetDispenser}
              disabled={walletState.isDemoMode}
            >
              <Coins size={16} color={walletState.isDemoMode ? "#9ca3af" : "#9333ea"} strokeWidth={2} />
              <Text style={[styles.actionButtonText, walletState.isDemoMode && styles.actionButtonTextDisabled]}>
                Get TestNet ALGO
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={openLuteWebsite}>
              <ExternalLink size={16} color="#9333ea" strokeWidth={2} />
              <Text style={styles.actionButtonText}>Open Lute</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.networkInfo}>
            <View style={[styles.networkDot, { backgroundColor: walletState.isDemoMode ? "#f59e0b" : "#f59e0b" }]} />
            <Text style={styles.networkText}>
              {walletState.isDemoMode ? 'Demo Mode' : 'Algorand TestNet'}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Disconnected state with enhanced UX
  return (
    <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={styles.connectCard}>
          <View style={styles.walletIcon}>
            <Wallet size={32} color="#9333ea" strokeWidth={2} />
          </View>
          
          <Text style={styles.connectTitle}>Algorand Wallet</Text>
          <Text style={styles.connectSubtitle}>
            Connect your wallet to interact with Algorand TestNet and manage digital assets
          </Text>
          
          {/* Platform Check */}
          {!isWeb && (
            <View style={styles.platformWarning}>
              <AlertCircle size={16} color="#f59e0b" strokeWidth={2} />
              <Text style={styles.platformWarningText}>
                Wallet connection requires a web browser environment
              </Text>
            </View>
          )}
          
          {/* Wallet Detection Status */}
          {isWeb && (
            <View style={styles.detectionStatus}>
              {walletProvider ? (
                <View style={styles.detectionSuccess}>
                  <CheckCircle size={16} color="#10b981" strokeWidth={2} />
                  <Text style={styles.detectionSuccessText}>Wallet extension detected!</Text>
                </View>
              ) : (
                <View style={styles.detectionWarning}>
                  <AlertCircle size={16} color="#f59e0b" strokeWidth={2} />
                  <Text style={styles.detectionWarningText}>No wallet extension detected</Text>
                  <TouchableOpacity onPress={refreshWalletDetection} style={styles.refreshButton}>
                    <RefreshCw size={14} color="#f59e0b" strokeWidth={2} />
                    <Text style={styles.refreshText}>Refresh</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          
          {/* Error Display */}
          {walletState.error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color="#ef4444" strokeWidth={2} />
              <Text style={styles.errorText}>{walletState.error}</Text>
            </View>
          )}
          
          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.primaryButton, (walletState.isLoading || !isWeb) && styles.primaryButtonDisabled]}
              onPress={connectWallet}
              disabled={walletState.isLoading || !isWeb}
              activeOpacity={0.8}
            >
              {walletState.isLoading ? (
                <RefreshCw size={20} color="#fff" strokeWidth={2} />
              ) : (
                <Wallet size={20} color="#fff" strokeWidth={2} />
              )}
              <Text style={styles.primaryButtonText}>
                {walletState.isLoading ? 'Connecting...' : 'Connect Wallet'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.demoButton} onPress={enableDemoMode}>
              <Eye size={20} color="#9333ea" strokeWidth={2} />
              <Text style={styles.demoButtonText}>Try Demo Mode</Text>
            </TouchableOpacity>
          </View>
          
          {/* Wallet Information Toggle */}
          <TouchableOpacity 
            style={styles.infoToggle} 
            onPress={() => setShowWalletInfo(!showWalletInfo)}
          >
            <Text style={styles.infoToggleText}>
              {showWalletInfo ? 'Hide' : 'Show'} Wallet Information
            </Text>
            <ExternalLink size={14} color="#9333ea" strokeWidth={2} />
          </TouchableOpacity>
          
          {/* Expandable Wallet Information */}
          {showWalletInfo && (
            <View style={styles.walletInfoSection}>
              <Text style={styles.infoSectionTitle}>Supported Wallets</Text>
              
              <View style={styles.walletOptions}>
                <TouchableOpacity style={styles.walletOption} onPress={openLuteWebsite}>
                  <View style={styles.walletOptionIcon}>
                    <Globe size={20} color="#9333ea" strokeWidth={2} />
                  </View>
                  <View style={styles.walletOptionContent}>
                    <Text style={styles.walletOptionTitle}>Lute Wallet</Text>
                    <Text style={styles.walletOptionDesc}>Web-based Algorand wallet</Text>
                  </View>
                  <ExternalLink size={16} color="#9333ea" strokeWidth={2} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.walletOption} onPress={openPeraWallet}>
                  <View style={styles.walletOptionIcon}>
                    <Smartphone size={20} color="#9333ea" strokeWidth={2} />
                  </View>
                  <View style={styles.walletOptionContent}>
                    <Text style={styles.walletOptionTitle}>Pera Wallet</Text>
                    <Text style={styles.walletOptionDesc}>Mobile & browser extension</Text>
                  </View>
                  <ExternalLink size={16} color="#9333ea" strokeWidth={2} />
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.walletOption} onPress={openDeflyWallet}>
                  <View style={styles.walletOptionIcon}>
                    <Monitor size={20} color="#9333ea" strokeWidth={2} />
                  </View>
                  <View style={styles.walletOptionContent}>
                    <Text style={styles.walletOptionTitle}>Defly Wallet</Text>
                    <Text style={styles.walletOptionDesc}>Desktop & mobile wallet</Text>
                  </View>
                  <ExternalLink size={16} color="#9333ea" strokeWidth={2} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.setupInstructions}>
                <Text style={styles.instructionsTitle}>Quick Setup</Text>
                <View style={styles.instructionsList}>
                  <Text style={styles.instructionItem}>1. Install a wallet extension</Text>
                  <Text style={styles.instructionItem}>2. Create or import an account</Text>
                  <Text style={styles.instructionItem}>3. Switch to TestNet</Text>
                  <Text style={styles.instructionItem}>4. Refresh this page</Text>
                  <Text style={styles.instructionItem}>5. Click "Connect Wallet"</Text>
                </View>
              </View>
              
              <View style={styles.demoExplanation}>
                <Text style={styles.demoExplanationTitle}>Try Demo Mode</Text>
                <Text style={styles.demoExplanationText}>
                  Can't install a wallet right now? Use demo mode to explore the app's wallet features 
                  with simulated data. This shows exactly how the interface works when a real wallet is connected.
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  
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
    maxWidth: 450,
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
  
  detectionStatus: {
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  
  detectionSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  
  detectionSuccessText: {
    fontSize: 14,
    color: '#065f46',
    fontWeight: '500',
  },
  
  detectionWarning: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
  },
  
  detectionWarningText: {
    fontSize: 14,
    color: '#92400e',
    marginBottom: 8,
    textAlign: 'center',
  },
  
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  
  refreshText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
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
  
  buttonGroup: {
    alignSelf: 'stretch',
    gap: 12,
    marginBottom: 20,
  },
  
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  
  primaryButtonDisabled: {
    opacity: 0.6,
    backgroundColor: '#6b7280',
  },
  
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  demoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9333ea',
    gap: 8,
  },
  
  demoButtonText: {
    color: '#9333ea',
    fontSize: 16,
    fontWeight: '600',
  },
  
  infoToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  
  infoToggleText: {
    fontSize: 14,
    color: '#9333ea',
    fontWeight: '500',
  },
  
  walletInfoSection: {
    alignSelf: 'stretch',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  
  infoSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  
  walletOptions: {
    gap: 12,
    marginBottom: 20,
  },
  
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  
  walletOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  
  walletOptionContent: {
    flex: 1,
  },
  
  walletOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  
  walletOptionDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  setupInstructions: {
    marginBottom: 20,
  },
  
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  
  instructionsList: {
    gap: 6,
  },
  
  instructionItem: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  
  demoExplanation: {
    backgroundColor: '#ede9fe',
    borderRadius: 8,
    padding: 12,
  },
  
  demoExplanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c3aed',
    marginBottom: 8,
  },
  
  demoExplanationText: {
    fontSize: 14,
    color: '#6d28d9',
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
  
  demoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  
  demoNoticeText: {
    fontSize: 14,
    color: '#92400e',
    flex: 1,
    fontWeight: '500',
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
  
  actionButtonDisabled: {
    opacity: 0.5,
  },
  
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9333ea',
  },
  
  actionButtonTextDisabled: {
    color: '#9ca3af',
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
  },
  
  networkText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
});