import { useNavigate } from 'react-router-dom';

export default function AGB() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <button onClick={() => nav(-1)} className="text-blue-400 hover:text-blue-300 text-sm mb-6 flex items-center gap-1">← Zurück</button>
        <h1 className="text-3xl font-black text-white mb-2">Allgemeine Geschäftsbedingungen (AGB)</h1>
        <p className="text-slate-500 text-xs mb-8">Stand: März 2026</p>

        <div className="space-y-7 text-sm leading-relaxed text-slate-300">

          <section>
            <h2 className="text-white font-bold text-base mb-2">§ 1 Geltungsbereich</h2>
            <p>Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Plattform BrainCoin, betrieben von Andrii Pylypchuk, Bergmannweg 16, 65934 Frankfurt am Main (nachfolgend „Anbieter"). Mit der Registrierung erkennen Sie diese AGB an.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">§ 2 Leistungsbeschreibung</h2>
            <p>BrainCoin ist eine Lernplattform für Kinder der Klassen 4–9. Die Plattform ermöglicht:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Erstellung von Lernverträgen zwischen Eltern und Kindern</li>
              <li>KI-generierte Quizfragen (via Claude AI) in verschiedenen Schulfächern</li>
              <li>Virtuelle Belohnungen (BrainCoins) für erbrachte Lernleistungen</li>
              <li>Soziale Funktionen: Rangliste, Freunde, Challenges</li>
              <li>Eltern-Dashboard zur Übersicht und Verwaltung</li>
            </ul>
            <p className="mt-2">BrainCoins haben keinen monetären Wert und können nicht gegen Geld eingetauscht werden.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">§ 3 Registrierung und Nutzerkonto</h2>
            <p>Die Registrierung setzt die Vollendung des 18. Lebensjahres voraus (Elternteil-Konto). Kindkonten dürfen nur durch erziehungsberechtigte Personen über einen Einladungscode angelegt werden. Der Nutzer ist verpflichtet, wahrheitsgemäße Angaben zu machen und Zugangsdaten geheim zu halten.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">§ 4 Abonnement und Zahlung</h2>
            <p>Nach einer kostenfreien Testphase von 14 Tagen ist die Nutzung kostenpflichtig. Es gilt:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Preis: €5,00 pro Monat (inkl. MwSt.)</li>
              <li>Abrechnung monatlich über Stripe</li>
              <li>Kündigung jederzeit zum Ende des laufenden Abrechnungszeitraums</li>
              <li>Bei Kündigung bleibt der Zugang bis zum Ende des bezahlten Zeitraums bestehen</li>
            </ul>
            <p className="mt-2">Rechnungen werden per E-Mail zugestellt. Es gelten die Zahlungsbedingungen von Stripe Inc.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">§ 5 Widerrufsrecht</h2>
            <p>Verbraucher haben das Recht, innerhalb von 14 Tagen ohne Angabe von Gründen von diesem Vertrag zurückzutreten. Die Widerrufsfrist beträgt 14 Tage ab Vertragsschluss. Um Ihr Widerrufsrecht auszuüben, teilen Sie uns (<a href="mailto:andrii.it.info@gmail.com" className="text-blue-400 hover:underline">andrii.it.info@gmail.com</a>) Ihre Entscheidung mittels einer eindeutigen Erklärung mit.</p>
            <p className="mt-2 font-medium">Hinweis: Das Widerrufsrecht erlischt, wenn Sie ausdrücklich zugestimmt haben, dass wir mit der Ausführung des Vertrages beginnen, bevor die Widerrufsfrist abgelaufen ist, und Sie bestätigt haben, dass Sie von diesem Erlöschen Ihres Widerrufsrechts Kenntnis genommen haben (§ 356 Abs. 5 BGB).</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">§ 6 Nutzungspflichten und verbotene Aktivitäten</h2>
            <p>Nutzer sind verpflichtet, die Plattform nur bestimmungsgemäß zu verwenden. Untersagt sind insbesondere:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Missbrauch durch automatisierte Anfragen oder Bots</li>
              <li>Weitergabe von Zugangsdaten an Dritte</li>
              <li>Verbreitung rechtswidriger, beleidigender oder jugendgefährdender Inhalte</li>
              <li>Manipulation von BrainCoin-Guthaben oder Quiz-Ergebnissen</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">§ 7 Haftungsbeschränkung</h2>
            <p>Der Anbieter haftet unbegrenzt für Vorsatz und grobe Fahrlässigkeit sowie bei Verletzung von Leben, Körper und Gesundheit. Bei einfacher Fahrlässigkeit haftet der Anbieter nur für die Verletzung wesentlicher Vertragspflichten (Kardinalpflichten), begrenzt auf den vorhersehbaren, typischen Schaden. Eine Haftung für die Richtigkeit der KI-generierten Quizfragen wird ausdrücklich ausgeschlossen.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">§ 8 Verfügbarkeit</h2>
            <p>Der Anbieter bemüht sich um eine Verfügbarkeit von 99 % im Jahresmittel. Wartungsarbeiten werden nach Möglichkeit außerhalb der Hauptnutzungszeiten durchgeführt. Ein Anspruch auf ununterbrochene Verfügbarkeit besteht nicht.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">§ 9 Kündigung und Kontolöschung</h2>
            <p>Nutzer können ihr Konto jederzeit über die App oder per E-Mail an <a href="mailto:andrii.it.info@gmail.com" className="text-blue-400 hover:underline">andrii.it.info@gmail.com</a> löschen lassen. Der Anbieter kann Konten bei schwerwiegenden Verstößen gegen diese AGB fristlos sperren.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">§ 10 Anwendbares Recht und Gerichtsstand</h2>
            <p>Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts. Für Streitigkeiten mit Verbrauchern gilt der Gerichtsstand am Wohnort des Verbrauchers. Für Streitigkeiten mit Unternehmern gilt Frankfurt am Main als Gerichtsstand.</p>
          </section>

          <section>
            <h2 className="text-white font-bold text-base mb-2">§ 11 Änderungen der AGB</h2>
            <p>Der Anbieter behält sich vor, diese AGB mit einer Ankündigungsfrist von 30 Tagen per E-Mail zu ändern. Widerspricht der Nutzer nicht innerhalb der Frist, gelten die neuen AGB als akzeptiert.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
