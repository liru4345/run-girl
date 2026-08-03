import React, { useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../services/authContext';
import { colors } from '../styles/colors';
import { spacing } from '../styles/spacing';
import { typography } from '../styles/typography';

export default function Header({ navigation }) {
  const { user } = useContext(AuthContext);

  return (
    <View style={styles.topBar}>
      <Text style={styles.handle}>@{user?.email?.split('@')[0] || 'runher'}</Text>
      <TouchableOpacity onPress={() => navigation.navigate('InfoScreen')}>
        <Ionicons name="menu-outline" size={26} color={colors.ink} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  handle: { fontSize: typography.lg, fontWeight: '700', color: colors.ink },
});
