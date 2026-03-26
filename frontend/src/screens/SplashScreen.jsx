import { useNavigate } from 'react-router-dom';

const FEATURES = [
  { icon: '📜', title: 'Lernverträge', desc: 'Eltern erstellen Aufgaben — Kinder erledigen sie und verdienen BrainCoins.' },
  { icon: '🪙', title: 'BrainCoins', desc: 'Virtuelle Münzen als Belohnung für jede gelöste Aufgabe und jedes Quiz.' },
  { icon: '🤖', title: 'KI-Quizfragen', desc: 'Claude AI generiert individuelle Fragen für Klassen 4–9 in allen Fächern.' },
  { icon: '🏆', title: 'Rangliste & Freunde', desc: 'Kinder treten gegeneinander an und motivieren sich gegenseitig.' },
  { icon: '👨‍👩‍👧', title: 'Eltern-Kontrolle', desc: 'Volle Übersicht über Fortschritte, Münzen und Abonnement.' },
  { icon: '📊', title: 'Statistiken', desc: 'Detaillierte Auswertungen pro Kind und Fach mit Fehleranalyse.' },
];

const STEPS = [
  { n: '1', text: 'Elternteil registriert sich und legt ein Konto an' },
  { n: '2', text: 'Kind wird mit einem Einladungscode verknüpft' },
  { n: '3', text: 'Lernvertrag erstellen: Fach, Klasse, Münzziel' },
  { n: '4', text: 'Kind löst Quiz-Aufgaben und sammelt BrainCoins' },
  { n: '5', text: 'Eltern bestätigen Fortschritte und Belohnungen' },
];

export default function SplashScreen() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">

      {/* ── Hero ── */}
      <section className="flex flex-col items-center justify-center px-6 pt-16 pb-12 text-center max-w-2xl mx-auto">
        <div className="text-7xl mb-4 animate-bounce">🧠</div>
        <h1 className="text-5xl font-black text-blue-400 tracking-tight mb-2">BrainCoin</h1>
        <p className="text-xl text-slate-300 mb-2">Die Lernplattform, die Kinder <span className="text-yellow-400 font-bold">motiviert</span></p>
        <p className="text-slate-400 mb-8 max-w-md">Kinder lösen Schulaufgaben, verdienen BrainCoins und tauschen sie gegen echte Belohnungen — alles unter Elternkontrolle.</p>
        <div className="flex gap-3 w-full max-w-xs flex-col">
          <button
            onClick={() => nav('/register')}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/50 text-lg"
          >
            Jetzt kostenlos starten
          </button>
          <button
            onClick={() => nav('/login')}
            className="w-full bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold py-3 rounded-2xl transition-all"
          >
            Anmelden
          </button>
        </div>
        <p className="text-slate-500 mt-4 text-xs">14 Tage kostenlos testen · Danach ab €5/Monat · Jederzeit kündbar</p>
      </section>

      {/* ── Features ── */}
      <section className="px-4 pb-12 max-w-2xl mx-auto">
        <h2 className="text-center text-2xl font-black text-slate-200 mb-6">Was BrainCoin bietet</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-3 items-start">
              <span className="text-3xl">{f.icon}</span>
              <div>
                <p className="font-bold text-slate-200 text-sm">{f.title}</p>
                <p className="text-slate-400 text-xs mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="px-4 pb-12 max-w-2xl mx-auto">
        <h2 className="text-center text-2xl font-black text-slate-200 mb-6">So funktioniert es</h2>
        <div className="space-y-3">
          {STEPS.map(s => (
            <div key={s.n} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex-shrink-0 flex items-center justify-center font-black text-sm">{s.n}</div>
              <p className="text-slate-300 text-sm">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="px-4 pb-12 max-w-md mx-auto">
        <h2 className="text-center text-2xl font-black text-slate-200 mb-6">Preise</h2>
        <div className="bg-gradient-to-br from-blue-700 to-indigo-800 rounded-3xl p-6 text-center shadow-xl">
          <p className="text-blue-200 text-sm font-bold mb-1">PREMIUM-ABO</p>
          <p className="text-5xl font-black text-white mb-1">€5<span className="text-2xl font-normal text-blue-200">/Monat</span></p>
          <p className="text-blue-200 text-sm mb-4">14 Tage kostenlos testen</p>
          <ul className="text-left space-y-2 mb-6 text-sm text-white">
            {['Unbegrenzte Lernverträge', 'KI-generierte Quizfragen', 'Alle Fächer Klasse 4–9', 'Rangliste & Freunde-System', 'Detaillierte Statistiken', 'Eltern-App & Web-Zugang'].map(t => (
              <li key={t} className="flex items-center gap-2"><span className="text-green-400">✓</span>{t}</li>
            ))}
          </ul>
          <button
            onClick={() => nav('/register')}
            className="w-full bg-white text-blue-700 font-black py-3 rounded-2xl hover:bg-blue-50 transition-all active:scale-95"
          >
            Kostenlos starten
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10 px-4 py-6 text-center text-slate-500 text-xs max-w-2xl mx-auto">
        <div className="flex justify-center gap-4 flex-wrap mb-3">
          <button onClick={() => nav('/impressum')} className="hover:text-slate-300 transition-colors">Impressum</button>
          <button onClick={() => nav('/datenschutz')} className="hover:text-slate-300 transition-colors">Datenschutz</button>
          <button onClick={() => nav('/agb')} className="hover:text-slate-300 transition-colors">AGB</button>
        </div>
        <p>© 2026 BrainCoin · Andrii Pylypchuk · Frankfurt am Main</p>
      </footer>
    </div>
  );
}

