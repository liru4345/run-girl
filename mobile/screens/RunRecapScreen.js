import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { finishRun } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';
import { colors } from '../styles/colors';
import { spacing } from '../styles/spacing';
import { typography } from '../styles/typography';

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
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={28} color={colors.ink} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Run recap</Text>
      <View style={{ width: 28 }} />
    </View>
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.metaText}>Location: {location || 'Main Campus'}</Text>
      <Text style={styles.metaText}>Duration: {duration ? `${duration} min` : '30 min'}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Distance (miles)</Text>
        <TextInput
          value={miles}
          onChangeText={setMiles}
          keyboardType="decimal-pad"
          style={styles.input}
          placeholder="e.g. 3.5"
          placeholderTextColor={colors.gray500}
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
          placeholderTextColor={colors.gray500}
        />
      </View>

      <View style={styles.buttonGroup}>
        <TouchableOpacity style={[styles.primaryButton, loading && styles.buttonDisabled]} onPress={() => handleFinish('post')} disabled={loading}>
          <Text style={styles.primaryButtonText}>{loading ? 'Posting…' : 'Post run'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.secondaryButton, loading && styles.buttonDisabled]} onPress={() => handleFinish('save')} disabled={loading}>
          <Text style={styles.secondaryButtonText}>{loading ? 'Saving…' : 'Save only'}</Text>
        </TouchableOpacity>
      </View>
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
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    paddingBottom: spacing['3xl'],
  },
  metaText: { color: colors.gray700, marginBottom: spacing.sm, fontSize: typography.sm },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.md,
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
  textArea: {
    height: 120,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.pink500,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.pink500,
    padding: spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: typography.sm,
  },
  secondaryButtonText: {
    color: colors.pink500,
    fontWeight: '700',
    fontSize: typography.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
