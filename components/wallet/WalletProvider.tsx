import React, { ReactNode, useState, useEffect } from 'react';
import { ThirdwebProvider } from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";

interface WalletProviderProps {
  children: ReactNode;
}

export default function WalletProvider({ children }: WalletProviderProps) {
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    // Initialize client after component mounts to ensure env vars are loaded
    const initializeClient = () => {
      try {
        const thirdwebClient = createThirdwebClient({
          clientId: process.env.EXPO_PUBLIC_THIRDWEB_CLIENT_ID || "299516306b51bd6356fd8995ed628950",
        });
        setClient(thirdwebClient);
      } catch (error) {
        console.error('Failed to initialize Thirdweb client:', error);
      }
    };

    initializeClient();
  }, []);

  // Show loading state while client is being initialized
  if (!client) {
    return null; // or a loading spinner if preferred
  }

  return (
    <ThirdwebProvider client={client}>
      {children}
    </ThirdwebProvider>
  );
}