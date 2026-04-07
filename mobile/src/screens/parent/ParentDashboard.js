import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, RefreshControl, Alert, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

export default function ParentDashboard({ navigation }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const [children,  setChildren]  = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ch, ct] = await Promise.all([
        api.get('/auth/children'),
        api.get('/contracts'),
      ]);
      setChildren(ch.data);
      setContracts(ct.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Aus dem Konto abmelden?')) logout();
    } else {
      Alert.alert(t('auth.logout'), 'Aus dem Konto abmelden?', [
        { text: 'Abbrechen', style: 'cancel' },
        { text: t('auth.logout'), style: 'destructive', onPress: logout },
      ]);
    }
  };

  const handleAccept = async (contractId) => {
    try {
      await api.post(`/contracts/${contractId}/accept`);
      load();
    } catch (e) {
      Alert.alert('', e.response?.data?.error || 'Error');
    }
  };

  const handleReject = async (contractId) => {
    Alert.alert('Ablehnen?', 'Vertrag ablehnen?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Ablehnen', style: 'destructive', onPress: async () => {
        try { await api.post(`/contracts/${contractId}/reject`); load(); } catch {}
      }},
    ]);
  };

  const pendingContracts = contracts.filter(c => c.status === 'pending' && !c.parent_accepted);
  const activeContracts  = contracts.filter(c => c.status === 'active');

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.avatar}>{user?.avatar_emoji || '👨‍👩‍👧'}</Text>
          <View>
            <Text style={styles.headerName}>{user?.name}</Text>
            <Text style={styles.headerRole}>{t('parent.panelTitle')}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutTxt}>↩</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Children */}
        <Text style={styles.sectionTitle}>{t('parent.myChildren')}</Text>

        {loading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTxt}>Laden...</Text>
          </View>
        ) : children.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🧒</Text>
            <Text style={styles.emptyTxt}>{t('parent.noChildren')}</Text>
          </View>
        ) : (
          children.map((child) => (
            <TouchableOpacity
              key={child.id}
              style={styles.childCard}
              onPress={() => navigation.navigate('Stats', { childId: child.id, childName: child.name })}
            >
              <Text style={styles.childAvatar}>{child.avatar_emoji || '🧒'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.childName}>{child.name}</Text>
                <Text style={styles.childGrade}>
                  {child.grade ? `${t('auth.grade')} ${child.grade}` : t('parent.gradeNotSet')}
                </Text>
              </View>
              <View style={styles.coinsChip}>
                <Text style={styles.coinsTxt}>🪙 {child.total_coins}</Text>
              </View>
              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={() => navigation.navigate('ContentSettings', { childId: child.id, childName: child.name })}
              >
                <Ionicons name="settings-outline" size={18} color="#64748b" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}

        {/* Pending contracts awaiting parent */}
        {pendingContracts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>⏳ {t('parent.awaitingYourConfirm')}</Text>
            {pendingContracts.map(ct => (
              <View key={ct.id} style={styles.pendingCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contractTitle}>{ct.title}</Text>
                  <Text style={styles.contractMeta}>{ct.subject_name} · 🧒 {ct.child_name}</Text>
                  <Text style={styles.contractMeta}>🪙 {ct.prize_coins ?? ct.reward_coins}</Text>
                </View>
                <View style={styles.pendingActions}>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(ct.id)}>
                    <Text style={styles.acceptTxt}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(ct.id)}>
                    <Text style={styles.rejectTxt}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {/* Active contracts */}
        <Text style={styles.sectionTitle}>{t('parent.activeContractsTitle')}</Text>

        {activeContracts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTxt}>{t('parent.noActiveContracts')}</Text>
          </View>
        ) : (
          activeContracts.map((ct) => (
            <View key={ct.id} style={styles.contractCard}>
              <View style={styles.contractHeader}>
                <Text style={styles.contractTitle}>{ct.title}</Text>
                <View style={[styles.statusBadge, styles.statusActive]}>
                  <Text style={styles.statusTxt}>{t('parent.active')}</Text>
                </View>
              </View>
              <Text style={styles.contractMeta}>
                🧒 {ct.child_name} · 🪙 {ct.prize_coins ?? ct.reward_coins} · {ct.subject_name}
              </Text>
            </View>
          ))
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#f1f5f9' },
  header:       {
    backgroundColor: '#1d4ed8', paddingTop: 56, paddingBottom: 16,
    paddingHorizontal: 20, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar:       { fontSize: 36 },
  headerName:   { fontSize: 17, fontWeight: '700', color: '#fff' },
  headerRole:   { fontSize: 12, color: '#bfdbfe' },
  logoutBtn:    { padding: 8 },
  logoutTxt:    { fontSize: 22, color: '#fff' },
  scroll:       { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 20, marginBottom: 10 },
  emptyCard:    {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    alignItems: 'center', marginBottom: 8,
  },
  emptyEmoji:   { fontSize: 36, marginBottom: 8 },
  emptyTxt:     { fontSize: 14, color: '#94a3b8' },
  childCard:    {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 10, elevation: 2,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  childAvatar:  { fontSize: 32, marginRight: 14 },
  childName:    { fontSize: 16, fontWeight: '700', color: '#1e293b' },
  childGrade:   { fontSize: 13, color: '#64748b', marginTop: 2 },
  coinsChip:    {
    backgroundColor: '#fef3c7', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    marginRight: 8,
  },
  coinsTxt:     { fontSize: 14, fontWeight: '700', color: '#92400e' },
  settingsBtn:  {
    padding: 6, borderRadius: 20, backgroundColor: '#f1f5f9',
  },
  contractCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10,
    elevation: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
  },
  contractHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  contractTitle:  { fontSize: 15, fontWeight: '600', color: '#1e293b', flex: 1, marginRight: 8 },
  contractMeta:   { fontSize: 13, color: '#64748b' },
  statusBadge:    { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusActive:   { backgroundColor: '#dcfce7' },
  statusTxt:      { fontSize: 12, fontWeight: '600', color: '#166534' },
  pendingCard:    {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#eff6ff', borderRadius: 16, padding: 16,
    marginBottom: 10, borderWidth: 1.5, borderColor: '#93c5fd',
  },
  pendingActions: { justifyContent: 'center', gap: 8 },
  acceptBtn:      { backgroundColor: '#16a34a', borderRadius: 24, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  acceptTxt:      { color: '#fff', fontWeight: '900', fontSize: 16 },
  rejectBtn:      { backgroundColor: '#ef4444', borderRadius: 24, width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  rejectTxt:      { color: '#fff', fontWeight: '900', fontSize: 16 },
});
