import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Filter, X, MapPin, Eye, Clock } from 'lucide-react-native';

interface AgentFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
  onClose: () => void;
  visible: boolean;
}

interface FilterOptions {
  types: string[];
  maxDistance: number;
  showInactive: boolean;
  sortBy: 'distance' | 'name' | 'created';
}

const AGENT_TYPES = [
  { id: 'Home Personal', label: 'Home Personal', emoji: '🏠' },
  { id: 'Landmark', label: 'Landmark', emoji: '📍' },
  { id: 'Intelligent Assistant', label: 'Intelligent Assistant', emoji: '🤖' },
  { id: 'Content Creator', label: 'Content Creator', emoji: '🎨' },
  { id: 'Local Services', label: 'Local Services', emoji: '🏪' },
  { id: 'Tutor/Teacher', label: 'Tutor/Teacher', emoji: '👨‍🏫' },
  { id: '3D World Modelling', label: '3D World Modelling', emoji: '🌍' },
  { id: 'Game Agent', label: 'Game Agent', emoji: '🎮' },
];

const DISTANCE_OPTIONS = [
  { value: 10, label: '10m' },
  { value: 25, label: '25m' },
  { value: 50, label: '50m' },
  { value: 100, label: '100m' },
  { value: 500, label: '500m' },
];

const SORT_OPTIONS = [
  { value: 'distance', label: 'Distance', icon: <MapPin size={16} color="#6b7280" strokeWidth={2} /> },
  { value: 'name', label: 'Name', icon: <Filter size={16} color="#6b7280" strokeWidth={2} /> },
  { value: 'created', label: 'Created', icon: <Clock size={16} color="#6b7280" strokeWidth={2} /> },
];

export default function AgentFilter({ onFilterChange, onClose, visible }: AgentFilterProps) {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState(50);
  const [showInactive, setShowInactive] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'name' | 'created'>('distance');

  if (!visible) return null;

  const toggleType = (typeId: string) => {
    setSelectedTypes(prev => 
      prev.includes(typeId) 
        ? prev.filter(id => id !== typeId)
        : [...prev, typeId]
    );
  };

  const applyFilters = () => {
    const filters: FilterOptions = {
      types: selectedTypes,
      maxDistance,
      showInactive,
      sortBy,
    };
    onFilterChange(filters);
    onClose();
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setMaxDistance(50);
    setShowInactive(false);
    setSortBy('distance');
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Filter Agents</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#374151" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Agent Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Agent Types</Text>
            <View style={styles.typeGrid}>
              {AGENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeItem,
                    selectedTypes.includes(type.id) && styles.typeItemSelected,
                  ]}
                  onPress={() => toggleType(type.id)}
                >
                  <Text style={styles.typeEmoji}>{type.emoji}</Text>
                  <Text style={[
                    styles.typeLabel,
                    selectedTypes.includes(type.id) && styles.typeLabelSelected,
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Distance Filter */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Maximum Distance</Text>
            <View style={styles.distanceOptions}>
              {DISTANCE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.distanceOption,
                    maxDistance === option.value && styles.distanceOptionSelected,
                  ]}
                  onPress={() => setMaxDistance(option.value)}
                >
                  <Text style={[
                    styles.distanceLabel,
                    maxDistance === option.value && styles.distanceLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Sort Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sort By</Text>
            <View style={styles.sortOptions}>
              {SORT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    sortBy === option.value && styles.sortOptionSelected,
                  ]}
                  onPress={() => setSortBy(option.value as any)}
                >
                  {option.icon}
                  <Text style={[
                    styles.sortLabel,
                    sortBy === option.value && styles.sortLabelSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Additional Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Options</Text>
            <TouchableOpacity
              style={styles.toggleOption}
              onPress={() => setShowInactive(!showInactive)}
            >
              <View style={styles.toggleContent}>
                <Eye size={20} color="#6b7280" strokeWidth={2} />
                <Text style={styles.toggleLabel}>Show Inactive Agents</Text>
              </View>
              <View style={[
                styles.toggle,
                showInactive && styles.toggleActive,
              ]}>
                <View style={[
                  styles.toggleThumb,
                  showInactive && styles.toggleThumbActive,
                ]} />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  
  // Agent Types
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 6,
  },
  typeItemSelected: {
    backgroundColor: '#ede9fe',
    borderColor: '#9333ea',
  },
  typeEmoji: {
    fontSize: 16,
  },
  typeLabel: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  typeLabelSelected: {
    color: '#7c3aed',
  },
  
  // Distance
  distanceOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  distanceOption: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  distanceOptionSelected: {
    backgroundColor: '#ede9fe',
    borderColor: '#9333ea',
  },
  distanceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  distanceLabelSelected: {
    color: '#7c3aed',
  },
  
  // Sort
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 12,
  },
  sortOptionSelected: {
    backgroundColor: '#ede9fe',
    borderColor: '#9333ea',
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  sortLabelSelected: {
    color: '#7c3aed',
  },
  
  // Toggle
  toggleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#374151',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#9333ea',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  
  // Actions
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  applyButton: {
    flex: 2,
    backgroundColor: '#9333ea',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});