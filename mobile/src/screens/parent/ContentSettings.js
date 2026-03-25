import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  Switch, ActivityIndicator,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import api from '../../api';

const FILTERS = [
  { key: 'safe_mode',       label: 'Safe Mode',       desc: 'Alle sensiblen Themen blockieren',          emoji: '🛡️' },
  { key: 'block_religion',  label: 'Religion',        desc: 'Religiöse Inhalte blockieren',              emoji: '⛪' },
  { key: 'block_politics',  label: 'Politik',         desc: 'Politische Inhalte blockieren',             emoji: '🏛️' },
  { key: 'block_conflicts', label: 'Konflikte',       desc: 'Kriegs- und Konfliktthemen blockieren',     emoji: '⚔️' },
  { key: 'block_mature',    label: 'Reife Inhalte',   desc: 'Inhalte für Erwachsene blockieren',         emoji: '🔞' },
];

export default function ContentSettings() {
  const navigation = useNavigation();
  const { childId, childName } = useRoute().params ?? {};

  const [settings, setSettings] = useState({});
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/auth/children/${childId}/settings`);
      setSettings(data ?? {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [childId]);

  useEffect(() => {
    navigation.setOptions({ title: `${childName ?? 'Kind'} – Einstellungen` });
    load();
  }, [childId]);

  const toggle = async (key, value) => {
    const prev = settings;
    const next = { ...settings, [key]: value };
    setSettings(next);
    setSaving(true);
    try {
      await api.patch(`/auth/children/${childId}/settings`, next);
    } catch {
      setSettings(prev); // revert on error
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1d4ed8" />;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🛡️ Inhaltsfilter für {childName}</Text>
        <Text style={styles.infoHint}>
          Quiz-Fragen werden für dieses Kind entsprechend gefiltert.
          Änderungen werden sofort gespeichert.
        </Text>
        {saving && <Text style={styles.savingTxt}>🔄 Speichern...</Text>}
      </View>

      {FILTERS.map((f) => (
        <View key={f.key} style={styles.row}>
          <Text style={styles.emoji}>{f.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{f.label}</Text>
            <Text style={styles.desc}>{f.desc}</Text>
          </View>
          <Switch
            value={!!settings[f.key]}
            onValueChange={(v) => toggle(f.key, v)}
            trackColor={{ false: '#e2e8f0', true: '#bfdbfe' }}
            thumbColor={settings[f.key] ? '#1d4ed8' : '#94a3b8'}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:      { flex: 1, backgroundColor: '#f8fafc' },
  infoCard:  {
    margin: 16, backgroundColor: '#eff6ff', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: '#bfdbfe',
  },
  infoTitle: { fontSize: 15, fontWeight: '700', color: '#1e40af', marginBottom: 6 },
  infoHint:  { fontSize: 13, color: '#3b82f6', lineHeight: 18 },
  savingTxt: { fontSize: 12, color: '#1d4ed8', marginTop: 8, fontWeight: '600' },
  row:       {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 10, borderRadius: 16, padding: 16,
    elevation: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  emoji:     { fontSize: 26, marginRight: 14 },
  label:     { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  desc:      { fontSize: 12, color: '#64748b', marginTop: 2 },
});
