import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { MessageCircle, Mic, Video, X, Zap, MapPin, Clock, User, Shield, Wallet, ExternalLink } from 'lucide-react-native';
import { DeployedObject } from '@/types/database';
import { LocationData } from '@/hooks/useLocation';
import { ARQRCodeGenerator } from './ARQRCodeGenerator';
import { BlockchainPaymentSimulator } from './BlockchainPaymentSimulator';

interface AgentInteractionModalProps {
  agent: DeployedObject;
  visible: boolean;
  onClose: () => void;
  userLocation: LocationData | null;
  arQRCodeGenerator?: ARQRCodeGenerator;
}

export default function AgentInteractionModal({
  agent,
  visible,
  onClose,
  userLocation,
  arQRCodeGenerator,
}: AgentInteractionModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'interact' | 'payment'>('info');
  const [interactionType, setInteractionType] = useState<'text' | 'voice' | 'video' | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');
  const [isQRVisible, setIsQRVisible] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  // Calculate distance to agent
  const getDistance = (): string => {
    if (!userLocation || !agent.latitude || !agent.longitude) return 'Unknown';
    
    // Use distance_meters if available
    if (agent.distance_meters) {
      return `${agent.distance_meters.toFixed(1)}m`;
    }
    
    // Otherwise calculate based on coordinates
    const distance = calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      agent.latitude,
      agent.longitude
    );
    
    return `${distance.toFixed(1)}m`;
  };

  // Calculate distance between two coordinates
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Get interaction fee based on type
  const getInteractionFee = (type: 'text' | 'voice' | 'video'): number => {
    const baseFee = agent.interaction_fee_usdfc || 0.5;
    
    switch (type) {
      case 'text':
        return baseFee;
      case 'voice':
        return baseFee * 2;
      case 'video':
        return baseFee * 3;
      default:
        return baseFee;
    }
  };

  // Handle interaction selection
  const handleInteractionSelect = (type: 'text' | 'voice' | 'video') => {
    setInteractionType(type);
    setActiveTab('payment');
  };

  // Connect wallet (simulation)
  const connectWallet = async () => {
    try {
      const address = await BlockchainPaymentSimulator.connectWallet();
      setWalletAddress(address);
      setWalletConnected(true);
      
      // Check balance
      const balance = await BlockchainPaymentSimulator.checkBalance(address);
      setWalletBalance(balance);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      Alert.alert('Connection Error', 'Failed to connect wallet. Please try again.');
    }
  };

  // Generate QR code for payment
  const generatePaymentQR = () => {
    if (!interactionType) {
      Alert.alert('Error', 'Please select an interaction type first');
      return;
    }
    
    if (!arQRCodeGenerator) {
      Alert.alert('Error', 'QR code generator not available');
      return;
    }
    
    const fee = getInteractionFee(interactionType);
    const recipientAddress = agent.agent_wallet_address || '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4';
    
    // Generate and display QR code
    arQRCodeGenerator.generateQRCode(recipientAddress, fee, agent.name || 'NEAR Agent');
    setIsQRVisible(true);
  };

  // Simulate QR code scan
  const simulateQRScan = async () => {
    if (!interactionType) return;
    
    setPaymentStatus('pending');
    
    try {
      const fee = getInteractionFee(interactionType);
      const recipientAddress = agent.agent_wallet_address || '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4';
      
      // Simulate payment
      const txHash = await BlockchainPaymentSimulator.simulatePayment(fee, recipientAddress);
      
      // Check transaction status
      const status = await BlockchainPaymentSimulator.checkTransactionStatus(txHash);
      
      if (status === 'confirmed') {
        setPaymentStatus('success');
        // Hide QR code if visible
        if (isQRVisible && arQRCodeGenerator) {
          arQRCodeGenerator.removeQRCode();
          setIsQRVisible(false);
        }
      } else if (status === 'pending') {
        // Keep status as pending
        setTimeout(() => {
          // 80% chance of success after delay
          setPaymentStatus(Math.random() < 0.8 ? 'success' : 'failed');
        }, 2000);
      } else {
        setPaymentStatus('failed');
      }
    } catch (error) {
      console.error('Payment simulation error:', error);
      setPaymentStatus('failed');
    }
  };

  // Clean up QR code on unmount or when modal closes
  useEffect(() => {
    return () => {
      if (arQRCodeGenerator) {
        arQRCodeGenerator.removeQRCode();
      }
    };
  }, [arQRCodeGenerator]);

  useEffect(() => {
    if (!visible && isQRVisible && arQRCodeGenerator) {
      arQRCodeGenerator.removeQRCode();
      setIsQRVisible(false);
    }
  }, [visible, isQRVisible, arQRCodeGenerator]);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setActiveTab('info');
      setInteractionType(null);
      setPaymentStatus('idle');
      setIsQRVisible(false);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.agentInfo}>
              <Text style={styles.agentName}>{agent.name || 'NEAR Agent'}</Text>
              <Text style={styles.agentType}>{agent.object_type || 'AI Agent'}</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#fff" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'info' && styles.activeTab]}
              onPress={() => setActiveTab('info')}
            >
              <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>Info</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'interact' && styles.activeTab]}
              onPress={() => setActiveTab('interact')}
            >
              <Text style={[styles.tabText, activeTab === 'interact' && styles.activeTabText]}>Interact</Text>
            </TouchableOpacity>
            {interactionType && (
              <TouchableOpacity
                style={[styles.tab, activeTab === 'payment' && styles.activeTab]}
                onPress={() => setActiveTab('payment')}
              >
                <Text style={[styles.tabText, activeTab === 'payment' && styles.activeTabText]}>Payment</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Content */}
          <ScrollView style={styles.modalContent}>
            {/* Info Tab */}
            {activeTab === 'info' && (
              <View style={styles.infoContainer}>
                {/* Agent Description */}
                {agent.description && (
                  <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>About</Text>
                    <Text style={styles.infoText}>{agent.description}</Text>
                  </View>
                )}

                {/* Location Info */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoTitle}>Location</Text>
                  <View style={styles.infoRow}>
                    <MapPin size={16} color="#00EC97" strokeWidth={2} />
                    <Text style={styles.infoText}>
                      {agent.latitude?.toFixed(6)}, {agent.longitude?.toFixed(6)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Zap size={16} color="#00EC97" strokeWidth={2} />
                    <Text style={styles.infoText}>
                      Distance: {getDistance()}
                    </Text>
                  </View>
                  {agent.altitude && (
                    <View style={styles.infoRow}>
                      <MapPin size={16} color="#00EC97" strokeWidth={2} />
                      <Text style={styles.infoText}>
                        Altitude: {agent.altitude.toFixed(1)}m
                      </Text>
                    </View>
                  )}
                </View>

                {/* Technical Info */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoTitle}>Technical Details</Text>
                  <View style={styles.infoRow}>
                    <Shield size={16} color="#00EC97" strokeWidth={2} />
                    <Text style={styles.infoText}>
                      Visibility Radius: {agent.visibility_radius || 50}m
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Clock size={16} color="#00EC97" strokeWidth={2} />
                    <Text style={styles.infoText}>
                      Created: {new Date(agent.created_at || Date.now()).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <User size={16} color="#00EC97" strokeWidth={2} />
                    <Text style={styles.infoText}>
                      Owner: {agent.user_id?.substring(0, 8) || 'Unknown'}...
                    </Text>
                  </View>
                </View>

                {/* Payment Info */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoTitle}>Interaction Fees</Text>
                  <View style={styles.feeGrid}>
                    <View style={styles.feeItem}>
                      <MessageCircle size={16} color="#00EC97" strokeWidth={2} />
                      <Text style={styles.feeLabel}>Text Chat</Text>
                      <Text style={styles.feeAmount}>{getInteractionFee('text')} USDFC</Text>
                    </View>
                    <View style={styles.feeItem}>
                      <Mic size={16} color="#00EC97" strokeWidth={2} />
                      <Text style={styles.feeLabel}>Voice Chat</Text>
                      <Text style={styles.feeAmount}>{getInteractionFee('voice')} USDFC</Text>
                    </View>
                    <View style={styles.feeItem}>
                      <Video size={16} color="#00EC97" strokeWidth={2} />
                      <Text style={styles.feeLabel}>Video Chat</Text>
                      <Text style={styles.feeAmount}>{getInteractionFee('video')} USDFC</Text>
                    </View>
                  </View>
                  <View style={styles.infoRow}>
                    <Wallet size={16} color="#00EC97" strokeWidth={2} />
                    <Text style={styles.infoText}>
                      Payment: USDFC on BlockDAG Primordial Testnet
                    </Text>
                  </View>
                </View>

                {/* Blockchain Info */}
                {agent.agent_wallet_address && (
                  <View style={styles.infoSection}>
                    <Text style={styles.infoTitle}>Blockchain Details</Text>
                    <View style={styles.infoRow}>
                      <Wallet size={16} color="#00EC97" strokeWidth={2} />
                      <Text style={styles.infoText}>
                        Wallet: {agent.agent_wallet_address.substring(0, 8)}...{agent.agent_wallet_address.substring(agent.agent_wallet_address.length - 6)}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <ExternalLink size={16} color="#00EC97" strokeWidth={2} />
                      <Text style={styles.infoText}>
                        Network: {agent.agent_wallet_type || 'BlockDAG Primordial Testnet'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Interact Tab */}
            {activeTab === 'interact' && (
              <View style={styles.interactContainer}>
                <Text style={styles.interactTitle}>Choose Interaction Method</Text>
                <Text style={styles.interactSubtitle}>
                  Select how you'd like to interact with {agent.name || 'this agent'}
                </Text>

                <View style={styles.interactionOptions}>
                  {/* Text Chat Option */}
                  <TouchableOpacity
                    style={styles.interactionOption}
                    onPress={() => handleInteractionSelect('text')}
                  >
                    <View style={styles.interactionIcon}>
                      <MessageCircle size={32} color="#00EC97" strokeWidth={2} />
                    </View>
                    <Text style={styles.interactionTitle}>Text Chat</Text>
                    <Text style={styles.interactionDescription}>
                      Chat with the agent using text messages
                    </Text>
                    <View style={styles.interactionPrice}>
                      <Text style={styles.priceLabel}>Fee:</Text>
                      <Text style={styles.priceAmount}>{getInteractionFee('text')} USDFC</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Voice Chat Option */}
                  <TouchableOpacity
                    style={styles.interactionOption}
                    onPress={() => handleInteractionSelect('voice')}
                  >
                    <View style={styles.interactionIcon}>
                      <Mic size={32} color="#00EC97" strokeWidth={2} />
                    </View>
                    <Text style={styles.interactionTitle}>Voice Chat</Text>
                    <Text style={styles.interactionDescription}>
                      Talk with the agent using voice
                    </Text>
                    <View style={styles.interactionPrice}>
                      <Text style={styles.priceLabel}>Fee:</Text>
                      <Text style={styles.priceAmount}>{getInteractionFee('voice')} USDFC</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Video Chat Option */}
                  <TouchableOpacity
                    style={styles.interactionOption}
                    onPress={() => handleInteractionSelect('video')}
                  >
                    <View style={styles.interactionIcon}>
                      <Video size={32} color="#00EC97" strokeWidth={2} />
                    </View>
                    <Text style={styles.interactionTitle}>Video Chat</Text>
                    <Text style={styles.interactionDescription}>
                      Video call with the agent
                    </Text>
                    <View style={styles.interactionPrice}>
                      <Text style={styles.priceLabel}>Fee:</Text>
                      <Text style={styles.priceAmount}>{getInteractionFee('video')} USDFC</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <View style={styles.interactNote}>
                  <Text style={styles.noteText}>
                    Interaction requires a one-time payment in USDFC on the BlockDAG Primordial Testnet.
                    You'll be prompted to pay after selecting an interaction method.
                  </Text>
                </View>
              </View>
            )}

            {/* Payment Tab */}
            {activeTab === 'payment' && interactionType && (
              <View style={styles.paymentContainer}>
                <View style={styles.paymentHeader}>
                  <Text style={styles.paymentTitle}>
                    Payment for {interactionType.charAt(0).toUpperCase() + interactionType.slice(1)} Interaction
                  </Text>
                  <Text style={styles.paymentSubtitle}>
                    Pay {getInteractionFee(interactionType)} USDFC to interact with {agent.name || 'this agent'}
                  </Text>
                </View>

                {/* Payment Status */}
                <View style={[
                  styles.paymentStatus,
                  paymentStatus === 'pending' && styles.paymentStatusPending,
                  paymentStatus === 'success' && styles.paymentStatusSuccess,
                  paymentStatus === 'failed' && styles.paymentStatusFailed,
                ]}>
                  <Text style={styles.paymentStatusText}>
                    {paymentStatus === 'idle' && 'Ready for payment'}
                    {paymentStatus === 'pending' && 'Processing payment...'}
                    {paymentStatus === 'success' && 'Payment successful!'}
                    {paymentStatus === 'failed' && 'Payment failed. Please try again.'}
                  </Text>
                </View>

                {/* Wallet Connection */}
                {!walletConnected && paymentStatus === 'idle' && (
                  <View style={styles.walletSection}>
                    <Text style={styles.walletTitle}>Connect Your Wallet</Text>
                    <Text style={styles.walletDescription}>
                      Connect your wallet to pay for this interaction
                    </Text>
                    <TouchableOpacity
                      style={styles.connectButton}
                      onPress={connectWallet}
                    >
                      <Wallet size={20} color="#000" strokeWidth={2} />
                      <Text style={styles.connectButtonText}>Connect Wallet</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Wallet Info */}
                {walletConnected && walletAddress && (
                  <View style={styles.walletInfo}>
                    <Text style={styles.walletInfoTitle}>Wallet Connected</Text>
                    <View style={styles.walletAddress}>
                      <Text style={styles.walletAddressText}>
                        {walletAddress.substring(0, 8)}...{walletAddress.substring(walletAddress.length - 6)}
                      </Text>
                    </View>
                    {walletBalance !== null && (
                      <Text style={styles.walletBalance}>
                        Balance: {walletBalance.toFixed(2)} USDFC
                      </Text>
                    )}
                  </View>
                )}

                {/* Payment Options */}
                {walletConnected && paymentStatus === 'idle' && (
                  <View style={styles.paymentOptions}>
                    <Text style={styles.paymentOptionsTitle}>Payment Methods</Text>
                    
                    {/* QR Code Payment */}
                    <TouchableOpacity
                      style={styles.paymentOption}
                      onPress={generatePaymentQR}
                    >
                      <View style={styles.paymentOptionIcon}>
                        <Text style={styles.paymentOptionIconText}>📱</Text>
                      </View>
                      <View style={styles.paymentOptionInfo}>
                        <Text style={styles.paymentOptionTitle}>QR Code Payment</Text>
                        <Text style={styles.paymentOptionDescription}>
                          Scan with MetaMask mobile wallet
                        </Text>
                      </View>
                    </TouchableOpacity>
                    
                    {/* Direct Payment (Simulation) */}
                    <TouchableOpacity
                      style={styles.paymentOption}
                      onPress={simulateQRScan}
                    >
                      <View style={styles.paymentOptionIcon}>
                        <Text style={styles.paymentOptionIconText}>💳</Text>
                      </View>
                      <View style={styles.paymentOptionInfo}>
                        <Text style={styles.paymentOptionTitle}>Direct Payment</Text>
                        <Text style={styles.paymentOptionDescription}>
                          Pay directly from connected wallet
                        </Text>
                      </View>
                    </TouchableOpacity>
                    
                    {/* Simulate QR Scan (For Demo) */}
                    <TouchableOpacity
                      style={[styles.paymentOption, styles.simulateOption]}
                      onPress={simulateQRScan}
                    >
                      <View style={styles.paymentOptionIcon}>
                        <Text style={styles.paymentOptionIconText}>🔄</Text>
                      </View>
                      <View style={styles.paymentOptionInfo}>
                        <Text style={styles.paymentOptionTitle}>Simulate QR Scan</Text>
                        <Text style={styles.paymentOptionDescription}>
                          For demo purposes only
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Success Message */}
                {paymentStatus === 'success' && (
                  <View style={styles.successMessage}>
                    <View style={styles.successIcon}>
                      <Text style={styles.successIconText}>✅</Text>
                    </View>
                    <Text style={styles.successTitle}>Payment Successful!</Text>
                    <Text style={styles.successDescription}>
                      Your payment of {getInteractionFee(interactionType)} USDFC has been processed successfully.
                      You can now start your {interactionType} interaction with {agent.name || 'this agent'}.
                    </Text>
                    <TouchableOpacity
                      style={styles.startInteractionButton}
                      onPress={() => {
                        // In a real implementation, this would start the actual interaction
                        Alert.alert(
                          'Interaction Started',
                          `Starting ${interactionType} interaction with ${agent.name || 'this agent'}`
                        );
                        onClose();
                      }}
                    >
                      <Text style={styles.startInteractionButtonText}>
                        Start {interactionType.charAt(0).toUpperCase() + interactionType.slice(1)} Interaction
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Failed Message */}
                {paymentStatus === 'failed' && (
                  <View style={styles.failedMessage}>
                    <View style={styles.failedIcon}>
                      <Text style={styles.failedIconText}>❌</Text>
                    </View>
                    <Text style={styles.failedTitle}>Payment Failed</Text>
                    <Text style={styles.failedDescription}>
                      Your payment could not be processed. Please try again or choose a different payment method.
                    </Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={() => setPaymentStatus('idle')}
                    >
                      <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Payment Note */}
                <View style={styles.paymentNote}>
                  <Text style={styles.noteText}>
                    Payments are processed on the BlockDAG Primordial Testnet using USDFC tokens.
                    This is a secure and decentralized payment method.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.modalFooter}>
            <Text style={styles.footerText}>
              Powered by NEAR Protocol & BlockDAG
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '90%',
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#00EC97',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 236, 151, 0.3)',
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  agentType: {
    fontSize: 14,
    color: '#00EC97',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#00EC97',
  },
  tabText: {
    fontSize: 16,
    color: '#fff',
  },
  activeTabText: {
    color: '#00EC97',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
  },
  modalFooter: {
    padding: 15,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },

  // Info Tab Styles
  infoContainer: {
    padding: 20,
  },
  infoSection: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#ddd',
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  feeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  feeItem: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: 'rgba(0, 236, 151, 0.1)',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  feeLabel: {
    fontSize: 12,
    color: '#fff',
    marginTop: 5,
  },
  feeAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00EC97',
    marginTop: 5,
  },

  // Interact Tab Styles
  interactContainer: {
    padding: 20,
  },
  interactTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  interactSubtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 20,
  },
  interactionOptions: {
    gap: 15,
  },
  interactionOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 236, 151, 0.3)',
  },
  interactionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 236, 151, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  interactionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  interactionDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 10,
  },
  interactionPrice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  priceAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00EC97',
  },
  interactNote: {
    marginTop: 20,
    backgroundColor: 'rgba(0, 236, 151, 0.1)',
    borderRadius: 8,
    padding: 15,
  },
  noteText: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
  },

  // Payment Tab Styles
  paymentContainer: {
    padding: 20,
  },
  paymentHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  paymentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  paymentSubtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  paymentStatus: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  paymentStatusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  paymentStatusSuccess: {
    backgroundColor: 'rgba(0, 236, 151, 0.1)',
    borderWidth: 1,
    borderColor: '#00EC97',
  },
  paymentStatusFailed: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  paymentStatusText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  walletSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  walletTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  walletDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 15,
    textAlign: 'center',
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00EC97',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 10,
  },
  connectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  walletInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  walletInfoTitle: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 10,
  },
  walletAddress: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 5,
  },
  walletAddressText: {
    fontSize: 16,
    color: '#00EC97',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  walletBalance: {
    fontSize: 14,
    color: '#fff',
  },
  paymentOptions: {
    gap: 15,
    marginBottom: 20,
  },
  paymentOptionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 236, 151, 0.3)',
  },
  simulateOption: {
    backgroundColor: 'rgba(0, 236, 151, 0.1)',
  },
  paymentOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 236, 151, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  paymentOptionIconText: {
    fontSize: 20,
  },
  paymentOptionInfo: {
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  paymentOptionDescription: {
    fontSize: 12,
    color: '#aaa',
  },
  successMessage: {
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 236, 151, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  successIconText: {
    fontSize: 30,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00EC97',
    marginBottom: 10,
  },
  successDescription: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
  },
  startInteractionButton: {
    backgroundColor: '#00EC97',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  startInteractionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  failedMessage: {
    alignItems: 'center',
    marginBottom: 20,
  },
  failedIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  failedIconText: {
    fontSize: 30,
  },
  failedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 10,
  },
  failedDescription: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  paymentNote: {
    marginTop: 20,
    backgroundColor: 'rgba(0, 236, 151, 0.1)',
    borderRadius: 8,
    padding: 15,
  },
});