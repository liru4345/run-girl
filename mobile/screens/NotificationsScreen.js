import React, { useEffect, useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getNotifications, dismissNotification, followRequestAction } from '../services/api';
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

export default function NotificationsScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [general, setGeneral] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setGeneral(data.general || []);
      setRequests(data.requests || []);
    } catch (error) {
      Alert.alert('Load failed', error.error || 'Unable to fetch notifications.');
    }
  };

  const handleDismiss = async (id) => {
    try {
      await dismissNotification(id);
      setGeneral((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      Alert.alert('Dismiss failed', error.error || 'Unable to dismiss notification.');
    }
  };

  const handleRequestAction = async (senderId, action) => {
    try {
      await followRequestAction(senderId, action);
      setRequests((prev) => prev.filter((r) => r.sender_id !== senderId));
    } catch (error) {
      Alert.alert('Action failed', error.error || 'Unable to respond to request.');
    }
  };

  const renderGeneralItem = ({ item }) => (
    <View style={styles.row}>
      <Avatar name={item.sender_username} />
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowText}>{item.message}</Text>
        <Text style={styles.rowTime}>{item.created_at}</Text>
      </View>
      <TouchableOpacity onPress={() => handleDismiss(item.id)}>
        <Ionicons name="close" size={18} color={colors.gray400} />
      </TouchableOpacity>
    </View>
  );

  const renderRequestItem = ({ item }) => (
    <View style={styles.row}>
      <Avatar name={item.sender_username} />
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowText}>
          <Text style={styles.bold}>{item.sender_username}</Text> requested to follow you.
        </Text>
        <Text style={styles.rowTime}>{item.requested_at}</Text>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.acceptButton} onPress={() => handleRequestAction(item.sender_id, 'approve')}>
          <Text style={styles.acceptText}>Confirm</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectButton} onPress={() => handleRequestAction(item.sender_id, 'decline')}>
          <Text style={styles.rejectText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenWrapper>
      <Header navigation={navigation} />
      <View style={styles.container}>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.tabsRow}>
          {['all', 'requests'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab === 'all' ? 'All' : 'Requests'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'all' && (
          <View>
            {requests.length > 0 && <Text style={styles.sectionTitle}>Follow Requests</Text>}
            <FlatList
              data={requests}
              keyExtractor={(item) => item.request_id?.toString() || item.sender_id?.toString()}
              renderItem={renderRequestItem}
              scrollEnabled={false}
            />
            <Text style={styles.sectionTitle}>This Week</Text>
            <FlatList
              data={general}
              keyExtractor={(item) => item.id?.toString() || `${item.sender_username}-${item.created_at}`}
              renderItem={renderGeneralItem}
              ListEmptyComponent={<Text style={styles.emptyText}>No notifications yet.</Text>}
              scrollEnabled={false}
            />
          </View>
        )}

        {activeTab === 'requests' && (
          <FlatList
            data={requests}
            keyExtractor={(item) => item.request_id?.toString() || item.sender_id?.toString()}
            renderItem={renderRequestItem}
            ListEmptyComponent={<Text style={styles.emptyText}>No follow requests.</Text>}
          />
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, backgroundColor: colors.white },
  title: { fontSize: typography['2xl'], fontWeight: '700', color: colors.ink, marginBottom: spacing.lg },
  tabsRow: { flexDirection: 'row', marginBottom: spacing.lg, backgroundColor: colors.gray100, borderRadius: 10 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabButtonActive: { backgroundColor: colors.pink500, borderRadius: 10 },
  tabText: { color: colors.gray700, fontWeight: '600' },
  tabTextActive: { color: colors.white },
  sectionTitle: { fontSize: typography.sm, fontWeight: '700', color: colors.ink, marginBottom: spacing.sm, marginTop: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.pink100, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.pink300,
  },
  avatarText: { color: colors.pink600, fontWeight: '700' },
  rowTextWrap: { flex: 1, marginLeft: spacing.md, marginRight: spacing.sm },
  rowText: { color: colors.ink, lineHeight: 18, fontSize: typography.sm },
  rowTime: { color: colors.gray500, fontSize: 11, marginTop: 2 },
  bold: { fontWeight: '700' },
  buttonRow: { flexDirection: 'row', gap: spacing.xs },
  acceptButton: { backgroundColor: colors.pink500, paddingVertical: 7, paddingHorizontal: spacing.sm, borderRadius: 8 },
  rejectButton: { backgroundColor: colors.gray100, paddingVertical: 7, paddingHorizontal: spacing.sm, borderRadius: 8 },
  acceptText: { color: colors.white, fontWeight: '700', fontSize: typography.xs },
  rejectText: { color: colors.ink, fontWeight: '700', fontSize: typography.xs },
  emptyText: { color: colors.gray600, marginBottom: spacing.md },
});
