import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

const AVATARS = ['🧒','👦','👧','🦁','🐯','🐻','🦊','🐸','🚀','⭐','🎮','🧠','🦋','🌟','🦄','🐲'];

export default function ChildProfile() {
  const { t } = useTranslation();
  const { user, logout, refreshUser } = useAuth();

  const [avatar,   setAvatar]   = useState(user?.avatar_emoji || '🧒');
  const [saving,   setSaving]   = useState(false);
  const [profile,  setProfile]  = useState(null);

  useEffect(() => {
    api.get('/auth/me').then(r => {
      setProfile(r.data);
      setAvatar(r.data.avatar_emoji || '🧒');
    }).catch(() => {});
  }, []);

  const handleSaveAvatar = async (emoji) => {
    setAvatar(emoji);
    try {
      setSaving(true);
      await api.patch('/auth/me/avatar', { avatar_emoji: emoji });
      if (refreshUser) refreshUser();
    } catch {
      Alert.alert('', 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Konto löschen',
      'Möchten Sie Ihr Konto wirklich löschen? Alle Daten werden unwiderruflich entfernt.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Endgültig löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/auth/me');
              logout();
            } catch {
              Alert.alert('Fehler', 'Konto konnte nicht gelöscht werden.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerAvatar}>{avatar}</Text>
        <Text style={styles.headerName}>{profile?.name ?? user?.name}</Text>
        <View style={styles.coinsRow}>
          <Text style={styles.coinsText}>🪙 {profile?.total_coins ?? 0}</Text>
        </View>
      </View>

      {/* Avatar picker */}
      <Text style={styles.sectionTitle}>Avatar wählen</Text>
      <View style={styles.avatarGrid}>
        {AVATARS.map(e => (
          <TouchableOpacity
            key={e}
            style={[styles.avatarBtn, e === avatar && styles.avatarBtnActive]}
            onPress={() => handleSaveAvatar(e)}
          >
            <Text style={{ fontSize: 30 }}>{e}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {saving && <ActivityIndicator color="#1d4ed8" style={{ marginTop: 8 }} />}

      {/* Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoRow}>📧 {profile?.email ?? '—'}</Text>
        <Text style={styles.infoRow}>🏫 Klasse: {profile?.grade ?? '—'}</Text>
        <Text style={styles.infoRow}>🎂 Alter: {profile?.age ?? '—'}</Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>↩ {t('auth.logout')}</Text>
      </TouchableOpacity>

      {/* Delete account */}
      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>⚠️ Gefahrenzone</Text>
        <Text style={styles.dangerDesc}>Das Löschen ist unwiderruflich.</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteBtnTxt}>Konto löschen</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#f8fafc' },
  header:         {
    backgroundColor: '#7c3aed', paddingTop: 56, paddingBottom: 28,
    alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  headerAvatar:   { fontSize: 64, marginBottom: 8 },
  headerName:     { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
  coinsRow:       { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8 },
  coinsText:      { fontSize: 18, fontWeight: '700', color: '#fff' },
  sectionTitle:   { fontSize: 15, fontWeight: '700', color: '#1e293b', marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
  avatarGrid:     { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: 16, gap: 8 },
  avatarBtn:      { width: 56, height: 56, borderRadius: 14, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e2e8f0' },
  avatarBtnActive:{ borderColor: '#7c3aed', backgroundColor: '#f3e8ff' },
  infoCard:       { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 20, borderRadius: 16, padding: 16, gap: 8 },
  infoRow:        { fontSize: 14, color: '#475569' },
  logoutBtn:      { marginHorizontal: 16, marginTop: 24, padding: 16, borderRadius: 14, backgroundColor: '#fee2e2', alignItems: 'center' },
  logoutText:     { fontSize: 16, fontWeight: '700', color: '#b91c1c' },
  dangerZone:     { marginHorizontal: 16, marginTop: 16, marginBottom: 32, borderRadius: 16, borderWidth: 1, borderColor: '#fca5a5', backgroundColor: '#fff1f1', padding: 18 },
  dangerTitle:    { fontSize: 14, fontWeight: '800', color: '#b91c1c', marginBottom: 6 },
  dangerDesc:     { fontSize: 13, color: '#64748b', marginBottom: 14 },
  deleteBtn:      { backgroundColor: '#dc2626', borderRadius: 12, padding: 13, alignItems: 'center' },
  deleteBtnTxt:   { fontSize: 14, fontWeight: '800', color: '#fff' },
});
