const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());

// Отдаем собранный фронтенд из статики (когда сделаешь npm run build)
app.use(express.static(path.join(__dirname, 'dist')));

const BOT_TOKEN = process.env.BOT_TOKEN;
const usersDB = {};

function verifyTelegramData(initData) {
    if (!initData) return false;
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    const dataCheckString = Array.from(urlParams.entries()).map(([key, value]) => `${key}=${value}`).sort().join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    return calculatedHash === hash;
}

app.post('/api/auth', (req, res) => {
    if (!verifyTelegramData(req.body.initData)) return res.status(401).json({ error: 'Auth failed' });
    const urlParams = new URLSearchParams(req.body.initData);
    const tgUser = JSON.parse(urlParams.get('user'));
    
    if (!usersDB[tgUser.id]) {
        usersDB[tgUser.id] = { balance: 42, tickets: 10 };
    }
    res.json({
        success: true,
        id: tgUser.id,
        username: tgUser.username || tgUser.first_name || 'Player',
        avatar: tgUser.photo_url || '',
        balance: usersDB[tgUser.id].balance,
        tickets: usersDB[tgUser.id].tickets
    });
});

// Используем регулярное выражение напрямую — это 100% рабочее решение для Express 5
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(3000, () => console.log('API запущен на порту 3000'));
