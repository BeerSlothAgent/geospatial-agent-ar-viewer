import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Wallet } from 'lucide-react-native';

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
          Wallet functionality is temporarily disabled for preview compatibility
        </Text>
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Wallet Integration</Text>
        <Text style={styles.infoText}>
          This app includes Algorand wallet integration with Lute Wallet support. 
          The wallet functionality has been temporarily simplified to ensure the preview loads correctly.
        </Text>
        
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>Lute Wallet integration</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>Algorand TestNet support</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>Balance checking</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureBullet}>•</Text>
            <Text style={styles.featureText}>Transaction support</Text>
          </View>
        </View>
      </View>

      {/* Setup Instructions */}
      <View style={styles.setupSection}>
        <Text style={styles.setupTitle}>Setup Instructions</Text>
        <Text style={styles.setupText}>
          To enable full wallet functionality:
        </Text>
        
        <View style={styles.stepsList}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Install Lute Wallet browser extension</Text>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Configure for Algorand TestNet</Text>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Get TestNet ALGO from the dispenser</Text>
          </View>
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
  
  // Info Section
  infoSection: {
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  
  // Features List
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureBullet: {
    fontSize: 16,
    color: '#9333ea',
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  
  // Setup Section
  setupSection: {
    backgroundColor: '#fff',
    paddingVertical: 24,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  setupText: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  
  // Steps List
  stepsList: {
    gap: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#9333ea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  stepText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
    lineHeight: 24,
  },
});