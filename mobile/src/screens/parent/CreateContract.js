import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../../api';

const PRIZES = ['🏆','🎮','🎁','🎠','📱','🎯','⭐','🏅','🎈','🍕'];
const GRADES = ['1','2','3','4','5','6','7','8','9','10'];

export default function CreateContract({ navigation }) {
  const { t } = useTranslation();

  const [step,        setStep]        = useState(1);
  const [children,    setChildren]    = useState([]);
  const [subjects,    setSubjects]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);

  // Step 1
  const [childId,     setChildId]     = useState(null);
  const [subjectId,   setSubjectId]   = useState(null);
  const [grade,       setGrade]       = useState('');

  // Step 2
  const [title,       setTitle]       = useState('');
  const [description, setDescription] = useState('');

  // Step 3
  const [prizeEmoji,  setPrizeEmoji]  = useState('🏆');
  const [prizeName,   setPrizeName]   = useState('');
  const [prizeCoins,  setPrizeCoins]  = useState('100');

  useEffect(() => {
    Promise.all([
      api.get('/auth/children'),
      api.get('/quiz/subjects'),
    ]).then(([ch, sub]) => {
      setChildren(ch.data);
      setSubjects(sub.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const selectedChild   = children.find(c => c.id === childId);
  const selectedSubject = subjects.find(s => s.id === subjectId);

  const handleSubmit = async () => {
    if (!childId || !subjectId || !grade || !title.trim() || !prizeName.trim()) {
      Alert.alert('', 'Bitte alle Felder ausfüllen'); return;
    }
    setSubmitting(true);
    try {
      await api.post('/contracts', {
        child_id: childId,
        subject_id: subjectId,
        grade,
        title: title.trim(),
        description: description.trim() || undefined,
        prize_name: prizeName.trim(),
        prize_emoji: prizeEmoji,
        prize_coins: parseInt(prizeCoins) || 100,
        reward_coins: parseInt(prizeCoins) || 100,
        target_coins: parseInt(prizeCoins) || 100,
      });
      Alert.alert('✅ Vertrag erstellt!', 'Das Kind muss den Vertrag noch bestätigen.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Fehler', e.response?.data?.error || 'Fehler beim Erstellen');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1d4ed8" />;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Step indicator */}
      <View style={styles.stepRow}>
        {[1,2,3].map(n => (
          <View key={n} style={[styles.stepDot, step >= n && styles.stepDotActive]}>
            <Text style={[styles.stepNum, step >= n && { color: '#fff' }]}>{n}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Step 1 ── */}
        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>{t('contract.step1Title')}</Text>

            <Text style={styles.label}>{t('contract.selectChild')}</Text>
            {children.length === 0 ? (
              <Text style={styles.emptyHint}>{t('contract.addChildFirst')}</Text>
            ) : (
              children.map(ch => (
                <TouchableOpacity
                  key={ch.id}
                  style={[styles.selectCard, childId === ch.id && styles.selectCardActive]}
                  onPress={() => setChildId(ch.id)}
                >
                  <Text style={{ fontSize: 24, marginRight: 10 }}>{ch.avatar_emoji || '🧒'}</Text>
                  <Text style={styles.selectCardText}>{ch.name}</Text>
                  {childId === ch.id && <Text style={{ fontSize: 18, marginLeft: 'auto' }}>✓</Text>}
                </TouchableOpacity>
              ))
            )}

            <Text style={styles.label}>{t('contract.selectSubject')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {subjects.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.chipBtn, subjectId === s.id && styles.chipBtnActive]}
                  onPress={() => setSubjectId(s.id)}
                >
                  <Text>{s.emoji} {s.name_de || s.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>{t('contract.selectGrade')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
              {GRADES.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.gradeBtn, grade === g && styles.gradeBtnActive]}
                  onPress={() => setGrade(g)}
                >
                  <Text style={[styles.gradeText, grade === g && { color: '#fff' }]}>{g}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.btn, (!childId || !subjectId || !grade) && { opacity: 0.4 }]}
              onPress={() => setStep(2)}
              disabled={!childId || !subjectId || !grade}
            >
              <Text style={styles.btnText}>Weiter →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <>
            <Text style={styles.stepTitle}>{t('contract.step2Title')}</Text>

            <Text style={styles.label}>{t('contract.contractTitle')}</Text>
            <TextInput
              style={styles.input}
              value={title} onChangeText={setTitle}
              placeholder={t('contract.titlePlaceholder')}
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Beschreibung (optional)</Text>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
              value={description} onChangeText={setDescription}
              placeholder="Was soll das Kind lernen?"
              placeholderTextColor="#94a3b8"
              multiline
            />

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Zusammenfassung</Text>
              <Text style={styles.summaryRow}>🧒 {selectedChild?.name}</Text>
              <Text style={styles.summaryRow}>{selectedSubject?.emoji} {selectedSubject?.name_de || selectedSubject?.name}</Text>
              <Text style={styles.summaryRow}>🏫 Klasse {grade}</Text>
            </View>

            <View style={styles.rowBtns}>
              <TouchableOpacity style={styles.btnBack} onPress={() => setStep(1)}>
                <Text style={styles.btnBackText}>← Zurück</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { flex: 1 }, !title.trim() && { opacity: 0.4 }]}
                onPress={() => setStep(3)}
                disabled={!title.trim()}
              >
                <Text style={styles.btnText}>Weiter →</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>{t('contract.step3Title')}</Text>
            <Text style={styles.stepDesc}>{t('contract.step3Desc')}</Text>

            <Text style={styles.label}>Belohnungs-Emoji</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {PRIZES.map(e => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, prizeEmoji === e && styles.emojiBtnActive]}
                  onPress={() => setPrizeEmoji(e)}
                >
                  <Text style={{ fontSize: 28 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Belohnungsname</Text>
            <TextInput
              style={styles.input}
              value={prizeName} onChangeText={setPrizeName}
              placeholder="z.B. Ausflug ins Kino"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.label}>Münzen-Ziel 🪙</Text>
            <TextInput
              style={styles.input}
              value={prizeCoins} onChangeText={setPrizeCoins}
              keyboardType="numeric"
              placeholder="100"
              placeholderTextColor="#94a3b8"
            />

            {/* Preview */}
            <View style={styles.rewardPreview}>
              <Text style={{ fontSize: 48 }}>{prizeEmoji}</Text>
              <Text style={styles.rewardName}>{prizeName || 'Belohnung'}</Text>
              <Text style={styles.rewardCoins}>Ziel: {prizeCoins || 100} 🪙</Text>
            </View>

            <View style={styles.rowBtns}>
              <TouchableOpacity style={styles.btnBack} onPress={() => setStep(2)}>
                <Text style={styles.btnBackText}>← Zurück</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { flex: 1 }, (!prizeName.trim() || submitting) && { opacity: 0.4 }]}
                onPress={handleSubmit}
                disabled={!prizeName.trim() || submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>✅ Vertrag erstellen</Text>
                }
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  stepRow:         { flexDirection: 'row', justifyContent: 'center', gap: 16, paddingTop: 52, paddingBottom: 8, backgroundColor: '#f8fafc' },
  stepDot:         { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  stepDotActive:   { backgroundColor: '#1d4ed8' },
  stepNum:         { fontSize: 15, fontWeight: '800', color: '#94a3b8' },
  scroll:          { flexGrow: 1, padding: 20 },
  stepTitle:       { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 6, marginTop: 8 },
  stepDesc:        { fontSize: 14, color: '#64748b', marginBottom: 20 },
  label:           { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 8, marginTop: 12 },
  emptyHint:       { fontSize: 14, color: '#94a3b8', textAlign: 'center', paddingVertical: 16 },
  selectCard:      {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginBottom: 8, borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  selectCardActive:{ borderColor: '#1d4ed8', backgroundColor: '#eff6ff' },
  selectCardText:  { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  chipBtn:         { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1.5, borderColor: '#e2e8f0' },
  chipBtnActive:   { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  gradeBtn:        { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginRight: 8, borderWidth: 1.5, borderColor: '#e2e8f0' },
  gradeBtnActive:  { backgroundColor: '#1d4ed8', borderColor: '#1d4ed8' },
  gradeText:       { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  input:           { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 15, borderWidth: 1.5, borderColor: '#e2e8f0', color: '#1e293b', marginBottom: 4 },
  summaryCard:     { backgroundColor: '#f0f9ff', borderRadius: 14, padding: 16, marginBottom: 20, gap: 6 },
  summaryTitle:    { fontSize: 13, fontWeight: '700', color: '#0369a1', marginBottom: 4 },
  summaryRow:      { fontSize: 14, color: '#1e293b' },
  rowBtns:         { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn:             { backgroundColor: '#1d4ed8', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnText:         { color: '#fff', fontSize: 16, fontWeight: '700' },
  btnBack:         { backgroundColor: '#f1f5f9', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 20, alignItems: 'center' },
  btnBackText:     { color: '#475569', fontSize: 15, fontWeight: '600' },
  emojiBtn:        { width: 52, height: 52, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  emojiBtnActive:  { backgroundColor: '#fef3c7', borderWidth: 2, borderColor: '#f59e0b' },
  rewardPreview:   { backgroundColor: '#fef3c7', borderRadius: 20, padding: 24, alignItems: 'center', marginVertical: 16 },
  rewardName:      { fontSize: 18, fontWeight: '800', color: '#92400e', marginTop: 8 },
  rewardCoins:     { fontSize: 15, color: '#b45309', marginTop: 4 },
});
