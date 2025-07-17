import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import WalletProvider from '@/components/wallet/WalletProvider';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <WalletProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </WalletProvider>
  );
}