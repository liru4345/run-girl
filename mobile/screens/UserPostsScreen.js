import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet, Alert } from 'react-native';
import { getPosts } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';


const formatPace = (paceSeconds) => {
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.round(paceSeconds % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function UserPostsScreen({ route }) {
  const userId = route.params?.userId;
  const [activeTab, setActiveTab] = useState('public');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getPosts({ userId, type: activeTab })
      .then((data) => setPosts(data))
      .catch((error) => {
        console.error('Failed to load posts:', error);
        Alert.alert('Load failed', error.error || 'Unable to load posts.');
      })
      .finally(() => setLoading(false));
  }, [activeTab, userId]);

  return (
    <ScreenWrapper>
    <View style={styles.container}>
      <Text style={styles.title}>{userId ? '📸 Posts' : '📸 Your Posts'}</Text>
      {!userId && (
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'public' && styles.tabActive]} onPress={() => setActiveTab('public')}>
            <Text style={[styles.tabText, activeTab === 'public' && styles.tabTextActive]}>Public</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'private' && styles.tabActive]} onPress={() => setActiveTab('private')}>
            <Text style={[styles.tabText, activeTab === 'private' && styles.tabTextActive]}>Private</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={<Text style={styles.emptyText}>{loading ? 'Loading posts...' : `No ${userId ? 'public' : activeTab} posts yet.`}</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.image ? <Image source={{ uri: `http://localhost:5001${item.image}` }} style={styles.image} /> : null}
            <View style={styles.cardBody}>
              <Text style={styles.cardText}>{item.content}</Text>
              <Text style={styles.metaText}>🏃 {item.miles} miles | ⏱ {Math.floor(item.duration_seconds / 60)} min</Text>
              <Text style={styles.metaText}>🏁 Pace: {item.pace_seconds_per_mile ? formatPace(item.pace_seconds_per_mile) : '—'} min/mile</Text>
              <Text style={styles.metaText}>📅 {new Date(item.created_at).toLocaleDateString()}</Text>
              <Text style={styles.metaText}>📍 {item.location}</Text>
            </View>
          </View>
        )}
      />
    </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff5fb', padding: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#163e8a', marginBottom: 18 },
  tabRow: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#ffe7f2', borderRadius: 18 },
  tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { backgroundColor: '#ff69b4', borderRadius: 18 },
  tabText: { color: '#a12d56', fontWeight: '700' },
  tabTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: '#f7d6e2', marginBottom: 16, overflow: 'hidden' },
  image: { width: '100%', height: 200 },
  cardBody: { padding: 16 },
  cardText: { color: '#333', lineHeight: 22, marginBottom: 10 },
  metaText: { color: '#5e6a88', fontSize: 13 },
  emptyText: { color: '#5e6a88', textAlign: 'center', marginTop: 20 },
});
