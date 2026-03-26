import { useNavigate } from 'react-router-dom';

export default function Datenschutz() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <button onClick={() => nav(-1)} className="text-blue-400 hover:text-blue-300 text-sm mb-6 flex items-center gap-1">← Zurück</button>
        <h1 className="text-3xl font-black text-white mb-2">Datenschutzerklärung</h1>
        <p className="text-slate-500 text-xs mb-8">Stand: März 2026</p>

        <div className="space-y-7 text-sm leading-relaxed text-slate-300">

          <section>
            <h2 className="text-white font-bold text-base mb-2">1. Verantwortlicher</h2>
            <p>Verantwortlicher im Sinne der DSGVO ist:<br />
            Andrii Pylypchuk, Bergmannweg 16, 65934 Frankfurt am Main<br />
            E-Mail: <a href="mailto:andrii.it.info@gmail.com" className="text-blue-400 hover:underline">andrii.it.info@gmail.com</a></p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">2. Erhobene Daten und Zweck der Verarbeitung</h2>
            <p>Wir erheben folgende personenbezogene Daten:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Registrierungsdaten</strong>: Name, E-Mail-Adresse, verschlüsseltes Passwort, Rolle (Elternteil / Kind)</li>
              <li><strong>Profildaten</strong>: Klasse, Avatar-Emoji, Spracheinstellung</li>
              <li><strong>Lerndaten</strong>: Lernverträge, Quiz-Ergebnisse, BrainCoin-Guthaben</li>
              <li><strong>Zahlungsdaten</strong>: Stripe-Kunden-ID und Abonnementstatus (keine Kartendaten gespeichert)</li>
              <li><strong>Kommunikationsdaten</strong>: Nachrichten im Freunde-Chat (Ende-zu-Ende nicht verschlüsselt)</li>
            </ul>
            <p className="mt-2">Rechtsgrundlagen: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung), Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">3. Kinddaten und Einwilligung</h2>
            <p>Kindkonten (unter 16 Jahren) werden ausschließlich durch Elternteile über einen Einladungscode angelegt. Die Einwilligung zur Datenverarbeitung von Minderjährigen wird durch die erziehungsberechtigte Person erteilt (Art. 8 DSGVO). Eltern können das Kindkonto jederzeit über das Eltern-Panel löschen.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">4. Datenweitergabe an Dritte</h2>
            <p>Daten werden nur an folgende Auftragsverarbeiter weitergegeben:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li><strong>Stripe Inc.</strong> (USA) – Zahlungsabwicklung. Datenübermittlung auf Basis von Standardvertragsklauseln (SCC).</li>
              <li><strong>Anthropic PBC</strong> (USA) – KI-Quizgenerierung. Keine personenbezogenen Daten werden übermittelt.</li>
              <li><strong>Render Inc.</strong> (USA) – Hosting. Datenverarbeitung in EU-nahen Rechenzentren.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">5. Speicherdauer</h2>
            <p>Daten werden gespeichert, solange das Konto aktiv ist. Nach Kontolöschung werden alle personenbezogenen Daten innerhalb von 30 Tagen gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen (z. B. steuerrechtlich 10 Jahre für Rechnungsdaten).</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">6. Ihre Rechte (Art. 15–22 DSGVO)</h2>
            <p>Sie haben das Recht auf:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Auskunft über gespeicherte Daten (Art. 15)</li>
              <li>Berichtigung unrichtiger Daten (Art. 16)</li>
              <li>Löschung ("Recht auf Vergessenwerden", Art. 17)</li>
              <li>Einschränkung der Verarbeitung (Art. 18)</li>
              <li>Datenübertragbarkeit (Art. 20)</li>
              <li>Widerspruch gegen die Verarbeitung (Art. 21)</li>
            </ul>
            <p className="mt-2">Anfragen richten Sie an: <a href="mailto:andrii.it.info@gmail.com" className="text-blue-400 hover:underline">andrii.it.info@gmail.com</a></p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">7. Beschwerderecht</h2>
            <p>Sie haben das Recht, sich bei der zuständigen Aufsichtsbehörde zu beschweren. In Hessen ist dies der Hessische Beauftragte für Datenschutz und Informationsfreiheit (HBDI), Postfach 3163, 65021 Wiesbaden.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">8. Cookies</h2>
            <p>BrainCoin verwendet keine Tracking-Cookies. Technisch notwendige Sitzungsdaten werden im <code className="bg-slate-800 px-1 rounded">localStorage</code> des Browsers gespeichert. Diese Daten verlassen den Browser nicht.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">9. Änderungen dieser Datenschutzerklärung</h2>
            <p>Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen. Die jeweils aktuelle Version ist auf dieser Seite abrufbar.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
