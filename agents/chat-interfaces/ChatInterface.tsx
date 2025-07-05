import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Send, ArrowLeft } from 'lucide-react-native';
import { DeployedObject } from '@/types/database';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: Date;
}

interface ChatInterfaceProps {
  agent: DeployedObject;
  onBack: () => void;
}

export default function ChatInterface({ agent, onBack }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage = getWelcomeMessage();
    setMessages([{
      id: '1',
      text: welcomeMessage,
      sender: 'agent',
      timestamp: new Date(),
    }]);
  }, [agent]);

  const getWelcomeMessage = () => {
    switch (agent.object_type) {
      case 'Home Personal':
        return `Hi! I'm ${agent.name}, your personal home assistant. How can I help you today?`;
      case 'Landmark':
        return `Welcome to ${agent.name}! I can provide information about this location and help with directions.`;
      case 'Intelligent Assistant':
        return `Hello! I'm ${agent.name}, your AI assistant. I'm here to help answer questions and assist with various tasks.`;
      case 'Content Creator':
        return `Hey there! I'm ${agent.name}, a content creator. Want to see my latest work or collaborate on something?`;
      case 'Local Services':
        return `Welcome! I'm ${agent.name} from local services. How can I assist you with local information or services?`;
      case 'Tutor/Teacher':
        return `Hello student! I'm ${agent.name}, your tutor. What would you like to learn about today?`;
      case '3D World Modelling':
        return `Greetings! I'm ${agent.name}, specializing in 3D world modeling. Need help with spatial visualization?`;
      case 'Game Agent':
        return `Hey player! I'm ${agent.name}. Ready for some fun? Let's play a game or explore together!`;
      default:
        return `Hello! I'm ${agent.name}. How can I help you today?`;
    }
  };

  const generateAgentResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Common responses
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return `Hello! Nice to meet you. I'm ${agent.name}. What brings you here today?`;
    }
    
    if (lowerMessage.includes('help')) {
      return `I'd be happy to help! As a ${agent.object_type}, I can assist with various tasks. What specifically do you need help with?`;
    }

    if (lowerMessage.includes('location') || lowerMessage.includes('where')) {
      return `I'm located at coordinates ${agent.latitude.toFixed(6)}, ${agent.longitude.toFixed(6)}. You're currently ${(agent.distance_meters || 0).toFixed(1)} meters away from me.`;
    }

    // Agent type specific responses
    switch (agent.object_type) {
      case 'Home Personal':
        if (lowerMessage.includes('weather')) {
          return "Let me check the weather for you... It's currently 72°F and sunny! Perfect day to be outside.";
        }
        if (lowerMessage.includes('schedule') || lowerMessage.includes('calendar')) {
          return "I can help manage your schedule! Would you like me to check your upcoming appointments or add a new event?";
        }
        return "As your personal assistant, I can help with weather, schedules, reminders, and home automation. What would you like to know?";

      case 'Landmark':
        if (lowerMessage.includes('history')) {
          return `This landmark has a rich history! ${agent.name} has been here for many years and is significant to the local community.`;
        }
        if (lowerMessage.includes('directions')) {
          return "I can help you navigate around this area! Where would you like to go from here?";
        }
        return "I can provide information about this landmark, its history, nearby attractions, and directions. What interests you?";

      case 'Intelligent Assistant':
        if (lowerMessage.includes('calculate') || lowerMessage.includes('math')) {
          return "I can help with calculations and mathematical problems! What would you like me to calculate?";
        }
        if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
          return "I can help you search for information! What are you looking for?";
        }
        return "I'm here to assist with questions, calculations, research, and general problem-solving. How can I help?";

      case 'Tutor/Teacher':
        if (lowerMessage.includes('learn') || lowerMessage.includes('teach')) {
          return "Excellent! I love helping people learn. What subject or topic would you like to explore today?";
        }
        if (lowerMessage.includes('question')) {
          return "Questions are great for learning! Feel free to ask me anything you're curious about.";
        }
        return "I'm here to help you learn and grow! What subject interests you, or do you have any questions I can help answer?";

      case 'Local Services':
        if (lowerMessage.includes('restaurant') || lowerMessage.includes('food')) {
          return "There are several great restaurants nearby! I can recommend some local favorites based on your preferences.";
        }
        if (lowerMessage.includes('shop') || lowerMessage.includes('store')) {
          return "I know all the local shops and services in this area! What type of store are you looking for?";
        }
        return "I can help you find local restaurants, shops, services, and attractions in this area. What are you looking for?";

      default:
        return `That's interesting! As a ${agent.object_type}, I'm here to help. Could you tell me more about what you need?`;
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate agent thinking time
    setTimeout(() => {
      const agentResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: generateAgentResponse(userMessage.text),
        sender: 'agent',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, agentResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 2000); // 1-3 second delay
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.sender === 'user' ? styles.userMessage : styles.agentMessage,
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                message.sender === 'user' ? styles.userBubble : styles.agentBubble,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.sender === 'user' ? styles.userText : styles.agentText,
                ]}
              >
                {message.text}
              </Text>
            </View>
            <Text style={styles.timestamp}>
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        ))}

        {isTyping && (
          <View style={[styles.messageContainer, styles.agentMessage]}>
            <View style={[styles.messageBubble, styles.agentBubble]}>
              <View style={styles.typingIndicator}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={`Message ${agent.name}...`}
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Send size={20} color={inputText.trim() ? "#fff" : "#9ca3af"} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  
  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  agentMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 4,
  },
  userBubble: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  agentBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  agentText: {
    color: '#374151',
  },
  timestamp: {
    fontSize: 12,
    color: '#9ca3af',
    marginHorizontal: 16,
  },
  
  // Typing Indicator
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9ca3af',
  },
  
  // Input
  inputContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#f3f4f6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
});