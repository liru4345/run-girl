import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StyleSheet, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPosts } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';
import { colors } from '../styles/colors';
import { spacing } from '../styles/spacing';
import { typography } from '../styles/typography';

const GRID_SIZE = (Dimensions.get('window').width - 4) / 3;

const formatPace = (paceSeconds) => {
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.round(paceSeconds % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function UserPostsScreen({ route, navigation }) {
  const userId = route.params?.userId;
  const [activeTab, setActiveTab] = useState('public');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    setSelected(null);
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
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={26} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.title}>{userId ? 'Posts' : 'Your Posts'}</Text>
        <View style={{ width: 26 }} />
      </View>

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

      {selected ? (
        <View style={styles.detailCard}>
          <TouchableOpacity style={styles.backRow} onPress={() => setSelected(null)}>
            <Ionicons name="chevron-back" size={18} color={colors.pink600} />
            <Text style={styles.backText}>Back to grid</Text>
          </TouchableOpacity>
          {selected.image ? (
            <Image source={{ uri: `http://localhost:5001${selected.image}` }} style={styles.detailImage} />
          ) : null}
          <View style={styles.detailBody}>
            <Text style={styles.cardText}>{selected.content}</Text>
            <Text style={styles.metaText}>🏃 {selected.miles} mi · ⏱ {Math.floor(selected.duration_seconds / 60)} min</Text>
            <Text style={styles.metaText}>🏁 Pace: {selected.pace_seconds_per_mile ? formatPace(selected.pace_seconds_per_mile) : '—'} /mi</Text>
            <Text style={styles.metaText}>📍 {selected.location} · {new Date(selected.created_at).toLocaleDateString()}</Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          ListEmptyComponent={<Text style={styles.emptyText}>{loading ? 'Loading posts...' : `No ${userId ? 'public' : activeTab} posts yet.`}</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.gridCell} onPress={() => setSelected(item)}>
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
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingBottom: spacing.sm,
  },
  title: { fontSize: typography.lg, fontWeight: '700', color: colors.ink },
  tabRow: { flexDirection: 'row', marginHorizontal: spacing.lg, marginBottom: spacing.sm, backgroundColor: colors.gray100, borderRadius: 12 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { backgroundColor: colors.pink500, borderRadius: 12 },
  tabText: { color: colors.gray700, fontWeight: '600' },
  tabTextActive: { color: colors.white },
  gridCell: { width: GRID_SIZE, height: GRID_SIZE, padding: 1 },
  gridImage: { flex: 1, backgroundColor: colors.gray100 },
  gridImageFallback: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.gray600, textAlign: 'center', marginTop: 24, width: '100%' },
  detailCard: { paddingHorizontal: spacing.lg },
  backRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  backText: { color: colors.pink600, fontWeight: '600', marginLeft: 2 },
  detailImage: { width: '100%', height: 320, borderRadius: 16, backgroundColor: colors.gray100 },
  detailBody: { paddingTop: spacing.md },
  cardText: { color: colors.ink, lineHeight: 22, marginBottom: 10 },
  metaText: { color: colors.gray600, fontSize: typography.sm, marginBottom: 4 },
});
