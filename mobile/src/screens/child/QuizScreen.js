import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Animated,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import api from '../../api';

const QUESTION_TIMEOUT = 30;

export default function QuizScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { contractId, contractTitle } = route.params ?? {};

  const [sessionId,     setSessionId]     = useState(null);
  const [questions,     setQuestions]     = useState([]);
  const [currentIdx,    setCurrentIdx]    = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [submitting,    setSubmitting]    = useState(false);
  const [selected,      setSelected]      = useState(null);
  const [correctIdx,    setCorrectIdx]    = useState(null);
  const [timeLeft,      setTimeLeft]      = useState(QUESTION_TIMEOUT);
  const [finished,      setFinished]      = useState(false);
  const [score,         setScore]         = useState(0);
  const [correctCount,  setCorrectCount]  = useState(0);

  const timerRef     = useRef(null);
  const progressAnim = useRef(new Animated.Value(1)).current;
  const pendingNext  = useRef(false);

  const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

  const startTimer = useCallback((onTimeout) => {
    clearTimer();
    setTimeLeft(QUESTION_TIMEOUT);
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0, duration: QUESTION_TIMEOUT * 1000, useNativeDriver: false,
    }).start();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); onTimeout(); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, [progressAnim]);

  // Start session on mount
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.post('/quiz/sessions', { contract_id: contractId });
        setSessionId(data.session.id);
        // Backend returns questions without correct_index (already stripped server-side)
        setQuestions(data.questions ?? []);
      } catch (e) {
        Alert.alert('', e.response?.data?.error || 'Failed to start quiz');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
    return clearTimer;
  }, [contractId]);

  // Start timer whenever we move to a new question
  useEffect(() => {
    if (!loading && questions.length > 0 && currentIdx < questions.length && selected === null) {
      pendingNext.current = false;
      startTimer(() => {
        if (!pendingNext.current) submitAnswer(-1);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx, loading, questions.length]);

  const completeSession = useCallback(async (sid) => {
    try { await api.post(`/quiz/sessions/${sid}/complete`); } catch { /* ignore */ }
    setFinished(true);
  }, []);

  const submitAnswer = useCallback(async (optionIndex) => {
    if (submitting || selected !== null || pendingNext.current) return;
    pendingNext.current = true;
    clearTimer();
    setSelected(optionIndex);
    setSubmitting(true);

    const question = questions[currentIdx];
    try {
      const { data } = await api.post(`/quiz/sessions/${sessionId}/answer`, {
        question_id: question.id,
        answer_index: optionIndex,
      });
      setCorrectIdx(data.correctIndex ?? data.correct_index ?? null);
      if (data.isCorrect) {
        setCorrectCount((c) => c + 1);
        setScore((s) => s + (data.points || 0));
      }
    } catch { /* mark wrong */ }

    setSubmitting(false);

    setTimeout(() => {
      const nextIdx = currentIdx + 1;
      if (nextIdx >= questions.length) {
        completeSession(sessionId);
      } else {
        setSelected(null);
        setCorrectIdx(null);
        setCurrentIdx(nextIdx);
      }
    }, 1200);
  }, [submitting, selected, questions, currentIdx, sessionId, completeSession]);

  // ─── Finished screen ──────────────────────────────────────────────────────
  if (finished) {
    const percentage = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
    return (
      <View style={styles.finishedRoot}>
        <Text style={styles.finishedEmoji}>{percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '😢'}</Text>
        <Text style={styles.finishedTitle}>{t('quiz.finished')}</Text>
        <Text style={styles.finishedScore}>{percentage}%</Text>
        <Text style={styles.finishedCoins}>+{score} 🪙</Text>
        <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.homeBtnText}>{t('quiz.backHome')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1d4ed8" />;

  const question = questions[currentIdx];
  if (!question) return null;
  const options = question.answers ?? question.options ?? [];

  return (
    <View style={styles.root}>
      {/* Header with progress */}
      <View style={styles.header}>
        <Text style={styles.progressText}>{currentIdx + 1} / {questions.length}</Text>
        <View style={styles.timerRow}>
          <Text style={[styles.timerText, timeLeft <= 5 && { color: '#ef4444' }]}>
            ⏱ {timeLeft}s
          </Text>
        </View>
      </View>
      {/* Progress bar */}
      <Animated.View style={[styles.progressBar, {
        width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
        backgroundColor: timeLeft <= 5 ? '#ef4444' : '#1d4ed8',
      }]} />

      {/* Question */}
      <View style={styles.questionBox}>
        <Text style={styles.subjectLabel}>{contractTitle}</Text>
        <Text style={styles.questionText}>{question.text}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsWrap}>
        {options.map((opt, idx) => {
          let bg = '#fff', border = '#e2e8f0', textColor = '#1e293b';
          if (selected !== null) {
            if (idx === correctIdx)                        { bg = '#dcfce7'; border = '#16a34a'; textColor = '#15803d'; }
            else if (idx === selected && idx !== correctIdx) { bg = '#fee2e2'; border = '#ef4444'; textColor = '#b91c1c'; }
          }
          return (
            <TouchableOpacity
              key={idx}
              style={[styles.option, { backgroundColor: bg, borderColor: border }]}
              onPress={() => submitAnswer(idx)}
              disabled={selected !== null}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionLetter, { color: textColor }]}>
                {String.fromCharCode(65 + idx)}.
              </Text>
              <Text style={[styles.optionText, { color: textColor }]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#f8fafc' },
  header:         { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 52 },
  progressText:   { fontSize: 15, fontWeight: '700', color: '#475569' },
  timerRow:       { flexDirection: 'row', alignItems: 'center' },
  timerText:      { fontSize: 15, fontWeight: '700', color: '#1d4ed8' },
  progressBar:    { height: 4, marginHorizontal: 20, borderRadius: 2 },
  questionBox:    { margin: 20, marginTop: 16, backgroundColor: '#fff', borderRadius: 20, padding: 20, elevation: 3, boxShadow: '0 3px 8px rgba(0,0,0,0.07)' },
  subjectLabel:   { fontSize: 12, fontWeight: '600', color: '#1d4ed8', textTransform: 'uppercase', marginBottom: 8 },
  questionText:   { fontSize: 18, fontWeight: '700', color: '#1e293b', lineHeight: 26 },
  optionsWrap:    { paddingHorizontal: 16 },
  option:         { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 14, padding: 16, marginBottom: 10 },
  optionLetter:   { fontSize: 16, fontWeight: '800', marginRight: 12 },
  optionText:     { flex: 1, fontSize: 15, lineHeight: 22 },
  finishedRoot:   { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#f8fafc' },
  finishedEmoji:  { fontSize: 72, marginBottom: 12 },
  finishedTitle:  { fontSize: 22, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  finishedScore:  { fontSize: 52, fontWeight: '900', color: '#1d4ed8', marginVertical: 8 },
  finishedCoins:  { fontSize: 24, fontWeight: '700', color: '#d97706', marginBottom: 32 },
  homeBtn:        { backgroundColor: '#1d4ed8', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 16 },
  homeBtnText:    { color: '#fff', fontSize: 16, fontWeight: '700' },
});
