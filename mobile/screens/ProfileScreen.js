import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, FlatList, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../services/authContext';
import { updateProfile, getPosts } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';
import Header from '../components/Header';
import { colors } from '../styles/colors';
import { spacing } from '../styles/spacing';
import { typography } from '../styles/typography';

const GRID_SIZE = (Dimensions.get('window').width - 4) / 3;

export default function ProfileScreen({ navigation }) {
  const { user, refreshProfile } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    setFirstName(user?.first_name || '');
    setLastName(user?.last_name || '');
    setEmail(user?.email || '');
    setPhoneNumber(user?.phone_number || '');
    setBio(user?.bio || '');
  }, [user]);

  useEffect(() => {
    getPosts({ type: 'public' }).then(setPosts).catch(() => {});
  }, []);

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
      <Header navigation={navigation} />
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={styles.profileTop}>
            {user?.profile_picture ? (
              <Image source={{ uri: user.profile_picture }} style={styles.profileAvatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{user?.first_name?.[0] || 'R'}</Text>
              </View>
            )}

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{posts.length}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user?.followers_count ?? 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user?.following_count ?? 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </View>
            </View>
          </View>

          <Text style={styles.profileName}>{user?.first_name} {user?.last_name}</Text>
          <Text style={styles.profileBio}>{user?.bio || 'No bio yet. Add one to share your vibe. 🏃‍♀️✨'}</Text>

          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity style={styles.editProfileButton} onPress={() => setIsEditing(true)}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={() => navigation.navigate('Calendar')}>
              <Ionicons name="calendar-outline" size={18} color={colors.ink} />
            </TouchableOpacity>
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
              <TouchableOpacity style={styles.cancelButton} onPress={() => setIsEditing(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.gridTabsRow}>
              <View style={styles.gridTabActive}>
                <Ionicons name="grid-outline" size={22} color={colors.ink} />
              </View>
              <TouchableOpacity style={styles.gridTab} onPress={() => navigation.navigate('UserPosts')}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.gray400} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={posts}
              keyExtractor={(item) => item.id.toString()}
              numColumns={3}
              scrollEnabled={false}
              ListEmptyComponent={<Text style={styles.emptyText}>No posts yet. Go for a run! 🏃‍♀️</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.gridCell} onPress={() => navigation.navigate('UserPosts')}>
                  {item.image ? (
                    <Image source={{ uri: `http://localhost:5001${item.image}` }} style={styles.gridImage} />
                  ) : (
                    <View style={[styles.gridImage, styles.gridImageFallback]}>
                      <Ionicons name="walk-outline" size={22} color={colors.pink300} />
                    </View>
                  )}
                </TouchableOpacity>
              )}
            />
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  handle: { fontSize: typography.lg, fontWeight: '700', color: colors.ink },
  container: { flex: 1, backgroundColor: colors.white },
  scrollContent: { paddingBottom: spacing['3xl'] },
  profileHeader: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  profileTop: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  profileAvatar: { width: 86, height: 86, borderRadius: 43, borderWidth: 2, borderColor: colors.pink300 },
  avatarPlaceholder: {
    width: 86, height: 86, borderRadius: 43, borderWidth: 2, borderColor: colors.pink300,
    backgroundColor: colors.pink100, alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { fontSize: typography['2xl'], fontWeight: '700', color: colors.pink500 },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', marginLeft: spacing.md },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: typography.lg, fontWeight: '700', color: colors.ink },
  statLabel: { fontSize: typography.xs, color: colors.gray600, marginTop: 2 },
  profileName: { fontSize: typography.sm, fontWeight: '700', color: colors.ink, marginTop: spacing.xs },
  profileBio: { fontSize: typography.sm, color: colors.gray800, lineHeight: 19, marginTop: spacing.xs, marginBottom: spacing.md },
  actionButtonsContainer: { flexDirection: 'row', gap: spacing.sm },
  editProfileButton: { flex: 1, backgroundColor: colors.pink500, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  editButtonText: { fontSize: typography.sm, fontWeight: '600', color: colors.white },
  shareButton: { width: 40, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  cancelButtonText: { fontSize: typography.sm, fontWeight: '600', color: colors.ink },
  gridTabsRow: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: colors.border },
  gridTabActive: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderBottomWidth: 1.5, borderBottomColor: colors.ink },
  gridTab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm },
  gridCell: { width: GRID_SIZE, height: GRID_SIZE, padding: 1 },
  gridImage: { flex: 1, backgroundColor: colors.gray100 },
  gridImageFallback: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { textAlign: 'center', marginTop: 24, color: colors.gray600, width: '100%' },
  formCard: { backgroundColor: colors.white, marginHorizontal: spacing.lg, marginTop: spacing.lg, borderRadius: 16, padding: spacing.lg, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: typography.lg, fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  input: {
    backgroundColor: colors.gray50, borderRadius: 10, paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    marginBottom: spacing.md, fontSize: typography.base, borderWidth: 1, borderColor: colors.border, color: colors.ink,
  },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
});
