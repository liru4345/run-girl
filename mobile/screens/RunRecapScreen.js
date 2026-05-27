import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { finishRun } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';


export default function RunRecapScreen({ route, navigation }) {
  const { location, duration } = route.params || {};
  const [description, setDescription] = useState('');
  const [miles, setMiles] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFinish = async (action) => {
    if (!description) {
      Alert.alert('Missing description', 'Add a recap before posting or saving.');
      return;
    }

    setLoading(true);
    try {
      await finishRun({
        location: location || 'Main Campus',
        duration_seconds: duration ? duration * 60 : 1800,
        miles: Number(miles) || 0,
        description,
        action
      });
      Alert.alert('Run saved', action === 'post' ? 'Your run recap has been posted.' : 'Your run recap was saved.');
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Save failed', error.error || 'Unable to save the run recap.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper> 
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Run recap</Text>
      <Text style={styles.subtitle}>Location: {location || 'Main Campus'}</Text>
      <Text style={styles.subtitle}>Duration: {duration ? `${duration} min` : '30 min'}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Distance (miles)</Text>
        <TextInput
          value={miles}
          onChangeText={setMiles}
          keyboardType="decimal-pad"
          style={styles.input}
          placeholder="e.g. 3.5"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Run description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.textArea]}
          multiline
          numberOfLines={6}
          placeholder="How was your run?"
        />
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={styles.primaryButton} onPress={() => handleFinish('post')} disabled={loading}>
          <Text style={styles.primaryButtonText}>{loading ? 'Posting…' : 'Post run'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => handleFinish('save')} disabled={loading}>
          <Text style={styles.secondaryButtonText}>{loading ? 'Saving…' : 'Save only'}</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 10
  },
  subtitle: {
    color: '#5e6a88',
    marginBottom: 16
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
    height: 50,
    borderWidth: 1,
    borderColor: '#d8ddee'
  },
  textArea: {
    height: 140,
    paddingTop: 14,
    textAlignVertical: 'top'
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#ff69b4',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center'
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700'
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ff69b4',
    padding: 16,
    alignItems: 'center'
  },
  secondaryButtonText: {
    color: '#ff69b4',
    fontWeight: '700'
  }
});
