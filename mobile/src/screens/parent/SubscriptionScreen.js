import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Platform, Linking,
} from 'react-native';
import api from '../../api';

const FEATURES = [
  { emoji: '🤖', text: 'KI-generierte Fragen in 12+ Fächern' },
  { emoji: '📊', text: 'Detaillierte Lernstatistiken pro Kind' },
  { emoji: '📋', text: 'Unbegrenzte Verträge & Quests' },
  { emoji: '🛡️', text: 'Inhaltsfilter & Sicherheitseinstellungen' },
  { emoji: '👥', text: 'Mehrere Kinder verwalten' },
  { emoji: '🏆', text: 'Rangliste & Freundesystem' },
];

export default function SubscriptionScreen() {
  const [status,  setStatus]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/payments/status');
      setStatus(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openUrl = async (url) => {
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      await Linking.openURL(url);
    }
  };

  const handleSubscribe = async () => {
    setWorking(true);
    try {
      const { data } = await api.post('/payments/checkout');
      if (data.url) await openUrl(data.url);
    } catch (e) {
      if (Platform.OS === 'web') {
        alert(e.response?.data?.error || 'Fehler beim Laden');
      }
    } finally {
      setWorking(false);
    }
  };

  const handlePortal = async () => {
    setWorking(true);
    try {
      const { data } = await api.get('/payments/portal');
      if (data.url) await openUrl(data.url);
    } catch (e) {
      if (Platform.OS === 'web') {
        alert(e.response?.data?.error || 'Fehler beim Laden');
      }
    } finally {
      setWorking(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1d4ed8" />;

  const isActive  = status?.sub_status === 'active' || status?.sub_status === 'trialing';
  const isTrial   = status?.sub_status === 'trialing';
  const trialEnd  = status?.trial_ends_at
    ? new Date(status.trial_ends_at).toLocaleDateString('de-DE')
    : null;
  const periodEnd = status?.period_end
    ? new Date(status.period_end).toLocaleDateString('de-DE')
    : null;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>⭐</Text>
        <Text style={styles.heroTitle}>BrainCoin Pro</Text>
        <Text style={styles.heroPrice}>5 € / Monat</Text>
        {!isActive && (
          <View style={styles.trialBadge}>
            <Text style={styles.trialTxt}>🎁 3 Tage kostenlos testen</Text>
          </View>
        )}
      </View>

      {/* Status banner */}
      {isActive ? (
        <View style={styles.activeBanner}>
          <Text style={styles.activeTxt}>
            {isTrial
              ? `🎁 Testphase aktiv${trialEnd ? ` bis ${trialEnd}` : ''}`
              : `✅ Abonnement aktiv${periodEnd ? ` bis ${periodEnd}` : ''}`}
          </Text>
        </View>
      ) : (
        <View style={styles.inactiveBanner}>
          <Text style={styles.inactiveTxt}>⚠️ Kein aktives Abonnement</Text>
        </View>
      )}

      {/* Features */}
      <View style={styles.featureBox}>
        <Text style={styles.featureTitle}>Was du bekommst:</Text>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <Text style={styles.featureEmoji}>{f.emoji}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      {isActive ? (
        <TouchableOpacity style={styles.portalBtn} onPress={handlePortal} disabled={working}>
          <Text style={styles.portalBtnTxt}>
            {working ? '⏳ Laden...' : '⚙️ Abonnement verwalten'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.subscribeBtn} onPress={handleSubscribe} disabled={working}>
          <Text style={styles.subscribeBtnTxt}>
            {working ? '⏳ Laden...' : '🚀 Jetzt für 5 €/Monat starten'}
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.legal}>
        Jederzeit kündbar · Sicher bezahlen mit Stripe
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#f8fafc' },
  hero:           {
    backgroundColor: '#1d4ed8', paddingTop: 52, paddingBottom: 36,
    alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  heroEmoji:      { fontSize: 56 },
  heroTitle:      { fontSize: 28, fontWeight: '900', color: '#fff', marginTop: 12 },
  heroPrice:      { fontSize: 18, color: '#bfdbfe', marginTop: 4 },
  trialBadge:     {
    marginTop: 16, backgroundColor: '#fbbf24',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
  },
  trialTxt:       { fontSize: 13, fontWeight: '700', color: '#92400e' },
  activeBanner:   {
    margin: 16, backgroundColor: '#d1fae5', borderRadius: 14,
    padding: 14, alignItems: 'center',
  },
  activeTxt:      { fontSize: 14, fontWeight: '700', color: '#065f46' },
  inactiveBanner: {
    margin: 16, backgroundColor: '#fee2e2', borderRadius: 14,
    padding: 14, alignItems: 'center',
  },
  inactiveTxt:    { fontSize: 14, fontWeight: '700', color: '#991b1b' },
  featureBox:     {
    margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 20,
    elevation: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  featureTitle:   { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  featureRow:     { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureEmoji:   { fontSize: 22, width: 36 },
  featureText:    { fontSize: 14, color: '#475569', flex: 1 },
  subscribeBtn:   {
    marginHorizontal: 16, marginTop: 8, backgroundColor: '#1d4ed8',
    borderRadius: 16, padding: 18, alignItems: 'center',
    elevation: 2, boxShadow: '0 2px 8px rgba(29,78,216,0.3)',
  },
  subscribeBtnTxt:{ fontSize: 16, fontWeight: '800', color: '#fff' },
  portalBtn:      {
    marginHorizontal: 16, marginTop: 8, backgroundColor: '#f1f5f9',
    borderRadius: 16, padding: 18, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#cbd5e1',
  },
  portalBtnTxt:   { fontSize: 15, fontWeight: '700', color: '#475569' },
  legal:          { textAlign: 'center', fontSize: 12, color: '#94a3b8', margin: 16 },
});
