import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { AuthContext } from '../services/authContext';
import ScreenWrapper from '../components/ScreenWrapper';


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
        password
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
      <View style={styles.card}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Join Run Girl and connect with your running crew.</Text>
        <TextInput placeholder="First name" style={styles.input} value={firstName} onChangeText={setFirstName} />
        <TextInput placeholder="Last name" style={styles.input} value={lastName} onChangeText={setLastName} />
        <TextInput
          placeholder="Email"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Phone number"
          style={styles.input}
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />
        <TextInput
          placeholder="Password"
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Registering...' : 'Register'}</Text>
        </TouchableOpacity>
        <View style={styles.footer}>
          <Text style={styles.helper}>Already have an account?</Text>
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
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff5fb'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#f7d6e2',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    marginBottom: 8,
    color: '#163e8a'
  },
  subtitle: {
    fontSize: 16,
    color: '#5e6a88',
    marginBottom: 24
  },
  input: {
    height: 52,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#d8ddee'
  },
  button: {
    backgroundColor: '#ff69b4',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16
  },
  footer: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  helper: {
    marginRight: 8,
    color: '#5e6a88'
  },
  link: {
    color: '#ff69b4',
    fontWeight: '700'
  }
});
