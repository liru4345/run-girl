import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ScreenWrapper from '../components/ScreenWrapper';
import { colors } from '../styles/colors';
import { spacing } from '../styles/spacing';
import { typography } from '../styles/typography';

export default function AboutScreen({ navigation }) {
  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>About Run Her</Text>
      <Text style={styles.lead}>
        Run Her is a community-driven platform built for women who want to run together, stay safe, and support each other.
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.ink },
  container: { flex: 1, backgroundColor: colors.white },
  contentContainer: { paddingHorizontal: spacing.lg, paddingVertical: spacing['2xl'], paddingBottom: spacing['3xl'] },
  title: { fontSize: typography['3xl'], fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  lead: { fontSize: typography.sm, color: colors.gray700, lineHeight: 24, marginBottom: spacing.lg },
  sectionTitle: { fontSize: typography.xl, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  bullet: { color: colors.pink500, marginRight: spacing.sm, fontSize: typography.lg },
  bulletText: { color: colors.gray700, fontSize: typography.sm, lineHeight: 22, flex: 1 }
});
