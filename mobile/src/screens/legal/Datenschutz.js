import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';

export default function Datenschutz({ navigation }) {
  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>← Zurück</Text>
        </TouchableOpacity>
        <Text style={s.title}>Datenschutzerklärung</Text>
      </View>
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        <Section title="1. Verantwortlicher">
          <Text style={s.p}>Andrii Pylypchuk{'\n'}Bergmannweg 16, 65934 Frankfurt am Main{'\n'}E-Mail: andrii.it.info@gmail.com</Text>
        </Section>

        <Section title="2. Erhobene Daten">
          <Text style={s.p}>Wir erheben folgende personenbezogene Daten:{'\n'}
            {'• '}Name und E-Mail-Adresse (Registrierung){'\n'}
            {'• '}Passwort (verschlüsselt gespeichert){'\n'}
            {'• '}Altersangabe und Klassenstufe (bei Kindern){'\n'}
            {'• '}Lernfortschritte und Quiz-Ergebnisse{'\n'}
            {'• '}Zahlungsdaten (verarbeitet von Stripe, nicht direkt gespeichert)</Text>
        </Section>

        <Section title="3. Zweck der Verarbeitung">
          <Text style={s.p}>
            {'• '}Bereitstellung der BrainCoin-Plattform{'\n'}
            {'• '}Verwaltung von Lernverträgen und Münzen{'\n'}
            {'• '}Abonnementverwaltung und Zahlung{'\n'}
            {'• '}Sicherheit und Missbrauchsschutz</Text>
        </Section>

        <Section title="4. Rechtsgrundlage">
          <Text style={s.p}>Die Verarbeitung erfolgt auf Basis von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und Art. 6 Abs. 1 lit. f DSGVO (berechtigte Interessen).</Text>
        </Section>

        <Section title="5. Zahlungsdienstleister Stripe">
          <Text style={s.p}>Zahlungen werden über Stripe verarbeitet. Stripe, Inc. hält eine eigene Datenschutzerklärung bereit:</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://stripe.com/de/privacy')}>
            <Text style={s.link}>https://stripe.com/de/privacy</Text>
          </TouchableOpacity>
        </Section>

        <Section title="6. KI-Dienst Anthropic (Claude)">
          <Text style={s.p}>Quizfragen werden mit Claude AI von Anthropic generiert. Dabei werden Fach und Klasse übermittelt, keine personenbezogenen Daten.</Text>
        </Section>

        <Section title="7. Datenspeicherung">
          <Text style={s.p}>Daten werden gespeichert, solange das Benutzerkonto aktiv ist. Nach Kontolöschung werden personenbezogene Daten innerhalb von 30 Tagen gelöscht, sofern keine gesetzliche Aufbewahrungspflicht besteht.</Text>
        </Section>

        <Section title="8. Ihre Rechte (DSGVO)">
          <Text style={s.p}>
            {'• '}Auskunft (Art. 15 DSGVO){'\n'}
            {'• '}Berichtigung (Art. 16 DSGVO){'\n'}
            {'• '}Löschung (Art. 17 DSGVO){'\n'}
            {'• '}Einschränkung (Art. 18 DSGVO){'\n'}
            {'• '}Datenübertragbarkeit (Art. 20 DSGVO){'\n'}
            {'• '}Widerspruch (Art. 21 DSGVO){'\n\n'}
            Anfragen richten Sie bitte an: andrii.it.info@gmail.com</Text>
        </Section>

        <Section title="9. Beschwerderecht">
          <Text style={s.p}>Sie haben das Recht, sich bei der zuständigen Datenschutzbehörde zu beschweren. In Hessen: Hessischer Beauftragter für Datenschutz und Informationsfreiheit.</Text>
        </Section>

      </ScrollView>
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#0f172a' },
  header:      { paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  back:        { marginBottom: 12 },
  backText:    { color: '#60a5fa', fontSize: 15, fontWeight: '600' },
  title:       { color: '#f8fafc', fontSize: 24, fontWeight: '900' },
  body:        { padding: 20, paddingBottom: 60 },
  section:     { marginBottom: 24 },
  sectionTitle:{ color: '#f1f5f9', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  p:           { color: '#94a3b8', fontSize: 14, lineHeight: 22 },
  link:        { color: '#60a5fa', fontSize: 14, lineHeight: 22, textDecorationLine: 'underline' },
});
