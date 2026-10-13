import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { searchFriends, friendsAction, cancelFriendRequest } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';
import Header from '../components/Header';
import { AuthContext } from '../services/authContext';
import { colors } from '../styles/colors';
import { spacing } from '../styles/spacing';
import { typography } from '../styles/typography';

function Avatar({ name }) {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{name?.[0]?.toUpperCase() || '?'}</Text>
    </View>
  );
}

export default function FriendsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(handleSearch, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const users = await searchFriends(query.trim());
      setResults(users);
    } catch (error) {
      Alert.alert('Search failed', error.error || 'Unable to search for friends.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId, action) => {
    try {
      await friendsAction(userId, action);
      const updated = results.map((item) =>
        item.id === userId ? { ...item, status: action === 'request' ? 'requested' : 'none' } : item
      );
      setResults(updated);
    } catch (error) {
      Alert.alert('Action failed', error.error || 'Unable to update follow status.');
    }
  };

  const handleCancel = async (userId) => {
    try {
      await cancelFriendRequest(userId);
      setResults((current) => current.map((item) => (item.id === userId ? { ...item, status: 'none' } : item)));
    } catch (error) {
      Alert.alert('Cancel failed', error.error || 'Unable to cancel request.');
    }
  };

  const renderItem = ({ item }) => {
    const isRequested = item.status === 'requested';
    const isFollowing = item.status === 'following';

    return (
      <View style={styles.userRow}>
        <Avatar name={item.name} />
        <View style={styles.userTextWrap}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userMeta}>{item.phone}</Text>
        </View>
        {isFollowing ? (
          <TouchableOpacity style={[styles.requestButton, styles.unfollowButton]} onPress={() => handleAction(item.id, 'unfollow')}>
            <Text style={styles.requestedText}>Following</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.requestButton, isRequested ? styles.requested : styles.primaryButton]}
            onPress={() => (isRequested ? handleCancel(item.id) : handleAction(item.id, 'request'))}
          >
            <Text style={[styles.requestText, isRequested && styles.requestedText]}>
              {isRequested ? 'Requested' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <ScreenWrapper>
      <Header navigation={navigation} />
      <View style={styles.container}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.gray500} />
          <TextInput
            style={styles.input}
            placeholder="Search by name or phone number"
            placeholderTextColor={colors.gray500}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.gray400} />
            </TouchableOpacity>
          ) : null}
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          ListEmptyComponent={
            <Text style={styles.empty}>{loading ? 'Searching…' : 'No runners found. Search to discover people.'}</Text>
          }
          contentContainerStyle={results.length === 0 && styles.emptyContainer}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg, backgroundColor: colors.white },
  title: { fontSize: typography['2xl'], fontWeight: '700', color: colors.ink, marginBottom: spacing.md },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    height: 40,
    marginBottom: spacing.lg,
  },
  input: { flex: 1, marginLeft: spacing.sm, fontSize: typography.sm, color: colors.ink },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.pink100, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.pink300,
  },
  avatarText: { color: colors.pink600, fontWeight: '700', fontSize: typography.lg },
  userTextWrap: { flex: 1, marginLeft: spacing.md },
  userName: { fontSize: typography.sm, fontWeight: '700', color: colors.ink },
  userMeta: { color: colors.gray600, fontSize: typography.xs, marginTop: 2 },
  requestButton: { paddingVertical: 7, paddingHorizontal: spacing.md, borderRadius: 8 },
  primaryButton: { backgroundColor: colors.pink500 },
  unfollowButton: { backgroundColor: colors.gray100 },
  requestText: { color: colors.white, fontWeight: '700', fontSize: typography.xs },
  requested: { backgroundColor: colors.gray100 },
  requestedText: { color: colors.ink, fontWeight: '700', fontSize: typography.xs },
  empty: { color: colors.gray600, marginTop: 36, textAlign: 'center' },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
});
