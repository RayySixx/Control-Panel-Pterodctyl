import axios from 'axios';

const DEFAULT_EGG = 15;
const DEFAULT_LOC = 1;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { action, host, key, username, plan, identifier, signal, ptlc, directory = '/', files = [] } = req.body;

  if (!host) return res.status(400).json({ message: 'Missing parameters: Host is required' });

  const cleanHost = host.endsWith('/') ? host.slice(0, -1) : host;
  
  const configAdmin = { headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', 'Accept': 'application/json' } };
  const configClient = ptlc ? { headers: { 'Authorization': `Bearer ${ptlc}`, 'Content-Type': 'application/json', 'Accept': 'application/json' } } : null;

  try {
    // === 1. LIST SERVERS (Admin) ===
    if (action === 'list_servers') {
      const response = await axios.get(`${cleanHost}/api/application/servers?include=user,allocations&per_page=50`, configAdmin);
      return res.status(200).json({ success: true, data: response.data.data });
    }

    // === 2. CREATE SERVER (Admin) ===
    if (action === 'create_server') {
      if (!username || !plan) return res.status(400).json({ message: 'Data kurang lengkap' });
      const randomTag = Math.floor(1000 + Math.random() * 9000);
      const finalUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); 
      const email = `${finalUsername}${randomTag}@panel.zone`;
      const password = `${finalUsername}${randomTag}!!`; 

      const userPayload = { email, username: `${finalUsername}${randomTag}`, first_name: finalUsername, last_name: "User", language: "en", password };
      const userRes = await axios.post(`${cleanHost}/api/application/users`, userPayload, configAdmin);
      const userId = userRes.data.attributes.id;

      const serverPayload = {
        name: `${finalUsername.toUpperCase()} SERVER`, user: userId, egg: DEFAULT_EGG, docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
        startup: "npm start", environment: { INST: "npm", USER_UPLOAD: "0", AUTO_UPDATE: "0", CMD_RUN: "npm start" },
        limits: { memory: plan.memory, swap: 0, disk: plan.disk, io: 500, cpu: plan.cpu },
        feature_limits: { databases: 1, backups: 1, allocations: 1 }, deploy: { locations: [DEFAULT_LOC], dedicated_ip: false, port_range: [] }
      };
      await axios.post(`${cleanHost}/api/application/servers`, serverPayload, configAdmin);

      return res.status(200).json({ success: true, data: { username: userPayload.username, email, password, login: cleanHost, ram: plan.memory === 0 ? 'Unlimited' : `${plan.memory}MB` } });
    }

    // ==========================================
    // CLIENT API ACTIONS (Butuh PTLC)
    // ==========================================
    if (!configClient) return res.status(400).json({ message: 'Client API Key (PTLC) belum diatur di Settings!' });

    // === 3. POWER ACTION ===
    if (action === 'power') {
      await axios.post(`${cleanHost}/api/client/servers/${identifier}/power`, { signal }, configClient);
      return res.status(200).json({ success: true, message: `Command ${signal} sent!` });
    }

    // === 4. LIST FILES ===
    if (action === 'list_files') {
      const resData = await axios.get(`${cleanHost}/api/client/servers/${identifier}/files/list?directory=${encodeURIComponent(directory)}`, configClient);
      return res.status(200).json({ success: true, data: resData.data.data });
    }

    // === 5. DELETE FILES ===
    if (action === 'delete_files') {
      await axios.post(`${cleanHost}/api/client/servers/${identifier}/files/delete`, { root: directory, files: files }, configClient);
      return res.status(200).json({ success: true, message: 'Files deleted successfully' });
    }

    // === 6. GET STARTUP INFO ===
    if (action === 'get_startup') {
      const resData = await axios.get(`${cleanHost}/api/client/servers/${identifier}/startup`, configClient);
      return res.status(200).json({ success: true, data: resData.data.meta });
    }

  } catch (error) {
    const msg = error.response?.data?.errors?.[0]?.detail || error.message;
    return res.status(500).json({ message: msg });
  }
}
