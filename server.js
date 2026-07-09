// server.js
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;

// Внутренняя база данных игроков (в оперативной памяти)
const usersDB = {};
const CASE_PRICE = 500;

// Список красивых предметов (Подарки и Пропуски)
// Иконки упакованы в Base64 (вместо пустых ссылок), чтобы интерфейс сразу выглядел сочно!
const CASE_ITEMS = [
    { id: 1, name: "Обычный Подарок (Common Gift)", rarity: "common", chance: 50.0, price: 80, img: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23b0c3d9'><path d='M11.5 22h-7a1.5 1.5 0 0 1-1.5-1.5V10h10v12M21 10v10.5a1.5 1.5 0 0 1-1.5 1.5h-7V10H21M22 6v3H2v-3a1 1 0 0 1 1-1h6.22a3 3 0 0 1 5.56 0H21a1 1 0 0 1 1 1M9.5 5A1.5 1.5 0 1 0 11 3.5 1.5 1.5 0 0 0 9.5 5m5 0A1.5 1.5 0 1 0 16 3.5 1.5 1.5 0 0 0 14.5 5'/></svg>" },
    { id: 2, name: "Редкий Подарок (Rare Gift)", rarity: "rare", chance: 30.0, price: 250, img: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234b69ff'><path d='M11.5 22h-7a1.5 1.5 0 0 1-1.5-1.5V10h10v12M21 10v10.5a1.5 1.5 0 0 1-1.5 1.5h-7V10H21M22 6v3H2v-3a1 1 0 0 1 1-1h6.22a3 3 0 0 1 5.56 0H21a1 1 0 0 1 1 1M9.5 5A1.5 1.5 0 1 0 11 3.5 1.5 1.5 0 0 0 9.5 5m5 0A1.5 1.5 0 1 0 16 3.5 1.5 1.5 0 0 0 14.5 5'/></svg>" },
    { id: 3, name: "Бронзовый Пропуск (Bronze Pass)", rarity: "epic", chance: 14.0, price: 800, img: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%238847ff'><path d='M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2M10 18H6v-2h4v2m0-4H6v-2h4v2m0-4H6V6h4v2m8 8h-6v-2h6v2m0-4h-6v-2h6v2m0-4h-6V6h6v2'/></svg>" },
    { id: 4, name: "Золотой Пропуск (Gold Pass)", rarity: "legendary", chance: 5.5, price: 3500, img: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23d32ce6'><path d='M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2M10 18H6v-2h4v2m0-4H6v-2h4v2m0-4H6V6h4v2m8 8h-6v-2h6v2m0-4h-6v-2h6v2m0-4h-6V6h6v2'/></svg>" },
    { id: 5, name: "🔥 СУПЕР ПАТЧ БОССА 🔥", rarity: "secret", chance: 0.5, price: 20000, img: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23eb4b4b'><path d='M12 2L1 21h22L12 2zm0 4l7.5 13h-15L12 6zm-1 4v4h2v-4h-2zm0 6v2h2v-2h-2z'/></svg>" }
];

// Валидация Telegram сессии
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

function getUser(initDataStr) {
    if (!verifyTelegramData(initDataStr)) return null;
    const urlParams = new URLSearchParams(initDataStr);
    const tgUser = JSON.parse(urlParams.get('user'));
    
    if (!usersDB[tgUser.id]) {
        usersDB[tgUser.id] = { balance: 3000, username: tgUser.username || "Игрок" };
    }
    return { id: tgUser.id, ...usersDB[tgUser.id] };
}

// API эндпоинты
app.post('/api/auth', (req, res) => {
    const user = getUser(req.body.initData);
    if (!user) return res.status(401).json({ error: 'Ошибка авторизации' });
    res.json({ success: true, balance: user.balance, username: user.username });
});

app.post('/api/open-case', (req, res) => {
    const user = getUser(req.body.initData);
    if (!user) return res.status(401).json({ error: 'Ошибка сессии' });

    if (usersDB[user.id].balance < CASE_PRICE) return res.status(400).json({ error: 'Недостаточно фишек!' });
    
    usersDB[user.id].balance -= CASE_PRICE;
    const randomRoll = crypto.randomInt(0, 10000) / 100; 
    let wonItem = null; let currentBoundary = 0;

    for (const item of CASE_ITEMS) {
        currentBoundary += item.chance;
        if (randomRoll <= currentBoundary) { wonItem = item; break; }
    }
    if (!wonItem) wonItem = CASE_ITEMS[0];
    usersDB[user.id].balance += wonItem.price;

    const tapeItems = [];
    for (let i = 0; i < 40; i++) {
        if (i === 32) { tapeItems.push(wonItem); } 
        else { tapeItems.push(CASE_ITEMS[crypto.randomInt(0, CASE_ITEMS.length)]); }
    }

    res.json({ success: true, tape: tapeItems, winIndex: 32, newBalance: usersDB[user.id].balance });
});

app.post('/api/deposit-stars', (req, res) => {
    const user = getUser(req.body.initData);
    if (!user) return res.status(401).json({ error: 'Ошибка' });

    axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`, {
        chat_id: user.id,
        title: "Пополнение баланса Bonzana",
        description: "Получите +2,500 фишек на открытие паков",
        payload: `deposit_${user.id}_${Date.now()}`,
        provider_token: "", currency: "XTR",
        prices: [{ label: "2500 фишек", amount: 50 }]
    }).then(response => {
        res.json({ success: true, invoiceLink: response.data.result.invoice_link });
    }).catch(() => res.status(500).json({ error: 'Ошибка Stars API' }));
});

app.post('/api/tg-webhook', (req, res) => {
    const { pre_checkout_query, message } = req.body;
    if (pre_checkout_query) axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, { pre_checkout_query_id: pre_checkout_query.id, ok: true });
    if (message && message.successful_payment) {
        const tgUserId = message.successful_payment.invoice_payload.split('_')[1];
        if (usersDB[tgUserId]) usersDB[tgUserId].balance += 2500;
    }
    res.sendStatus(200);
});

// КРАСИВЫЙ И СТИЛЬНЫЙ ФРОНТЕНД (ИНТЕРФЕЙС)
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
        <title>Bonzana Casino App</title>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
        <style>
            :root {
                --bg-main: #0a0b10;
                --bg-card: #131520;
                --bg-accent: #1c1f32;
                --text-gold: #ffb700;
                --neon-cyan: #00f0ff;
            }
            body { 
                background: var(--bg-main); color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0; padding: 16px; overflow-x: hidden; -webkit-user-select: none;
            }
            
            /* ТОП БАР (Дизайн как на скриншотах) */
            .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
            .logo-area { display: flex; align-items: center; gap: 10px; font-weight: 900; font-size: 20px; letter-spacing: 1px; color: #fff; }
            .logo-area span { color: var(--text-gold); }
            
            .balance-container {
                display: flex; align-items: center; gap: 8px; background: var(--bg-card); 
                padding: 6px 14px; border-radius: 20px; border: 1px solid var(--bg-accent); font-weight: 700;
            }
            .balance-container span { color: var(--text-gold); }
            .btn-plus { 
                background: linear-gradient(135deg, #00c6ff, #0072ff); border: none; width: 22px; height: 22px;
                color: white; border-radius: 50%; font-weight: bold; font-size: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer;
            }

            /* ПАКИ / КЕЙСЫ КАРТОЧКА */
            .section-title { text-align: left; font-size: 14px; text-transform: uppercase; letter-spacing: 1.5px; color: #62688f; margin-bottom: 12px; font-weight: 700; }
            
            .case-banner {
                background: linear-gradient(135deg, rgba(136,71,255,0.2), rgba(19,21,32,1));
                border-radius: 16px; border: 1px solid rgba(136,71,255,0.4); padding: 16px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;
            }
            .case-banner-info { text-align: left; }
            .case-banner-title { font-size: 18px; font-weight: 800; margin-bottom: 4px; }
            .case-banner-price { font-size: 14px; color: #00f0ff; font-weight: bold; }

            /* РУЛЕТКА */
            .roulette-container {
                position: relative; width: 100%; height: 140px; background: #07080c; border-radius: 16px;
                border: 1px solid var(--bg-accent); margin: 20px 0; overflow: hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
            }
            .pointer {
                position: absolute; left: 50%; top: 0; bottom: 0; width: 3px; background: var(--text-gold);
                z-index: 10; transform: translateX(-50%); box-shadow: 0 0 10px var(--text-gold);
            }
            .tape { display: flex; position: absolute; left: 0; top: 15px; transition: transform 5s cubic-bezier(0.1, 0.8, 0.1, 1); will-change: transform; }
            
            /* КАРТОЧКИ ПРЕДМЕТОВ В ЛЕНТЕ */
            .item-card {
                min-width: 100px; max-width: 100px; height: 110px; background: var(--bg-card); margin: 0 6px;
                border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center;
                box-sizing: border-box; font-size: 10px; font-weight: bold; padding: 6px; border: 1px solid rgba(255,255,255,0.05);
            }
            .item-card img { width: 50px; height: 50px; margin-bottom: 8px; filter: drop-shadow(0 0 8px rgba(255,255,255,0.1)); }
            
            /* ЦВЕТА РЕДКОСТЕЙ И СВЕЧЕНИЕ */
            .common { border-bottom: 4px solid #b0c3d9; }
            .rare { border-bottom: 4px solid #4b69ff; }
            .epic { border-bottom: 4px solid #8847ff; }
            .legendary { border-bottom: 4px solid #d32ce6; }
            .secret { border-bottom: 4px solid #eb4b4b; animation: glow 1.5s infinite ease-in-out; }
            @keyframes glow { 0%, 100% { box-shadow: 0 0 5px rgba(235,75,75,0.3); } 50% { box-shadow: 0 0 15px rgba(235,75,75,0.7); } }

            /* КНОПКА ДЕЙСТВИЯ */
            .btn-action {
                background: linear-gradient(135deg, #ffb700, #ff7700); color: black; border: none;
                width: 100%; padding: 18px; border-radius: 16px; font-size: 16px; font-weight: 800;
                cursor: pointer; box-shadow: 0 4px 20px rgba(255,119,0,0.4); transition: transform 0.1s;
            }
            .btn-action:active { transform: scale(0.98); }
            .btn-action:disabled { background: #2a2c3d; color: #5a5d7a; box-shadow: none; }

            #result-text { font-size: 16px; font-weight: 700; height: 24px; margin-top: 15px; color: var(--neon-cyan); }
        </style>
    </head>
    <body>

        <div class="top-bar">
            <div class="logo-area">🎰 BONZANA<span>GB</span></div>
            <div class="balance-container" onclick="buyStars()">
                <span id="balance">Загрузка...</span> 🪙
                <button class="btn-plus">+</button>
            </div>
        </div>

        <div class="section-title">Текущий тираж паков</div>
        
        <div class="case-banner">
            <div class="case-banner-info">
                <div class="case-banner-title">Premium Gift Pack</div>
                <div class="case-banner-price">Стоимость: 500 🪙</div>
            </div>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="%23ffb700"><path d="M12 2L2 22h20L12 2z"/></svg>
        </div>

        <div class="roulette-container">
            <div class="pointer"></div>
            <div class="tape" id="tape"></div>
        </div>

        <div id="result-text"></div>

        <button class="btn-action" id="open-btn" onclick="openCase()" disabled>ОТКРЫТЬ ПАК ЗА 500 🪙</button>

        <script>
            const tg = window.Telegram.WebApp;
            if (tg) { tg.expand(); tg.ready(); }

            const audioSpin = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
            const audioWin = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-84.wav');
            const tape = document.getElementById('tape');

            function buildTape(items) {
                tape.innerHTML = '';
                items.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'item-card ' + item.rarity;
                    card.innerHTML = '<img src="' + item.img + '"><div>' + item.name + '</div>';
                    tape.appendChild(card);
                });
            }

            async function checkAuth() {
                try {
                    const res = await fetch('/api/auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ initData: tg.initData })
                    });
                    const data = await res.json();
                    if (data.success) {
                        document.getElementById('balance').innerText = data.balance;
                        document.getElementById('open-btn').disabled = false;
                        buildTape(Array(45).fill(${JSON.stringify(CASE_ITEMS[0])}));
                    }
                } catch(e) { document.getElementById('balance').innerText = "Ошибка"; }
            }
            checkAuth();

            async function openCase() {
                const btn = document.getElementById('open-btn');
                const resultText = document.getElementById('result-text');
                btn.disabled = true; resultText.innerText = '';
                
                tape.style.transition = 'none';
                tape.style.transform = 'translateX(0px)';

                try {
                    const res = await fetch('/api/open-case', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ initData: tg.initData })
                    });
                    const data = await res.json();
                    if (data.error) { alert(data.error); btn.disabled = false; return; }

                    buildTape(data.tape);
                    audioSpin.play();

                    setTimeout(() => {
                        tape.style.transition = 'transform 5s cubic-bezier(0.1, 0.8, 0.1, 1)';
                        // Ширина карты 100px + отступы 12px = 112px
                        const targetShift = -(data.winIndex * 112) + (window.innerWidth / 2) - 56;
                        tape.style.transform = 'translateX(' + targetShift + 'px)';
                    }, 50);

                    setTimeout(() => {
                        audioWin.play();
                        document.getElementById('balance').innerText = data.newBalance;
                        const winItem = data.tape[data.winIndex];
                        resultText.innerHTML = '🎉 Выпало: ' + winItem.name + ' (+$' + winItem.price + ')';
                        btn.disabled = false;
                    }, 5050);
                } catch(e) { alert('Ошибка сети'); btn.disabled = false; }
            }

            async function buyStars() {
                try {
                    const res = await fetch('/api/deposit-stars', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ initData: tg.initData })
                    });
                    const data = await res.json();
                    if (data.invoiceLink) {
                        tg.openInvoice(data.invoiceLink, function(status) {
                            if (status === 'paid') checkAuth();
                        });
                    }
                } catch(e) { alert('Ошибка биллинга'); }
            }
        </script>
    </body>
    </html>
    `);
});

app.listen(PORT, () => {
    console.log(`[BONZANA] Успешный запуск на порту ${PORT}`);
});
