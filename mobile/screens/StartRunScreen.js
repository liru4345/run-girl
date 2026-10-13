import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { getStartRunData, startRun } from '../services/api';
import { shareRunLocation } from '../services/glympse';
import ScreenWrapper from '../components/ScreenWrapper';
import Header from '../components/Header';
import { AuthContext } from '../services/authContext';
import { colors } from '../styles/colors';
import { spacing } from '../styles/spacing';
import { typography } from '../styles/typography';

export default function StartRunScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [location, setLocation] = useState('Main Campus');
  const [duration, setDuration] = useState('30');
  const [loading, setLoading] = useState(false);
  const [selectedWatchers, setSelectedWatchers] = useState([]);

  useEffect(() => {
    loadRunData();
  }, []);

  const loadRunData = async () => {
    try {
      const data = await getStartRunData();
      setFriends(data.friends || []);
      setLocation(data.defaults.location || 'Main Campus');
      setDuration(String(data.defaults.duration_min || 30));
    } catch (error) {
      Alert.alert('Load failed', error.error || 'Unable to load run settings.');
    }
  };

  const toggleWatcher = (id) => {
    setSelectedWatchers((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const handleStartRun = async () => {
    if (!location || !duration) {
      Alert.alert('Missing data', 'Please choose a location and duration.');
      return;
    }

    setLoading(true);
    try {
      await startRun({ duration_minutes: Number(duration), location, watcher_ids: selectedWatchers });

      const watchers = friends.filter((f) => selectedWatchers.includes(f.id));
      if (watchers.length > 0) {
        try {
          await shareRunLocation({
            durationMinutes: Number(duration),
            message: `${user?.first_name || 'I'} started a run at ${location}. Track live:`,
            watchers,
          });
        } catch (glympseError) {
          console.error('Glympse share failed:', glympseError);
          Alert.alert('Run started', 'Your run started, but live location sharing failed to send.');
          navigation.navigate('RunRecap', { location, duration: Number(duration) });
          return;
        }
      }

      Alert.alert('Run started', 'Your run has started and watchers have been notified.');
      navigation.navigate('RunRecap', { location, duration: Number(duration) });
    } catch (error) {
      Alert.alert('Start failed', error.error || 'Unable to start your run.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header navigation={navigation} />
      <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Run location</Text>
        <TextInput value={location} onChangeText={setLocation} style={styles.input} placeholderTextColor={colors.gray500} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Run duration (minutes)</Text>
        <TextInput
          value={duration}
          onChangeText={setDuration}
          style={styles.input}
          keyboardType="number-pad"
          placeholderTextColor={colors.gray500}
        />
      </View>

      <Text style={styles.sectionTitle}>Choose watchers</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id.toString()}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.watcherCard, selectedWatchers.includes(item.id) && styles.watcherSelected]}
            onPress={() => toggleWatcher(item.id)}
          >
            <View>
              <Text style={styles.watcherName}>{item.first_name} {item.last_name}</Text>
              <Text style={styles.watcherMeta}>{item.profile_picture ? 'Watcher' : 'Friend'}</Text>
            </View>
            <Text style={styles.toggleText}>{selectedWatchers.includes(item.id) ? '✓' : '○'}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Add friends to choose watchers.</Text>}
      />

      <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleStartRun} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Starting run...' : 'Begin run'}</Text>
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
    paddingBottom: spacing['3xl'],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    color: colors.gray700,
    marginBottom: spacing.sm,
    fontSize: typography.sm,
  },
  input: {
    backgroundColor: colors.gray50,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: typography.sm,
    color: colors.ink,
  },
  sectionTitle: {
    fontSize: typography.md,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing.md,
    marginTop: spacing.md,
  },
  watcherCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  watcherSelected: {
    backgroundColor: colors.pink100,
    borderColor: colors.pink300,
  },
  watcherName: {
    fontSize: typography.sm,
    fontWeight: '700',
    color: colors.ink,
  },
  watcherMeta: {
    color: colors.gray600,
    marginTop: spacing.xs,
    fontSize: typography.xs,
  },
  toggleText: {
    color: colors.pink500,
    fontWeight: '700',
    fontSize: typography.lg,
  },
  emptyText: {
    color: colors.gray600,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.pink500,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: typography.sm,
  },
});
