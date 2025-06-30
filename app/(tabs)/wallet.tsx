import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Wallet } from 'lucide-react-native';
import WalletConnectButton from '@/components/wallet/WalletConnectButton';
import LuteWalletGuide from '@/components/wallet/LuteWalletGuide';

export default function WalletScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Wallet size={24} color="#9333ea" strokeWidth={2} />
        </View>
        <Text style={styles.headerTitle}>Algorand Wallet</Text>
        <Text style={styles.headerSubtitle}>
          Connect your Lute Wallet to interact with Algorand TestNet
        </Text>
      </View>

      {/* Wallet Connection */}
      <View style={styles.walletSection}>
        <Text style={styles.sectionTitle}>Wallet Connection</Text>
        <View style={styles.walletContainer}>
          <WalletConnectButton />
        </View>
      </View>

      {/* Setup Guide */}
      <View style={styles.guideSection}>
        <LuteWalletGuide />
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
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Wallet Section
  walletSection: {
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 24,
    marginTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  walletContainer: {
    alignItems: 'center',
  },
  
  // Guide Section
  guideSection: {
    backgroundColor: '#fff',
    marginTop: 16,
  },
});