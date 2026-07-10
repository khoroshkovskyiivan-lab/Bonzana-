// server.js
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;

// Эмуляция базы данных
const usersDB = {};

// Данные для лидерборда (как на скриншотах)
const REGIONAL_LEADERBOARD = [
    { name: "Cuddly Zebra", xp: "164 398 xp", rank: "🥇" },
    { name: "Funny Kitten", xp: "99 873 xp", rank: "🥈" },
    { name: "Hardy Rabbit", xp: "91 175 xp", rank: "🥉" },
    { name: "Fluffy Ibex", xp: "41 475 xp", rank: "#4" },
    { name: "Brave Python", xp: "35 050 xp", rank: "#5" },
    { name: "Hardy Wombat", xp: "30 928 xp", rank: "#6" }
];

const GLOBAL_LEADERBOARD = [
    { name: "Groovy Python", xp: "310 938 xp", rank: "🥇" },
    { name: "Cuddly Zebra", xp: "164 398 xp", rank: "🥈" },
    { name: "Calm Shrimp", xp: "157 951 xp", rank: "🥉" },
    { name: "@QWX_YT", xp: "155 360 xp", rank: "#4" },
    { name: "@korallxd", xp: "151 241 xp", rank: "#5" },
    { name: "Fierce Quokka", xp: "142 575 xp", rank: "#6" }
];

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
    
    const avatar = tgUser.photo_url || "";
    const username = tgUser.username ? `${tgUser.username}` : (tgUser.first_name || "ukrop");

    if (!usersDB[tgUser.id]) {
        usersDB[tgUser.id] = { 
            balance: 42, // Баланс со скрина
            tickets: 10,
            username: username,
            avatar: avatar
        };
    }
    return { id: tgUser.id, ...usersDB[tgUser.id] };
}

// API
app.post('/api/auth', (req, res) => {
    const user = getUser(req.body.initData);
    if (!user) return res.status(401).json({ error: 'Auth error' });
    res.json({ success: true, ...user });
});

