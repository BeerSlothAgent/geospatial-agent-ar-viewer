import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Mic, MicOff, Volume2, VolumeX, Play, Square } from 'lucide-react-native';
import { DeployedObject } from '@/types/database';

interface VoiceInterfaceProps {
  agent: DeployedObject;
  onBack: () => void;
}

export default function VoiceInterface({ agent, onBack }: VoiceInterfaceProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [lastTranscript, setLastTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState('');

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage = getVoiceWelcomeMessage();
    setLastResponse(welcomeMessage);
    
    // Auto-speak welcome message
    setTimeout(() => {
      speakMessage(welcomeMessage);
    }, 500);
  }, [agent]);

  const getVoiceWelcomeMessage = () => {
    switch (agent.object_type) {
      case 'Home Personal':
        return `Hello! I'm ${agent.name}, your voice-activated home assistant. You can ask me about weather, schedules, or home controls.`;
      case 'Landmark':
        return `Welcome to ${agent.name}! I can tell you about this location's history and provide audio directions.`;
      case 'Intelligent Assistant':
        return `Hi there! I'm ${agent.name}. You can ask me questions or request help with various tasks using voice commands.`;
      case 'Tutor/Teacher':
        return `Hello student! I'm ${agent.name}, your voice tutor. Ask me questions or tell me what you'd like to learn about.`;
      case 'Local Services':
        return `Welcome! I'm ${agent.name}. Ask me about local restaurants, shops, or services in this area.`;
      default:
        return `Hello! I'm ${agent.name}. You can talk to me using voice commands. How can I help you today?`;
    }
  };

  const startListening = () => {
    if (isSpeaking) {
      Alert.alert('Please Wait', 'Let me finish speaking first, then you can talk.');
      return;
    }

    setIsListening(true);
    console.log('🎤 Starting voice recognition...');
    
    // Simulate voice recognition
    setTimeout(() => {
      const mockTranscripts = [
        "What's the weather like today?",
        "Tell me about this location",
        "How can you help me?",
        "What services are available here?",
        "Can you give me directions?",
      ];
      
      const transcript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      setLastTranscript(transcript);
      setIsListening(false);
      
      // Generate response
      const response = generateVoiceResponse(transcript);
      setLastResponse(response);
      
      // Speak the response
      if (audioEnabled) {
        speakMessage(response);
      }
    }, 2000 + Math.random() * 2000); // 2-4 second simulation
  };

  const stopListening = () => {
    setIsListening(false);
    console.log('🎤 Stopped voice recognition');
  };

  const speakMessage = (message: string) => {
    if (!audioEnabled) return;
    
    setIsSpeaking(true);
    console.log('🔊 Speaking:', message);
    
    // Simulate text-to-speech duration
    const duration = Math.max(2000, message.length * 50); // Minimum 2 seconds
    setTimeout(() => {
      setIsSpeaking(false);
    }, duration);
  };

  const generateVoiceResponse = (transcript: string): string => {
    const lowerTranscript = transcript.toLowerCase();
    
    if (lowerTranscript.includes('weather')) {
      return "The current weather is 72 degrees Fahrenheit and sunny. It's a beautiful day to be outside exploring!";
    }
    
    if (lowerTranscript.includes('location') || lowerTranscript.includes('place')) {
      return `You're currently at ${agent.name}, which is a ${agent.object_type}. This location is at coordinates ${agent.latitude.toFixed(4)}, ${agent.longitude.toFixed(4)}.`;
    }
    
    if (lowerTranscript.includes('help')) {
      return `I can help you with various tasks. As a ${agent.object_type}, I specialize in providing assistance related to my area of expertise. What would you like to know?`;
    }
    
    if (lowerTranscript.includes('directions')) {
      return "I can provide audio directions to nearby locations. Where would you like to go from here?";
    }
    
    // Agent type specific responses
    switch (agent.object_type) {
      case 'Home Personal':
        return "I can help control your smart home devices, check your schedule, set reminders, and provide weather updates. What would you like me to do?";
      case 'Landmark':
        return `This landmark has significant historical importance. ${agent.name} attracts many visitors who come to learn about its heritage and cultural significance.`;
      case 'Tutor/Teacher':
        return "I'm here to help you learn! You can ask me questions about any subject, request explanations, or have me quiz you on topics you're studying.";
      case 'Local Services':
        return "I know about all the local businesses and services in this area. I can recommend restaurants, shops, or help you find specific services you need.";
      default:
        return `Thank you for talking with me! As a ${agent.object_type}, I'm here to assist you. Is there anything specific you'd like to know or do?`;
    }
  };

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled);
    if (isSpeaking && !audioEnabled) {
      // If enabling audio while speaking, restart the speech
      speakMessage(lastResponse);
    }
  };

  const stopSpeaking = () => {
    setIsSpeaking(false);
    console.log('🔇 Stopped speaking');
  };

  return (
    <View style={styles.container}>
      {/* Voice Status */}
      <View style={styles.statusContainer}>
        <View style={styles.agentInfo}>
          <Text style={styles.agentName}>{agent.name}</Text>
          <Text style={styles.agentType}>Voice Interface</Text>
        </View>
        
        <View style={styles.statusIndicators}>
          <View style={[styles.statusDot, { backgroundColor: isListening ? '#ef4444' : '#6b7280' }]} />
          <Text style={styles.statusText}>
            {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Ready'}
          </Text>
        </View>
      </View>

      {/* Voice Visualization */}
      <View style={styles.visualizationContainer}>
        <View style={[
          styles.voiceCircle,
          isListening && styles.listeningCircle,
          isSpeaking && styles.speakingCircle,
        ]}>
          {isListening ? (
            <Mic size={48} color="#ef4444" strokeWidth={2} />
          ) : isSpeaking ? (
            <Volume2 size={48} color="#00d4ff" strokeWidth={2} />
          ) : (
            <Mic size={48} color="#6b7280" strokeWidth={2} />
          )}
        </View>
        
        {(isListening || isSpeaking) && (
          <View style={styles.waveContainer}>
            {[...Array(5)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.waveBar,
                  {
                    height: Math.random() * 40 + 10,
                    backgroundColor: isListening ? '#ef4444' : '#00d4ff',
                  }
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Conversation Display */}
      <View style={styles.conversationContainer}>
        {lastTranscript && (
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptLabel}>You said:</Text>
            <Text style={styles.transcriptText}>"{lastTranscript}"</Text>
          </View>
        )}
        
        {lastResponse && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseLabel}>{agent.name} responded:</Text>
            <Text style={styles.responseText}>"{lastResponse}"</Text>
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={styles.audioButton}
          onPress={toggleAudio}
        >
          {audioEnabled ? (
            <Volume2 size={24} color="#374151" strokeWidth={2} />
          ) : (
            <VolumeX size={24} color="#ef4444" strokeWidth={2} />
          )}
          <Text style={styles.controlLabel}>
            {audioEnabled ? 'Audio On' : 'Audio Off'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.micButton,
            isListening && styles.micButtonActive,
            (isSpeaking || !audioEnabled) && styles.micButtonDisabled,
          ]}
          onPress={isListening ? stopListening : startListening}
          disabled={isSpeaking || !audioEnabled}
        >
          {isListening ? (
            <MicOff size={32} color="#fff" strokeWidth={2} />
          ) : (
            <Mic size={32} color="#fff" strokeWidth={2} />
          )}
        </TouchableOpacity>

        {isSpeaking && (
          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopSpeaking}
          >
            <Square size={24} color="#374151" strokeWidth={2} />
            <Text style={styles.controlLabel}>Stop</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>Voice Commands</Text>
        <Text style={styles.instructionsText}>
          • Tap the microphone to start talking{'\n'}
          • Ask questions or request information{'\n'}
          • I'll respond with voice and text{'\n'}
          • Toggle audio on/off as needed
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
  
  // Status
  statusContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  agentInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  agentName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  agentType: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  
  // Visualization
  visualizationContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  voiceCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  listeningCircle: {
    backgroundColor: '#fef2f2',
    borderWidth: 3,
    borderColor: '#ef4444',
  },
  speakingCircle: {
    backgroundColor: '#eff6ff',
    borderWidth: 3,
    borderColor: '#00d4ff',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 50,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    opacity: 0.7,
  },
  
  // Conversation
  conversationContainer: {
    marginBottom: 32,
  },
  transcriptContainer: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  transcriptLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1d4ed8',
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 16,
    color: '#1e40af',
    fontStyle: 'italic',
  },
  responseContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 16,
    color: '#15803d',
    lineHeight: 24,
  },
  
  // Controls
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 32,
  },
  audioButton: {
    alignItems: 'center',
    gap: 8,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  micButtonActive: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  micButtonDisabled: {
    backgroundColor: '#9ca3af',
    shadowColor: '#9ca3af',
  },
  stopButton: {
    alignItems: 'center',
    gap: 8,
  },
  controlLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  
  // Instructions
  instructionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  instructionsText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
});