import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { t } = useTranslation();
  const { login } = useAuth();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('', t('auth.email') + ' / ' + t('auth.password') + ' required');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      await login(data.token, data.user);
    } catch (e) {
      Alert.alert('Ошибка', e.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Logo */}
        <View style={styles.logoArea}>
          <Text style={styles.logoEmoji}>🧠</Text>
          <Text style={styles.logoText}>BrainCoin</Text>
          <Text style={styles.tagline}>{t('app.tagline')}</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>{t('auth.loginTitle')}</Text>

          <Text style={styles.label}>{t('auth.email')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            placeholder="example@email.com"
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.label}>{t('auth.password')}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder={t('auth.passwordPlaceholder')}
            placeholderTextColor="#94a3b8"
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>{t('auth.login')}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
            <Text style={styles.linkText}>
              {t('auth.noAccount')} <Text style={styles.linkBold}>{t('auth.register')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, height: '100%', backgroundColor: '#1d4ed8' },
  scroll:  { flexGrow: 1, justifyContent: 'center', padding: 20 },
  logoArea:{ alignItems: 'center', marginBottom: 32 },
  logoEmoji:{ fontSize: 56 },
  logoText: { fontSize: 32, fontWeight: '800', color: '#fff', marginTop: 8 },
  tagline:  { fontSize: 14, color: '#bfdbfe', marginTop: 4 },
  card:    {
    backgroundColor: '#fff', borderRadius: 24,
    padding: 24, elevation: 8,
    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
  },
  title:   { fontSize: 22, fontWeight: '700', color: '#1e293b', marginBottom: 20 },
  label:   { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input:   {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12,
    padding: 14, fontSize: 15, color: '#1e293b',
    backgroundColor: '#f8fafc', marginBottom: 16,
  },
  btn:     {
    backgroundColor: '#1d4ed8', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link:    { marginTop: 16, alignItems: 'center' },
  linkText: { fontSize: 14, color: '#64748b' },
  linkBold: { color: '#1d4ed8', fontWeight: '700' },
});
