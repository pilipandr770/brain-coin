import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

const ContractCard = ({ contract, onStart }) => (
  <View style={styles.contractCard}>
    <View style={{ flex: 1 }}>
      <Text style={styles.contractTitle}>{contract.title}</Text>
      <Text style={styles.contractSubject}>{contract.subject_name}</Text>
      <Text style={styles.contractParent}>👤 {contract.parent_name}</Text>
    </View>
    <View style={{ alignItems: 'flex-end' }}>
      <Text style={styles.contractReward}>+{contract.reward_coins ?? contract.prize_coins} 🪙</Text>
      <TouchableOpacity style={styles.startBtn} onPress={() => onStart(contract)}>
        <Text style={styles.startBtnText}>▶ Start</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const PendingCard = ({ contract, onAccept, onReject }) => (
  <View style={styles.pendingCard}>
    <View style={{ flex: 1 }}>
      <Text style={styles.contractTitle}>{contract.title}</Text>
      <Text style={styles.contractSubject}>{contract.subject_name}</Text>
      <Text style={styles.pendingFrom}>von {contract.parent_name}</Text>
      <Text style={styles.contractReward}>🏆 {contract.reward_coins ?? contract.prize_coins} 🪙</Text>
    </View>
    <View style={styles.pendingActions}>
      <TouchableOpacity style={styles.acceptBtn} onPress={() => onAccept(contract)}>
        <Text style={styles.acceptBtnText}>✓</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.rejectBtn} onPress={() => onReject(contract)}>
        <Text style={styles.rejectBtnText}>✕</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function ChildHome() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { user } = useAuth();

  const [profile,    setProfile]    = useState(null);
  const [contracts,  setContracts]  = useState([]);
  const [parents,    setParents]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [meRes, contractsRes, parentsRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/contracts'),
        api.get('/auth/parents'),
      ]);
      setProfile(meRes.data);
      setContracts(contractsRes.data ?? []);
      setParents(parentsRes.data ?? []);
    } catch {
      // keep existing data on refresh error
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleStartQuiz = (contract) => {
    navigation.navigate('Quiz', { contractId: contract.id, contractTitle: contract.title });
  };

  const handleAccept = async (contract) => {
    try {
      await api.post(`/contracts/${contract.id}/accept`);
      load();
    } catch (e) {
      Alert.alert('', e.response?.data?.error || 'Error');
    }
  };

  const handleReject = async (contract) => {
    Alert.alert('Ablehnen?', 'Vertrag ablehnen?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Ablehnen', style: 'destructive', onPress: async () => {
        try {
          await api.post(`/contracts/${contract.id}/reject`);
          load();
        } catch {}
      }},
    ]);
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1d4ed8" />;

  const activeContracts  = contracts.filter(c => c.status === 'active');
  const pendingContracts = contracts.filter(c => c.status === 'pending' && !c.child_accepted);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Hero greeting */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>{profile?.avatar_emoji ?? user?.avatar_emoji ?? '🧒'}</Text>
        <Text style={styles.heroName}>{t('child.hello', { name: profile?.name ?? user?.name })}</Text>
        <View style={styles.coinsRow}>
          <Text style={styles.coinsLabel}>🪙</Text>
          <Text style={styles.coinsValue}>{profile?.total_coins ?? 0}</Text>
          <Text style={styles.coinsUnit}> {t('child.coins')}</Text>
        </View>
      </View>

      {/* Connect parent banner if no parent linked */}
      {parents.length === 0 && (
        <TouchableOpacity
          style={styles.connectBanner}
          onPress={() => navigation.navigate('ConnectParent')}
        >
          <Text style={styles.connectEmoji}>🔗</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.connectTitle}>Elternteil verbinden</Text>
            <Text style={styles.connectSub}>Einladungscode eingeben</Text>
          </View>
          <Text style={styles.connectArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* Parents list */}
      {parents.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>👪 Meine Eltern</Text>
          {parents.map(p => (
            <View key={p.id} style={styles.parentRow}>
              <Text style={{ fontSize: 28, marginRight: 12 }}>{p.avatar_emoji || '👤'}</Text>
              <Text style={styles.childName}>{p.name}</Text>
            </View>
          ))}
        </>
      )}

      {/* Pending contracts */}
      {pendingContracts.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>⏳ Neue Verträge</Text>
          {pendingContracts.map(c => (
            <PendingCard key={c.id} contract={c} onAccept={handleAccept} onReject={handleReject} />
          ))}
        </>
      )}

      {/* Active contracts */}
      <Text style={styles.sectionTitle}>{t('child.activeContracts')}</Text>
      {activeContracts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyText}>{t('child.noContracts')}</Text>
        </View>
      ) : (
        activeContracts.map((c) => (
          <ContractCard key={c.id} contract={c} onStart={handleStartQuiz} />
        ))
      )}

      {/* Quick actions */}
      <Text style={styles.sectionTitle}>⚡ Schnellzugriff</Text>
      <View style={styles.quickRow}>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => navigation.navigate('MistakeReview')}
        >
          <Text style={styles.quickEmoji}>📝</Text>
          <Text style={styles.quickLabel}>Meine Fehler</Text>
          <Text style={styles.quickSub}>Überprüfen & lernen</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#f8fafc' },
  hero:          {
    backgroundColor: '#1d4ed8', paddingHorizontal: 24, paddingTop: 48,
    paddingBottom: 32, alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  heroEmoji:     { fontSize: 56, marginBottom: 8 },
  heroName:      { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 12 },
  coinsRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', padding: 12, borderRadius: 20 },
  coinsLabel:    { fontSize: 24 },
  coinsValue:    { fontSize: 28, fontWeight: '900', color: '#fff', marginLeft: 6 },
  coinsUnit:     { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  connectBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fef3c7', marginHorizontal: 16, marginTop: 20,
    borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: '#f59e0b',
  },
  connectEmoji:  { fontSize: 28, marginRight: 12 },
  connectTitle:  { fontSize: 15, fontWeight: '700', color: '#92400e' },
  connectSub:    { fontSize: 12, color: '#b45309', marginTop: 2 },
  connectArrow:  { fontSize: 22, color: '#d97706', fontWeight: '700' },
  sectionTitle:  { fontSize: 17, fontWeight: '700', color: '#1e293b', marginHorizontal: 20, marginTop: 28, marginBottom: 12 },
  parentRow:     {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8,
    borderRadius: 14, padding: 14, elevation: 1,
  },
  childName:     { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  contractCard:  {
    flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 16, elevation: 2,
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
  },
  pendingCard:   {
    flexDirection: 'row', backgroundColor: '#eff6ff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 16, elevation: 2, borderWidth: 1.5, borderColor: '#93c5fd',
  },
  contractTitle:   { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  contractSubject: { fontSize: 13, color: '#64748b', marginTop: 2 },
  contractParent:  { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  pendingFrom:     { fontSize: 12, color: '#3b82f6', marginTop: 2 },
  contractReward:  { fontSize: 15, fontWeight: '800', color: '#d97706', marginTop: 4 },
  startBtn:        { marginTop: 8, backgroundColor: '#1d4ed8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  startBtnText:    { color: '#fff', fontWeight: '700', fontSize: 13 },
  pendingActions:  { justifyContent: 'center', gap: 8 },
  acceptBtn:       { backgroundColor: '#16a34a', borderRadius: 24, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  acceptBtnText:   { color: '#fff', fontWeight: '900', fontSize: 16 },
  rejectBtn:       { backgroundColor: '#ef4444', borderRadius: 24, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  rejectBtnText:   { color: '#fff', fontWeight: '900', fontSize: 16 },
  emptyBox:        { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji:      { fontSize: 48, marginBottom: 12 },
  emptyText:       { fontSize: 15, color: '#94a3b8', textAlign: 'center' },
  quickRow:        { flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 8 },
  quickCard:       {
    flex: 1, backgroundColor: '#f3e8ff', borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1.5, borderColor: '#d8b4fe',
  },
  quickEmoji:      { fontSize: 32, marginBottom: 6 },
  quickLabel:      { fontSize: 14, fontWeight: '700', color: '#6d28d9' },
  quickSub:        { fontSize: 11, color: '#8b5cf6', marginTop: 2, textAlign: 'center' },
});
