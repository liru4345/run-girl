import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { AuthContext } from '../services/authContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { colors } from '../styles/colors';
import { spacing } from '../styles/spacing';
import { typography } from '../styles/typography';

export default function RegisterScreen({ navigation }) {
  const { signUp } = useContext(AuthContext);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !phoneNumber || !password) {
      Alert.alert('Missing fields', 'Complete all fields to register.');
      return;
    }

    setLoading(true);
    try {
      await signUp({
        first_name: firstName,
        last_name: lastName,
        email,
        phone_number: phoneNumber,
        password,
      });
    } catch (error) {
      Alert.alert('Registration failed', error.error || 'Unable to register.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoContainer}>
          <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Join us and connect with your running crew.</Text>

          <TextInput
            placeholder="First name"
            style={styles.input}
            placeholderTextColor={colors.gray500}
            value={firstName}
            onChangeText={setFirstName}
          />

          <TextInput
            placeholder="Last name"
            style={styles.input}
            placeholderTextColor={colors.gray500}
            value={lastName}
            onChangeText={setLastName}
          />

          <TextInput
            placeholder="Email"
            style={styles.input}
            placeholderTextColor={colors.gray500}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            placeholder="Phone number"
            style={styles.input}
            placeholderTextColor={colors.gray500}
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />

          <TextInput
            placeholder="Password"
            style={styles.input}
            placeholderTextColor={colors.gray500}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Registering...' : 'Register'}</Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.link}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.white,
    paddingBottom: spacing['3xl'],
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    paddingTop: spacing['2xl'],
  },
  logo: {
    width: 140,
    height: 80,
  },
  card: {
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing['2xl'],
  },
  title: {
    fontSize: typography['2xl'],
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sm,
    color: colors.gray600,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  input: {
    height: 48,
    backgroundColor: colors.gray50,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.ink,
  },
  button: {
    backgroundColor: colors.pink500,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: typography.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    marginRight: spacing.xs,
    color: colors.gray600,
    fontSize: typography.sm,
  },
  link: {
    color: colors.pink500,
    fontWeight: '700',
    fontSize: typography.sm,
  },
});
