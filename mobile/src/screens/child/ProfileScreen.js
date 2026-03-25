import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';

const AVATARS = ['🧒','👦','👧','🦁','🐯','🐻','🦊','🐸','🚀','⭐','🎮','🧠','🦋','🌟','🦄','🐲'];
const LANGS   = [{ code: 'de', label: '🇩🇪 Deutsch' }, { code: 'en', label: '🇬🇧 English' }, { code: 'uk', label: '🇺🇦 Українська' }];

export default function ChildProfile() {
  const { t, i18n } = useTranslation();
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

  const handleChangeLang = async (code) => {
    try {
      await api.patch('/auth/me/language', { ui_language: code });
      i18n.changeLanguage(code);
    } catch { /* ignore */ }
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

      {/* Language */}
      <Text style={styles.sectionTitle}>Sprache</Text>
      <View style={styles.langRow}>
        {LANGS.map(l => (
          <TouchableOpacity
            key={l.code}
            style={[styles.langBtn, i18n.language === l.code && styles.langBtnActive]}
            onPress={() => handleChangeLang(l.code)}
          >
            <Text style={[styles.langText, i18n.language === l.code && { color: '#fff' }]}>
              {l.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

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
  langRow:        { flexDirection: 'row', marginHorizontal: 16, gap: 8 },
  langBtn:        { flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0' },
  langBtnActive:  { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  langText:       { fontSize: 13, fontWeight: '600', color: '#1e293b' },
  infoCard:       { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 20, borderRadius: 16, padding: 16, gap: 8 },
  infoRow:        { fontSize: 14, color: '#475569' },
  logoutBtn:      { marginHorizontal: 16, marginTop: 24, padding: 16, borderRadius: 14, backgroundColor: '#fee2e2', alignItems: 'center' },
  logoutText:     { fontSize: 16, fontWeight: '700', color: '#b91c1c' },
});
