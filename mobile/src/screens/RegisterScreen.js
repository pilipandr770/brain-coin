import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const AVATARS = ['😊','🦁','🐯','🐻','🦊','🐸','🦋','🚀','⭐','🎮'];

export default function RegisterScreen({ navigation }) {
  const { t } = useTranslation();
  const { login } = useAuth();

  const [step, setStep]       = useState(1); // 1=choose role, 2=fill form
  const [role, setRole]       = useState(''); // 'parent' | 'child'
  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [age, setAge]         = useState('');
  const [avatar, setAvatar]   = useState('😊');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('', 'Fill in all fields'); return;
    }
    if (password.length < 6) {
      Alert.alert('', 'Password must be at least 6 characters'); return;
    }
    setLoading(true);
    try {
      const body = {
        name: name.trim(), email: email.trim().toLowerCase(),
        password, role, avatar_emoji: avatar,
        ...(role === 'child' && age ? { age: parseInt(age) } : {}),
      };
      const { data } = await api.post('/auth/register', body);
      await login(data.token, data.user);
    } catch (e) {
      Alert.alert('Ошибка', e.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: choose role
  if (step === 1) {
    return (
      <View style={styles.root}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backTxt}>← {t('auth.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.roleTitle}>{t('auth.whoAreYou')}</Text>

        <TouchableOpacity style={styles.roleCard} onPress={() => { setRole('parent'); setStep(2); }}>
          <Text style={styles.roleEmoji}>👨‍👩‍👧</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.roleName}>{t('auth.iAmParent')}</Text>
            <Text style={styles.roleDesc}>{t('auth.parentDesc')}</Text>
          </View>
          <Text style={styles.roleArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.roleCard} onPress={() => { setRole('child'); setStep(2); }}>
          <Text style={styles.roleEmoji}>🎮</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.roleName}>{t('auth.iAmChild')}</Text>
            <Text style={styles.roleDesc}>{t('auth.childDesc')}</Text>
          </View>
          <Text style={styles.roleArrow}>›</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Step 2: fill form
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => setStep(1)} style={styles.backBtn2}>
          <Text style={styles.backTxt2}>← {t('auth.back')}</Text>
        </TouchableOpacity>

        <Text style={styles.formTitle}>
          {role === 'parent' ? t('auth.parentProfile') : t('auth.childProfile')}
        </Text>

        {/* Avatar picker */}
        <Text style={styles.label}>{t('auth.chooseAvatar')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {AVATARS.map((a) => (
            <TouchableOpacity
              key={a}
              onPress={() => setAvatar(a)}
              style={[styles.avatarBtn, avatar === a && styles.avatarBtnActive]}
            >
              <Text style={{ fontSize: 28 }}>{a}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>{t('auth.name')}</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder={role === 'parent' ? t('auth.namePlaceholderParent') : t('auth.namePlaceholderChild')}
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>{t('auth.email')}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="example@email.com"
          placeholderTextColor="#94a3b8"
        />

        {role === 'child' && (
          <>
            <Text style={styles.label}>{t('auth.age')}</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              placeholder="8"
              placeholderTextColor="#94a3b8"
            />
          </>
        )}

        <Text style={styles.label}>{t('auth.password')}</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPass}
          secureTextEntry
          placeholder={t('auth.passwordPlaceholder')}
          placeholderTextColor="#94a3b8"
        />

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>{t('auth.register')} 🎉</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
          <Text style={styles.linkText}>
            {t('auth.haveAccount')} <Text style={styles.linkBold}>{t('auth.login')}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: '#f8fafc', padding: 20, paddingTop: 60 },
  scroll:     { flexGrow: 1, padding: 20, paddingTop: 50 },
  backBtn:    { marginBottom: 24 },
  backBtn2:   { marginBottom: 20 },
  backTxt:    { fontSize: 16, color: '#1d4ed8', fontWeight: '600' },
  backTxt2:   { fontSize: 16, color: '#64748b' },
  roleTitle:  { fontSize: 26, fontWeight: '800', color: '#1e293b', marginBottom: 28 },
  roleCard:   {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, padding: 20, marginBottom: 16,
    elevation: 4, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  roleEmoji:  { fontSize: 36, marginRight: 16 },
  roleName:   { fontSize: 17, fontWeight: '700', color: '#1e293b' },
  roleDesc:   { fontSize: 13, color: '#64748b', marginTop: 2 },
  roleArrow:  { fontSize: 24, color: '#94a3b8' },
  formTitle:  { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 20 },
  label:      { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input:      {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12,
    padding: 14, fontSize: 15, color: '#1e293b',
    backgroundColor: '#fff', marginBottom: 14,
  },
  avatarBtn:  {
    padding: 8, borderRadius: 12, marginRight: 8,
    borderWidth: 2, borderColor: 'transparent',
  },
  avatarBtnActive: { borderColor: '#1d4ed8', backgroundColor: '#eff6ff' },
  btn:        {
    backgroundColor: '#1d4ed8', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  btnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
  link:       { marginTop: 16, alignItems: 'center' },
  linkText:   { fontSize: 14, color: '#64748b' },
  linkBold:   { color: '#1d4ed8', fontWeight: '700' },
});
