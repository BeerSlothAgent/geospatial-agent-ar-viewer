import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { ExternalLink, Wallet, Coins, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';

export default function LuteWalletGuide() {
  const openLuteWallet = () => {
    Linking.openURL('https://lute.app');
  };

  const openTestnetDispenser = () => {
    Linking.openURL('https://bank.testnet.algorand.network/');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Wallet size={32} color="#9333ea" strokeWidth={2} />
        </View>
        <Text style={styles.title}>Setup Lute Wallet</Text>
        <Text style={styles.subtitle}>
          Connect to Algorand TestNet with the easiest web-based wallet
        </Text>
      </View>

      {/* Benefits */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Why Lute Wallet?</Text>
        <View style={styles.benefitsList}>
          <View style={styles.benefitItem}>
            <CheckCircle size={16} color="#10b981" strokeWidth={2} />
            <Text style={styles.benefitText}>No installation required - runs in your browser</Text>
          </View>
          <View style={styles.benefitItem}>
            <CheckCircle size={16} color="#10b981" strokeWidth={2} />
            <Text style={styles.benefitText}>Easy network switching (TestNet/MainNet)</Text>
          </View>
          <View style={styles.benefitItem}>
            <CheckCircle size={16} color="#10b981" strokeWidth={2} />
            <Text style={styles.benefitText}>Perfect for testing and development</Text>
          </View>
          <View style={styles.benefitItem}>
            <CheckCircle size={16} color="#10b981" strokeWidth={2} />
            <Text style={styles.benefitText}>Open source and secure</Text>
          </View>
        </View>
      </View>

      {/* Setup Steps */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Setup Steps</Text>
        
        <View style={styles.stepsList}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Open Lute Wallet</Text>
              <Text style={styles.stepDescription}>
                Click the button below to open Lute Wallet in a new tab
              </Text>
              <TouchableOpacity style={styles.stepButton} onPress={openLuteWallet}>
                <ExternalLink size={16} color="#9333ea" strokeWidth={2} />
                <Text style={styles.stepButtonText}>Open Lute Wallet</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Create or Import Wallet</Text>
              <Text style={styles.stepDescription}>
                Create a new wallet or import an existing one using your seed phrase
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Switch to TestNet</Text>
              <Text style={styles.stepDescription}>
                In Lute Wallet settings, switch the network to "TestNet" for development
              </Text>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Get TestNet ALGO</Text>
              <Text style={styles.stepDescription}>
                Get free TestNet ALGO tokens from the official dispenser
              </Text>
              <TouchableOpacity style={styles.stepButton} onPress={openTestnetDispenser}>
                <Coins size={16} color="#9333ea" strokeWidth={2} />
                <Text style={styles.stepButtonText}>TestNet Dispenser</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>5</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Connect to App</Text>
              <Text style={styles.stepDescription}>
                Return to this app and click "Connect Lute Wallet" to link your wallet
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Important Notes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Important Notes</Text>
        <View style={styles.notesList}>
          <View style={styles.noteItem}>
            <AlertCircle size={16} color="#f59e0b" strokeWidth={2} />
            <Text style={styles.noteText}>
              <Text style={styles.noteTextBold}>TestNet Only:</Text> This app is configured for Algorand TestNet. 
              TestNet tokens have no real value and are for testing purposes only.
            </Text>
          </View>
          <View style={styles.noteItem}>
            <AlertCircle size={16} color="#f59e0b" strokeWidth={2} />
            <Text style={styles.noteText}>
              <Text style={styles.noteTextBold}>Keep Your Seed Safe:</Text> Never share your seed phrase with anyone. 
              Store it securely as it's the only way to recover your wallet.
            </Text>
          </View>
          <View style={styles.noteItem}>
            <AlertCircle size={16} color="#f59e0b" strokeWidth={2} />
            <Text style={styles.noteText}>
              <Text style={styles.noteTextBold}>Browser Compatibility:</Text> Lute Wallet works best in modern browsers 
              like Chrome, Firefox, Safari, and Edge.
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.primaryAction} onPress={openLuteWallet}>
          <Wallet size={20} color="#fff" strokeWidth={2} />
          <Text style={styles.primaryActionText}>Open Lute Wallet</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryAction} onPress={openTestnetDispenser}>
          <Coins size={20} color="#9333ea" strokeWidth={2} />
          <Text style={styles.secondaryActionText}>Get TestNet ALGO</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  
  // Header
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: '#fafbff',
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  
  // Sections
  section: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  
  // Benefits
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
    lineHeight: 24,
  },
  
  // Steps
  stepsList: {
    gap: 24,
  },
  step: {
    flexDirection: 'row',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 12,
  },
  stepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ede9fe',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
  },
  stepButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9333ea',
  },
  
  // Notes
  notesList: {
    gap: 16,
  },
  noteItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#fffbeb',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  noteText: {
    fontSize: 14,
    color: '#92400e',
    flex: 1,
    lineHeight: 20,
  },
  noteTextBold: {
    fontWeight: '600',
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9333ea',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#9333ea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#9333ea',
    gap: 8,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9333ea',
  },
});