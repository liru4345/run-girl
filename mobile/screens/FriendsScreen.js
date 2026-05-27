import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { searchFriends, friendsAction, cancelFriendRequest } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';


export default function FriendsScreen() {
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
      <View style={styles.userCard}>
        <View>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userMeta}>{item.phone}</Text>
        </View>
        {isFollowing ? (
          <TouchableOpacity style={[styles.requestButton, styles.unfollowButton]} onPress={() => handleAction(item.id, 'unfollow')}>
            <Text style={styles.requestedText}>Unfollow</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.requestButton, isRequested ? styles.requested : styles.primaryButton]}
            onPress={() => (isRequested ? handleCancel(item.id) : handleAction(item.id, 'request'))}
          >
            <Text style={[styles.requestText, isRequested && styles.requestedText]}>
              {isRequested ? 'Cancel' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
    );
  };

  return (
    <ScreenWrapper>
    <View style={styles.container}>
      <Text style={styles.title}>Find friends</Text>
      <TextInput
        style={styles.input}
        placeholder="Search by name or phone number"
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        onSubmitEditing={handleSearch}
      />
      <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loading}>
        <Text style={styles.searchButtonText}>{loading ? 'Searching…' : 'Search'}</Text>
      </TouchableOpacity>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListEmptyComponent={<Text style={styles.empty}>No friends found. Search to discover runners.</Text>}
        contentContainerStyle={results.length === 0 && styles.emptyContainer}
      />
    </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff5fb'
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#163e8a',
    marginBottom: 16
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: '#d8ddee',
    marginBottom: 12
  },
  searchButton: {
    backgroundColor: '#ff69b4',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '700'
  },
  userCard: {
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
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#163e8a'
  },
  userMeta: {
    color: '#5e6a88',
    marginTop: 6
  },
  requestButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14
  },
  primaryButton: {
    backgroundColor: '#ff69b4'
  },
  unfollowButton: {
    backgroundColor: '#fbe2eb'
  },
  requestText: {
    color: '#fff',
    fontWeight: '700'
  },
  requested: {
    backgroundColor: '#ffe6ec'
  },
  requestedText: {
    color: '#ff69b4',
    fontWeight: '700'
  },
  empty: {
    color: '#5e6a88',
    marginTop: 36,
    textAlign: 'center'
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center'
  }
});
