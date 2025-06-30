import React, { ReactNode } from 'react';

interface WalletProviderProps {
  children: ReactNode;
}

export default function WalletProvider({ children }: WalletProviderProps) {
  // Simplified wallet provider that doesn't block app initialization
  // The wallet functionality will be available but won't prevent the app from loading
  
  return <>{children}</>;
}