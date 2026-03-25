import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../api';

export default function ConnectParent() {
  const navigation = useNavigation();
  const [code,    setCode]    = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [linked,  setLinked]  = useState(null);

  const handleAccept = async () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) { Alert.alert('', 'Bitte Code eingeben'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/invite/accept', { code: trimmed });
      setLinked(data.linkedUser);
      setDone(true);
    } catch (e) {
      Alert.alert('Fehler', e.response?.data?.error || 'Ungültiger Code');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={styles.successRoot}>
        <Text style={styles.successEmoji}>🎉</Text>
        <Text style={styles.successTitle}>Verbunden!</Text>
        <Text style={styles.successSub}>
          {linked?.avatar_emoji} {linked?.name} wurde als Elternteil verknüpft.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Weiter ›</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.emoji}>🔗</Text>
        <Text style={styles.title}>Elternteil verbinden</Text>
        <Text style={styles.sub}>
          Gib den Einladungscode ein, den dir dein Elternteil gegeben hat.
        </Text>

        <TextInput
          style={styles.input}
          value={code}
          onChangeText={v => setCode(v.toUpperCase())}
          placeholder="z.B. A1B2C3D4"
          placeholderTextColor="#94a3b8"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
        />

        <TouchableOpacity
          style={[styles.btn, (!code.trim() || loading) && { opacity: 0.5 }]}
          onPress={handleAccept}
          disabled={!code.trim() || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Verbinden</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Abbrechen</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#f8fafc' },
  content:      { flex: 1, padding: 32, justifyContent: 'center', alignItems: 'center' },
  emoji:        { fontSize: 64, marginBottom: 16 },
  title:        { fontSize: 22, fontWeight: '800', color: '#1e293b', textAlign: 'center', marginBottom: 10 },
  sub:          { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  input:        {
    width: '100%', backgroundColor: '#fff', borderRadius: 14, padding: 18,
    fontSize: 22, fontWeight: '800', letterSpacing: 4, textAlign: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0', color: '#1e293b', marginBottom: 16,
  },
  btn:          {
    width: '100%', backgroundColor: '#1d4ed8', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 12,
  },
  btnText:      { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn:    { paddingVertical: 12 },
  cancelText:   { color: '#64748b', fontSize: 15 },
  successRoot:  { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#f0fdf4' },
  successEmoji: { fontSize: 72, marginBottom: 12 },
  successTitle: { fontSize: 26, fontWeight: '800', color: '#15803d', marginBottom: 8 },
  successSub:   { fontSize: 16, color: '#166534', textAlign: 'center', marginBottom: 32 },
});
