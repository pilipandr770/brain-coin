import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

const MEDAL = ['🥇','🥈','🥉'];

export default function Leaderboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [data,       setData]       = useState([]);
  const [friends,    setFriends]    = useState([]);   // friendship records
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);
  const [requesting, setRequesting] = useState({}); // { userId: true }

  const load = useCallback(async () => {
    setError(null);
    try {
      const [lb, fr] = await Promise.all([
        api.get('/social/leaderboard'),
        api.get('/social/friends').catch(() => ({ data: [] })),
      ]);
      setData(lb.data ?? []);
      setFriends(fr.data ?? []);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  // Build a set of user ids already in some friendship state
  const friendIds = new Set(friends.map(f => f.friend_id));

  const sendRequest = async (targetId) => {
    setRequesting(prev => ({ ...prev, [targetId]: true }));
    try {
      await api.post('/social/friends/request', { addressee_id: targetId });
      await load();
    } catch {
      // Silently ignore (e.g. already requested)
      await load();
    } finally {
      setRequesting(prev => ({ ...prev, [targetId]: false }));
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1d4ed8" />;

  if (error) return (
    <View style={styles.center}>
      <Text style={{ color: '#ef4444' }}>{error}</Text>
      <TouchableOpacity onPress={load} style={{ marginTop: 12 }}>
        <Text style={{ color: '#1d4ed8' }}>{t('retry')}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={styles.heroHeader}>
        <Text style={styles.heroTitle}>🏆 {t('child.leaderboard')}</Text>
      </View>
      <FlatList
        data={data}
        keyExtractor={(item, idx) => String(item.id ?? idx)}
        renderItem={({ item, index }) => {
          const isMe = item.id === user?.id;
          const isFriend = friendIds.has(item.id);
          const isRequesting = requesting[item.id];
          return (
            <View style={[styles.row, isMe && styles.rowMe]}>
              <Text style={styles.rank}>
                {index + 1 <= 3 ? MEDAL[index] : `#${index + 1}`}
              </Text>
              <Text style={styles.avatar}>{item.avatar_emoji ?? '🧒'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.name, isMe && { fontWeight: '900', color: '#1d4ed8' }]}>
                  {item.name ?? 'User'}{isMe ? ' (du)' : ''}
                </Text>
                <Text style={styles.quizzes}>{item.completed_quests ?? 0} Quests</Text>
              </View>
              <View style={styles.coinsWrap}>
                <Text style={styles.coins}>{item.total_coins ?? 0}</Text>
                <Text style={styles.coinsEmoji}> 🪙</Text>
              </View>
              {!isMe && (
                isFriend ? (
                  <Text style={styles.friendedBadge}>👾</Text>
                ) : (
                  <TouchableOpacity
                    style={[styles.addBtn, isRequesting && styles.addBtnDisabled]}
                    onPress={() => sendRequest(item.id)}
                    disabled={!!isRequesting}
                  >
                    <Text style={styles.addBtnTxt}>{isRequesting ? '…' : '+'}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          );
        }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: '#94a3b8' }}>{t('child.emptyLeaderboard')}</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#f8fafc' },
  center:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  heroHeader: {
    backgroundColor: '#1d4ed8', paddingTop: 52, paddingBottom: 20, alignItems: 'center',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28, marginBottom: 8,
  },
  heroTitle:  { fontSize: 22, fontWeight: '900', color: '#fff' },
  row:        {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 12, marginVertical: 4,
    borderRadius: 16, padding: 14,
    elevation: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  rowMe:      { borderWidth: 2, borderColor: '#1d4ed8', backgroundColor: '#eff6ff' },
  rank:       { width: 40, fontSize: 20, textAlign: 'center' },
  avatar:     { fontSize: 28, marginHorizontal: 10 },
  name:       { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  quizzes:    { fontSize: 12, color: '#64748b', marginTop: 2 },
  coinsWrap:    { flexDirection: 'row', alignItems: 'center' },
  coins:        { fontSize: 18, fontWeight: '800', color: '#d97706' },
  coinsEmoji:   { fontSize: 18 },
  addBtn:       {
    marginLeft: 8, width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#7c3aed', alignItems: 'center', justifyContent: 'center',
  },
  addBtnDisabled: { backgroundColor: '#c4b5fd' },
  addBtnTxt:    { color: '#fff', fontSize: 18, fontWeight: '700', lineHeight: 22 },
  friendedBadge:{ marginLeft: 8, fontSize: 18 },
});
