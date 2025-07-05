import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Wallet, Copy, ExternalLink, Send, ArrowUpRight, ArrowDownLeft } from 'lucide-react-native';
import { DeployedObject } from '@/types/database';

interface WalletInterfaceProps {
  agent: DeployedObject;
  onBack: () => void;
}

interface WalletData {
  address: string;
  balance: number;
  network: string;
  transactions: Transaction[];
}

interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: number;
  from: string;
  to: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

export default function WalletInterface({ agent, onBack }: WalletInterfaceProps) {
  const [walletData] = useState<WalletData>({
    address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
    balance: 1.2345,
    network: 'Ethereum',
    transactions: [
      {
        id: '1',
        type: 'received',
        amount: 0.5,
        from: '0x123...abc',
        to: '0x742...8D4',
        timestamp: new Date(Date.now() - 3600000),
        status: 'completed',
      },
      {
        id: '2',
        type: 'sent',
        amount: 0.1,
        from: '0x742...8D4',
        to: '0x456...def',
        timestamp: new Date(Date.now() - 7200000),
        status: 'completed',
      },
    ],
  });

  const copyAddress = () => {
    // In a real implementation, this would copy to clipboard
    Alert.alert('Address Copied', 'Wallet address copied to clipboard');
  };

  const openExplorer = () => {
    Alert.alert(
      'View on Explorer',
      'This would open the wallet address on a blockchain explorer like Etherscan.'
    );
  };

  const sendTokens = () => {
    Alert.alert(
      'Send Tokens',
      'This would open a send transaction interface. In the full implementation, users could send tokens to this agent.'
    );
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: number) => {
    return amount.toFixed(4);
  };

  return (
    <View style={styles.container}>
      {/* Wallet Header */}
      <View style={styles.walletHeader}>
        <View style={styles.walletIcon}>
          <Wallet size={32} color="#9333ea" strokeWidth={2} />
        </View>
        <Text style={styles.agentName}>{agent.name}</Text>
        <Text style={styles.walletTitle}>Agent Wallet</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>{formatAmount(walletData.balance)} ETH</Text>
        <Text style={styles.balanceUsd}>≈ ${(walletData.balance * 2500).toFixed(2)} USD</Text>
        
        <View style={styles.networkBadge}>
          <View style={styles.networkDot} />
          <Text style={styles.networkText}>{walletData.network}</Text>
        </View>
      </View>

      {/* Address Card */}
      <View style={styles.addressCard}>
        <Text style={styles.addressLabel}>Wallet Address</Text>
        <View style={styles.addressContainer}>
          <Text style={styles.addressText}>{walletData.address}</Text>
          <View style={styles.addressActions}>
            <TouchableOpacity onPress={copyAddress} style={styles.addressAction}>
              <Copy size={16} color="#6b7280" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity onPress={openExplorer} style={styles.addressAction}>
              <ExternalLink size={16} color="#6b7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={sendTokens}>
          <Send size={20} color="#9333ea" strokeWidth={2} />
          <Text style={styles.actionText}>Send to Agent</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions */}
      <View style={styles.transactionsContainer}>
        <Text style={styles.transactionsTitle}>Recent Transactions</Text>
        
        {walletData.transactions.map((tx) => (
          <View key={tx.id} style={styles.transactionItem}>
            <View style={[
              styles.transactionIcon,
              tx.type === 'received' ? styles.receivedIcon : styles.sentIcon,
            ]}>
              {tx.type === 'received' ? (
                <ArrowDownLeft size={16} color="#10b981" strokeWidth={2} />
              ) : (
                <ArrowUpRight size={16} color="#ef4444" strokeWidth={2} />
              )}
            </View>
            
            <View style={styles.transactionDetails}>
              <Text style={styles.transactionType}>
                {tx.type === 'received' ? 'Received' : 'Sent'}
              </Text>
              <Text style={styles.transactionAddresses}>
                {tx.type === 'received' 
                  ? `From: ${formatAddress(tx.from)}`
                  : `To: ${formatAddress(tx.to)}`
                }
              </Text>
              <Text style={styles.transactionTime}>
                {tx.timestamp.toLocaleString()}
              </Text>
            </View>
            
            <View style={styles.transactionAmount}>
              <Text style={[
                styles.amountText,
                tx.type === 'received' ? styles.receivedAmount : styles.sentAmount,
              ]}>
                {tx.type === 'received' ? '+' : '-'}{formatAmount(tx.amount)} ETH
              </Text>
              <View style={[
                styles.statusBadge,
                tx.status === 'completed' ? styles.completedBadge : 
                tx.status === 'pending' ? styles.pendingBadge : styles.failedBadge,
              ]}>
                <Text style={[
                  styles.statusText,
                  tx.status === 'completed' ? styles.completedText : 
                  tx.status === 'pending' ? styles.pendingText : styles.failedText,
                ]}>
                  {tx.status}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Disclaimer */}
      <View style={styles.disclaimerContainer}>
        <Text style={styles.disclaimerText}>
          This is a mock wallet interface for demonstration purposes. In the full implementation, 
          users would be able to interact with the agent's wallet using real blockchain transactions.
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
  
  // Wallet Header
  walletHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  walletIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  agentName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  walletTitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  // Balance Card
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  balanceUsd: {
    fontSize: 16,
    color: '#9ca3af',
    marginBottom: 12,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  networkText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  
  // Address Card
  addressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  addressLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  addressContainer: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressText: {
    fontSize: 14,
    color: '#374151',
    fontFamily: 'monospace',
    flex: 1,
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  addressAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  
  // Actions
  actionsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9333ea',
  },
  
  // Transactions
  transactionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  receivedIcon: {
    backgroundColor: '#d1fae5',
  },
  sentIcon: {
    backgroundColor: '#fee2e2',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  transactionAddresses: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  receivedAmount: {
    color: '#10b981',
  },
  sentAmount: {
    color: '#ef4444',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedBadge: {
    backgroundColor: '#d1fae5',
  },
  pendingBadge: {
    backgroundColor: '#fef3c7',
  },
  failedBadge: {
    backgroundColor: '#fee2e2',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  completedText: {
    color: '#065f46',
  },
  pendingText: {
    color: '#92400e',
  },
  failedText: {
    color: '#b91c1c',
  },
  
  // Disclaimer
  disclaimerContainer: {
    backgroundColor: '#ede9fe',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#6d28d9',
    lineHeight: 18,
    textAlign: 'center',
  },
});