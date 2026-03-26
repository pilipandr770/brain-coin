import { useNavigate } from 'react-router-dom';

export default function SplashScreen() {
  const nav = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center p-6">
      <div className="text-center max-w-sm w-full">
        <div className="text-8xl mb-4 animate-float">🧠</div>
        <h1 className="text-5xl font-black text-blue-400 tracking-tight mb-1">{'BrainCoin'}</h1>
        <p className="text-slate-400 mb-12 text-lg">{'Lernen · Verdienen · Gewinnen!'}</p>

        <div className="space-y-4">
          <button
            onClick={() => nav('/login')}
            className="w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-900/50 text-lg"
          >
            {'Anmelden'}
          </button>
          <button
            onClick={() => nav('/register')}
            className="w-full bg-slate-700 hover:bg-slate-600 active:scale-95 text-white font-bold py-4 rounded-2xl transition-all text-lg"
          >
            {'Registrieren'}
          </button>
        </div>

        <p className="text-slate-600 mt-10 text-xs">BrainCoin v2.0 · 2026</p>
      </div>
    </div>
  );
}
