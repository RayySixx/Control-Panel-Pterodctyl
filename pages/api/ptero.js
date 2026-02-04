import axios from 'axios';

// KONFIGURASI DEFAULT (Ganti jika ingin default egg/loc lain)
const DEFAULT_EGG = 15; // Egg ID untuk Node.js (biasanya 15 atau 16)
const DEFAULT_LOC = 1;  // Location ID default

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  const { host, key, username, plan } = req.body;

  if (!host || !key || !username || !plan) {
    return res.status(400).json({ message: 'Missing parameters' });
  }

  const cleanHost = host.endsWith('/') ? host.slice(0, -1) : host;
  
  // Header Authorization
  const config = {
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  };

  try {
    // 1. GENERATE DATA
    // Tambahkan random number biar username unik dan gak error "User exists"
    const randomTag = Math.floor(1000 + Math.random() * 9000);
    const finalUsername = username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase(); 
    const email = `${finalUsername}${randomTag}@panel.zone`;
    const password = `${finalUsername}${randomTag}!!`; // Password kuat

    // 2. CREATE USER
    const userPayload = {
      email,
      username: `${finalUsername}${randomTag}`,
      first_name: finalUsername,
      last_name: "User",
      language: "en",
      password
    };

    const userRes = await axios.post(`${cleanHost}/api/application/users`, userPayload, config);
    const userId = userRes.data.attributes.id;

    // 3. CREATE SERVER
    const serverPayload = {
      name: `${finalUsername.toUpperCase()} SERVER`,
      user: userId,
      egg: DEFAULT_EGG,
      docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
      startup: "npm start",
      environment: {
        INST: "npm",
        USER_UPLOAD: "0",
        AUTO_UPDATE: "0",
        CMD_RUN: "npm start"
      },
      limits: {
        memory: plan.memory,
        swap: 0,
        disk: plan.disk,
        io: 500,
        cpu: plan.cpu
      },
      feature_limits: { databases: 1, backups: 1, allocations: 1 },
      deploy: {
        locations: [DEFAULT_LOC],
        dedicated_ip: false,
        port_range: []
      }
    };

    await axios.post(`${cleanHost}/api/application/servers`, serverPayload, config);

    // Sukses
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
    console.error(error);
    const msg = error.response?.data?.errors?.[0]?.detail || error.message;
    return res.status(500).json({ message: msg });
  }
}
