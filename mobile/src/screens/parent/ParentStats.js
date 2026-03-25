import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import api from '../../api';

const StatCard = ({ label, value, emoji }) => (
  <View style={styles.card}>
    <Text style={styles.cardEmoji}>{emoji}</Text>
    <Text style={styles.cardValue}>{value ?? '—'}</Text>
    <Text style={styles.cardLabel}>{label}</Text>
  </View>
);

const SubjectRow = ({ subject, score }) => (
  <View style={styles.subjectRow}>
    <Text style={styles.subjectName}>{subject}</Text>
    <View style={styles.barWrap}>
      <View style={[styles.bar, { width: `${Math.min(score, 100)}%` }]} />
    </View>
    <Text style={styles.subjectScore}>{score}%</Text>
  </View>
);

export default function ParentStats() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { childId, childName } = route.params ?? {};

  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    navigation.setOptions({
      title: childName ?? t('parent.stats'),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('ContentSettings', { childId, childName })}
          style={{ marginRight: 8, padding: 6 }}
        >
          <Text style={{ fontSize: 22 }}>⚙️</Text>
        </TouchableOpacity>
      ),
    });
    fetchStats();
  }, [childId]);

  const fetchStats = async () => {
    setLoading(true); setError(null);
    try {
      const { data } = await api.get(`/quiz/stats/child/${childId}`);
      setStats(data);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#1d4ed8" />;
  if (error)   return (
    <View style={styles.center}>
      <Text style={{ color: '#ef4444' }}>{error}</Text>
      <TouchableOpacity onPress={fetchStats} style={styles.retryBtn}>
        <Text style={{ color: '#1d4ed8' }}>{t('retry')}</Text>
      </TouchableOpacity>
    </View>
  );

  const subjects = stats?.bySubject ?? [];
  const sessions = stats?.recentSessions ?? [];
  const totalSessions = stats?.total_sessions ?? 0;
  const totalCorrect  = stats?.total_correct ?? 0;
  const totalWrong    = stats?.total_wrong ?? 0;
  const avgScore = (totalCorrect + totalWrong) > 0
    ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100) : null;

  return (
    <ScrollView style={styles.root} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Summary cards */}
      <View style={styles.cardRow}>
        <StatCard label={t('stats.quizzes')}   value={totalSessions}                   emoji="📝" />
        <StatCard label="Richtig"               value={totalCorrect}                    emoji="✅" />
        <StatCard label={t('stats.avgScore')}   value={avgScore != null ? `${avgScore}%` : null} emoji="⭐" />
      </View>

      {/* Subjects */}
      {subjects.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('stats.bySubject')}</Text>
          {subjects.map((s) => {
            const total = s.correct + s.wrong;
            const pct = total > 0 ? Math.round((s.correct / total) * 100) : 0;
            return (
              <SubjectRow key={s.subject_id} subject={`${s.subject_emoji} ${s.subject_name}`} score={pct} />
            );
          })}
        </View>
      )}

      {/* Recent quiz sessions */}
      {sessions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('stats.recentSessions')}</Text>
          {sessions.map((s) => {
            const pct = s.total_count > 0 ? Math.round((s.correct_count / s.total_count) * 100) : 0;
            return (
              <View key={s.id} style={styles.sessionRow}>
                <View>
                  <Text style={styles.sessionSubject}>{s.subject_name ?? s.contract_title ?? '—'}</Text>
                  <Text style={styles.sessionDate}>
                    {s.completed_at ? new Date(s.completed_at).toLocaleDateString('de-DE') : '—'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.sessionScore}>{pct}%</Text>
                  <Text style={styles.sessionCoins}>+{s.score ?? 0} 🪙</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Danger zone removed - delete not yet available */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#f8fafc' },
  center:       { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  retryBtn:     { marginTop: 12 },
  cardRow:      { flexDirection: 'row', padding: 16, gap: 8 },
  card:         {
    flex: 1, backgroundColor: '#fff', borderRadius: 16,
    padding: 14, alignItems: 'center', elevation: 2,
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
  },
  cardEmoji:    { fontSize: 24, marginBottom: 4 },
  cardValue:    { fontSize: 20, fontWeight: '800', color: '#1e293b' },
  cardLabel:    { fontSize: 11, color: '#64748b', marginTop: 2 },
  section:      { marginHorizontal: 16, marginTop: 16, backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2, boxShadow: '0 2px 6px rgba(0,0,0,0.06)' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  subjectRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  subjectName:  { width: 90, fontSize: 13, color: '#475569' },
  barWrap:      { flex: 1, height: 10, backgroundColor: '#e2e8f0', borderRadius: 5, overflow: 'hidden', marginHorizontal: 8 },
  bar:          { height: 10, backgroundColor: '#1d4ed8', borderRadius: 5 },
  subjectScore: { width: 36, fontSize: 12, color: '#1d4ed8', fontWeight: '700', textAlign: 'right' },
  sessionRow:   { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  sessionSubject:{ fontSize: 14, fontWeight: '600', color: '#1e293b' },
  sessionDate:  { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  sessionScore: { fontSize: 16, fontWeight: '700', color: '#1d4ed8' },
  sessionCoins: { fontSize: 12, color: '#d97706', marginTop: 2 },
  deleteBtn:    { margin: 16, marginTop: 24, padding: 16, borderRadius: 12, borderWidth: 1.5, borderColor: '#ef4444', alignItems: 'center' },
  deleteBtnText:{ color: '#ef4444', fontWeight: '700', fontSize: 15 },
});
