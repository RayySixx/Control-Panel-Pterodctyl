import { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { 
  LayoutDashboard, 
  Settings, 
  PlusCircle, 
  Server, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  Terminal,
  LogOut
} from 'lucide-react';

export default function Home() {
  // State Tabs
  const [activeTab, setActiveTab] = useState('create');
  
  // State Data
  const [config, setConfig] = useState({ domain: '', plta: '' });
  const [isConfigured, setIsConfigured] = useState(false);
  
  // State Form
  const [username, setUsername] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('1gb');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg: '' }

  // State History
  const [history, setHistory] = useState([]);

  // LIST PLAN (Sesuai Bot Lu)
  const PLANS = {
    "1gb":  { label: "Starter", memory: 1024, cpu: 30, disk: 1024, color: "from-blue-500 to-cyan-500" },
    "2gb":  { label: "Basic",   memory: 2048, cpu: 60, disk: 2048, color: "from-blue-600 to-indigo-600" },
    "4gb":  { label: "Pro",     memory: 4096, cpu: 110, disk: 4096, color: "from-purple-500 to-pink-500" },
    "8gb":  { label: "Turbo",   memory: 8192, cpu: 230, disk: 8192, color: "from-orange-500 to-red-500" },
    "unli": { label: "God Mode", memory: 0, cpu: 0, disk: 0, color: "from-emerald-500 to-green-500" },
  };

  // LOAD DATA FROM LOCALSTORAGE
  useEffect(() => {
    const savedConfig = localStorage.getItem('panel_config');
    const savedHistory = localStorage.getItem('panel_history');
    
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      setConfig(parsed);
      if(parsed.domain && parsed.plta) setIsConfigured(true);
    } else {
      setActiveTab('settings');
    }

    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  // SAVE CONFIG
  const saveConfig = () => {
    if (!config.domain || !config.plta) return alert("Isi semua data!");
    localStorage.setItem('panel_config', JSON.stringify(config));
    setIsConfigured(true);
    setActiveTab('create');
    setStatus({ type: 'success', msg: 'Konfigurasi tersimpan di browser!' });
    setTimeout(() => setStatus(null), 3000);
  };

  // DELETE HISTORY
  const deleteHistoryItem = (index) => {
    const newHistory = history.filter((_, i) => i !== index);
    setHistory(newHistory);
    localStorage.setItem('panel_history', JSON.stringify(newHistory));
  };

  // CREATE PANEL FUNCTION
  const handleCreate = async () => {
    if (!username) return setStatus({ type: 'error', msg: 'Username wajib diisi!' });
    if (!isConfigured) return setStatus({ type: 'error', msg: 'Setting belum diatur!' });

    setLoading(true);
    setStatus(null);

    try {
      const res = await axios.post('/api/ptero', {
        host: config.domain,
        key: config.plta,
        username: username,
        plan: PLANS[selectedPlan]
      });

      const newData = {
        ...res.data.data,
        planName: PLANS[selectedPlan].label,
        date: new Date().toLocaleDateString()
      };

      // Save to history
      const newHistory = [newData, ...history];
      setHistory(newHistory);
      localStorage.setItem('panel_history', JSON.stringify(newHistory));

      setStatus({ type: 'success', msg: `Berhasil membuat server untuk ${username}!` });
      setUsername('');
      setActiveTab('history'); // Auto pindah ke history biar user liat hasilnya

    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.message || 'Gagal terhubung ke Panel.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-gray-200 font-sans selection:bg-blue-500 selection:text-white">
      <Head>
        <title>Panel Manager Pro</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* NAVBAR */}
      <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Terminal size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Panel<span className="text-blue-500">Manager</span></span>
          </div>
          <div className="text-xs text-gray-500 font-mono hidden sm:block">
            {isConfigured ? 'CONNECTED' : 'NO CONFIG'}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* SIDEBAR */}
        <aside className="md:col-span-3 space-y-2">
          <TabButton 
            active={activeTab === 'create'} 
            onClick={() => setActiveTab('create')} 
            icon={<PlusCircle size={20} />} 
            label="Create Server" 
          />
          <TabButton 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')} 
            icon={<LayoutDashboard size={20} />} 
            label="History / Data" 
          />
          <TabButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            icon={<Settings size={20} />} 
            label="Settings" 
          />
          
          {!isConfigured && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle size={16} className="mb-2" />
              Anda belum mengatur Domain & PLTA. Silahkan ke menu Settings.
            </div>
          )}
        </aside>

        {/* CONTENT AREA */}
        <div className="md:col-span-9">
          
          {/* STATUS NOTIFICATION */}
          {status && (
            <div className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
              status.type === 'success' 
                ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <span className="text-sm font-medium">{status.msg}</span>
            </div>
          )}

          {/* === TAB: SETTINGS === */}
          {activeTab === 'settings' && (
            <div className="glass-panel rounded-2xl p-6 space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">Configuration</h2>
                <p className="text-gray-400 text-sm">Data disimpan di LocalStorage browser anda.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">PANEL DOMAIN (HTTPS)</label>
                  <input 
                    type="text" 
                    value={config.domain}
                    onChange={(e) => setConfig({...config, domain: e.target.value})}
                    placeholder="https://panel.example.com"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">PLTA (API KEY)</label>
                  <input 
                    type="password" 
                    value={config.plta}
                    onChange={(e) => setConfig({...config, plta: e.target.value})}
                    placeholder="plta_xxxxxxxxxxxxxxxxx"
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <button 
                onClick={saveConfig}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-all active:scale-95"
              >
                Save Settings
              </button>
            </div>
          )}

          {/* === TAB: CREATE === */}
          {activeTab === 'create' && (
            <div className="space-y-6">
              <div className="glass-panel rounded-2xl p-6">
                 <h2 className="text-2xl font-bold mb-4">Deploy New Instance</h2>
                 
                 <div className="mb-6">
                   <label className="block text-xs font-medium text-gray-400 mb-2">USERNAME (OWNER)</label>
                   <input 
                     type="text" 
                     value={username}
                     onChange={(e) => setUsername(e.target.value)}
                     placeholder="Ex: RyzzHosting"
                     className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-lg focus:outline-none focus:border-blue-500 transition-colors"
                   />
                 </div>

                 <div className="mb-6">
                   <label className="block text-xs font-medium text-gray-400 mb-2">SELECT RESOURCE PLAN</label>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                     {Object.keys(PLANS).map((key) => {
                       const p = PLANS[key];
                       const active = selectedPlan === key;
                       return (
                         <button
                           key={key}
                           onClick={() => setSelectedPlan(key)}
                           className={`relative overflow-hidden rounded-xl p-4 text-left border transition-all ${
                             active ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5 hover:border-white/10'
                           }`}
                         >
                           <div className={`text-sm font-bold mb-1 ${active ? 'text-blue-400' : 'text-gray-300'}`}>{p.label}</div>
                           <div className="text-xs text-gray-500">{p.memory === 0 ? 'Unlimited' : p.memory + ' MB'} RAM</div>
                           {active && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"></div>}
                         </button>
                       )
                     })}
                   </div>
                 </div>

                 <button 
                   onClick={handleCreate}
                   disabled={loading}
                   className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg flex justify-center items-center gap-2 ${
                     loading ? 'bg-gray-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/20 active:scale-95'
                   }`}
                 >
                   {loading ? 'Processing...' : 'Deploy Server Now'}
                   {!loading && <Server size={18} />}
                 </button>
              </div>
            </div>
          )}

          {/* === TAB: HISTORY === */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold">Account History</h2>
                <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">Local Data</span>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-2xl">
                  Belum ada data server yang dibuat.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {history.map((item, idx) => (
                    <div key={idx} className="glass-panel rounded-xl p-5 relative group overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => deleteHistoryItem(idx)} className="text-red-500 hover:text-red-400 bg-red-500/10 p-2 rounded-lg">
                           <Trash2 size={16} />
                         </button>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center shrink-0">
                          <span className="font-bold text-gray-400">{item.username.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="w-full overflow-hidden">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg text-white truncate">{item.username}</h3>
                            <span className="text-[10px] font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase tracking-wider">
                              {item.planName || 'SERVER'}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-gray-400 mt-3 bg-black/30 p-3 rounded-lg border border-white/5">
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span>EMAIL:</span> <span className="text-gray-200 select-all">{item.email}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/5 pb-1">
                              <span>PASS:</span> <span className="text-gray-200 select-all">{item.password}</span>
                            </div>
                            <div className="flex justify-between col-span-1 sm:col-span-2 pt-1">
                              <span>LOGIN:</span> <a href={item.login} target="_blank" className="text-blue-400 hover:underline truncate">{item.login}</a>
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-600 mt-2 text-right">{item.date}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Component Kecil untuk Tombol Sidebar
function TabButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </button>
  );
}
