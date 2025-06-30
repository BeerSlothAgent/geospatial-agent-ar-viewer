import { NetworkId, WalletId, WalletManager } from '@txnlab/use-wallet-react';
import algosdk from 'algosdk';
import { Platform } from 'react-native';

// Algorand TestNet configuration
export const ALGORAND_TESTNET_CONFIG = {
  server: 'https://testnet-api.algonode.cloud',
  port: '',
  token: '',
  network: NetworkId.TESTNET,
};

// Initialize Algorand client
export const algodClient = new algosdk.Algodv2(
  ALGORAND_TESTNET_CONFIG.token,
  ALGORAND_TESTNET_CONFIG.server,
  ALGORAND_TESTNET_CONFIG.port
);

// Safe wallet manager configuration for web platform
export const createWalletManager = () => {
  try {
    // Only initialize wallet manager if we're in a proper environment
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return new WalletManager({
        wallets: [
          WalletId.LUTE,
          // Only include other wallets if they're available
          ...(typeof window.ethereum !== 'undefined' ? [WalletId.PERA] : []),
        ],
        network: NetworkId.TESTNET,
        algod: {
          server: ALGORAND_TESTNET_CONFIG.server,
          port: ALGORAND_TESTNET_CONFIG.port,
          token: ALGORAND_TESTNET_CONFIG.token,
        },
      });
    }
    
    // Fallback for non-web platforms
    return new WalletManager({
      wallets: [WalletId.LUTE],
      network: NetworkId.TESTNET,
      algod: {
        server: ALGORAND_TESTNET_CONFIG.server,
        port: ALGORAND_TESTNET_CONFIG.port,
        token: ALGORAND_TESTNET_CONFIG.token,
      },
    });
  } catch (error) {
    console.warn('Failed to initialize wallet manager:', error);
    // Return a minimal configuration that won't crash
    return new WalletManager({
      wallets: [WalletId.LUTE],
      network: NetworkId.TESTNET,
      algod: {
        server: ALGORAND_TESTNET_CONFIG.server,
        port: ALGORAND_TESTNET_CONFIG.port,
        token: ALGORAND_TESTNET_CONFIG.token,
      },
    });
  }
};

// Create wallet manager instance
export const walletManager = createWalletManager();

// Utility functions
export const formatAlgoAmount = (microAlgos: number): string => {
  return (microAlgos / 1_000_000).toFixed(6);
};

export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const getTestnetDispenserUrl = (address: string): string => {
  return `https://bank.testnet.algorand.network/?account=${address}`;
};

// Safe wallet connection helper
export const safeConnectWallet = async (walletId: string) => {
  try {
    const wallet = walletManager.wallets.find(w => w.id === walletId);
    if (!wallet) {
      throw new Error(`Wallet ${walletId} not found`);
    }
    
    await wallet.connect();
    return true;
  } catch (error) {
    console.error('Wallet connection error:', error);
    throw error;
  }
};