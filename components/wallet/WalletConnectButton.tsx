import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Wallet } from 'lucide-react-native';
import { createThirdwebClient } from "thirdweb";
import { ConnectButton } from "thirdweb/react";
import { inAppWallet, createWallet } from "thirdweb/wallets";

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

export default function WalletConnectButton() {

  return (
    <View style={styles.container}>
      <View style={styles.infoCard}>
        <Wallet size={24} color="#9333ea" strokeWidth={2} />
        <Text style={styles.infoTitle}>Connect Your Wallet</Text>
        <Text style={styles.infoText}>
          Connect your wallet to interact with the AR ecosystem using Thirdweb.
        </Text>
      </View>
      
      <View style={styles.connectSection}>
        <ConnectButton
          client={client}
          connectModal={{ size: "compact" }}
          wallets={wallets}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  
  infoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    maxWidth: 300,
  },
  
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  
  infoText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  connectSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
});