import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { getStartRunData, startRun } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';


export default function StartRunScreen({ navigation }) {
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
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Start a safe run</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Run location</Text>
        <TextInput value={location} onChangeText={setLocation} style={styles.input} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Run duration (minutes)</Text>
        <TextInput
          value={duration}
          onChangeText={setDuration}
          style={styles.input}
          keyboardType="number-pad"
        />
      </View>

      <Text style={styles.sectionTitle}>Choose watchers</Text>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.watcherCard, selectedWatchers.includes(item.id) && styles.watcherSelected]}
            onPress={() => toggleWatcher(item.id)}
          >
            <View>
              <Text style={styles.watcherName}>{item.first_name} {item.last_name}</Text>
              <Text style={styles.watcherMeta}>{item.profile_picture ? 'Watcher' : 'Friend'}</Text>
            </View>
            <Text style={styles.toggleText}>{selectedWatchers.includes(item.id) ? 'Selected' : 'Add'}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Add friends to choose watchers.</Text>}
      />

      <TouchableOpacity style={styles.button} onPress={handleStartRun} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Starting run...' : 'Begin run'}</Text>
      </TouchableOpacity>
    </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff5fb'
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#163e8a',
    marginBottom: 20
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f7d6e2'
  },
  label: {
    color: '#5e6a88',
    marginBottom: 10
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#d8ddee'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#163e8a',
    marginBottom: 12
  },
  watcherCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f7d6e2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  watcherSelected: {
    backgroundColor: '#ffe6f0',
    borderColor: '#ffbdd4'
  },
  watcherName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#163e8a'
  },
  watcherMeta: {
    color: '#5e6a88',
    marginTop: 4
  },
  toggleText: {
    color: '#ff69b4',
    fontWeight: '700'
  },
  emptyText: {
    color: '#5e6a88',
    marginTop: 12,
    textAlign: 'center'
  },
  button: {
    marginTop: 18,
    backgroundColor: '#ff69b4',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16
  }
});
