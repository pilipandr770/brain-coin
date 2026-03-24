import { useState, useEffect } from 'react';
import { ChevronLeft, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../api';

const DEFAULT_SETTINGS = {
  block_religion: false,
  block_politics: false,
  block_conflicts: false,
  block_mature: false,
  safe_mode: false,
};

export default function ContentSettings({ childId, childName, onBack }) {
  const { t } = useTranslation();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/auth/children/${childId}/settings`)
      .then(({ data }) => setSettings({ ...DEFAULT_SETTINGS, ...data }))
      .catch(() => setSettings(DEFAULT_SETTINGS))
      .finally(() => setLoading(false));
  }, [childId]);

  const toggle = (key) => {
    setSettings(s => ({ ...s, [key]: !s[key] }));
    setSaved(false);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/auth/children/${childId}/settings`, settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.response?.data?.error || t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const filters = [
    { key: 'safe_mode',        icon: '🛡️', label: t('content.safeMode'),       desc: t('content.safeModeDesc') },
    { key: 'block_religion',   icon: '⛪', label: t('content.blockReligion'),   desc: t('content.blockReligionDesc') },
    { key: 'block_politics',   icon: '🏛️', label: t('content.blockPolitics'),   desc: t('content.blockPoliticsDesc') },
    { key: 'block_conflicts',  icon: '⚔️', label: t('content.blockConflicts'),  desc: t('content.blockConflictsDesc') },
    { key: 'block_mature',     icon: '🔞', label: t('content.blockMature'),     desc: t('content.blockMatureDesc') },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-xl">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h1 className="font-black text-slate-900">{t('content.title')}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Child info */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3 text-sm text-blue-700">
          {t('content.settingsFor')}: <span className="font-bold">{childName}</span>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="text-center py-12 text-3xl animate-spin">⏳</div>
        ) : (
          <>
            {/* safe_mode gets special treatment — it's shown first and overrides all */}
            {filters.map(({ key, icon, label, desc }) => {
              const isDisabled = key !== 'safe_mode' && settings.safe_mode;
              return (
                <div
                  key={key}
                  className={`bg-white rounded-2xl p-4 border-2 transition-all ${
                    settings[key] ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
                  } ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{icon}</span>
                      <div>
                        <p className="font-bold text-slate-900">{label}</p>
                        <p className="text-slate-500 text-sm mt-0.5">{desc}</p>
                        {key === 'safe_mode' && settings.safe_mode && (
                          <p className="text-blue-600 text-xs mt-1 font-medium">✅ {t('content.safeModeActive')}</p>
                        )}
                      </div>
                    </div>
                    {/* Toggle switch */}
                    <button
                      onClick={() => toggle(key)}
                      className={`relative shrink-0 w-12 h-6 rounded-full transition-colors ${
                        settings[key] ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        settings[key] ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              onClick={save}
              disabled={saving}
              className={`w-full font-bold py-3 rounded-xl transition-all text-white ${
                saved ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-500'
              } disabled:opacity-50`}
            >
              {saving ? '⏳' : saved ? '✅ ' + t('common.saved') : t('common.save')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
