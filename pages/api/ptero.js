import axios from 'axios';

// CONFIG DEFAULT
const DEFAULT_EGG = 15;
const DEFAULT_LOC = 1;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { action, host, key, username, plan, identifier, signal, ptlc } = req.body;

  if (!host) {
    return res.status(400).json({ message: 'Missing parameters: Host is required' });
  }

  const cleanHost = host.endsWith('/') ? host.slice(0, -1) : host;
  
  // Headers untuk Admin API (Buat nampilin list dan buat server)
  const configAdmin = {
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  };

  try {
    // === FITUR 1: LIST SERVERS ===
    if (action === 'list_servers') {
      const response = await axios.get(`${cleanHost}/api/application/servers?include=user,allocations&per_page=50`, configAdmin);
      return res.status(200).json({
        success: true,
        data: response.data.data
      });
    }

    // === FITUR BARU: CONTROL POWER SERVER ===
    if (action === 'power') {
      if (!ptlc) return res.status(400).json({ message: 'Client API Key (PTLC) belum diatur di menu Settings!' });
      
      const configClient = {
        headers: {
          'Authorization': `Bearer ${ptlc}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      };
      
      await axios.post(`${cleanHost}/api/client/servers/${identifier}/power`, { signal }, configClient);
      
      return res.status(200).json({ 
        success: true, 
        message: `Command ${signal} berhasil dikirim!` 
      });
    }

    // === FITUR 3: CREATE SERVER ===
    if (!username || !plan) return res.status(400).json({ message: 'Data kurang lengkap untuk create server' });

    const randomTag = Math.floor(1000 + Math.random() * 9000);
    const finalUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); 
    const email = `${finalUsername}${randomTag}@panel.zone`;
    const password = `${finalUsername}${randomTag}!!`; 

    // Create User
    const userPayload = {
      email, username: `${finalUsername}${randomTag}`, first_name: finalUsername, last_name: "User", language: "en", password
    };
    const userRes = await axios.post(`${cleanHost}/api/application/users`, userPayload, configAdmin);
    const userId = userRes.data.attributes.id;

    // Create Server
    const serverPayload = {
      name: `${finalUsername.toUpperCase()} SERVER`,
      user: userId,
      egg: DEFAULT_EGG,
      docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
      startup: "npm start",
      environment: { INST: "npm", USER_UPLOAD: "0", AUTO_UPDATE: "0", CMD_RUN: "npm start" },
      limits: { memory: plan.memory, swap: 0, disk: plan.disk, io: 500, cpu: plan.cpu },
      feature_limits: { databases: 1, backups: 1, allocations: 1 },
      deploy: { locations: [DEFAULT_LOC], dedicated_ip: false, port_range: [] }
    };
    await axios.post(`${cleanHost}/api/application/servers`, serverPayload, configAdmin);

    return res.status(200).json({
      success: true,
      data: {
        username: userPayload.username,
        email: email,
        password: password,
        login: cleanHost,
        ram: plan.memory === 0 ? 'Unlimited' : `${plan.memory}MB`
      }
    });

  } catch (error) {
    const msg = error.response?.data?.errors?.[0]?.detail || error.message;
    return res.status(500).json({ message: msg });
  }
}
