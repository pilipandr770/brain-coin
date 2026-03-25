import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../../api';

const AVATARS = ['🧒','👦','👧','🦁','🐯','🐻','🦊','🐸','🚀','⭐','🎮','🧠'];

export default function CreateChild() {
  const { t } = useTranslation();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPass]     = useState('');
  const [age,      setAge]      = useState('');
  const [grade,    setGrade]    = useState('');
  const [avatar,   setAvatar]   = useState('🧒');
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('', 'Fill name, email and password'); return;
    }
    if (password.length < 6) {
      Alert.alert('', 'Password min 6 chars'); return;
    }
    setLoading(true);
    try {
      await api.post('/auth/children', {
        name: name.trim(), email: email.trim().toLowerCase(),
        password, age: age ? parseInt(age) : undefined,
        grade: grade || undefined, avatar_emoji: avatar,
      });
      setDone(true);
    } catch (e) {
      Alert.alert('Ошибка', e.response?.data?.error || 'Failed to create child');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setName(''); setEmail(''); setPass('');
    setAge(''); setGrade(''); setAvatar('🧒'); setDone(false);
  };

  if (done) {
    return (
      <View style={styles.successRoot}>
        <Text style={styles.successEmoji}>🎉</Text>
        <Text style={styles.successTitle}>{t('parent.childProfileCreated')}</Text>
        <TouchableOpacity style={styles.btn} onPress={reset}>
          <Text style={styles.btnText}>+ Ещё ребёнок</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('parent.childProfile')}</Text>

        {/* Avatar */}
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
          value={name} onChangeText={setName}
          placeholder={t('auth.namePlaceholderChild')}
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>{t('auth.email')}</Text>
        <TextInput
          style={styles.input}
          value={email} onChangeText={setEmail}
          keyboardType="email-address" autoCapitalize="none"
          placeholder="child@example.com"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>{t('auth.password')}</Text>
        <TextInput
          style={styles.input}
          value={password} onChangeText={setPass}
          secureTextEntry
          placeholder={t('auth.passwordPlaceholder')}
          placeholderTextColor="#94a3b8"
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>{t('auth.age')}</Text>
            <TextInput
              style={styles.input}
              value={age} onChangeText={setAge}
              keyboardType="numeric" placeholder="10"
              placeholderTextColor="#94a3b8"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>{t('auth.grade')}</Text>
            <TextInput
              style={styles.input}
              value={grade} onChangeText={setGrade}
              placeholder="3A"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>{t('parent.createProfileBtn')}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll:          { flexGrow: 1, padding: 20, paddingTop: 60 },
  title:           { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 20 },
  label:           { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input:           {
    borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12,
    padding: 14, fontSize: 15, color: '#1e293b',
    backgroundColor: '#fff', marginBottom: 14,
  },
  row:             { flexDirection: 'row' },
  avatarBtn:       {
    padding: 8, borderRadius: 12, marginRight: 8,
    borderWidth: 2, borderColor: 'transparent',
  },
  avatarBtnActive: { borderColor: '#1d4ed8', backgroundColor: '#eff6ff' },
  btn:             {
    backgroundColor: '#1d4ed8', borderRadius: 12,
    padding: 16, alignItems: 'center', marginTop: 8,
  },
  btnText:         { color: '#fff', fontSize: 16, fontWeight: '700' },
  successRoot:     { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#f8fafc' },
  successEmoji:    { fontSize: 64, marginBottom: 20 },
  successTitle:    { fontSize: 18, fontWeight: '700', color: '#166534', textAlign: 'center', marginBottom: 32 },
});
