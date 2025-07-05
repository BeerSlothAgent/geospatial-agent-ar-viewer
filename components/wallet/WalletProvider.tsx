import React, { ReactNode } from 'react';
import { createThirdwebClient } from "thirdweb";
import { ThirdwebProvider } from "thirdweb/react";

interface WalletProviderProps {
  children: ReactNode;
}

const client = createThirdwebClient({
  clientId: "1928bd7fecdee2c34a7a508ae42db420",
});

export default function WalletProvider({ children }: WalletProviderProps) {
  // Simplified wallet provider that doesn't block app initialization
  // The wallet functionality will be available but won't prevent the app from loading
  
  return (
    <ThirdwebProvider client={client}>
      {children}
    </ThirdwebProvider>
  );
}