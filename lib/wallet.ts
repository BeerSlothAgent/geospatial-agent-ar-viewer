import { NetworkId, WalletId, WalletManager } from '@txnlab/use-wallet-react';
import algosdk from 'algosdk';

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

// Wallet Manager configuration
export const walletManager = new WalletManager({
  wallets: [
    WalletId.LUTE,
    WalletId.PERA,
    WalletId.DEFLY,
  ],
  network: NetworkId.TESTNET,
  algod: {
    server: ALGORAND_TESTNET_CONFIG.server,
    port: ALGORAND_TESTNET_CONFIG.port,
    token: ALGORAND_TESTNET_CONFIG.token,
  },
});

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