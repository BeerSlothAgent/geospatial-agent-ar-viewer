import React, { ReactNode } from 'react';
import { WalletProvider as UseWalletProvider } from '@txnlab/use-wallet-react';
import { WalletUIProvider } from '@txnlab/use-wallet-ui-react';
import { walletManager } from '@/lib/wallet';

interface WalletProviderProps {
  children: ReactNode;
}

export default function WalletProvider({ children }: WalletProviderProps) {
  return (
    <UseWalletProvider manager={walletManager}>
      <WalletUIProvider>
        {children}
      </WalletUIProvider>
    </UseWalletProvider>
  );
}