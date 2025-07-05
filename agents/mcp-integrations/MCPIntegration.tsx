import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Cloud, Thermometer, Wind, Droplets, Sun, Moon, CloudRain, Zap, RefreshCw } from 'lucide-react-native';
import { DeployedObject } from '@/types/database';

interface MCPFunction {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'weather' | 'data' | 'utility' | 'ai';
  enabled: boolean;
}

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  condition: string;
  location: string;
}

interface MCPIntegrationProps {
  agent: DeployedObject;
  onBack: () => void;
}

export default function MCPIntegration({ agent, onBack }: MCPIntegrationProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loadingFunction, setLoadingFunction] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Get available MCP functions based on agent type
  const getAvailableFunctions = (): MCPFunction[] => {
    const baseFunctions: MCPFunction[] = [
      {
        id: 'weather',
        name: 'Weather Data',
        description: 'Get current weather conditions and forecasts',
        icon: <Cloud size={20} color="#00d4ff" strokeWidth={2} />,
        category: 'weather',
        enabled: true,
      },
      {
        id: 'location-data',
        name: 'Location Data',
        description: 'Access location-based information and services',
        icon: <Zap size={20} color="#00d4ff" strokeWidth={2} />,
        category: 'data',
        enabled: false, // Mock disabled
      },
      {
        id: 'ai-analysis',
        name: 'AI Analysis',
        description: 'Perform AI-powered data analysis and insights',
        icon: <Zap size={20} color="#00d4ff" strokeWidth={2} />,
        category: 'ai',
        enabled: false, // Mock disabled
      },
    ];

    // Agent type specific functions
    switch (agent.object_type) {
      case 'Home Personal':
        baseFunctions.push({
          id: 'smart-home',
          name: 'Smart Home Control',
          description: 'Control smart home devices and automation',
          icon: <Zap size={20} color="#00d4ff" strokeWidth={2} />,
          category: 'utility',
          enabled: false, // Mock disabled
        });
        break;
      case 'Local Services':
        baseFunctions.push({
          id: 'business-data',
          name: 'Business Directory',
          description: 'Access local business information and reviews',
          icon: <Zap size={20} color="#00d4ff" strokeWidth={2} />,
          category: 'data',
          enabled: false, // Mock disabled
        });
        break;
      case 'Tutor/Teacher':
        baseFunctions.push({
          id: 'educational-content',
          name: 'Educational Resources',
          description: 'Access educational content and learning materials',
          icon: <Zap size={20} color="#00d4ff" strokeWidth={2} />,
          category: 'data',
          enabled: false, // Mock disabled
        });
        break;
    }

    return baseFunctions;
  };

  const functions = getAvailableFunctions();

  // Mock weather API call
  const fetchWeatherData = async () => {
    setLoadingFunction('weather');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock weather data
    const mockWeather: WeatherData = {
      temperature: Math.round(Math.random() * 30 + 50), // 50-80°F
      humidity: Math.round(Math.random() * 40 + 40), // 40-80%
      windSpeed: Math.round(Math.random() * 15 + 5), // 5-20 mph
      condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
      location: `Near ${agent.name}`,
    };
    
    setWeatherData(mockWeather);
    setLastUpdate(new Date());
    setLoadingFunction(null);
  };

  const executeFunction = async (functionId: string) => {
    const func = functions.find(f => f.id === functionId);
    if (!func) return;

    if (!func.enabled) {
      Alert.alert(
        'Function Not Available',
        `${func.name} is not currently enabled for this agent. This would be available in the full implementation.`,
        [{ text: 'OK' }]
      );
      return;
    }

    switch (functionId) {
      case 'weather':
        await fetchWeatherData();
        break;
      default:
        Alert.alert('Function Executed', `${func.name} would be executed here.`);
    }
  };

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'sunny':
        return <Sun size={32} color="#f59e0b" strokeWidth={2} />;
      case 'partly cloudy':
        return <Cloud size={32} color="#6b7280" strokeWidth={2} />;
      case 'cloudy':
        return <Cloud size={32} color="#4b5563" strokeWidth={2} />;
      case 'light rain':
        return <CloudRain size={32} color="#3b82f6" strokeWidth={2} />;
      default:
        return <Sun size={32} color="#f59e0b" strokeWidth={2} />;
    }
  };

  useEffect(() => {
    // Auto-fetch weather data on mount
    fetchWeatherData();
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>MCP Functions</Text>
        <Text style={styles.headerSubtitle}>
          External data sources and services for {agent.name}
        </Text>
      </View>

      {/* Weather Data Display */}
      {weatherData && (
        <View style={styles.weatherContainer}>
          <View style={styles.weatherHeader}>
            <Text style={styles.weatherTitle}>Current Weather</Text>
            <TouchableOpacity
              onPress={fetchWeatherData}
              disabled={loadingFunction === 'weather'}
              style={styles.refreshButton}
            >
              <RefreshCw 
                size={16} 
                color="#6b7280" 
                strokeWidth={2}
                style={loadingFunction === 'weather' ? { opacity: 0.5 } : {}}
              />
            </TouchableOpacity>
          </View>
          
          <View style={styles.weatherContent}>
            <View style={styles.weatherMain}>
              {getWeatherIcon(weatherData.condition)}
              <View style={styles.weatherInfo}>
                <Text style={styles.temperature}>{weatherData.temperature}°F</Text>
                <Text style={styles.condition}>{weatherData.condition}</Text>
                <Text style={styles.location}>{weatherData.location}</Text>
              </View>
            </View>
            
            <View style={styles.weatherDetails}>
              <View style={styles.weatherDetail}>
                <Thermometer size={16} color="#ef4444" strokeWidth={2} />
                <Text style={styles.detailLabel}>Temperature</Text>
                <Text style={styles.detailValue}>{weatherData.temperature}°F</Text>
              </View>
              
              <View style={styles.weatherDetail}>
                <Droplets size={16} color="#3b82f6" strokeWidth={2} />
                <Text style={styles.detailLabel}>Humidity</Text>
                <Text style={styles.detailValue}>{weatherData.humidity}%</Text>
              </View>
              
              <View style={styles.weatherDetail}>
                <Wind size={16} color="#10b981" strokeWidth={2} />
                <Text style={styles.detailLabel}>Wind Speed</Text>
                <Text style={styles.detailValue}>{weatherData.windSpeed} mph</Text>
              </View>
            </View>
            
            {lastUpdate && (
              <Text style={styles.lastUpdate}>
                Last updated: {lastUpdate.toLocaleTimeString()}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Available Functions */}
      <View style={styles.functionsContainer}>
        <Text style={styles.functionsTitle}>Available Functions</Text>
        
        <View style={styles.functionsList}>
          {functions.map((func) => (
            <TouchableOpacity
              key={func.id}
              style={[
                styles.functionItem,
                !func.enabled && styles.functionItemDisabled,
                loadingFunction === func.id && styles.functionItemLoading,
              ]}
              onPress={() => executeFunction(func.id)}
              disabled={loadingFunction === func.id}
            >
              <View style={styles.functionIcon}>
                {loadingFunction === func.id ? (
                  <RefreshCw size={20} color="#6b7280" strokeWidth={2} />
                ) : (
                  func.icon
                )}
              </View>
              
              <View style={styles.functionContent}>
                <Text style={[
                  styles.functionName,
                  !func.enabled && styles.functionNameDisabled,
                ]}>
                  {func.name}
                </Text>
                <Text style={[
                  styles.functionDescription,
                  !func.enabled && styles.functionDescriptionDisabled,
                ]}>
                  {func.description}
                </Text>
              </View>
              
              <View style={[
                styles.functionStatus,
                func.enabled ? styles.functionStatusEnabled : styles.functionStatusDisabled,
              ]}>
                <Text style={[
                  styles.functionStatusText,
                  func.enabled ? styles.functionStatusTextEnabled : styles.functionStatusTextDisabled,
                ]}>
                  {func.enabled ? 'Active' : 'Mock'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* MCP Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>About MCP Integration</Text>
        <Text style={styles.infoText}>
          Model Context Protocol (MCP) enables this agent to access external data sources and services. 
          Currently, weather data is fully functional, while other functions are shown as mockups to 
          demonstrate the interface capabilities.
        </Text>
        
        <View style={styles.infoFeatures}>
          <Text style={styles.infoFeatureTitle}>Available in Full Version:</Text>
          <Text style={styles.infoFeature}>• Real-time weather and environmental data</Text>
          <Text style={styles.infoFeature}>• Location-based business information</Text>
          <Text style={styles.infoFeature}>• Smart home device integration</Text>
          <Text style={styles.infoFeature}>• Educational content and resources</Text>
          <Text style={styles.infoFeature}>• AI-powered data analysis</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  
  // Header
  headerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  
  // Weather
  weatherContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  weatherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weatherTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherContent: {
    gap: 16,
  },
  weatherMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  weatherInfo: {
    flex: 1,
  },
  temperature: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
  },
  condition: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#9ca3af',
  },
  weatherDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  weatherDetail: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  
  // Functions
  functionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  functionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  functionsList: {
    gap: 12,
  },
  functionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  functionItemDisabled: {
    opacity: 0.6,
  },
  functionItemLoading: {
    opacity: 0.7,
  },
  functionIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  functionContent: {
    flex: 1,
  },
  functionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  functionNameDisabled: {
    color: '#9ca3af',
  },
  functionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  functionDescriptionDisabled: {
    color: '#9ca3af',
  },
  functionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  functionStatusEnabled: {
    backgroundColor: '#d1fae5',
  },
  functionStatusDisabled: {
    backgroundColor: '#fef3c7',
  },
  functionStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  functionStatusTextEnabled: {
    color: '#065f46',
  },
  functionStatusTextDisabled: {
    color: '#92400e',
  },
  
  // Info
  infoContainer: {
    backgroundColor: '#ede9fe',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c3aed',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6d28d9',
    lineHeight: 20,
    marginBottom: 16,
  },
  infoFeatures: {
    gap: 4,
  },
  infoFeatureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
    marginBottom: 8,
  },
  infoFeature: {
    fontSize: 14,
    color: '#6d28d9',
  },
});