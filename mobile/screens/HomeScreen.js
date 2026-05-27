import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { AuthContext } from '../services/authContext';
import ScreenWrapper from '../components/ScreenWrapper';


export default function HomeScreen({ navigation }) {
  const { user, signOut } = useContext(AuthContext);

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Run Girl</Text>
          <Text style={styles.heroSubtitle}>Run together, stay safe, and keep the girl squad moving.</Text>
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
      <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Feed')}>
        <Text style={styles.actionText}>Run feed</Text>
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
    padding: 24,
    backgroundColor: '#fff5fb',
    alignItems: 'stretch'
  },
  heroCard: {
    backgroundColor: '#ff69b4',
    borderRadius: 24,
    padding: 24,
    marginBottom: 20
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12
  },
  heroSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ffe6f0',
    marginBottom: 20
  },
  heroButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center'
  },
  heroButtonText: {
    color: '#ff69b4',
    fontWeight: '700',
    fontSize: 16
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#f4d0e6',
    marginRight: 10
  },
  statLabel: {
    color: '#7a2c5a',
    marginBottom: 8,
    fontWeight: '600'
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ff69b4'
  },
  sectionTitle: {
    color: '#163e8a',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12
  },
  actionButton: {
    backgroundColor: '#ff69b4',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16
  },
  actionButtonSecondary: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ff69b4'
  },
  actionTextSecondary: {
    color: '#ff69b4',
    fontWeight: '700',
    fontSize: 16
  },
  logoutButton: {
    backgroundColor: '#ffe6ec',
    borderColor: '#ff5a5f'
  }
});
