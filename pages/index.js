import { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { 
  LayoutDashboard, Settings, PlusCircle, Server, 
  Trash2, CheckCircle2, AlertCircle, Terminal 
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('create');
  const [config, setConfig] = useState({ domain: '', plta: '' });
  const [isConfigured, setIsConfigured] = useState(false);
  const [username, setUsername] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('1gb');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);

  // SETTING PLAN
  const PLANS = {
    "1gb":  { label: "Starter", memory: 1024, cpu: 30, disk: 1024 },
    "2gb":  { label: "Basic",   memory: 2048, cpu: 60, disk: 2048 },
    "3gb":  { label: "Medium",  memory: 3072, cpu: 80, disk: 3072 },
    "4gb":  { label: "Pro",     memory: 4096, cpu: 110, disk: 4096 },
    "8gb":  { label: "Turbo",   memory: 8192, cpu: 230, disk: 8192 },
    "unli": { label: "God Mode", memory: 0, cpu: 0, disk: 0 },
  };

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

    if (savedHistory) setHistory(JSON.parse(savedHistory));
  }, []);

  const saveConfig = () => {
    if (!config.domain || !config.plta) return alert("Isi Domain & PLTA dulu!");
    localStorage.setItem('panel_config', JSON.stringify(config));
    setIsConfigured(true);
    setActiveTab('create');
    setStatus({ type: 'success', msg: 'Setting tersimpan!' });
  };

  const deleteHistoryItem = (index) => {
    if(!confirm("Hapus data ini?")) return;
    const newHistory = history.filter((_, i) => i !== index);
    setHistory(newHistory);
    localStorage.setItem('panel_history', JSON.stringify(newHistory));
  };

  const handleCreate = async () => {
    if (!username) return setStatus({ type: 'error', msg: 'Username wajib diisi!' });
    if (!isConfigured) return setStatus({ type: 'error', msg: 'Setting API belum diatur!' });

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

      const newHistory = [newData, ...history];
      setHistory(newHistory);
      localStorage.setItem('panel_history', JSON.stringify(newHistory));

      setStatus({ type: 'success', msg: `Sukses membuat server: ${username}` });
      setUsername('');
      setActiveTab('history');

    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.message || 'Gagal connect ke panel.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-wrapper">
      <Head>
        <title>Panel Manager V2</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="container nav-content">
          <div className="brand">
            <Terminal size={24} />
            Panel<span>Manager</span>
          </div>
          <div className="status-badge">
            {isConfigured ? '🟢 Connected' : '🔴 No Config'}
          </div>
        </div>
      </nav>

      <div className="container grid-layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <button 
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}>
            <PlusCircle size={20} /> Create Server
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}>
            <LayoutDashboard size={20} /> History Data
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}>
            <Settings size={20} /> Settings
          </button>
          
          {!isConfigured && (
             <div className="alert alert-error" style={{marginTop: '1rem', fontSize: '0.8rem'}}>
               <AlertCircle size={16} /> Belum ada Config!
             </div>
          )}
        </aside>

        {/* MAIN CONTENT */}
        <main>
          {status && (
            <div className={`alert ${status.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {status.msg}
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Konfigurasi Panel</h2>
                <p className="text-sm">Data disimpan di browser (LocalStorage).</p>
              </div>
              <div className="form-group">
                <label className="label">DOMAIN PANEL (https://...)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="https://panel.domain.com"
                  value={config.domain}
                  onChange={(e) => setConfig({...config, domain: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="label">PLTA (API KEY)</label>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="plta_xxxxxxxxxxxx"
                  value={config.plta}
                  onChange={(e) => setConfig({...config, plta: e.target.value})}
                />
              </div>
              <button className="btn-primary" onClick={saveConfig}>
                Simpan Konfigurasi
              </button>
            </div>
          )}

          {/* TAB: CREATE */}
          {activeTab === 'create' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Deploy Server</h2>
                <p className="text-sm">Buat akun & server otomatis.</p>
              </div>

              <div className="form-group">
                <label className="label">USERNAME</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Contoh: AdminGanteng"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="label">PILIH PAKET (RAM)</label>
                <div className="plan-grid">
                  {Object.keys(PLANS).map((key) => {
                    const p = PLANS[key];
                    return (
                      <div 
                        key={key} 
                        className={`plan-card ${selectedPlan === key ? 'selected' : ''}`}
                        onClick={() => setSelectedPlan(key)}>
                        <span className="plan-name">{p.label}</span>
                        <span className="plan-desc">{p.memory === 0 ? 'Unli' : p.memory + ' MB'}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <button className="btn-primary" onClick={handleCreate} disabled={loading}>
                {loading ? 'Sedang Memproses...' : 'Deploy Server Sekarang'}
                {!loading && <Server size={18} />}
              </button>
            </div>
          )}

          {/* TAB: HISTORY */}
          {activeTab === 'history' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Riwayat Akun</h2>
              </div>
              
              {history.length === 0 ? (
                <div className="text-center" style={{padding: '2rem', color: '#64748b'}}>
                  Belum ada server yang dibuat.
                </div>
              ) : (
                <div>
                  {history.map((item, idx) => (
                    <div key={idx} className="history-item">
                      <button className="delete-btn" onClick={() => deleteHistoryItem(idx)}>
                        <Trash2 size={16} />
                      </button>
                      
                      <div className="history-header">
                        <div className="avatar">{item.username.charAt(0).toUpperCase()}</div>
                        <div>
                          <div style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{item.username}</div>
                          <div className="text-sm" style={{color: '#3b82f6'}}>{item.planName}</div>
                        </div>
                      </div>

                      <div className="history-details">
                        <div className="detail-row">
                          <span>Email:</span> <span>{item.email}</span>
                        </div>
                        <div className="detail-row">
                          <span>Pass:</span> <span>{item.password}</span>
                        </div>
                        <div className="detail-row" style={{border: 'none'}}>
                          <span>Login:</span> <a href={item.login} target="_blank">{item.login}</a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
