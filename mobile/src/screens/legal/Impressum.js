import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from 'react-native';

export default function Impressum({ navigation }) {
  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
          <Text style={s.backText}>← Zurück</Text>
        </TouchableOpacity>
        <Text style={s.title}>Impressum</Text>
      </View>
      <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>

        <Section title="Angaben gemäß § 5 TMG">
          <Text style={s.p}>Andrii Pylypchuk{'\n'}Bergmannweg 16{'\n'}65934 Frankfurt am Main{'\n'}Deutschland</Text>
        </Section>

        <Section title="Kontakt">
          <TouchableOpacity onPress={() => Linking.openURL('tel:+4916095030120')}>
            <Text style={s.link}>Telefon: +49 160 95030120</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('mailto:andrii.it.info@gmail.com')}>
            <Text style={s.link}>E-Mail: andrii.it.info@gmail.com</Text>
          </TouchableOpacity>
        </Section>

        <Section title="Umsatzsteuer-Identifikationsnummer">
          <Text style={s.p}>USt-IdNr.: DE456902445</Text>
        </Section>

        <Section title="Webseite">
          <TouchableOpacity onPress={() => Linking.openURL('https://www.andrii-it.de/')}>
            <Text style={s.link}>https://www.andrii-it.de/</Text>
          </TouchableOpacity>
        </Section>

        <Section title="Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV">
          <Text style={s.p}>Andrii Pylypchuk{'\n'}Bergmannweg 16{'\n'}65934 Frankfurt am Main</Text>
        </Section>

        <Section title="Online-Streitbeilegung">
          <Text style={s.p}>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:</Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://ec.europa.eu/consumers/odr/')}>
            <Text style={s.link}>https://ec.europa.eu/consumers/odr/</Text>
          </TouchableOpacity>
          <Text style={s.p}>Unsere E-Mail-Adresse finden Sie oben im Impressum.</Text>
        </Section>

        <Section title="Verbraucherstreitbeilegung">
          <Text style={s.p}>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</Text>
        </Section>

        <Section title="Haftung für Inhalte">
          <Text style={s.p}>Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.</Text>
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
  title:       { color: '#f8fafc', fontSize: 26, fontWeight: '900' },
  body:        { padding: 20, paddingBottom: 60 },
  section:     { marginBottom: 24 },
  sectionTitle:{ color: '#f1f5f9', fontSize: 15, fontWeight: '700', marginBottom: 8 },
  p:           { color: '#94a3b8', fontSize: 14, lineHeight: 22 },
  link:        { color: '#60a5fa', fontSize: 14, lineHeight: 22, textDecorationLine: 'underline' },
});
