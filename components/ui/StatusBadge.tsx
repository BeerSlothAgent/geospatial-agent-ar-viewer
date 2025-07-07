import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CircleCheck as CheckCircle, CircleAlert as AlertCircle, Clock } from 'lucide-react-native';

interface StatusBadgeProps {
  status: 'success' | 'error' | 'pending';
  text: string;
  size?: 'small' | 'medium' | 'large';
}

export default function StatusBadge({ 
  status, 
  text, 
  size = 'medium' 
}: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'success':
        return {
          backgroundColor: 'rgba(0, 236, 151, 0.2)',
          borderColor: '#00EC97',
          textColor: '#00EC97',
          icon: <CheckCircle size={16} color="#00EC97" strokeWidth={2} />,
        };
      case 'error':
        return {
          backgroundColor: '#ff6b3520',
          borderColor: '#ff6b35',
          textColor: '#ff6b35',
          icon: <AlertCircle size={16} color="#ff6b35" strokeWidth={2} />,
        };
      case 'pending':
        return {
          backgroundColor: 'rgba(0, 102, 255, 0.2)',
          borderColor: '#0066FF',
          textColor: '#0066FF',
          icon: <Clock size={16} color="#0066FF" strokeWidth={2} />,
        };
    }
  };

  const config = getStatusConfig();
  const sizeStyles = styles[size];

  return (
    <View
      style={[
        styles.badge,
        sizeStyles.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
      ]}
    >
      {config.icon}
      <Text
        style={[
          styles.text,
          sizeStyles.text,
          { color: config.textColor },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    gap: 6,
  },
  text: {
    fontWeight: '600',
  },
  
  // Size variants
  small: {
    container: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    text: {
      fontSize: 12,
    },
  },
  medium: {
    container: {
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    text: {
      fontSize: 14,
    },
  },
  large: {
    container: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    text: {
      fontSize: 16,
    },
  },
});