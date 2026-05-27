/**
 * Романтичный бэкенд — server.js
 */

const express  = require('express');
const cors     = require('cors');
const fs       = require('fs');
const path     = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;
const DB   = path.join(__dirname, 'responses.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'date.html'));
});

// API: receive choice
app.post('/api/submit', (req, res) => {
  const { chosen_date, sent_at, user_agent } = req.body;
  if (!chosen_date) return res.status(400).json({ error: 'No date provided' });

  const record = {
    id: Date.now(),
    chosen_date,
    sent_at: sent_at || new Date().toISOString(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    user_agent: user_agent || req.headers['user-agent']
  };

  const data = readDB();
  data.push(record);
  writeDB(data);

  console.log(`💌 Новый ответ: ${chosen_date}`);
  res.json({ ok: true });
});

// Helpers
function readDB() {
  if (!fs.existsSync(DB)) return [];
  try { return JSON.parse(fs.readFileSync(DB, 'utf-8')); }
  catch { return []; }
}

function writeDB(data) {
  fs.writeFileSync(DB, JSON.stringify(data, null, 2), 'utf-8');
}

// Admin page
app.get('/admin', (req, res) => {
  const entries = readDB();
  // ... (остальной код admin страницы остаётся без изменений)
  const rows = entries.length === 0
    ? `<tr><td colspan="4" class="empty">Пока никто не выбрал дату 🥲</td></tr>`
    : entries.map((e, i) => `
        <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
          <td>${i + 1}</td>
          <td>📅 <strong>${e.chosen_date}</strong></td>
          <td>${new Date(e.sent_at).toLocaleString('ru-RU')}</td>
          <td class="ip">${e.ip || '—'}</td>
        </tr>`).join('');

  res.send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Admin — Ответы на свидание</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap" rel="stylesheet"/>
  <style>
    body { font-family: 'Nunito', sans-serif; background: #fdf6ee; color: #3d2b2b; margin: 0; padding: 2rem; }
    h1 { font-size: 2rem; color: #c94560; margin-bottom: 0.3rem; }
    p.sub { color: #9e7e7e; margin-bottom: 2rem; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 1rem; overflow: hidden; box-shadow: 0 4px 24px rgba(232,99,122,0.12); }
    th { background: #e8637a; color: #fff; padding: 1rem; text-align: left; }
    td { padding: 0.85rem 1rem; }
    tr.even td { background: #fff8f9; }
    tr.odd  td { background: #fff; }
    .empty { text-align: center; color: #9e7e7e; padding: 2rem; }
    .ip { font-size: 0.8rem; color: #bbb; }
  </style>
</head>
<body>
  <h1>💌 Ответы на приглашение</h1>
  <p class="sub">Здесь отображаются все выборы даты</p>
  <table>
    <thead><tr><th>#</th><th>Выбранная дата</th><th>Время отправки</th><th>IP</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p style="margin-top:1rem; font-weight:700; color:#7ba37e">Всего ответов: ${entries.length}</p>
  <a href="/admin" style="display:inline-block;margin-top:1rem;background:#e8637a;color:white;padding:0.7rem 1.5rem;border-radius:999px;text-decoration:none">🔄 Обновить</a>
</body>
</html>`);
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════╗
║  💕 Сервер запущен на :${PORT}       ║
║  🌐 Сайт:  http://localhost:${PORT}  ║
║  🔐 Admin: http://localhost:${PORT}/admin  ║
╚═══════════════════════════════════╝
  `);
});