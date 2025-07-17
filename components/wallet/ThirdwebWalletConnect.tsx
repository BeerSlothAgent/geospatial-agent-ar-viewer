import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createThirdwebClient } from "thirdweb";
import { ConnectButton } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { Wallet, Coins } from 'lucide-react-native';

const client = createThirdwebClient({
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
          <Coins size={24} color="#00EC97" strokeWidth={2} />
        </View>
        <Text style={styles.headerTitle}>Connect NEAR Wallet</Text>
        <Text style={styles.headerSubtitle}>
          Connect your NEAR wallet to interact with the NeAR ecosystem
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
        <Text style={styles.featuresTitle}>NEAR Wallet Features</Text>
        
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>NEAR Protocol native integration</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>USDFC token support for agent interactions</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Instant transactions with NEAR Protocol</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>Secure NEAR wallet authentication</Text>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <Text style={styles.featureText}>NeAR QR Pay for agent interactions</Text>
          </View>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>NEAR Protocol Integration</Text>
        <Text style={styles.infoText}>
          Powered by NEAR Protocol, connecting your wallet is secure and takes just a few clicks. 
          Enjoy seamless USDFC payments for NEAR agent interactions in the NeAR world.
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
    color: '#000000',
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
    backgroundColor: '#00EC97',
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
    backgroundColor: 'rgba(0, 236, 151, 0.2)',
    borderRadius: 16,
    padding: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00EC97',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
});