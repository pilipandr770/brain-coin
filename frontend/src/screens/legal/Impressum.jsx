import { useNavigate } from 'react-router-dom';

export default function Impressum() {
  const nav = useNavigate();
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <button onClick={() => nav(-1)} className="text-blue-400 hover:text-blue-300 text-sm mb-6 flex items-center gap-1">← Zurück</button>
        <h1 className="text-3xl font-black text-white mb-8">Impressum</h1>

        <section className="space-y-6 text-sm leading-relaxed text-slate-300">
          <div>
            <h2 className="text-white font-bold text-base mb-2">Angaben gemäß § 5 TMG</h2>
            <p>Andrii Pylypchuk<br />
            Bergmannweg 16<br />
            65934 Frankfurt am Main<br />
            Deutschland</p>
          </div>

          <div>
            <h2 className="text-white font-bold text-base mb-2">Kontakt</h2>
            <p>Telefon: <a href="tel:+4916095030120" className="text-blue-400 hover:underline">+49 160 95030120</a><br />
            E-Mail: <a href="mailto:andrii.it.info@gmail.com" className="text-blue-400 hover:underline">andrii.it.info@gmail.com</a></p>
          </div>

          <div>
            <h2 className="text-white font-bold text-base mb-2">Umsatzsteuer-Identifikationsnummer</h2>
            <p>USt-IdNr.: DE456902445</p>
          </div>

          <div>
            <h2 className="text-white font-bold text-base mb-2">Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
            <p>Andrii Pylypchuk<br />
            Bergmannweg 16<br />
            65934 Frankfurt am Main</p>
          </div>

          <div>
            <h2 className="text-white font-bold text-base mb-2">Online-Streitbeilegung</h2>
            <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:<br />
            <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">https://ec.europa.eu/consumers/odr/</a><br />
            Unsere E-Mail-Adresse finden Sie oben im Impressum.</p>
          </div>

          <div>
            <h2 className="text-white font-bold text-base mb-2">Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
            <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
          </div>

          <div>
            <h2 className="text-white font-bold text-base mb-2">Haftung für Inhalte</h2>
            <p>Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht unter der Verpflichtung, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.</p>
          </div>

          <div>
            <h2 className="text-white font-bold text-base mb-2">Urheberrecht</h2>
            <p>Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.</p>
          </div>

          <div>
            <h2 className="text-white font-bold text-base mb-2">Webseite</h2>
            <p><a href="https://www.andrii-it.de/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">https://www.andrii-it.de/</a></p>
          </div>
        </section>
      </div>
    </div>
  );
}
