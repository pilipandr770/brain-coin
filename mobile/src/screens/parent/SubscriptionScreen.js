import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Linking,
} from 'react-native';
import api from '../../api';

// вљ пёЏ  Payments happen on the web вЂ” no in-app purchase (avoids 30% App Store / Google Play fee).
// The app only shows subscription status and redirects to the website for payment management.
const WEB_URL = 'http://localhost:3000/parent/payment'; // change to production URL when deploying

const FEATURES = [
  { emoji: 'рџ¤–', text: 'KI-generierte Fragen in 12+ FГ¤chern' },
  { emoji: 'рџ“Љ', text: 'Detaillierte Lernstatistiken pro Kind' },
  { emoji: 'рџ“‹', text: 'Unbegrenzte VertrГ¤ge & Quests' },
  { emoji: 'рџ›ЎпёЏ', text: 'Inhaltsfilter & Sicherheitseinstellungen' },
  { emoji: 'рџ‘Ґ', text: 'Mehrere Kinder verwalten' },
  { emoji: 'рџЏ†', text: 'Rangliste & Freundesystem' },
];

export default function SubscriptionScreen() {
  const [status,  setStatus]  = useState(null);
  const [loading, setLoading] = useState(true);

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

  const openWebPayment = () => Linking.openURL(WEB_URL);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1d4ed8" />;

  const isActive = status?.sub_status === 'active' || status?.sub_status === 'trialing';
  const isTrial  = status?.sub_status === 'trialing';
  const trialEnd = status?.trial_ends_at
    ? new Date(status.trial_ends_at).toLocaleDateString('de-DE')
    : null;
  const periodEnd = status?.sub_current_period_end
    ? new Date(status.sub_current_period_end).toLocaleDateString('de-DE')
    : null;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 60 }}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>в­ђ</Text>
        <Text style={styles.heroTitle}>BrainCoin Pro</Text>
        <Text style={styles.heroPrice}>5 в‚¬ / Monat</Text>
        {!isActive && (
          <View style={styles.trialBadge}>
            <Text style={styles.trialTxt}>рџЋЃ 3 Tage kostenlos testen</Text>
          </View>
        )}
      </View>

      {/* Status banner */}
      {isActive ? (
        <View style={styles.activeBanner}>
          <Text style={styles.activeTxt}>
            {isTrial
              ? `рџЋЃ Testphase aktiv${trialEnd ? ` bis ${trialEnd}` : ''}`
              : `вњ… Abonnement aktiv${periodEnd ? ` bis ${periodEnd}` : ''}`}
          </Text>
        </View>
      ) : (
        <View style={styles.inactiveBanner}>
          <Text style={styles.inactiveTxt}>вљ пёЏ Kein aktives Abonnement</Text>
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

      {/* Web payment CTA вЂ” no in-app purchase to avoid 30% platform fee */}
      <TouchableOpacity style={styles.webBtn} onPress={openWebPayment} activeOpacity={0.8}>
        <Text style={styles.webBtnEmoji}>рџЊђ</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.webBtnTitle}>
            {isActive ? 'Abonnement verwalten' : 'Jetzt fГјr 5 в‚¬/Monat starten'}
          </Text>
          <Text style={styles.webBtnSub}>Г–ffnet braincoin.app im Browser</Text>
        </View>
        <Text style={styles.webBtnArrow}>вЂє</Text>
      </TouchableOpacity>

      {!isActive && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            рџ’Ў Die Zahlung wird sicher Гјber unsere Website abgewickelt. Nach dem Abonnieren wird dein Zugang hier automatisch freigeschaltet.
          </Text>
        </View>
      )}

      <Text style={styles.legal}>
        Jederzeit kГјndbar В· Sicher bezahlen mit Stripe В· Keine In-App-KГ¤ufe
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: '#f8fafc' },
  hero:            {
    backgroundColor: '#1d4ed8', paddingTop: 52, paddingBottom: 36,
    alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
  },
  heroEmoji:       { fontSize: 56 },
  heroTitle:       { fontSize: 28, fontWeight: '900', color: '#fff', marginTop: 12 },
  heroPrice:       { fontSize: 18, color: '#bfdbfe', marginTop: 4 },
  trialBadge:      {
    marginTop: 16, backgroundColor: '#fbbf24',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
  },
  trialTxt:        { fontSize: 13, fontWeight: '700', color: '#92400e' },
  activeBanner:    {
    margin: 16, backgroundColor: '#d1fae5', borderRadius: 14,
    padding: 14, alignItems: 'center',
  },
  activeTxt:       { fontSize: 14, fontWeight: '700', color: '#065f46' },
  inactiveBanner:  {
    margin: 16, backgroundColor: '#fee2e2', borderRadius: 14,
    padding: 14, alignItems: 'center',
  },
  inactiveTxt:     { fontSize: 14, fontWeight: '700', color: '#991b1b' },
  featureBox:      {
    margin: 16, backgroundColor: '#fff', borderRadius: 16, padding: 20,
    elevation: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  featureTitle:    { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  featureRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureEmoji:    { fontSize: 22, width: 36 },
  featureText:     { fontSize: 14, color: '#475569', flex: 1 },
  webBtn:          {
    marginHorizontal: 16, marginTop: 8, backgroundColor: '#1d4ed8',
    borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12,
    elevation: 2, boxShadow: '0 2px 8px rgba(29,78,216,0.3)',
  },
  webBtnEmoji:     { fontSize: 24 },
  webBtnTitle:     { fontSize: 15, fontWeight: '800', color: '#fff' },
  webBtnSub:       { fontSize: 12, color: '#bfdbfe', marginTop: 2 },
  webBtnArrow:     { fontSize: 22, color: '#bfdbfe', fontWeight: '700' },
  infoBox:         {
    marginHorizontal: 16, marginTop: 12, backgroundColor: '#eff6ff',
    borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#bfdbfe',
  },
  infoText:        { fontSize: 13, color: '#1e40af', lineHeight: 19 },
  legal:           { textAlign: 'center', fontSize: 12, color: '#94a3b8', margin: 16 },
});
