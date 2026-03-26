import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';

export default function AGB({ navigation }) {
  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>← Zurück</Text>
        </TouchableOpacity>
        <Text style={s.title}>Allgemeine Geschäftsbedingungen</Text>
      </View>
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        <Section title="§ 1 Geltungsbereich">
          <Text style={s.p}>Diese AGB gelten für alle Nutzer der BrainCoin-Lernplattform, betrieben von Andrii Pylypchuk, Bergmannweg 16, 65934 Frankfurt am Main (nachfolgend „Anbieter").</Text>
        </Section>

        <Section title="§ 2 Leistungsbeschreibung">
          <Text style={s.p}>BrainCoin ist eine Lernplattform für Kinder der Klassen 4–9. Sie ermöglicht:{'\n'}
            {'• '}Erstellung von Lernverträgen zwischen Eltern und Kindern{'\n'}
            {'• '}KI-generierte Quizfragen{'\n'}
            {'• '}Virtuelle Belohnungen (BrainCoins){'\n'}
            {'• '}Statistiken und Lernfortschrittsverfolgung</Text>
        </Section>

        <Section title="§ 3 Registrierung und Konto">
          <Text style={s.p}>
            3.1 Für die Nutzung ist eine Registrierung erforderlich.{'\n'}
            3.2 Der Nutzer ist für die Sicherheit seiner Zugangsdaten verantwortlich.{'\n'}
            3.3 Die Registrierung von Kindern erfordert die Zustimmung eines Erziehungsberechtigten.{'\n'}
            3.4 Pro E-Mail-Adresse ist nur ein Konto erlaubt.</Text>
        </Section>

        <Section title="§ 4 Abonnement und Zahlung">
          <Text style={s.p}>
            4.1 BrainCoin wird im Abonnement für €5,00/Monat (inkl. MwSt.) angeboten.{'\n'}
            4.2 Es gilt eine kostenlose Testphase von 14 Tagen.{'\n'}
            4.3 Das Abonnement verlängert sich automatisch um einen Monat, wenn es nicht vor Ablauf des Abrechnungszeitraums gekündigt wird.{'\n'}
            4.4 Die Zahlung erfolgt über Stripe. Es gelten die Nutzungsbedingungen von Stripe.{'\n'}
            4.5 Rechnungen werden per E-Mail zugesandt.</Text>
        </Section>

        <Section title="§ 5 Kündigung">
          <Text style={s.p}>
            5.1 Der Nutzer kann das Abonnement jederzeit zum Ende des laufenden Abrechnungszeitraums kündigen.{'\n'}
            5.2 Die Kündigung erfolgt im Nutzerbereich unter „Abonnement".{'\n'}
            5.3 Der Anbieter kann das Konto bei Verstoß gegen diese AGB ohne Vorankündigung sperren.</Text>
        </Section>

        <Section title="§ 6 Widerrufsrecht">
          <Text style={s.p}>Verbrauchern steht ein gesetzliches Widerrufsrecht zu. Das Widerrufsrecht erlischt bei digitalen Inhalten, wenn mit der Ausführung des Vertrags begonnen wurde und der Verbraucher dem zugestimmt hat.</Text>
        </Section>

        <Section title="§ 7 Nutzungspflichten">
          <Text style={s.p}>
            Der Nutzer verpflichtet sich:{'\n'}
            {'• '}Keine falschen Angaben zu machen{'\n'}
            {'• '}Die Plattform nicht zu missbrauchen{'\n'}
            {'• '}Keine automatisierten Anfragen zu stellen{'\n'}
            {'• '}Keine schädlichen Inhalte hochzuladen oder zu verbreiten</Text>
        </Section>

        <Section title="§ 8 Haftungsbeschränkung">
          <Text style={s.p}>Der Anbieter haftet nicht für mittelbare Schäden, entgangene Gewinne oder Datenverluste, soweit dies gesetzlich zulässig ist. Die Haftung für Vorsatz und grobe Fahrlässigkeit bleibt unberührt.</Text>
        </Section>

        <Section title="§ 9 Datenschutz">
          <Text style={s.p}>Es gilt die Datenschutzerklärung des Anbieters, abrufbar in der App unter „Datenschutz".</Text>
        </Section>

        <Section title="§ 10 Änderungen der AGB">
          <Text style={s.p}>Der Anbieter behält sich vor, diese AGB zu ändern. Nutzer werden per E-Mail informiert. Widerspruch ist innerhalb von 30 Tagen möglich; andernfalls gelten die neuen AGB als akzeptiert.</Text>
        </Section>

        <Section title="§ 11 Anwendbares Recht">
          <Text style={s.p}>Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Gerichtsstand ist Frankfurt am Main, soweit gesetzlich zulässig.</Text>
        </Section>

        <Text style={s.stand}>Stand: März 2026</Text>

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
  title:       { color: '#f8fafc', fontSize: 22, fontWeight: '900' },
  body:        { padding: 20, paddingBottom: 60 },
  section:     { marginBottom: 24 },
  sectionTitle:{ color: '#f1f5f9', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  p:           { color: '#94a3b8', fontSize: 14, lineHeight: 22 },
  stand:       { color: '#475569', fontSize: 12, textAlign: 'center', marginTop: 16 },
});
