import React, { ReactNode, useEffect, useState } from 'react';
import { WalletProvider as UseWalletProvider } from '@txnlab/use-wallet-react';
import { WalletUIProvider } from '@txnlab/use-wallet-ui-react';
import { walletManager } from '@/lib/wallet';
import { Platform } from 'react-native';

interface WalletProviderProps {
  children: ReactNode;
}

export default function WalletProvider({ children }: WalletProviderProps) {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeWallet = async () => {
      try {
        // Add a small delay to ensure the environment is ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if we're in a supported environment
        if (Platform.OS === 'web' && typeof window === 'undefined') {
          throw new Error('Window object not available');
        }
        
        setIsReady(true);
      } catch (err) {
        console.error('Wallet provider initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize wallet');
        // Still set ready to true to prevent blocking the app
        setIsReady(true);
      }
    };

    initializeWallet();
  }, []);

  // Show loading state while initializing
  if (!isReady) {
    return <>{children}</>;
  }

  // If there's an error, still render children but log the error
  if (error) {
    console.warn('Wallet provider error (continuing anyway):', error);
  }

  try {
    return (
      <UseWalletProvider manager={walletManager}>
        <WalletUIProvider>
          {children}
        </WalletUIProvider>
      </UseWalletProvider>
    );
  } catch (providerError) {
    console.error('Wallet provider render error:', providerError);
    // Fallback: render children without wallet provider
    return <>{children}</>;
  }
}