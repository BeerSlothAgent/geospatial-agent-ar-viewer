import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Wallet, Coins } from 'lucide-react-native';
import ThirdwebWalletConnect from '@/components/wallet/ThirdwebWalletConnect';

export default function WalletScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Coins size={24} color="#00EC97" strokeWidth={2} />
        </View>
        <Text style={styles.headerTitle}>NEAR Wallet Connection</Text>
        <Text style={styles.headerSubtitle}>
          Connect your NEAR wallet to interact with the NeAR ecosystem
        </Text>
      </View>

      {/* Wallet Connection */}
      <View style={styles.walletSection}>
        <View style={styles.walletContainer}>
          <ThirdwebWalletConnect />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  
  // Header
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 236, 151, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B46C1',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Wallet Section
  walletSection: {
    flex: 1,
  },
  walletContainer: {
    flex: 1,
  },
});