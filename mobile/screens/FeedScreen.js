import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { getFeed } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';


const formatPace = (paceSeconds) => {
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.round(paceSeconds % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function FeedScreen({ navigation }) {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    getFeed()
      .then(setPosts)
      .catch((err) => console.error('Error fetching feed:', err));
  }, []);

  return (
    <ScreenWrapper>
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>🏃‍♀️ Feed</Text>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Friends')}>
          <Text style={styles.actionButtonText}>Find Friends</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id?.toString() || `${item.first_name}-${item.created_at}`}
        ListEmptyComponent={<Text style={styles.emptyText}>No posts from people you follow yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.image ? (
              <Image source={{ uri: `http://localhost:5001${item.image}` }} style={styles.image} />
            ) : null}
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>{item.first_name} {item.last_name}</Text>
              <Text style={styles.cardText}>{item.content}</Text>
              <Text style={styles.metaText}>🏃 {item.miles} miles | ⏱ {Math.floor(item.duration_seconds / 60)} min</Text>
              <Text style={styles.metaText}>🏁 Pace: {formatPace(item.pace_seconds_per_mile)} min/mile</Text>
              <Text style={styles.metaText}>📍 {item.location} • {new Date(item.created_at).toLocaleDateString()}</Text>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 26, fontWeight: '800', color: '#163e8a' },
  actionButton: { backgroundColor: '#ff69b4', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 },
  actionButtonText: { color: '#fff', fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: '#f7d6e2' },
  image: { width: '100%', height: 200 },
  cardBody: { padding: 16 },
  cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6, color: '#163e8a' },
  cardText: { color: '#5e6a88', marginBottom: 10, lineHeight: 20 },
  metaText: { color: '#7a2c5a', fontSize: 13 },
  emptyText: { textAlign: 'center', marginTop: 24, color: '#5e6a88' },
});
