import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native';
import api from '../../api';

export default function MistakeReview() {
  const [mistakes,   setMistakes]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded,   setExpanded]   = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/quiz/mistakes');
      setMistakes(data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(); };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#7c3aed" />;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>❌ Meine Fehler</Text>
        <Text style={styles.headerSub}>
          {mistakes.length > 0
            ? `${mistakes.length} Fragen zum Wiederholen`
            : 'Keine Fehler – super gemacht!'}
        </Text>
      </View>

      <FlatList
        data={mistakes}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyText}>Keine Fehler! Weiter so!</Text>
            <Text style={styles.emptyHint}>Mach mehr Quests, um dein Wissen zu testen.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isExpanded = expanded === item.id;
          const answers = item.answers ?? [];
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setExpanded(isExpanded ? null : item.id)}
              activeOpacity={0.8}
            >
              <View style={styles.cardTop}>
                <Text style={styles.subject}>
                  {item.subject_emoji} {item.subject_name}
                  {item.grade ? ` · Klasse ${item.grade}` : ''}
                </Text>
                <View style={styles.wrongChip}>
                  <Text style={styles.wrongTxt}>✕ {item.wrong_count}×</Text>
                </View>
              </View>
              <Text style={styles.question}>{item.text}</Text>
              <Text style={styles.tapHint}>{isExpanded ? '▲ Zuklappen' : '▼ Antwort zeigen'}</Text>

              {isExpanded && (
                <View style={styles.answersWrap}>
                  {answers.map((a, i) => {
                    const isCorrect = i === item.correct_index;
                    return (
                      <View key={i} style={[styles.answer, isCorrect && styles.correctAnswer]}>
                        <Text style={[styles.answerText, isCorrect && styles.correctAnswerText]}>
                          {isCorrect ? '✅ ' : '   '}
                          {a}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:              { flex: 1, backgroundColor: '#f8fafc' },
  header:            {
    backgroundColor: '#7c3aed', paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28, marginBottom: 8,
  },
  headerTitle:       { fontSize: 22, fontWeight: '900', color: '#fff' },
  headerSub:         { fontSize: 13, color: '#e9d5ff', marginTop: 4 },
  empty:             { alignItems: 'center', padding: 40 },
  emptyEmoji:        { fontSize: 48, marginBottom: 12 },
  emptyText:         { fontSize: 16, fontWeight: '700', color: '#475569' },
  emptyHint:         { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center' },
  card:              {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10,
    elevation: 1, boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
  },
  cardTop:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  subject:           { fontSize: 12, fontWeight: '700', color: '#7c3aed', flex: 1, marginRight: 8 },
  wrongChip:         { backgroundColor: '#fee2e2', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  wrongTxt:          { fontSize: 11, fontWeight: '700', color: '#991b1b' },
  question:          { fontSize: 15, fontWeight: '600', color: '#1e293b', lineHeight: 22 },
  tapHint:           { fontSize: 12, color: '#94a3b8', marginTop: 8 },
  answersWrap:       { marginTop: 12, gap: 6 },
  answer:            { padding: 10, borderRadius: 10, backgroundColor: '#f1f5f9' },
  answerText:        { fontSize: 14, color: '#475569' },
  correctAnswer:     { backgroundColor: '#d1fae5' },
  correctAnswerText: { color: '#065f46', fontWeight: '700' },
});
