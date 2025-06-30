import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Wallet, ExternalLink } from 'lucide-react-native';

export default function WalletConnectButton() {
  const openLuteWallet = () => {
    Linking.openURL('https://lute.app');
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoCard}>
        <Wallet size={24} color="#9333ea" strokeWidth={2} />
        <Text style={styles.infoTitle}>Wallet Integration Ready</Text>
        <Text style={styles.infoText}>
          This app includes Algorand wallet integration with Lute Wallet support.
        </Text>
      </View>
      
      <TouchableOpacity style={styles.setupButton} onPress={openLuteWallet}>
        <ExternalLink size={16} color="#9333ea" strokeWidth={2} />
        <Text style={styles.setupButtonText}>Open Lute Wallet</Text>
      </TouchableOpacity>
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
  
  setupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9333ea',
    gap: 6,
  },
  
  setupButtonText: {
    color: '#9333ea',
    fontSize: 14,
    fontWeight: '500',
  },
});