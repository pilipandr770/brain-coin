import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

export default function FriendsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [friends,    setFriends]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/social/friends');
      setFriends(data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  const handleAccept = async (friendshipId) => {
    try {
      await api.put(`/social/friends/${friendshipId}`, { action: 'accept' });
      load();
    } catch (e) {
      if (Platform.OS === 'web') {
        alert(e.response?.data?.error || 'Fehler');
      } else {
        Alert.alert('', e.response?.data?.error || 'Fehler');
      }
    }
  };

  const handleReject = async (friendshipId) => {
    try {
      await api.put(`/social/friends/${friendshipId}`, { action: 'reject' });
      load();
    } catch {}
  };

  // separate pending (incoming) vs accepted
  const incoming  = friends.filter(f => f.status === 'pending' && f.requester_id !== user?.id);
  const outgoing  = friends.filter(f => f.status === 'pending' && f.requester_id === user?.id);
  const accepted  = friends.filter(f => f.status === 'accepted');

  const sections = [
    ...(incoming.map(f => ({ ...f, _section: 'incoming' }))),
    ...(outgoing.map(f => ({ ...f, _section: 'outgoing' }))),
    ...(accepted.map(f => ({ ...f, _section: 'accepted' }))),
  ];

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#7c3aed" />;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👥 Freunde</Text>
        <Text style={styles.headerSub}>{accepted.length} Freunde · {incoming.length} Anfragen</Text>
      </View>

      <FlatList
        data={sections}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🤝</Text>
            <Text style={styles.emptyText}>Noch keine Freunde</Text>
            <Text style={styles.emptyHint}>Füge Freunde über die Rangliste hinzu!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={[
            styles.card,
            item._section === 'incoming' && styles.cardIncoming,
            item._section === 'outgoing' && styles.cardOutgoing,
          ]}>
            <Text style={styles.avatar}>{item.friend_avatar ?? '🧒'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.friend_name ?? '—'}</Text>
              {item._section === 'incoming' && (
                <Text style={styles.labelIncoming}>Freundschaftsanfrage erhalten</Text>
              )}
              {item._section === 'outgoing' && (
                <Text style={styles.labelOutgoing}>Anfrage gesendet ⏳</Text>
              )}
              {item._section === 'accepted' && (
                <Text style={styles.labelFriend}>🪙 {item.friend_coins ?? 0} Münzen</Text>
              )}
            </View>
            {item._section === 'incoming' && (
              <View style={styles.actions}>
                <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item.id)}>
                  <Text style={styles.acceptTxt}>✓</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item.id)}>
                  <Text style={styles.rejectTxt}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
            {item._section === 'accepted' && (
              <Text style={styles.friendBadge}>👾</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#f8fafc' },
  header:        {
    backgroundColor: '#7c3aed', paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28, marginBottom: 8,
  },
  headerTitle:   { fontSize: 22, fontWeight: '900', color: '#fff' },
  headerSub:     { fontSize: 13, color: '#e9d5ff', marginTop: 4 },
  empty:         { alignItems: 'center', padding: 40 },
  emptyEmoji:    { fontSize: 48, marginBottom: 12 },
  emptyText:     { fontSize: 16, fontWeight: '700', color: '#475569' },
  emptyHint:     { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  card:          {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, padding: 16, marginBottom: 10,
    elevation: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  cardIncoming:  { borderWidth: 1.5, borderColor: '#c4b5fd' },
  cardOutgoing:  { borderWidth: 1, borderColor: '#e2e8f0' },
  avatar:        { fontSize: 28, marginRight: 14 },
  name:          { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  labelIncoming: { fontSize: 12, color: '#7c3aed', marginTop: 2 },
  labelOutgoing: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  labelFriend:   { fontSize: 12, color: '#d97706', marginTop: 2 },
  actions:       { flexDirection: 'row', gap: 8 },
  acceptBtn:     { backgroundColor: '#d1fae5', borderRadius: 8, padding: 8, minWidth: 36, alignItems: 'center' },
  acceptTxt:     { fontSize: 16, color: '#065f46', fontWeight: '700' },
  rejectBtn:     { backgroundColor: '#fee2e2', borderRadius: 8, padding: 8, minWidth: 36, alignItems: 'center' },
  rejectTxt:     { fontSize: 16, color: '#991b1b', fontWeight: '700' },
  friendBadge:   { fontSize: 22 },
});
