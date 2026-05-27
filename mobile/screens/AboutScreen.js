import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import ScreenWrapper from '../components/ScreenWrapper';


export default function AboutScreen() {
  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>About Run Girl</Text>
      <Text style={styles.lead}>
        Run Girl is a community-driven platform built for women who want to run together, stay safe, and support each other.
      </Text>
      <Text style={styles.sectionTitle}>Features</Text>
      <View style={styles.bulletRow}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>Track your runs with detailed stats</Text></View>
      <View style={styles.bulletRow}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>Connect with friends and follow other runners</Text></View>
      <View style={styles.bulletRow}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>Manage notifications, follow requests, and scheduled runs</Text></View>
      <View style={styles.bulletRow}><Text style={styles.bullet}>•</Text><Text style={styles.bulletText}>Create and recap your runs from the app</Text></View>
    </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff5fb' },
  contentContainer: { padding: 24, paddingBottom: 32 },
  title: { fontSize: 32, fontWeight: '800', color: '#163e8a', marginBottom: 16 },
  lead: { fontSize: 16, color: '#5e6a88', lineHeight: 24, marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#163e8a', marginBottom: 14 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  bullet: { color: '#ff69b4', marginRight: 8, fontSize: 18 },
  bulletText: { color: '#5e6a88', fontSize: 16, lineHeight: 24, flex: 1 }
});
