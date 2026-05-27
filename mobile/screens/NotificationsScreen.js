import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Alert } from 'react-native';
import { getNotifications, dismissNotification, followRequestAction } from '../services/api';
import ScreenWrapper from '../components/ScreenWrapper';


export default function NotificationsScreen() {
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
    <View style={styles.notificationCard}>
      <Text style={styles.notificationText}>{item.message}</Text>
      <Text style={styles.notificationTime}>{item.created_at}</Text>
      <TouchableOpacity style={styles.dismissButton} onPress={() => handleDismiss(item.id)}>
        <Text style={styles.dismissText}>Dismiss</Text>
      </TouchableOpacity>
    </View>
  );

  const renderRequestItem = ({ item }) => (
    <View style={styles.notificationCard}>
      <Text style={styles.notificationText}><Text style={{ fontWeight: '700' }}>{item.sender_username}</Text> requested to follow you.</Text>
      <Text style={styles.notificationTime}>{item.requested_at}</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.acceptButton} onPress={() => handleRequestAction(item.sender_id, 'approve')}>
          <Text style={styles.actionText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectButton} onPress={() => handleRequestAction(item.sender_id, 'decline')}>
          <Text style={styles.rejectText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScreenWrapper>
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
          <Text style={styles.sectionTitle}>Follow requests</Text>
          <FlatList
            data={requests}
            keyExtractor={(item) => item.request_id?.toString() || item.sender_id?.toString()}
            renderItem={renderRequestItem}
            ListEmptyComponent={<Text style={styles.emptyText}>No follow requests.</Text>}
          />
          <Text style={styles.sectionTitle}>General</Text>
          <FlatList
            data={general}
            keyExtractor={(item) => item.id?.toString() || `${item.sender_username}-${item.created_at}`}
            renderItem={renderGeneralItem}
            ListEmptyComponent={<Text style={styles.emptyText}>No notifications yet.</Text>}
          />
        </View>
      )}

      {activeTab === 'requests' && (
        <View>
          <FlatList
            data={requests}
            keyExtractor={(item) => item.request_id?.toString() || item.sender_id?.toString()}
            renderItem={renderRequestItem}
            ListEmptyComponent={<Text style={styles.emptyText}>No follow requests.</Text>}
          />
        </View>
      )}
    </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, backgroundColor: '#fff5fb' },
  title: { fontSize: 28, fontWeight: '800', color: '#163e8a', marginBottom: 20 },
  tabsRow: { flexDirection: 'row', marginBottom: 20, borderRadius: 16, backgroundColor: '#ffe7f2' },
  tabButton: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabButtonActive: { backgroundColor: '#ff69b4', borderRadius: 16 },
  tabText: { color: '#a12d56', fontWeight: '700' },
  tabTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#163e8a', marginBottom: 10 },
  notificationCard: { backgroundColor: '#fff', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#f7d6e2', marginBottom: 12 },
  notificationText: { color: '#163e8a', marginBottom: 10, lineHeight: 22 },
  notificationTime: { color: '#8a8dab', fontSize: 12, marginBottom: 10 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  acceptButton: { flex: 1, backgroundColor: '#ff69b4', paddingVertical: 12, borderRadius: 14, alignItems: 'center', marginRight: 8 },
  rejectButton: { flex: 1, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#ff69b4', paddingVertical: 12, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '700' },
  rejectText: { color: '#ff69b4', fontWeight: '700' },
  dismissButton: { marginTop: 10 },
  dismissText: { color: '#ff69b4', fontWeight: '700' },
  emptyText: { color: '#5e6a88', marginBottom: 12 }
});
