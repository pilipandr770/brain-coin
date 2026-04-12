import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Linking, Alert, Platform,
} from 'react-native';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

// Payments happen on the web — no in-app purchase (avoids 30% App Store / Google Play fee).
// The app only shows subscription status and redirects to the website for payment management.
const WEB_URL = __DEV__
  ? 'http://localhost:3000/parent/payment'
  : 'https://braincoin.onrender.com/parent/payment';

const FEATURES = [
  { emoji: '🤖', text: 'KI-generierte Fragen in 12+ Fächern' },
  { emoji: '📊', text: 'Detaillierte Lernstatistiken pro Kind' },
  { emoji: '📋', text: 'Unbegrenzte Verträge & Quests' },
  { emoji: '🛡️', text: 'Inhaltsfilter & Sicherheitseinstellungen' },
  { emoji: '👥', text: 'Mehrere Kinder verwalten' },
  { emoji: '🏆', text: 'Rangliste & Freundesystem' },
];

export default function SubscriptionScreen() {
  const { logout } = useAuth();
  const [status,  setStatus]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  const handleCancelSubscription = () => {
    Alert.alert(
      'Abonnement kündigen',
      'Möchten Sie Ihr Abonnement kündigen? Sie haben bis zum Ende des Abrechnungszeitraums weiterhin Zugang.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Kündigen',
          style: 'destructive',
          onPress: async () => {
            setCancelLoading(true);
            try {
              await api.post('/payments/cancel');
              await load();
              Alert.alert('Gekündigt', 'Ihr Abonnement wurde gekündigt. Zugang bis zum Periodenende bleibt bestehen.');
            } catch {
              Alert.alert('Fehler', 'Kündigung fehlgeschlagen. Bitte erneut versuchen.');
            } finally {
              setCancelLoading(false);
            }
          },
        },
      ]
    );
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
            setDeleteLoading(true);
            try {
              await api.delete('/auth/me');
              logout();
            } catch {
              Alert.alert('Fehler', 'Konto konnte nicht gelöscht werden.');
              setDeleteLoading(false);
            }
          },
        },
      ]
    );
  };

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

      {/* Web payment CTA — no in-app purchase to avoid 30% platform fee */}
      <TouchableOpacity style={styles.webBtn} onPress={openWebPayment} activeOpacity={0.8}>
        <Text style={styles.webBtnEmoji}>🌐</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.webBtnTitle}>
            {isActive ? 'Abonnement verwalten' : 'Jetzt für 5 €/Monat starten'}
          </Text>
          <Text style={styles.webBtnSub}>Öffnet braincoin.app im Browser</Text>
        </View>
        <Text style={styles.webBtnArrow}>›</Text>
      </TouchableOpacity>

      {!isActive && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            💡 Die Zahlung wird sicher über unsere Website abgewickelt. Nach dem Abonnieren wird dein Zugang hier automatisch freigeschaltet.
          </Text>
        </View>
      )}

      {isActive && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleCancelSubscription}
          disabled={cancelLoading}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelBtnTxt}>
            {cancelLoading ? 'Wird verarbeitet…' : '❌ Abonnement kündigen'}
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.legal}>
        Jederzeit kündbar · Sicher bezahlen mit Stripe · Keine In-App-Käufe
      </Text>

      {/* Danger zone */}
      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>⚠️ Gefahrenzone</Text>
        <Text style={styles.dangerDesc}>
          Das Löschen des Kontos ist unwiderruflich. Alle Daten und Kinder werden dauerhaft entfernt.
        </Text>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDeleteAccount}
          disabled={deleteLoading}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteBtnTxt}>
            {deleteLoading ? 'Wird gelöscht…' : 'Konto löschen'}
          </Text>
        </TouchableOpacity>
      </View>
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
    elevation: 1,
  },
  featureTitle:    { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 16 },
  featureRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureEmoji:    { fontSize: 22, width: 36 },
  featureText:     { fontSize: 14, color: '#475569', flex: 1 },
  webBtn:          {
    marginHorizontal: 16, marginTop: 8, backgroundColor: '#1d4ed8',
    borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12,
    elevation: 2,
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
  cancelBtn:       {
    marginHorizontal: 16, marginTop: 8, borderRadius: 14,
    borderWidth: 1, borderColor: '#fca5a5', backgroundColor: '#fff7f7',
    padding: 16, alignItems: 'center',
  },
  cancelBtnTxt:    { fontSize: 15, fontWeight: '700', color: '#dc2626' },
  dangerZone:      {
    marginHorizontal: 16, marginBottom: 32, marginTop: 8,
    borderRadius: 16, borderWidth: 1, borderColor: '#fca5a5',
    backgroundColor: '#fff1f1', padding: 20,
  },
  dangerTitle:     { fontSize: 15, fontWeight: '800', color: '#b91c1c', marginBottom: 8 },
  dangerDesc:      { fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 19 },
  deleteBtn:       {
    backgroundColor: '#dc2626', borderRadius: 12,
    padding: 14, alignItems: 'center',
  },
  deleteBtnTxt:    { fontSize: 15, fontWeight: '800', color: '#fff' },
});