app.post('/api/deposit-stars', (req, res) => {
    const user = getUser(req.body.initData);
    if (!user) return res.status(401).json({ error: 'Error' });

    const starsAmount = parseInt(req.body.amount);
    if (!starsAmount || starsAmount <= 0) return res.status(400).json({ error: 'Неверная сумма' });

    axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`, {
        chat_id: user.id,
        title: `Пополнение баланса (${starsAmount} ⭐)`,
        description: `Покупка игровых звёзд на баланс Gifts Battle.`,
        payload: `deposit_${user.id}_${Date.now()}_${starsAmount}`,
        provider_token: "", 
        currency: "XTR",
        prices: [{ label: "Stars", amount: starsAmount }]
    }).then(response => {
        res.json({ success: true, invoiceLink: response.data.result.invoice_link });
    }).catch(() => res.status(500).json({ error: 'Ошибка Stars API' }));
});

app.post('/api/tg-webhook', (req, res) => {
    const { pre_checkout_query, message } = req.body;
    if (pre_checkout_query) axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, { pre_checkout_query_id: pre_checkout_query.id, ok: true });
    if (message && message.successful_payment) {
        const payloadParts = message.successful_payment.invoice_payload.split('_');
        const tgUserId = payloadParts[1];
        const starsPaid = parseInt(payloadParts[3]);
        if (usersDB[tgUserId]) usersDB[tgUserId].balance += starsPaid;
    }
    res.sendStatus(200);
});

// КРАСИВЫЙ ФРОНТЕНД (КОПИЯ ИНТЕРФЕЙСА)
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover">
        <title>Gifts Battle</title>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
        <style>
            :root {
                --bg-main: #090c14;
                --bg-card: #131824;
                --bg-input: #1a2032;
                --accent-blue: #2463eb;
                --text-muted: #8e99b3;
                --gold: #fbc02d;
            }
            body { 
                background: var(--bg-main); color: #fff; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                margin: 0; padding: 0; overflow-x: hidden; -webkit-user-select: none;
            }
            
            /* ХЕДЕР */
            .header {
                display: flex; justify-content: space-between; align-items: center;
                padding: 14px 16px; position: sticky; top: 0; background: var(--bg-main); z-index: 90;
            }
            .header-left { display: flex; align-items: center; gap: 14px; }
            .burger-btn { display: flex; flex-direction: column; gap: 5px; cursor: pointer; padding: 4px; }
            .burger-btn span { width: 20px; height: 2px; background: #fff; border-radius: 2px; }
            .logo-text { font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 4px; }
            
            .header-right { display: flex; align-items: center; gap: 10px; }
            .pill-balance {
                display: flex; align-items: center; gap: 6px; background: #171d2e;
                padding: 6px 12px; border-radius: 50px; font-weight: 700; font-size: 14px; cursor: pointer;
            }
            .plus-circle {
                width: 18px; height: 18px; background: var(--accent-blue); border-radius: 50%;
                display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900;
            }
            .user-avatar-btn {
                width: 34px; height: 34px; border-radius: 10px;
                background: linear-gradient(135deg, #5175ff, #7e51ff);
                display: flex; align-items: center; justify-content: center;
                font-weight: 700; font-size: 15px; text-transform: uppercase; overflow: hidden;
            }
            .user-avatar-btn img { width: 100%; height: 100%; object-fit: cover; }

            /* БОКОВАЯ ШТОРКА (МЕНЮ) */
            .drawer {
                position: fixed; top: 0; bottom: 0; left: -100%; width: 100%; z-index: 200;
                transition: left 0.3s cubic-bezier(0.1, 0.8, 0.1, 1);
            }
            .drawer.open { left: 0; }
            .drawer-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); }
            .drawer-content {
                position: absolute; top: 0; bottom: 0; left: 0; width: 280px;
                background: #0f1320; padding: 24px 16px; box-sizing: border-box; display: flex; flex-direction: column;
            }
            .drawer-profile { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
            .drawer-avatar {
                width: 48px; height: 48px; border-radius: 50%; background: #4361ee;
                display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 18px;
            }
            .drawer-name { font-size: 18px; font-weight: 700; }
            .drawer-id { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
            
            .drawer-card { background: #161c2c; border-radius: 16px; padding: 14px; margin-bottom: 24px; }
            .drawer-card-title { font-size: 13px; color: var(--text-muted); margin-bottom: 8px; }
            .drawer-balances { display: flex; gap: 16px; font-weight: 700; font-size: 15px; margin-bottom: 12px; }
            .drawer-btn {
                width: 100%; background: var(--accent-blue); color: #fff; border: none;
                padding: 10px; border-radius: 10px; font-weight: 700; font-size: 14px; cursor: pointer;
            }
            .drawer-links { display: flex; flex-direction: column; gap: 16px; }
            .drawer-link {
                background: none; border: none; color: #fff; text-align: left;
                font-size: 15px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 12px;
            }
            .drawer-footer { margin-top: auto; color: #10b981; font-weight: 700; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; }

            /* ТАБЫ (ЭКРАНЫ) */
            .tab-page { display: none; padding: 0 16px 100px 16px; }
            .tab-page.active { display: block; }
            .page-title { font-size: 20px; font-weight: 800; margin: 16px 0; text-transform: uppercase; letter-spacing: 0.5px; }

            /* ЭКРАН КЕЙСОВ */
            .banner-promo {
                background: linear-gradient(100deg, #3b82f6, #8b5cf6); border-radius: 16px;
                padding: 16px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;
            }
            .banner-title { font-size: 16px; font-weight: 700; }
            .banner-sub { font-size: 12px; color: rgba(255,255,255,0.8); margin-top: 4px; display: flex; align-items: center; gap: 4px; }
            .banner-timer { background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 8px; font-size: 12px; font-weight: 600; margin-top: 10px; display: inline-block; }
            
            .cases-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
            .pack-card {
                background: var(--bg-card); border-radius: 20px; padding: 16px; text-align: center;
                display: flex; flex-direction: column; align-items: center; justify-content: space-between; min-height: 230px;
            }
            .pack-img-box {
                width: 110px; height: 130px; background-size: contain; background-repeat: no-repeat;
                background-position: center; margin-bottom: 10px;
            }
            .pack-card:nth-child(1) .pack-img-box { background-image: url('https://img.icons8.com/isometric/512/000000/package.png'); filter: hue-rotate(320deg); }
            .pack-card:nth-child(2) .pack-img-box { background-image: url('https://img.icons8.com/isometric/512/000000/package.png'); filter: hue-rotate(60deg); }
            
            .pack-title { font-size: 14px; font-weight: 700; margin-bottom: 10px; }
            .pack-price-btn {
                background: #1c2335; border-radius: 10px; width: 100%; padding: 8px 0;
                font-weight: 700; font-size: 14px; display: flex; align-items: center; justify-content: center; gap: 4px;
            }

            /* ЭКРАН КОНКУРСОВ */
            .contest-card { background: var(--bg-card); border-radius: 20px; padding: 16px; margin-bottom: 16px; }
            .contest-header { display: flex; justify-content: space-between; font-size: 14px; font-weight: 700; margin-bottom: 12px; }
            .contest-body { background: #0b0f19; border-radius: 14px; padding: 30px; text-align: center; margin-bottom: 14px; }
            .contest-gift-ico { font-size: 60px; filter: drop-shadow(0 0 15px rgba(255,165,0,0.4)); }
            .contest-meta { display: flex; justify-content: center; gap: 10px; font-size: 14px; font-weight: 700; margin-top: 14px; }
            .contest-btn {
                width: 100%; background: var(--accent-blue); border: none; padding: 14px;
                color: #fff; font-weight: 700; font-size: 15px; border-radius: 12px; cursor: pointer;
            }

            /* ЭКРАН ЛИДЕРБОРДА */
            .leader-toggle {
                display: flex; background: #131724; padding: 4px; border-radius: 12px; margin-bottom: 16px;
            }
            .toggle-btn {
                flex: 1; background: none; border: none; color: var(--text-muted); padding: 10px 0;
                font-weight: 700; font-size: 14px; border-radius: 10px; cursor: pointer;
            }
            .toggle-btn.active { background: #1c2235; color: #fff; }
            
            .leader-list { display: flex; flex-direction: column; gap: 8px; }
            .leader-row {
                background: var(--bg-card); padding: 12px 16px; border-radius: 14px;
                display: flex; justify-content: space-between; align-items: center;
            }
            .leader-user { display: flex; align-items: center; gap: 12px; }
            .leader-avatar-circle { width: 34px; height: 34px; border-radius: 50%; background: #2563eb; font-weight: 700; display: flex; align-items: center; justify-content: center; }
            .leader-name { font-size: 14px; font-weight: 600; }
            .leader-xp { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
            .leader-rank { font-weight: 700; font-size: 14px; }

            /* ОКНО ПОПОЛНЕНИЯ (СЕТКА ТАРИФОВ) */
            .deposit-container { display: none; padding: 16px; }
            .deposit-container.active { display: block; }
            .back-nav-btn { background: #131824; border: none; color: #fff; padding: 8px 14px; border-radius: 10px; font-weight: 600; margin-bottom: 16px; cursor: pointer; }
            .grid-stars { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 16px; }
            .star-card {
                background: var(--bg-card); border-radius: 16px; padding: 18px; text-align: center; cursor: pointer; border: 1px solid transparent;
            }
            .star-card:active { border-color: var(--accent-blue); transform: scale(0.97); }
            .star-amount { font-size: 18px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 4px; }
            .star-buy-lbl { font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; margin-top: 4px; }

            /* НИЖНИЙ ТАБ-БАР */
            .tabbar {
                position: fixed; bottom: 0; left: 0; right: 0; height: 74px;
                background: #0b0f19; border-top: 1px solid #1a2235;
                display: flex; justify-content: space-around; align-items: center; z-index: 100;
                padding-bottom: env(safe-area-inset-bottom);
            }
            .tab-btn {
                background: none; border: none; color: var(--text-muted);
                display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 10px; font-weight: 600; flex: 1; cursor: pointer;
            }
            .tab-btn.active { color: #fff; }
            .tab-btn svg { width: 22px; height: 22px; fill: currentColor; }
            
            .center-btn-box {
                background: linear-gradient(135deg, #2463eb, #1d4ed8); width: 48px; height: 48px;
                border-radius: 50%; display: flex; align-items: center; justify-content: center;
                margin-top: -24px; box-shadow: 0 4px 14px rgba(36, 99, 235, 0.4); color: #fff !important;
            }
            .center-btn-box svg { fill: #fff; }

            /* ПЛЕЙСХОЛДЕР ДЛЯ ПУСТЫХ СТРАНИЦ */
            .empty-state { text-align: center; padding: 60px 20px; color: var(--text-muted); }
            .empty-state-ico { font-size: 50px; margin-bottom: 10px; }
        </style>
    </head>
    <body>

        <div id="app-view">
            <header class="header">
                <div class="header-left">
                    <div class="burger-btn" onclick="toggleDrawer(true)">
                        <span></span><span></span><span></span>
                    </div>
                    <div class="logo-text">🐸 GB</div>
                </div>
                <div class="header-right">
                    <div class="pill-balance" onclick="openDepositView()">
                        <span>⭐</span> <span id="top-balance">42</span> <div class="plus-circle">+</div>
                    </div>
                    <div class="user-avatar-btn" id="top-avatar">U</div>
                </div>
            </header>

            <div id="tab-cases" class="tab-page active">
                <div class="banner-promo">
                    <div>
                        <div class="banner-title">Gifts x100</div>
                        <div class="banner-sub">💎 0,25</div>
                        <div class="banner-timer">⏱️ 12 дней 17:29:13</div>
                    </div>
                    <div style="font-size: 50px;">🎁</div>
                </div>
                <div class="page-title">Паки с гифтами</div>
                <div class="cases-grid">
                    <div class="pack-card" onclick="alert('Открытие кейса Стандартный за 300 ⭐')">
                        <div class="pack-img-box"></div>
                        <div class="pack-title">Стандартный</div>
                        <div class="pack-price-btn">⭐ 300</div>
                    </div>
                    <div class="pack-card" onclick="alert('Открытие кейса Ценный за 800 ⭐')">
                        <div class="pack-img-box"></div>
                        <div class="pack-title">Ценный</div>
                        <div class="pack-price-btn">⭐ 800</div>
                    </div>
                </div>
            </div>

            <div id="tab-contests" class="tab-page">
                <div class="page-title">Бесплатные конкурсы</div>
                <div class="contest-card">
                    <div class="contest-header">
                        <span>Gifts x100</span>
                        <span style="color: var(--gold);">⏱️ 12 дней 17:24:43</span>
                    </div>
                    <div class="contest-body">
                        <div class="contest-gift-ico">🎁</div>
                        <div class="contest-meta">
                            <span style="color:#22c55e;">💎 0.25</span> / <span style="color:var(--gold);">⭐ 25</span>
                        </div>
                        <div style="color:var(--text-muted); font-size:12px; margin-top:6px;">Участники: 692</div>
                    </div>
                    <button class="contest-btn" onclick="alert('Вы успешно приняли участие!')">Участвовать</button>
                </div>
            </div>

            <div id="tab-leaderboard" class="tab-page">
                <div class="page-title" style="text-align:center;">Таблица лидеров</div>
                <p style="text-align:center; color:var(--text-muted); font-size:13px; margin-bottom:20px;">Тут ви можете побачити найактивніших гравців</p>
                
                <div class="leader-toggle">
                    <button id="btn-reg" class="toggle-btn active" onclick="switchLeaderboard('regional')">Регіональний</button>
                    <button id="btn-glob" class="toggle-btn" onclick="switchLeaderboard('global')">Глобальний</button>
                </div>

                <div class="leader-list" id="leaderbox"></div>
            </div>

            <div id="tab-upgrade" class="tab-page">
                <div class="empty-state">
                    <div class="empty-state-ico">▲</div>
                    <h3>Апгрейд предметов</h3>
                    <p>Экран апгрейда в процессе синхронизации.</p>
                </div>
            </div>
            <div id="tab-crafts" class="tab-page">
                <div class="empty-state">
                    <div class="empty-state-ico">🎯</div>
                    <h3>Крафты предметов</h3>
                    <p>Создавайте ценные гифты из обычных предметов.</p>
                </div>
            </div>

            <nav class="tabbar">
                <button class="tab-btn" onclick="switchTab('upgrade', this)">
                    <svg viewBox="0 0 24 24"><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/></svg>
                    <span>Апгрейд</span>
                </button>
                <button class="tab-btn" onclick="switchTab('crafts', this)">
                    <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L11 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.53c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                    <span>Крафты</span>
                </button>
                <button class="tab-btn active" onclick="switchTab('cases', this)">
                    <div class="center-btn-box">
                        <svg viewBox="0 0 24 24"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/></svg>
                    </div>
                    <span style="margin-top:28px;">Кейсы</span>
                </button>
                <button class="tab-btn" onclick="switchTab('contests', this)">
                    <svg viewBox="0 0 24 24"><path d="M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.65-.5-.65C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h16v6z"/></svg>
                    <span>Конкурсы</span>
                </button>
                <button class="tab-btn" onclick="switchTab('leaderboard', this)">
                    <svg viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
                    <span>Друзья</span>
                </button>
            </nav>
        </div>

        <div id="drawer-view" class="drawer">
            <div class="drawer-overlay" onclick="toggleDrawer(false)"></div>
            <div class="drawer-content">
                <div class="drawer-profile">
                    <div class="drawer-avatar" id="draw-avatar-lbl">U</div>
                    <div>
                        <div class="drawer-name" id="draw-username">ukrop</div>
                        <div class="drawer-id" id="draw-id">ID: 7207936626</div>
                    </div>
                </div>
                <div class="drawer-card">
                    <div class="drawer-card-title">Мой баланс</div>
                    <div class="drawer-balances">
                        <div>⭐ <span class="user-stars-txt">42</span></div>
                        <div style="color: #cbd5e1;">🎟️ <span id="draw-tickets">10</span></div>
                    </div>
                    <button class="drawer-btn" onclick="toggleDrawer(false); openDepositView();">Пополнить</button>
                </div>
                <div class="drawer-links">
                    <button class="drawer-link" onclick="toggleDrawer(false); switchTab('leaderboard');">👤 Мой профиль</button>
                    <button class="drawer-link" onclick="alert('Раздел в разработке')">🔄 Live-трейды</button>
                    <button class="drawer-link" onclick="toggleDrawer(false); openDepositView();">⭐ Купить Stars</button>
                    <button class="drawer-link" onclick="toggleDrawer(false); switchTab('leaderboard');">🏆 Лидерборд</button>
                </div>
                <div class="drawer-footer">
                    🎧 Поддержка
                </div>
            </div>
        </div>

        <div id="deposit-view" class="deposit-container">
            <button class="back-nav-btn" onclick="closeDepositView()">‹ Назад</button>
            <div class="page-title" style="margin-top:0;">Пополнение баланса</div>
            
            <div style="background: #171d2e; padding:12px; border-radius:12px; font-size:14px; font-weight:700; margin-bottom:16px;">
                ⭐ Выбран метод: Telegram Stars
            </div>

            <div class="grid-stars">
                <div class="star-card" onclick="payStars(1)"><div class="star-amount">1 <span>⭐</span></div><div class="star-buy-lbl">Купить</div></div>
                <div class="star-card" onclick="payStars(25)"><div class="star-amount">25 <span>⭐</span></div><div class="star-buy-lbl">Купить</div></div>
                <div class="star-card" onclick="payStars(50)"><div class="star-amount">50 <span>⭐</span></div><div class="star-buy-lbl">Купить</div></div>
                <div class="star-card" onclick="payStars(100)"><div class="star-amount">100 <span>⭐</span></div><div class="star-buy-lbl">Купить</div></div>
                <div class="star-card" onclick="payStars(250)"><div class="star-amount">250 <span>⭐</span></div><div class="star-buy-lbl">Купить</div></div>
                <div class="star-card" onclick="payStars(500)"><div class="star-amount">500 <span>⭐</span></div><div class="star-buy-lbl">Купить</div></div>
                <div class="star-card" onclick="payStars(1000)"><div class="star-amount">1000 <span>⭐</span></div><div class="star-buy-lbl">Купить</div></div>
                <div class="star-card" onclick="payStars(2500)"><div class="star-amount">2500 <span>⭐</span></div><div class="star-buy-lbl">Купить</div></div>
                <div class="star-card" onclick="payStars(5000)"><div class="star-amount">5000 <span>⭐</span></div><div class="star-buy-lbl">Купить</div></div>
                <div class="star-card" onclick="payStars(10000)"><div class="star-amount">10000 <span>⭐</span></div><div class="star-buy-lbl">Купить</div></div>
            </div>
        </div>

        <script>
            const tg = window.Telegram.WebApp;
            if (tg) { tg.expand(); tg.ready(); }

            const regionalData = ${JSON.stringify(REGIONAL_LEADERBOARD)};
            const globalData = ${JSON.stringify(GLOBAL_LEADERBOARD)};

            function toggleDrawer(open) {
                const drawer = document.getElementById('drawer-view');
                if (open) drawer.classList.add('open');
                else drawer.classList.remove('open');
            }

            function switchTab(tabId, btnElement) {
                document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
                document.getElementById('tab-' + tabId).classList.add('active');
                
                if(btnElement) {
                    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                    btnElement.classList.add('active');
                }
                closeDepositView();
            }

            function openDepositView() {
                document.getElementById('app-view').style.display = 'none';
                document.getElementById('deposit-view').classList.add('active');
            }

            function closeDepositView() {
                document.getElementById('app-view').style.display = 'block';
                document.getElementById('deposit-view').classList.remove('active');
            }

            function renderLeaderboard(data) {
                const box = document.getElementById('leaderbox');
                box.innerHTML = '';
                data.forEach(item => {
                    const row = document.createElement('div');
                    row.className = 'leader-row';
                    row.innerHTML = \`
                        <div class="leader-user">
                            <div class="leader-avatar-circle">\${item.name[0]}</div>
                            <div>
                                <div class="leader-name">\${item.name}</div>
                                <div class="leader-xp">\${item.xp}</div>
                            </div>
                        </div>
                        <div class="leader-rank">\${item.rank}</div>
                    \`;
                    box.appendChild(row);
                });
            }

            function switchLeaderboard(type) {
                document.getElementById('btn-reg').classList.remove('active');
                document.getElementById('btn-glob').classList.remove('active');
                if (type === 'regional') {
                    document.getElementById('btn-reg').classList.add('active');
                    renderLeaderboard(regionalData);
                } else {
                    document.getElementById('btn-glob').classList.add('active');
                    renderLeaderboard(globalData);
                }
            }

            // Инициализация данных юзера
            async function initUser() {
                try {
                    const res = await fetch('/api/auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ initData: tg.initData })
                    });
                    const data = await res.json();
                    if (data.success) {
                        document.getElementById('top-balance').innerText = data.balance;
                        document.querySelectorAll('.user-stars-txt').forEach(el => el.innerText = data.balance);
                        document.getElementById('draw-tickets').innerText = data.tickets;
                        document.getElementById('draw-username').innerText = data.username;
                        document.getElementById('draw-id').innerText = "ID: " + data.id;

                        const avatarBtn = document.getElementById('top-avatar');
                        const drawAvatar = document.getElementById('draw-avatar-lbl');
                        if (data.avatar) {
                            avatarBtn.innerHTML = \`<img src="\${data.avatar}"/>\`;
                            drawAvatar.innerHTML = \`<img src="\${data.avatar}"/>\`;
                        } else {
                            avatarBtn.innerText = data.username[0].toUpperCase();
                            drawAvatar.innerText = data.username[0].toUpperCase();
                        }
                    }
                } catch (e) { console.error(e); }
            }

            async function payStars(amount) {
                try {
                    const res = await fetch('/api/deposit-stars', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ initData: tg.initData, amount: amount })
                    });
                    const data = await res.json();
                    if (data.invoiceLink) {
                        tg.openInvoice(data.invoiceLink, function(status) {
                            if (status === 'paid') {
                                initUser();
                                closeDepositView();
                            }
                        });
                    }
                } catch(e) { alert('Ошибка при создании счета'); }
            }

            // Рендерим стартовый лидерборд и грузим юзера
            renderLeaderboard(regionalData);
            initUser();
        </script>
    </body>
    </html>
    `);
});

app.listen(PORT, () => console.log(`[GIFTS BATTLE] Сервер успешно запущен на порту ${PORT}`));
