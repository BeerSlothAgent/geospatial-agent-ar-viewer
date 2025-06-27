import React from 'react';
import { View, StyleSheet } from 'react-native';
import DatabaseListView from '@/components/database/DatabaseListView';

export default function DatabaseScreen() {
  return (
    <View style={styles.container}>
      <DatabaseListView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
});