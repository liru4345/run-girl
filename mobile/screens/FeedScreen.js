import React, { useEffect, useState, useContext } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getFeed } from '../services/api';
import { AuthContext } from '../services/authContext';
import ScreenWrapper from '../components/ScreenWrapper';
import Header from '../components/Header';
import { colors } from '../styles/colors';
import { spacing } from '../styles/spacing';
import { typography } from '../styles/typography';

const formatPace = (paceSeconds) => {
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.round(paceSeconds % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

function Avatar({ name, size = 34 }) {
  const initial = name?.[0]?.toUpperCase() || 'R';
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );
}

export default function FeedScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [liked, setLiked] = useState({});

  useEffect(() => {
    getFeed()
      .then(setPosts)
      .catch((err) => console.error('Error fetching feed:', err));
  }, []);

  const toggleLike = (id) => setLiked((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <ScreenWrapper>
      <Header navigation={navigation} />
      <View style={styles.container}>

        <FlatList
          data={posts}
          keyExtractor={(item) => item.id?.toString() || `${item.first_name}-${item.created_at}`}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={<Text style={styles.emptyText}>No posts from people you follow yet.</Text>}
          renderItem={({ item }) => {
            const isLiked = !!liked[item.id];
            return (
              <View style={styles.card}>
                <View style={styles.postHeader}>
                  <Avatar name={item.first_name} />
                  <View style={styles.postHeaderText}>
                    <Text style={styles.username}>{item.first_name} {item.last_name}</Text>
                    {item.location ? <Text style={styles.location}>{item.location}</Text> : null}
                  </View>
                  <Ionicons name="ellipsis-horizontal" size={20} color={colors.gray700} />
                </View>

                {item.image ? (
                  <Image source={{ uri: `http://localhost:5001${item.image}` }} style={styles.image} />
                ) : (
                  <View style={[styles.image, styles.imageFallback]}>
                    <Ionicons name="walk-outline" size={48} color={colors.pink300} />
                  </View>
                )}

                <View style={styles.actionsRow}>
                  <TouchableOpacity onPress={() => toggleLike(item.id)} style={styles.actionIcon}>
                    <Ionicons name={isLiked ? 'heart' : 'heart-outline'} size={26} color={isLiked ? colors.pink500 : colors.ink} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionIcon}>
                    <Ionicons name="chatbubble-outline" size={24} color={colors.ink} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionIcon}>
                    <Ionicons name="paper-plane-outline" size={24} color={colors.ink} />
                  </TouchableOpacity>
                  <View style={{ flex: 1 }} />
                  <Ionicons name="bookmark-outline" size={24} color={colors.ink} />
                </View>

                <View style={styles.cardBody}>
                  <Text style={styles.metaText}>
                    🏃 {item.miles} mi · ⏱ {Math.floor(item.duration_seconds / 60)} min · 🏁 {formatPace(item.pace_seconds_per_mile)} /mi
                  </Text>
                  <Text style={styles.caption}>
                    <Text style={styles.username}>{item.first_name} {item.last_name} </Text>
                    {item.content}
                  </Text>
                  <Text style={styles.timestamp}>{new Date(item.created_at).toLocaleDateString()}</Text>
                </View>
              </View>
            );
          }}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.white },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  logo: { fontSize: typography['2xl'], fontWeight: '800', color: colors.pink500, fontStyle: 'italic' },
  listContent: { paddingBottom: spacing['3xl'] },
  avatar: {
    backgroundColor: colors.pink100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.pink300,
  },
  avatarText: { color: colors.pink600, fontWeight: '700' },
  card: { marginBottom: spacing.md },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  postHeaderText: { flex: 1, marginLeft: spacing.sm },
  username: { fontWeight: '700', color: colors.ink, fontSize: typography.sm },
  location: { color: colors.gray600, fontSize: typography.xs },
  image: { width: '100%', height: 380, backgroundColor: colors.gray100 },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  actionsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  actionIcon: { marginRight: spacing.lg },
  cardBody: { paddingHorizontal: spacing.md, paddingTop: spacing.xs },
  metaText: { color: colors.pink600, fontSize: typography.xs, fontWeight: '600', marginTop: spacing.xs },
  caption: { color: colors.ink, marginTop: spacing.xs, lineHeight: 19, fontSize: typography.sm },
  timestamp: { color: colors.gray500, fontSize: 11, marginTop: spacing.xs, textTransform: 'uppercase' },
  emptyText: { textAlign: 'center', marginTop: 40, color: colors.gray600 },
});
