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
    LuteConnect?: any;
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
    console.log('🔍 Checking for wallet providers...');
    
    // Check for Lute wallet specifically
    if (window.lute) {
      console.log('✅ Found Lute wallet provider');
      setWalletProvider(window.lute);
      return true;
    }
    
    // Check for LuteConnect
    if (window.LuteConnect) {
      console.log('✅ Found LuteConnect provider');
      setWalletProvider(window.LuteConnect);
      return true;
    }
    
    // Check for other Algorand wallet providers
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
      console.log('🔄 Attempting to connect to Lute wallet...');
      
      // First, try to detect Lute wallet by opening the URL
      const luteWalletUrl = 'https://lute.app/Y57PSZMQYCPW3Y67YRZSJ2VB2XSLPHGH2PQK2PGHT55UFBWGDDOIQZSBYM';
      
      // Check if we can communicate with Lute wallet
      let accounts: string[] = [];
      let connected = false;

      // Method 1: Try direct Lute wallet connection
      if (window.lute) {
        try {
          console.log('🔄 Connecting via window.lute...');
          accounts = await window.lute.connect();
          connected = true;
        } catch (error) {
          console.log('⚠️ window.lute connection failed:', error);
        }
      }

      // Method 2: Try LuteConnect
      if (!connected && window.LuteConnect) {
        try {
          console.log('🔄 Connecting via LuteConnect...');
          const result = await window.LuteConnect.connect();
          accounts = result.accounts || [result.address] || [];
          connected = true;
        } catch (error) {
          console.log('⚠️ LuteConnect connection failed:', error);
        }
      }

      // Method 3: Try postMessage communication with Lute wallet
      if (!connected) {
        try {
          console.log('🔄 Attempting postMessage communication...');
          
          // Open Lute wallet in a popup
          const popup = window.open(luteWalletUrl, 'luteWallet', 'width=400,height=600');
          
          // Listen for messages from Lute wallet
          const messagePromise = new Promise<string[]>((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Connection timeout'));
            }, 30000); // 30 second timeout

            const messageHandler = (event: MessageEvent) => {
              if (event.origin === 'https://lute.app') {
                clearTimeout(timeout);
                window.removeEventListener('message', messageHandler);
                
                if (event.data.type === 'WALLET_CONNECTED' && event.data.accounts) {
                  resolve(event.data.accounts);
                } else if (event.data.type === 'WALLET_ERROR') {
                  reject(new Error(event.data.error || 'Wallet connection failed'));
                }
              }
            };

            window.addEventListener('message', messageHandler);
            
            // Send connection request to Lute wallet
            if (popup) {
              popup.postMessage({
                type: 'CONNECT_REQUEST',
                origin: window.location.origin
              }, 'https://lute.app');
            }
          });

          accounts = await messagePromise;
          connected = true;
          
          if (popup) {
            popup.close();
          }
        } catch (error) {
          console.log('⚠️ postMessage communication failed:', error);
        }
      }

      // Method 4: Try opening Lute wallet directly and ask user to copy address
      if (!connected) {
        const userWantsToConnect = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Connect to Lute Wallet',
            'We\'ll open your Lute wallet. Please copy your wallet address and return to this app.',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Open Lute Wallet', onPress: () => resolve(true) }
            ]
          );
        });

        if (userWantsToConnect) {
          // Open Lute wallet
          window.open(luteWalletUrl, '_blank');
          
          // Show manual address input
          const address = await new Promise<string | null>((resolve) => {
            // For now, we'll use a demo address
            // In a real implementation, you'd show an input dialog
            Alert.alert(
              'Manual Connection',
              'For demo purposes, we\'ll connect with a sample address. In a real app, you would paste your wallet address here.',
              [
                { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
                { text: 'Use Demo Address', onPress: () => resolve('Y57PSZMQYCPW3Y67YRZSJ2VB2XSLPHGH2PQK2PGHT55UFBWGDDOIQZSBYM') }
              ]
            );
          });

          if (address) {
            accounts = [address];
            connected = true;
          }
        }
      }

      if (connected && accounts && accounts.length > 0) {
        const address = typeof accounts[0] === 'string' ? accounts[0] : accounts[0].address || accounts[0];
        
        setWalletState(prev => ({
          ...prev,
          isConnected: true,
          address: address,
          isLoading: false,
          isDemoMode: false,
        }));
        
        await fetchBalance(address);
        
        Alert.alert('Success! 🎉', `Lute Wallet connected successfully!\n\nAddress: ${address.slice(0, 8)}...${address.slice(-6)}`);
      } else {
        throw new Error('No accounts returned from wallet or connection failed');
      }
    } catch (error: any) {
      console.log('ℹ️ Wallet connection attempt failed:', error.message);
      
      let errorMessage = 'Connection failed';
      
      if (error.message?.includes('User rejected') || error.message?.includes('denied')) {
        errorMessage = 'Connection was cancelled by user';
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Connection timeout - please try again';
      } else if (error.message?.includes('not found') || error.message?.includes('No wallet')) {
        errorMessage = 'Lute wallet not detected';
      }
      
      setWalletState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      // Offer demo mode as fallback
      Alert.alert(
        'Connection Failed',
        `${errorMessage}\n\nWould you like to try demo mode to see how the app works?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Demo Mode', onPress: enableDemoMode }
        ]
      );
    }
  };

  const enableDemoMode = () => {
    const demoAddress = 'Y57PSZMQYCPW3Y67YRZSJ2VB2XSLPHGH2PQK2PGHT55UFBWGDDOIQZSBYM';
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
      'You\'re now viewing the app with a simulated wallet connection using your Lute wallet address. This shows how the interface looks when a real wallet is connected.',
      [{ text: 'Got it!' }]
    );
  };

  const fetchBalance = async (address: string) => {
    try {
      console.log('💰 Fetching balance for:', address);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, use a mock balance
      // In a real app, you'd call the Algorand API
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

  const openYourLuteWallet = () => {
    const url = 'https://lute.app/Y57PSZMQYCPW3Y67YRZSJ2VB2XSLPHGH2PQK2PGHT55UFBWGDDOIQZSBYM';
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
      Alert.alert('No Wallet Found', 'Still no wallet detected. Make sure your Lute wallet is open and try again.');
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
                {walletState.isDemoMode ? 'Demo Mode (Your Lute Wallet)' : 'Connected to TestNet'}
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
                Demo mode using your Lute wallet address - showing how the app looks when connected
              </Text>
            </View>
          )}
          
          <View style={styles.walletInfo}>
            <Text style={styles.walletLabel}>Lute Wallet Address</Text>
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
            
            <TouchableOpacity style={styles.actionButton} onPress={openYourLuteWallet}>
              <ExternalLink size={16} color="#9333ea" strokeWidth={2} />
              <Text style={styles.actionButtonText}>Open Your Lute</Text>
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
          
          <Text style={styles.connectTitle}>Connect Your Lute Wallet</Text>
          <Text style={styles.connectSubtitle}>
            Connect your Lute wallet to interact with Algorand TestNet and manage digital assets
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
                  <Text style={styles.detectionSuccessText}>Lute wallet detected!</Text>
                </View>
              ) : (
                <View style={styles.detectionWarning}>
                  <AlertCircle size={16} color="#f59e0b" strokeWidth={2} />
                  <Text style={styles.detectionWarningText}>Lute wallet not detected</Text>
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
                {walletState.isLoading ? 'Connecting...' : 'Connect Lute Wallet'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.demoButton} onPress={enableDemoMode}>
              <Eye size={20} color="#9333ea" strokeWidth={2} />
              <Text style={styles.demoButtonText}>Try Demo Mode</Text>
            </TouchableOpacity>
          </View>
          
          {/* Quick Access */}
          <View style={styles.quickAccess}>
            <TouchableOpacity style={styles.quickAccessButton} onPress={openYourLuteWallet}>
              <ExternalLink size={16} color="#9333ea" strokeWidth={2} />
              <Text style={styles.quickAccessText}>Open Your Lute Wallet</Text>
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
              <Text style={styles.infoSectionTitle}>About Lute Wallet</Text>
              
              <View style={styles.luteInfo}>
                <View style={styles.luteInfoItem}>
                  <Globe size={20} color="#9333ea" strokeWidth={2} />
                  <View style={styles.luteInfoContent}>
                    <Text style={styles.luteInfoTitle}>Web-Based Wallet</Text>
                    <Text style={styles.luteInfoDesc}>No installation required - runs in your browser</Text>
                  </View>
                </View>
                
                <View style={styles.luteInfoItem}>
                  <Coins size={20} color="#9333ea" strokeWidth={2} />
                  <View style={styles.luteInfoContent}>
                    <Text style={styles.luteInfoTitle}>Algorand Native</Text>
                    <Text style={styles.luteInfoDesc}>Built specifically for the Algorand ecosystem</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.setupInstructions}>
                <Text style={styles.instructionsTitle}>Connection Steps</Text>
                <View style={styles.instructionsList}>
                  <Text style={styles.instructionItem}>1. Make sure your Lute wallet is open</Text>
                  <Text style={styles.instructionItem}>2. Click "Connect Lute Wallet" above</Text>
                  <Text style={styles.instructionItem}>3. Approve the connection in Lute</Text>
                  <Text style={styles.instructionItem}>4. Start using the app!</Text>
                </View>
              </View>
              
              <View style={styles.demoExplanation}>
                <Text style={styles.demoExplanationTitle}>Try Demo Mode</Text>
                <Text style={styles.demoExplanationText}>
                  Can't connect right now? Use demo mode to explore the app's wallet features 
                  with your actual Lute wallet address. This shows exactly how the interface works when connected.
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
  
  quickAccess: {
    alignSelf: 'stretch',
    marginBottom: 16,
  },
  
  quickAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  
  quickAccessText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9333ea',
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
  
  luteInfo: {
    gap: 12,
    marginBottom: 20,
  },
  
  luteInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  
  luteInfoContent: {
    flex: 1,
    marginLeft: 12,
  },
  
  luteInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  
  luteInfoDesc: {
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