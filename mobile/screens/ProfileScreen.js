import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { AuthContext } from '../services/authContext';
import { updateProfile } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';
import { colors } from '../styles/colors';
import { spacing } from '../styles/spacing';
import { typography } from '../styles/typography';


export default function ProfileScreen({ navigation }) {
  const { user, refreshProfile } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFirstName(user?.first_name || '');
    setLastName(user?.last_name || '');
    setEmail(user?.email || '');
    setPhoneNumber(user?.phone_number || '');
    setBio(user?.bio || '');
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({ first_name: firstName, last_name: lastName, email, phone_number: phoneNumber, bio });
      await refreshProfile();
      setIsEditing(false);
      Alert.alert('Profile updated', 'Your profile changes were saved successfully.');
    } catch (error) {
      Alert.alert('Update failed', error.error || 'Could not save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
  <ScreenWrapper>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.profileHeader}>
        <View style={styles.profileTop}>
          <View>
            {user?.profile_picture ? (
              <Image source={{ uri: user.profile_picture }} style={styles.profileAvatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{user?.first_name?.[0] || 'R'}</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.profileName}>
          {user?.firstname} {user?.last_name}
        </Text>

        <Text style={styles.profileHandle}>
          @{user?.email?.split('@')[0] || 'run.girl'}
        </Text>

        <Text style={styles.profileBio}>
          {user?.bio || 'No bio yet. Add one to share your vibe.'}
        </Text>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.editProfileButton} onPress={() => setIsEditing(true)}>
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={() => navigation.navigate('UserPosts')}>
            <Text style={styles.shareButtonText}>Your Posts</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.shareButton} onPress={() => navigation.navigate('Calendar')}>
            <Text style={styles.shareButtonText}>Calendar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareButton} onPress={() => navigation.navigate('About')}>
            <Text style={styles.shareButtonText}>About</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.followers_count ?? 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{user?.following_count ?? 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
      </View>

      {isEditing ? (
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Edit Profile</Text>

          <TextInput style={styles.input} placeholder="First name" value={firstName} onChangeText={setFirstName} />
          <TextInput style={styles.input} placeholder="Last name" value={lastName} onChangeText={setLastName} />
          <TextInput style={styles.input} placeholder="Email" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Phone" keyboardType="phone-pad" value={phoneNumber} onChangeText={setPhoneNumber} />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Bio"
            multiline
            numberOfLines={4}
            value={bio}
            onChangeText={setBio}
          />

          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.editProfileButton} onPress={handleSave} disabled={loading}>
              <Text style={styles.editButtonText}>{loading ? 'Saving...' : 'Save Changes'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareButton} onPress={() => setIsEditing(false)}>
              <Text style={styles.shareButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </ScrollView>
  </ScreenWrapper>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.pink50,
  },

  scrollContent: {
    paddingBottom: spacing['3xl'],
  },

  profileHeader: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },

  profileTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },

  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.pink200,
    backgroundColor: colors.gray200,
  },

  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: colors.pink200,
    backgroundColor: colors.pink100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarInitial: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.pink500,
  },

  profileName: {
    fontSize: typography.xl,
    fontWeight: typography.bold,
    color: colors.gray800,
    marginBottom: spacing.xs,
  },

  profileHandle: {
    fontSize: typography.sm,
    color: colors.gray600,
  },

  profileBio: {
    fontSize: typography.sm,
    color: colors.gray700,
    lineHeight: 20,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },

  actionButtonsContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  editProfileButton: {
    flex: 1,
    backgroundColor: colors.pink500,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    alignItems: 'center',
  },

  editButtonText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.white,
  },

  shareButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.pink300,
    alignItems: 'center',
    backgroundColor: colors.white,
  },

  shareButtonText: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    color: colors.pink500,
  },

  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 24,
    paddingVertical: spacing.lg,
  },

  statValue: {
    fontSize: typography['2xl'],
    fontWeight: typography.bold,
    color: colors.pink500,
  },

  statLabel: {
    fontSize: typography.xs,
    color: colors.gray600,
    marginTop: spacing.xs,
  },

  formCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: 24,
    padding: spacing.lg,
  },

  sectionTitle: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    color: colors.gray800,
    marginBottom: spacing.md,
  },

  input: {
    backgroundColor: colors.gray50,
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    fontSize: typography.base,
    borderWidth: 1,
    borderColor: colors.gray200,
    color: colors.gray800,
  },

  textArea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
});