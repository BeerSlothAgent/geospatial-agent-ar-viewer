import React, { ReactNode } from 'react';
import { ThirdwebProvider } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";

interface WalletProviderProps {
  children: ReactNode;
}

// Create client outside component to prevent recreation on every render
const client = createThirdwebClient({
  clientId: process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID || "299516306b51bd6356fd8995ed628950",
});

export default function WalletProvider({ children }: WalletProviderProps) {
  return (
    <ThirdwebProvider client={client}>
      {children}
    </ThirdwebProvider>
  );
}