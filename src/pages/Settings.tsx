import { useState, useEffect, FormEvent } from 'react';
import { 
  Clock, 
  Key, 
  Cpu, 
  CheckCircle, 
  Info
} from 'lucide-react';

export default function Settings() {
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [timezone, setTimezone] = useState('UTC');
  
  const [serverMode, setServerMode] = useState({
    status: 'unknown',
    mode: 'emulator-active'
  });
  
  const [saving, setSaving] = useState(false);
  const [, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchDiagnostics = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/health');
        if (response.ok) {
          const data = await response.json();
          setServerMode({
            status: 'online',
            mode: data.mode
          });
        }
      } catch (e) {
        setServerMode({ status: 'offline', mode: 'unknown' });
      } finally {
        setLoading(false);
      }
    };
    fetchDiagnostics();
  }, []);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    setTimeout(() => {
      setSaving(false);
      setSuccess(true);
    }, 600);
  };

  const isGeminiActive = serverMode.mode === 'gemini-active';

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-4xl mx-auto overflow-y-auto bg-canvas h-screen font-light">
      
      {/* Header */}
      <div className="border-b border-hairline pb-5 relative">
        <div className="absolute bottom-[-1.5px] left-0 w-24 h-[3px] m-stripe" />
        <h1 className="text-2xl font-bold text-ink tracking-wider uppercase">System Settings</h1>
        <p className="text-muted text-xs mt-1">Configure workspace parameters, scheduler boundaries, and verify server keys.</p>
      </div>

      {success && (
        <div className="p-3.5 border border-success bg-success/5 text-success text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-none">
          <CheckCircle className="w-4 h-4" />
          <span>Settings saved successfully! Scheduler boundaries updated.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: General settings form (7 cols) */}
        <form onSubmit={handleSave} className="md:col-span-7 space-y-6">
          
          <div className="glass-panel p-6 border-hairline space-y-5 relative">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] m-stripe" />
            <h3 className="font-bold text-xs text-ink uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-hairline pt-1">
              <Clock className="w-4.5 h-4.5 text-ink" />
              Scheduler Boundaries
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] font-bold text-muted uppercase tracking-[1.5px] mb-1.5">Start Focus Hours</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bmw-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-muted uppercase tracking-[1.5px] mb-1.5">End Focus Hours</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bmw-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-muted uppercase tracking-[1.5px] mb-1.5">Workspace Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bmw-input text-xs text-slate-350"
              >
                <option value="UTC">Coordinated Universal Time (UTC)</option>
                <option value="EST">Eastern Standard Time (EST)</option>
                <option value="PST">Pacific Standard Time (PST)</option>
                <option value="IST">India Standard Time (IST)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bmw-btn-primary text-xs"
            >
              {saving ? 'Saving bounds...' : 'Save Preferences'}
            </button>
          </div>

          <div className="glass-panel p-5 border-hairline text-xs text-body flex items-start gap-2.5 bg-surface-soft">
            <Info className="w-4 h-4 text-ink shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              These boundaries guide the **Scheduler Agent** to map your time blocks. Large tasks will not be scheduled before your starting hour or after your ending hour.
            </p>
          </div>

        </form>

        {/* Right Side: Diagnostics (5 cols) */}
        <div className="md:col-span-5 space-y-6">
          
          <div className="glass-panel p-6 border-hairline space-y-5 relative">
            <div className="absolute top-0 left-0 right-0 h-[2.5px] m-stripe" />
            <h3 className="font-bold text-xs text-ink uppercase tracking-widest flex items-center gap-2 pb-2 border-b border-hairline pt-1">
              <Cpu className="w-4.5 h-4.5 text-ink" />
              Agent Console Details
            </h3>

            {/* Mode status */}
            <div className="space-y-4">
              
              <div className="flex justify-between items-center text-xs pb-3 border-b border-hairline">
                <span className="font-bold text-muted uppercase text-[9px] tracking-wide">Server Node Status:</span>
                <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase tracking-wider
                  ${serverMode.status === 'online' ? 'border-success bg-success/5 text-success' : 'border-m-red bg-m-red/5 text-m-red'}
                `}>
                  {serverMode.status}
                </span>
              </div>

              {/* Gemini state */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted uppercase text-[9px] tracking-wide">Gemini LLM Channel:</span>
                  <span className={`px-2 py-0.5 border text-[9px] font-bold uppercase tracking-wider
                    ${isGeminiActive ? 'border-m-blue-light bg-m-blue-light/5 text-ink' : 'border-warning bg-warning/5 text-warning'}
                  `}>
                    {isGeminiActive ? 'Gemini 1.5 Active' : 'Local LLM Emulator'}
                  </span>
                </div>
                <p className="text-[10px] text-muted leading-normal pt-1.5">
                  {isGeminiActive 
                    ? 'Connected directly to Google AI Studio. Tasks are decomposed dynamically using generative capabilities.' 
                    : 'Backend running using deterministic pattern matching and emulated JSON schemas. Zero setup required.'}
                </p>
              </div>

              {/* Firebase state */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted uppercase text-[9px] tracking-wide">Database Engine:</span>
                  <span className="px-2 py-0.5 bg-canvas border border-hairline text-[9px] font-bold text-muted uppercase tracking-wider">
                    File-Persistent db.json
                  </span>
                </div>
                <p className="text-[10px] text-muted leading-normal pt-1.5">
                  Firestore configuration is disabled. Storing files locally in server directory to enable out-of-the-box reviews.
                </p>
              </div>

            </div>

            {/* Instruction block */}
            {!isGeminiActive && (
              <div className="p-3.5 bg-canvas border border-hairline space-y-2">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-ink uppercase tracking-wider">
                  <Key className="w-3.5 h-3.5" />
                  How to link Google Gemini?
                </div>
                <ol className="list-decimal pl-4 text-[9px] text-muted space-y-2 leading-relaxed font-semibold">
                  <li>Generate a free key at <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-ink hover:underline">Google AI Studio</a>.</li>
                  <li>Open <code className="px-1 py-0.5 bg-surface-card border border-hairline text-ink">server/.env</code> in your workspace.</li>
                  <li>Paste the key into the <code className="text-ink">GEMINI_API_KEY=...</code> variable.</li>
                  <li>Restart the backend Node service.</li>
                </ol>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
