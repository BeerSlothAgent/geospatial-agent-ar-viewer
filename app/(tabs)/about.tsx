import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import {
  Info,
  Globe,
  Github,
  Mail,
  ExternalLink,
  Users,
  Target,
  Zap,
  Shield,
} from 'lucide-react-native';

export default function AboutPage() {
  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Info size={32} color="#00d4ff" strokeWidth={2} />
          </View>
          <Text style={styles.appName}>AR Viewer</Text>
          <Text style={styles.tagline}>Geospatial AR Experience</Text>
        </View>
      </View>

      {/* Mission */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Mission</Text>
        <Text style={styles.missionText}>
          To create the most precise and reliable augmented reality experience for viewing 3D objects at exact real-world coordinates, serving as the foundation for location-based AR applications.
        </Text>
      </View>

      {/* Key Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Key Features</Text>
        
        <View style={styles.featuresList}>
          <FeatureItem
            icon={<Target size={20} color="#00d4ff" strokeWidth={2} />}
            title="Millimeter Precision"
            description="GEODNET-corrected GPS coordinates for unmatched accuracy"
          />
          
          <FeatureItem
            icon={<Zap size={20} color="#00d4ff" strokeWidth={2} />}
            title="High Performance"
            description="Optimized for smooth 60fps AR experience across devices"
          />
          
          <FeatureItem
            icon={<Shield size={20} color="#00d4ff" strokeWidth={2} />}
            title="Privacy First"
            description="Your location data is processed securely and never stored"
          />
          
          <FeatureItem
            icon={<Globe size={20} color="#00d4ff" strokeWidth={2} />}
            title="Cross Platform"
            description="Works seamlessly on mobile, tablet, and web browsers"
          />
        </View>
      </View>

      {/* Technology */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Technology Stack</Text>
        
        <View style={styles.techGrid}>
          <TechItem title="React Native" subtitle="Cross-platform framework" />
          <TechItem title="Expo" subtitle="Development platform" />
          <TechItem title="WebXR" subtitle="AR capabilities" />
          <TechItem title="Supabase" subtitle="Backend services" />
          <TechItem title="PostGIS" subtitle="Geospatial database" />
          <TechItem title="GEODNET" subtitle="Precision GPS" />
        </View>
      </View>

      {/* Team */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Development Team</Text>
        
        <View style={styles.teamCard}>
          <Users size={24} color="#00d4ff" strokeWidth={2} />
          <Text style={styles.teamTitle}>AgentSphere Development Team</Text>
          <Text style={styles.teamDescription}>
            A dedicated team of AR developers, geospatial engineers, and UX designers working to push the boundaries of location-based augmented reality.
          </Text>
        </View>
      </View>

      {/* Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Links & Resources</Text>
        
        <LinkItem
          icon={<Globe size={20} color="#00d4ff" strokeWidth={2} />}
          title="Official Website"
          subtitle="Learn more about AgentSphere"
          onPress={() => handleOpenLink('https://agentsphere.com')}
        />
        
        <LinkItem
          icon={<Github size={20} color="#00d4ff" strokeWidth={2} />}
          title="Source Code"
          subtitle="View on GitHub"
          onPress={() => handleOpenLink('https://github.com/agentsphere/ar-viewer')}
        />
        
        <LinkItem
          icon={<Mail size={20} color="#00d4ff" strokeWidth={2} />}
          title="Contact Support"
          subtitle="Get help with AR Viewer"
          onPress={() => handleOpenLink('mailto:support@agentsphere.com')}
        />
      </View>

      {/* Legal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        
        <TouchableOpacity style={styles.legalItem}>
          <Text style={styles.legalText}>Privacy Policy</Text>
          <ExternalLink size={16} color="#666" strokeWidth={2} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.legalItem}>
          <Text style={styles.legalText}>Terms of Service</Text>
          <ExternalLink size={16} color="#666" strokeWidth={2} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.legalItem}>
          <Text style={styles.legalText}>Open Source Licenses</Text>
          <ExternalLink size={16} color="#666" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Version Info */}
      <View style={styles.versionInfo}>
        <Text style={styles.versionTitle}>Version Information</Text>
        <View style={styles.versionDetails}>
          <Text style={styles.versionItem}>App Version: 1.0.0</Text>
          <Text style={styles.versionItem}>Build: 2025.01.27</Text>
          <Text style={styles.versionItem}>Platform: {require('react-native').Platform.OS}</Text>
          <Text style={styles.versionItem}>Expo SDK: 52.0.30</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2025 AgentSphere. All rights reserved.
        </Text>
        <Text style={styles.footerSubtext}>
          Built with ❤️ for the AR community
        </Text>
      </View>
    </ScrollView>
  );
}

// Feature Item Component
function FeatureItem({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        {icon}
      </View>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

// Tech Item Component
function TechItem({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.techItem}>
      <Text style={styles.techTitle}>{title}</Text>
      <Text style={styles.techSubtitle}>{subtitle}</Text>
    </View>
  );
}

// Link Item Component
function LinkItem({ icon, title, subtitle, onPress }: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.linkItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.linkIcon}>
        {icon}
      </View>
      <View style={styles.linkContent}>
        <Text style={styles.linkTitle}>{title}</Text>
        <Text style={styles.linkSubtitle}>{subtitle}</Text>
      </View>
      <ExternalLink size={16} color="#666" strokeWidth={2} />
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
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#00d4ff20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#00d4ff',
    fontWeight: '500',
  },
  
  // Sections
  section: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
  },
  
  // Mission
  missionText: {
    fontSize: 16,
    color: '#aaa',
    lineHeight: 24,
    textAlign: 'center',
  },
  
  // Features
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#00d4ff20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#aaa',
    lineHeight: 20,
  },
  
  // Technology
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  techItem: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    minWidth: '45%',
  },
  techTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  techSubtitle: {
    fontSize: 12,
    color: '#aaa',
  },
  
  // Team
  teamCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  teamTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
    marginBottom: 12,
  },
  teamDescription: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Links
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  linkIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#00d4ff20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  linkSubtitle: {
    fontSize: 14,
    color: '#aaa',
  },
  
  // Legal
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  legalText: {
    fontSize: 16,
    color: '#aaa',
  },
  
  // Version Info
  versionInfo: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  versionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  versionDetails: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  versionItem: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  
  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 12,
    color: '#444',
  },
});