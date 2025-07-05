import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createThirdwebClient } from "thirdweb";
import { ConnectButton } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { Wallet } from 'lucide-react-native';

const client = createThirdwebClient({
  clientId: "1928bd7fecdee2c34a7a508ae42db420",
});

const wallets = [
  inAppWallet({
    auth: {
      options: [
        "google",
        "discord",
        "telegram",
        "farcaster",
        "email",
        "x",
        "passkey",
        "phone",
      ],
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
];

export default function ThirdwebWalletConnect() {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Wallet size={24} color="#9333ea" strokeWidth={2} />
        </View>
        <Text style={styles.headerTitle}>Connect Wallet</Text>
        <Text style={styles.headerSubtitle}>
          Connect your wallet to interact with the AR ecosystem
        </Text>
      </View>

      {/* Thirdweb Connect Button */}
      <View style={styles.connectSection}>
        <ConnectButton
          client={client}
          connectModal={{ size: "compact" }}
          wallets={wallets}
        />
      </View>

      {/* Features */}
      <View style={styles.featuresSection}>
        <Text style={styles.featuresTitle}>Supported Features</Text>
        
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Multiple wallet options (MetaMask, Coinbase, Rainbow, etc.)</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Social login (Google, Discord, Telegram, X)</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Email and phone authentication</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Passkey support for secure access</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Cross-platform compatibility</Text>
          </View>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Secure & Easy</Text>
        <Text style={styles.infoText}>
          Powered by Thirdweb, connecting your wallet is secure and takes just a few clicks. 
          Choose from multiple authentication methods that work best for you.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  
  // Header
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  
  // Connect Section
  connectSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Features
  featuresSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9333ea',
    marginTop: 6,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  
  // Info
  infoSection: {
    backgroundColor: '#ede9fe',
    borderRadius: 16,
    padding: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c3aed',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6d28d9',
    lineHeight: 20,
  },
});