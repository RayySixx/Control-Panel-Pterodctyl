import { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { 
  LayoutDashboard, Settings, PlusCircle, Server, 
  Trash2, CheckCircle2, AlertCircle, Terminal, HardDrive, Wifi 
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('create');
  const [config, setConfig] = useState({ domain: '', plta: '' });
  const [isConfigured, setIsConfigured] = useState(false);
  
  // Create State
  const [username, setUsername] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('1gb');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  
  // History & List State
  const [history, setHistory] = useState([]);
  const [serverList, setServerList] = useState([]); // DATA SERVER DARI PANEL
  const [loadingList, setLoadingList] = useState(false);

  // SETTING PLAN
  const PLANS = {
    "1gb":  { label: "Starter", memory: 1024, cpu: 30, disk: 1024 },
    "2gb":  { label: "Basic",   memory: 2048, cpu: 60, disk: 2048 },
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
  };

  // === FETCH SERVER LIST DARI PANEL ===
  const fetchServers = async () => {
    if(!isConfigured) return;
    setLoadingList(true);
    try {
      const res = await axios.post('/api/ptero', {
        action: 'list_servers',
        host: config.domain,
        key: config.plta
      });
      setServerList(res.data.data);
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: 'Gagal mengambil data server.' });
    } finally {
      setLoadingList(false);
    }
  };

  // Load server list pas masuk tab list
  useEffect(() => {
    if(activeTab === 'list' && isConfigured) {
      fetchServers();
    }
  }, [activeTab]);

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
        <title>CyberPanel V3</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      {/* NAVBAR */}
      <nav className="navbar">
        <div className="container nav-content">
          <div className="brand">
            <Terminal size={26} className="text-blue-500" />
            Cyber<span>Panel</span>
          </div>
          <div className="status-badge">
            <div className={`dot ${isConfigured ? 'online' : 'offline'}`}></div>
            {isConfigured ? 'SYSTEM ONLINE' : 'DISCONNECTED'}
          </div>
        </div>
      </nav>

      <div className="container main-grid">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <button className={`nav-btn ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>
            <PlusCircle size={20} /> Create Server
          </button>
          <button className={`nav-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => setActiveTab('list')}>
            <Server size={20} /> List Server (Real)
          </button>
          <button className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <LayoutDashboard size={20} /> Local History
          </button>
          <button className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={20} /> Settings
          </button>
        </aside>

        {/* CONTENT */}
        <main className="animate-in">
          {status && (
            <div className={`alert ${status.type === 'success' ? 'success' : 'error'}`}>
              {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              {status.msg}
            </div>
          )}

          {/* TAB: LIST SERVER (REALTIME) */}
          {activeTab === 'list' && (
            <div className="glass-card">
              <div className="card-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h2 className="card-title">Active Server List</h2>
                <button onClick={fetchServers} style={{background:'none', border:'none', color:'#3b82f6', cursor:'pointer'}}>
                  Refresh ↻
                </button>
              </div>

              {loadingList ? (
                <div style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>Accessing Panel Data...</div>
              ) : serverList.length === 0 ? (
                <div style={{textAlign:'center', padding:'2rem', color:'#94a3b8'}}>Tidak ada server ditemukan.</div>
              ) : (
                <div className="server-grid">
                  {serverList.map((srv) => {
                    const attr = srv.attributes;
                    // Logic Status Badge
                    let statusClass = 'active';
                    let statusText = 'ONLINE';
                    
                    if (attr.suspended) {
                      statusClass = 'suspended';
                      statusText = 'SUSPENDED';
                    } else if (attr.status) { // Kalo ada status install/transfer
                       statusClass = 'installing';
                       statusText = attr.status; // installing, restoring, etc
                    }

                    return (
                      <div key={attr.id} className="server-card">
                        <div className="srv-info">
                          <h4>{attr.name}</h4>
                          <p>ID: {attr.id} | USER: {attr.user}</p>
                          <div style={{fontSize:'0.75rem', marginTop:'4px', color:'#64748b'}}>
                            {attr.limits.memory}MB RAM | {attr.limits.disk}MB DISK
                          </div>
                        </div>
                        <div className="srv-status">
                          <span className={`badge ${statusClass}`}>
                             {statusClass === 'active' && <Wifi size={12}/>}
                             {statusText}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="glass-card">
              <div className="card-header">
                <h2 className="card-title">System Configuration</h2>
              </div>
              <div className="input-group">
                <label className="input-label">PANEL DOMAIN (https://...)</label>
                <input type="text" className="input-field" placeholder="https://panel.host.com"
                  value={config.domain} onChange={(e) => setConfig({...config, domain: e.target.value})} />
              </div>
              <div className="input-group">
                <label className="input-label">APPLICATION API KEY (PLTA)</label>
                <input type="password" className="input-field" placeholder="plta_xxxxxxxxxxxx"
                  value={config.plta} onChange={(e) => setConfig({...config, plta: e.target.value})} />
              </div>
              <button className="btn-action" onClick={saveConfig}>Save Configuration</button>
            </div>
          )}

          {/* TAB: CREATE */}
          {activeTab === 'create' && (
            <div className="glass-card">
              <div className="card-header">
                <h2 className="card-title">Deploy Instance</h2>
              </div>
              <div className="input-group">
                <label className="input-label">SERVER NAME / OWNER</label>
                <input type="text" className="input-field" placeholder="Ex: RayyProject"
                  value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="input-group">
                <label className="input-label">RESOURCE ALLOCATION</label>
                <div className="plan-grid">
                  {Object.keys(PLANS).map((key) => (
                    <div key={key} className={`plan-item ${selectedPlan === key ? 'selected' : ''}`} onClick={() => setSelectedPlan(key)}>
                      <span className="plan-title">{PLANS[key].label}</span>
                      <span className="plan-info">{PLANS[key].memory === 0 ? 'Unli' : PLANS[key].memory + ' MB'}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn-action" onClick={handleCreate} disabled={loading}>
                {loading ? 'Deploying...' : 'Deploy Server'}
              </button>
            </div>
          )}

          {/* TAB: HISTORY (LOCAL) */}
          {activeTab === 'history' && (
             <div className="glass-card">
               <div className="card-header"><h2 className="card-title">Local History</h2></div>
               <div className="server-grid">
                 {history.map((item, idx) => (
                   <div key={idx} className="server-card">
                     <div className="srv-info">
                        <h4>{item.username}</h4>
                        <p>{item.email}</p>
                        <p style={{color:'#3b82f6'}}>{item.password}</p>
                     </div>
                     <div className="srv-status" style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'5px'}}>
                        <span style={{fontSize:'0.7rem', color:'#64748b'}}>{item.date}</span>
                        <button onClick={()=>{
                           const n = history.filter((_,i)=>i!==idx); setHistory(n); localStorage.setItem('panel_history',JSON.stringify(n));
                        }} style={{background:'none', border:'none', color:'#ef4444', cursor:'pointer'}}><Trash2 size={16}/></button>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          )}
        </main>
      </div>
    </div>
  );
}
