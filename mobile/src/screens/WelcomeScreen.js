import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, StatusBar,
} from 'react-native';

const FEATURES = [
  { icon: '📜', title: 'Lernverträge', desc: 'Eltern erstellen Aufgaben — Kinder verdienen BrainCoins.' },
  { icon: '🪙', title: 'BrainCoins', desc: 'Virtuelle Münzen als Belohnung für jede gelöste Aufgabe.' },
  { icon: '🤖', title: 'KI-Quizfragen', desc: 'Claude AI generiert individuelle Fragen für Klassen 4–9.' },
  { icon: '🏆', title: 'Rangliste & Freunde', desc: 'Kinder treten gegeneinander an und motivieren sich.' },
  { icon: '👨‍👩‍👧', title: 'Eltern-Kontrolle', desc: 'Volle Übersicht über Fortschritte und Abonnement.' },
  { icon: '📊', title: 'Statistiken', desc: 'Detaillierte Auswertungen pro Kind und Fach.' },
];

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Hero ── */}
        <View style={s.hero}>
          <Text style={s.logoEmoji}>🧠</Text>
          <Text style={s.logoText}>BrainCoin</Text>
          <Text style={s.tagline}>Die Lernplattform, die Kinder{'\n'}
            <Text style={s.taglineHighlight}>motiviert</Text>
          </Text>
          <Text style={s.sub}>
            Kinder lösen Schulaufgaben, verdienen BrainCoins und tauschen sie gegen echte Belohnungen — alles unter Elternkontrolle.
          </Text>

          <TouchableOpacity style={s.btnPrimary} onPress={() => navigation.navigate('Register')}>
            <Text style={s.btnPrimaryText}>Jetzt kostenlos starten 🚀</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary} onPress={() => navigation.navigate('Login')}>
            <Text style={s.btnSecondaryText}>Bereits registriert? Anmelden</Text>
          </TouchableOpacity>
          <Text style={s.trialNote}>14 Tage kostenlos · danach ab €5/Monat · jederzeit kündbar</Text>
        </View>

        {/* ── Features ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Was BrainCoin bietet</Text>
          <View style={s.featureGrid}>
            {FEATURES.map(f => (
              <View key={f.title} style={s.featureCard}>
                <Text style={s.featureIcon}>{f.icon}</Text>
                <Text style={s.featureName}>{f.title}</Text>
                <Text style={s.featureDesc}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Pricing ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Preise</Text>
          <View style={s.priceCard}>
            <Text style={s.priceLabel}>PREMIUM-ABO</Text>
            <Text style={s.priceAmount}>€5<Text style={s.pricePer}>/Monat</Text></Text>
            <Text style={s.priceTrial}>14 Tage kostenlos testen</Text>
            {[
              'Unbegrenzte Lernverträge',
              'KI-generierte Quizfragen',
              'Alle Fächer Klasse 4–9',
              'Rangliste & Freunde-System',
              'Detaillierte Statistiken',
              'Eltern-App & Web-Zugang',
            ].map(t => (
              <Text key={t} style={s.priceItem}>✓  {t}</Text>
            ))}
            <TouchableOpacity style={s.priceCta} onPress={() => navigation.navigate('Register')}>
              <Text style={s.priceCtaText}>Kostenlos starten</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Footer / Legal ── */}
        <View style={s.footer}>
          <View style={s.legalRow}>
            <TouchableOpacity onPress={() => navigation.navigate('Impressum')}>
              <Text style={s.legalLink}>Impressum</Text>
            </TouchableOpacity>
            <Text style={s.legalDot}>·</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Datenschutz')}>
              <Text style={s.legalLink}>Datenschutz</Text>
            </TouchableOpacity>
            <Text style={s.legalDot}>·</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AGB')}>
              <Text style={s.legalLink}>AGB</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.copyright}>© 2026 BrainCoin · Andrii Pylypchuk · Frankfurt am Main</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: '#0f172a' },
  scroll:        { paddingBottom: 40 },

  hero:          { alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 32 },
  logoEmoji:     { fontSize: 64, marginBottom: 8 },
  logoText:      { fontSize: 40, fontWeight: '900', color: '#60a5fa', letterSpacing: -1 },
  tagline:       { fontSize: 20, color: '#cbd5e1', textAlign: 'center', marginTop: 8, lineHeight: 28 },
  taglineHighlight: { color: '#fbbf24', fontWeight: '800' },
  sub:           { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 14, lineHeight: 22, maxWidth: 320 },

  btnPrimary:    {
    backgroundColor: '#2563eb', borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 32,
    marginTop: 28, width: '100%', alignItems: 'center',
    elevation: 6,
  },
  btnPrimaryText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  btnSecondary:  {
    backgroundColor: '#1e293b', borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 32,
    marginTop: 10, width: '100%', alignItems: 'center',
  },
  btnSecondaryText: { color: '#94a3b8', fontSize: 15, fontWeight: '600' },
  trialNote:     { color: '#475569', fontSize: 12, marginTop: 12 },

  section:       { paddingHorizontal: 16, paddingBottom: 16 },
  sectionTitle:  { color: '#e2e8f0', fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 14 },

  featureGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureCard:   {
    width: '47%', backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, padding: 14,
  },
  featureIcon:   { fontSize: 28, marginBottom: 6 },
  featureName:   { color: '#e2e8f0', fontWeight: '700', fontSize: 13, marginBottom: 4 },
  featureDesc:   { color: '#64748b', fontSize: 11, lineHeight: 16 },

  priceCard:     {
    backgroundColor: '#1e3a8a', borderRadius: 24, padding: 24, alignItems: 'center',
  },
  priceLabel:    { color: '#93c5fd', fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  priceAmount:   { color: '#fff', fontSize: 48, fontWeight: '900' },
  pricePer:      { fontSize: 20, fontWeight: '400', color: '#93c5fd' },
  priceTrial:    { color: '#93c5fd', fontSize: 13, marginBottom: 16 },
  priceItem:     { color: '#fff', fontSize: 14, alignSelf: 'flex-start', marginBottom: 6 },
  priceCta:      {
    backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 40,
    marginTop: 16, alignItems: 'center', width: '100%',
  },
  priceCtaText:  { color: '#1e3a8a', fontWeight: '800', fontSize: 16 },

  footer:        { paddingHorizontal: 24, paddingTop: 16, alignItems: 'center', gap: 8 },
  legalRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legalLink:     { color: '#475569', fontSize: 13 },
  legalDot:      { color: '#334155', fontSize: 13 },
  copyright:     { color: '#334155', fontSize: 11, textAlign: 'center' },
});
