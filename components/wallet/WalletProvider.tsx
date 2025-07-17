import React, { ReactNode } from 'react';
import { createThirdwebClient } from "thirdweb";
import { ThirdwebProvider } from "thirdweb/react";

interface WalletProviderProps {
  children: ReactNode;
}

const client = createThirdwebClient({
  clientId: "299516306b51bd6356fd8995ed628950",
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