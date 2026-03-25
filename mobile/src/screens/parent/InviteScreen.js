import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Clipboard,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../../api';

export default function InviteScreen() {
  const { t } = useTranslation();
  const [code,    setCode]    = useState(null);
  const [expires, setExpires] = useState(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/invite/generate');
      setCode(data.code);
      setExpires(data.expiresAt);
    } catch (e) {
      Alert.alert('Fehler', e.response?.data?.error || 'Server error');
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!code) return;
    Clipboard.setString(code);
    Alert.alert('', '✓ Code kopiert!');
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.toLocaleDateString('de-DE')} ${d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.emoji}>🔗</Text>
        <Text style={styles.title}>{t('parent.generateInvite')}</Text>
        <Text style={styles.desc}>{t('parent.inviteDesc')}</Text>

        {code ? (
          <>
            <TouchableOpacity onPress={copy} style={styles.codeBox}>
              <Text style={styles.codeText}>{code}</Text>
              <Text style={styles.copyHint}>Tippen zum Kopieren</Text>
            </TouchableOpacity>
            {expires && (
              <Text style={styles.expires}>
                ⏱ Gültig bis {formatTime(expires)}
              </Text>
            )}
            <Text style={styles.hint}>{t('parent.codeValid24h')}</Text>
            <TouchableOpacity style={[styles.btn, styles.btnOutline]} onPress={generate}>
              <Text style={styles.btnOutlineText}>Neuen Code generieren</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={generate}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>{t('parent.generateCode')}</Text>
            }
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Wie funktioniert es?</Text>
        <Text style={styles.infoItem}>1. Generiere einen Code hier</Text>
        <Text style={styles.infoItem}>2. Sende den Code deinem Kind</Text>
        <Text style={styles.infoItem}>3. Kind gibt den Code in der App ein</Text>
        <Text style={styles.infoItem}>4. ✅ Ihr seid verknüpft!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#f8fafc', padding: 20, paddingTop: 48 },
  card:           { backgroundColor: '#fff', borderRadius: 24, padding: 28, alignItems: 'center', elevation: 3 },
  emoji:          { fontSize: 56, marginBottom: 12 },
  title:          { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 8, textAlign: 'center' },
  desc:           { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  codeBox:        {
    backgroundColor: '#eff6ff', borderRadius: 20, padding: 24,
    alignItems: 'center', marginBottom: 12, width: '100%',
    borderWidth: 2, borderColor: '#93c5fd',
  },
  codeText:       { fontSize: 36, fontWeight: '900', letterSpacing: 6, color: '#1d4ed8' },
  copyHint:       { fontSize: 12, color: '#94a3b8', marginTop: 6 },
  expires:        { fontSize: 13, color: '#64748b', marginBottom: 8 },
  hint:           { fontSize: 12, color: '#94a3b8', marginBottom: 20 },
  btn:            {
    backgroundColor: '#1d4ed8', borderRadius: 14, paddingVertical: 16,
    paddingHorizontal: 32, alignItems: 'center', width: '100%',
  },
  btnText:        { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnOutline:     { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: '#1d4ed8' },
  btnOutlineText: { color: '#1d4ed8', fontSize: 15, fontWeight: '700' },
  infoBox:        { marginTop: 24, backgroundColor: '#f0fdf4', borderRadius: 20, padding: 20 },
  infoTitle:      { fontSize: 15, fontWeight: '700', color: '#166534', marginBottom: 12 },
  infoItem:       { fontSize: 14, color: '#15803d', marginBottom: 8, lineHeight: 22 },
});
