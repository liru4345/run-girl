import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AuthContext } from '../services/authContext';
import ScreenWrapper from '../components/ScreenWrapper';
import Header from '../components/Header';
import { colors } from '../styles/colors';
import { spacing } from '../styles/spacing';
import { typography } from '../styles/typography';

export default function HomeScreen({ navigation }) {
  const { user, signOut } = useContext(AuthContext);

  return (
    <ScreenWrapper>
      <Header navigation={navigation} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Welcome back, {user?.first_name}!</Text>
          <Text style={styles.heroSubtitle}>Run together, stay safe, and keep moving.</Text>
          <TouchableOpacity style={styles.heroButton} onPress={() => navigation.navigate('StartRun')}>
            <Text style={styles.heroButtonText}>Start a run</Text>
          </TouchableOpacity>
        </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Followers</Text>
          <Text style={styles.statValue}>{user?.followers_count ?? 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Following</Text>
          <Text style={styles.statValue}>{user?.following_count ?? 0}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick actions</Text>
      <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Profile')}>
        <Text style={styles.actionText}>Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Friends')}>
        <Text style={styles.actionText}>Find friends</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Notifications')}>
        <Text style={styles.actionText}>Notifications</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.actionText}>Feed</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionButtonSecondary} onPress={() => navigation.navigate('Calendar')}>
        <Text style={styles.actionTextSecondary}>Calendar</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButtonSecondary, styles.logoutButton]} onPress={signOut}>
        <Text style={styles.actionTextSecondary}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    alignItems: 'stretch'
  },
  heroCard: {
    backgroundColor: colors.pink500,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg
  },
  heroTitle: {
    fontSize: typography.xl,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.sm
  },
  heroSubtitle: {
    fontSize: typography.sm,
    lineHeight: 20,
    color: colors.pink100,
    marginBottom: spacing.md
  },
  heroButton: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 10,
    alignItems: 'center'
  },
  heroButtonText: {
    color: colors.pink500,
    fontWeight: '700',
    fontSize: typography.sm
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm
  },
  statLabel: {
    color: colors.gray600,
    marginBottom: spacing.xs,
    fontWeight: '600',
    fontSize: typography.xs
  },
  statValue: {
    fontSize: typography.xl,
    fontWeight: '700',
    color: colors.pink500
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.lg,
    fontWeight: '700',
    marginBottom: spacing.md
  },
  actionButton: {
    backgroundColor: colors.pink500,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  actionText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: typography.sm
  },
  actionButtonSecondary: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.pink500
  },
  actionTextSecondary: {
    color: colors.pink500,
    fontWeight: '700',
    fontSize: typography.sm
  },
  logoutButton: {
    backgroundColor: colors.gray50,
    borderColor: colors.pink600
  }
});
