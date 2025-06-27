import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import {
  Settings as SettingsIcon,
  Camera,
  MapPin,
  Zap,
  Shield,
  Info,
  ChevronRight,
  Bell,
  Eye,
  Smartphone,
} from 'lucide-react-native';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [locationAccuracy, setLocationAccuracy] = useState(true);
  const [performanceMode, setPerformanceMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear all cached 3D models and location data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => {
          // TODO: Implement cache clearing
          console.log('Cache cleared');
        }},
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all settings to their default values. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => {
          setNotifications(true);
          setLocationAccuracy(true);
          setPerformanceMode(false);
          setDebugMode(false);
        }},
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <SettingsIcon size={24} color="#00d4ff" strokeWidth={2} />
        </View>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>
          Configure your AR experience
        </Text>
      </View>

      {/* AR Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AR Experience</Text>
        
        <SettingItem
          icon={<Camera size={20} color="#00d4ff" strokeWidth={2} />}
          title="Camera Quality"
          subtitle="High quality for better AR tracking"
          type="navigation"
          onPress={() => console.log('Camera settings')}
        />
        
        <SettingItem
          icon={<Eye size={20} color="#00d4ff" strokeWidth={2} />}
          title="Object Visibility"
          subtitle="Maximum distance for AR objects"
          type="navigation"
          onPress={() => console.log('Visibility settings')}
        />
        
        <SettingItem
          icon={<Zap size={20} color="#00d4ff" strokeWidth={2} />}
          title="Performance Mode"
          subtitle="Optimize for battery life"
          type="toggle"
          value={performanceMode}
          onToggle={setPerformanceMode}
        />
      </View>

      {/* Location Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location & Precision</Text>
        
        <SettingItem
          icon={<MapPin size={20} color="#00d4ff" strokeWidth={2} />}
          title="High Precision GPS"
          subtitle="Use GEODNET-corrected coordinates"
          type="toggle"
          value={locationAccuracy}
          onToggle={setLocationAccuracy}
        />
        
        <SettingItem
          icon={<Shield size={20} color="#00d4ff" strokeWidth={2} />}
          title="Location Privacy"
          subtitle="Manage location data sharing"
          type="navigation"
          onPress={() => console.log('Privacy settings')}
        />
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <SettingItem
          icon={<Bell size={20} color="#00d4ff" strokeWidth={2} />}
          title="Push Notifications"
          subtitle="Get notified about nearby AR objects"
          type="toggle"
          value={notifications}
          onToggle={setNotifications}
        />
      </View>

      {/* Developer Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Developer</Text>
        
        <SettingItem
          icon={<Info size={20} color="#00d4ff" strokeWidth={2} />}
          title="Debug Mode"
          subtitle="Show technical information"
          type="toggle"
          value={debugMode}
          onToggle={setDebugMode}
        />
        
        <SettingItem
          icon={<Smartphone size={20} color="#00d4ff" strokeWidth={2} />}
          title="Device Information"
          subtitle="View device capabilities"
          type="navigation"
          onPress={() => console.log('Device info')}
        />
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleClearCache}>
          <Text style={styles.actionButtonText}>Clear Cache</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.dangerButton]} 
          onPress={handleResetSettings}
        >
          <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
            Reset All Settings
          </Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoTitle}>AR Viewer</Text>
        <Text style={styles.appInfoVersion}>Version 1.0.0</Text>
        <Text style={styles.appInfoBuild}>Build 2025.01.27</Text>
      </View>
    </ScrollView>
  );
}

// Setting Item Component
function SettingItem({ 
  icon, 
  title, 
  subtitle, 
  type, 
  value, 
  onToggle, 
  onPress 
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  type: 'toggle' | 'navigation';
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={type === 'navigation' ? onPress : undefined}
      activeOpacity={type === 'navigation' ? 0.7 : 1}
    >
      <View style={styles.settingIcon}>
        {icon}
      </View>
      
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingSubtitle}>{subtitle}</Text>
      </View>
      
      <View style={styles.settingAction}>
        {type === 'toggle' ? (
          <Switch
            value={value}
            onValueChange={onToggle}
            trackColor={{ false: '#333', true: '#00d4ff40' }}
            thumbColor={value ? '#00d4ff' : '#666'}
          />
        ) : (
          <ChevronRight size={20} color="#666" strokeWidth={2} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  
  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: '#00d4ff20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#aaa',
    textAlign: 'center',
  },
  
  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  
  // Setting Items
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#00d4ff20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  settingAction: {
    marginLeft: 16,
  },
  
  // Action Buttons
  actionButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00d4ff',
  },
  dangerButton: {
    borderColor: '#ff6b35',
  },
  dangerButtonText: {
    color: '#ff6b35',
  },
  
  // App Info
  appInfo: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  appInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  appInfoVersion: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 2,
  },
  appInfoBuild: {
    fontSize: 12,
    color: '#666',
  },
});