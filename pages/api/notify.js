// pages/api/notify.js
import axios from 'axios';

const BOT_TOKEN = '7326623466:AAFKdUTahzRetWMjhPli4L4v6RLFajm-8Uc';
const CHAT_ID = '6315300476';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { domain, ip } = req.body;
  const date = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

  // Pesan yang dikirim ke Telegram
  const message = `
🔔 <b>NEW CONFIGURATION SAVED</b>

👤 <b>User IP:</b> <code>${ip || 'Unknown'}</code>
🌐 <b>Domain:</b> <code>${domain}</code>
📅 <b>Time:</b> ${date}

<i>User baru saja menyimpan konfigurasi panel di web.</i>
`;

  try {
    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Telegram Error:", error);
    res.status(500).json({ success: false });
  }
}
