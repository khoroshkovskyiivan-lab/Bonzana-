// server.js
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;

const usersDB = {};
const CASE_PRICE = 500;

const CASE_ITEMS = [
    { id: 1, name: "Обычный Подарок (Common Gift)", rarity: "common", chance: 50.0, price: 80, emoji: "🎁", color: "#b0c3d9" },
    { id: 2, name: "Редкий Подарок (Rare Gift)", rarity: "rare", chance: 30.0, price: 250, emoji: "🎈", color: "#4b69ff" },
    { id: 3, name: "Бронзовый Пропуск (Bronze Pass)", rarity: "epic", chance: 14.0, price: 800, emoji: "🎫", color: "#8847ff" },
    { id: 4, name: "Золотой Пропуск (Gold Pass)", rarity: "legendary", chance: 5.5, price: 3500, emoji: "💎", color: "#d32ce6" },
    { id: 5, name: "🔮 СЕКРЕТНЫЙ МИФИЧЕСКИЙ КЕЙС 🔮", rarity: "mythic", chance: 0.5, price: 20000, emoji: "🔮", color: "#ef4444" }
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
    
    // Вытаскиваем аватарку, если её нет — ставим заглушку
    const avatar = tgUser.photo_url || "https://auto-baza.biz/images/user-empty.png";

    if (!usersDB[tgUser.id]) {
        usersDB[tgUser.id] = { 
            balance: 3000, 
            username: tgUser.username ? `@${tgUser.username}` : (tgUser.first_name || "Игрок"),
            avatar: avatar
        };
    } else {
        // Обновляем аватарку и юзернейм при каждом входе, если они изменились в TG
        usersDB[tgUser.id].avatar = avatar;
        usersDB[tgUser.id].username = tgUser.username ? `@${tgUser.username}` : (tgUser.first_name || "Игрок");
    }
    return { id: tgUser.id, ...usersDB[tgUser.id] };
}

// API Эндпоинты
app.post('/api/auth', (req, res) => {
    const user = getUser(req.body.initData);
    if (!user) return res.status(41c).json({ error: 'Ошибка авторизации' });
    res.json({ success: true, balance: user.balance, username: user.username, avatar: user.avatar, id: user.id });
});

app.post('/api/open-case', (req, res) => {
    const user = getUser(req.body.initData);
    if (!user) return res.status(401).json({ error: 'Ошибка сессии' });

    if (usersDB[user.id].balance < CASE_PRICE) return res.status(400).json({ error: 'Недостаточно звёзд!' });
    
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

// Динамическое пополнение под любую выбранную сумму Stars
app.post('/api/deposit-stars', (req, res) => {
    const user = getUser(req.body.initData);
    if (!user) return res.status(401).json({ error: 'Ошибка' });

    const starsAmount = parseInt(req.body.amount);
    if (!starsAmount || starsAmount <= 0) return res.status(400).json({ error: 'Неверная сумма пополнения' });

    axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`, {
        chat_id: user.id,
        title: `Пополнение Bonzana (${starsAmount} ⭐)`,
        description: `Зачисление +${starsAmount} звёзд на игровой игровой баланс кейсов.`,
        payload: `deposit_${user.id}_${Date.now()}_${starsAmount}`,
        provider_token: "", 
        currency: "XTR",
        prices: [{ label: "Пополнение баланса", amount: starsAmount }]
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
        const starsPaid = parseInt(payloadParts[3] || 50); // Вытаскиваем точную сумму, которая была оплачена
        
        if (usersDB[tgUserId]) {
            usersDB[tgUserId].balance += starsPaid;
        }
    }
    res.sendStatus(200);
});

// ФРОНТЕНД С ПРОФИЛЕМ И МОДАЛКОЙ ПОПОЛНЕНИЯ
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
                --bg-main: #080b12;
                --bg-card: rgba(255, 255, 255, 0.03);
                --bg-accent: rgba(255, 255, 255, 0.08);
                --text-gold: #f5b50a;
                --neon-cyan: #2d7afe;
            }
            body { 
                background: var(--bg-main); color: #fff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0; padding: 16px; overflow-x: hidden; -webkit-user-select: none;
            }
            
            /* СТРУКТУРА СТРАНИЦ */
            .page { display: none; }
            .page.active { display: block; }

            /* ТОП БАР */
            .top-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .logo-area { display: flex; align-items: center; gap: 6px; font-weight: 900; font-size: 22px; letter-spacing: 0.5px; color: #fff; }
            .logo-area span { color: var(--neon-cyan); text-shadow: 0 0 10px var(--neon-cyan); }
            
            .right-controls { display: flex; align-items: center; gap: 10px; }
            .balance-container {
                display: flex; align-items: center; gap: 8px; background: var(--bg-card); 
                padding: 8px 14px; border-radius: 16px; border: 1px solid var(--bg-accent); font-weight: 700;
                backdrop-filter: blur(10px); cursor: pointer; transition: all 0.2s; font-size: 14px;
            }
            .balance-container span { color: var(--text-gold); }
            
            /* АВАТАРКА В КРУЖОЧКЕ */
            .avatar-btn {
                width: 38px; height: 38px; border-radius: 50%; border: 2px solid var(--neon-cyan);
                background-size: cover; background-position: center; cursor: pointer;
                box-shadow: 0 0 10px rgba(45, 122, 254, 0.4); transition: transform 0.2s;
            }
            .avatar-btn:active { transform: scale(0.9); }

            /* ПРОМО-БАННЕР x100 */
            .promo-banner {
                background: linear-gradient(135deg, #4c1d95, #1e3a8a);
                border-radius: 20px; padding: 20px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;
                position: relative; overflow: hidden; border: 1px solid rgba(255,255,255,0.05);
            }
            .promo-banner::before {
                content: ''; position: absolute; inset: 0; opacity: 0.2;
                background: radial-gradient(circle at 80% 20%, var(--text-gold), transparent 50%);
            }
            .promo-info { display: flex; align-items: center; gap: 14px; position: relative; z-index: 2; }
            .promo-emoji { font-size: 44px; animation: float 3s infinite ease-in-out; }
            .promo-title { font-size: 22px; font-weight: 900; text-align: left; }
            .promo-sub { font-size: 13px; color: #cbd5e1; font-weight: 600; margin-top: 2px; text-align: left; }
            
            @keyframes float {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-6px); }
            }

            .section-title { text-align: left; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 12px; font-weight: 800; }

            /* РУЛЕТКА */
            .roulette-container {
                position: relative; width: 100%; height: 150px; background: #05070a; border-radius: 20px;
                border: 1px solid var(--bg-accent); margin: 20px 0; overflow: hidden;
            }
            .pointer-top {
                position: absolute; left: 50%; top: 0; width: 0; height: 0;
                border-l: 10px solid transparent; border-r: 10px solid transparent; border-t: 12px solid var(--neon-cyan);
                z-index: 10; transform: translateX(-50%); filter: drop-shadow(0 0 5px var(--neon-cyan));
            }
            .pointer-bottom {
                position: absolute; left: 50%; bottom: 0; width: 0; height: 0;
                border-l: 10px solid transparent; border-r: 10px solid transparent; border-b: 12px solid var(--neon-cyan);
                z-index: 10; transform: translateX(-50%); filter: drop-shadow(0 0 5px var(--neon-cyan));
            }
            .line-center {
                position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; background: var(--neon-cyan);
                z-index: 9; transform: translateX(-50%); opacity: 0.5;
            }
            .tape { display: flex; position: absolute; left: 0; top: 15px; transition: transform 5s cubic-bezier(0.12, 0.8, 0.12, 1); will-change: transform; }
            
            .item-card {
                min-width: 110px; max-width: 110px; height: 120px; background: rgba(19, 24, 38, 0.6); margin: 0 6px;
                border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center;
                box-sizing: border-box; font-size: 11px; font-weight: bold; padding: 8px; border: 1px solid rgba(255,255,255,0.03);
                backdrop-filter: blur(5px);
            }
            .item-emoji { font-size: 38px; margin-bottom: 6px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.3)); }
            .item-name { color: #94a3b8; font-size: 10px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; width: 100%; text-align: center; }
            .item-price { color: #fff; font-size: 11px; margin-top: 4px; display: flex; align-items: center; gap: 2px; }

            /* РЕДКОСТИ ТОВАРА */
            .common { border: 1px solid rgba(176,195,217,0.2); background: radial-gradient(circle, rgba(176,195,217,0.1) 0%, transparent 80%); }
            .rare { border: 1px solid rgba(75,105,255,0.3); background: radial-gradient(circle, rgba(75,105,255,0.15) 0%, transparent 80%); }
            .epic { border: 1px solid rgba(136,71,255,0.4); background: radial-gradient(circle, rgba(136,71,255,0.2) 0%, transparent 80%); }
            .legendary { border: 1px solid rgba(211,44,230,0.5); background: radial-gradient(circle, rgba(211,44,230,0.25) 0%, transparent 80%); }
            .mythic { border: 1px solid rgba(239,68,68,0.6); background: radial-gradient(circle, rgba(239,68,68,0.3) 0%, transparent 80%); animation: pulseGlow 2s infinite; }
            
            @keyframes pulseGlow { 0%, 100% { box-shadow: inset 0 0 10px rgba(239,68,68,0.2); } 50% { box-shadow: inset 0 0 20px rgba(239,68,68,0.5); } }

            .btn-action {
                background: linear-gradient(135deg, #2d7afe, #0052d4); color: white; border: none;
                width: 100%; padding: 18px; border-radius: 18px; font-size: 16px; font-weight: 800;
                cursor: pointer; box-shadow: 0 4px 20px rgba(45,122,254,0.3); transition: transform 0.1s, opacity 0.2s;
                margin-top: 10px;
            }
            .btn-action:active { transform: scale(0.98); }
            .btn-action:disabled { background: #1e293b; color: #475569; box-shadow: none; cursor: not-allowed; }

            #result-alert { font-size: 16px; font-weight: bold; margin-top: 15px; min-height: 24px; text-align: center; color: var(--text-gold); }

            /* СТИЛИ СТРАНИЦЫ ПРОФИЛЯ */
            .btn-back {
                background: var(--bg-card); border: 1px solid var(--bg-accent); color: #fff; padding: 8px 16px;
                border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 14px; margin-bottom: 24px;
            }
            .profile-card {
                background: linear-gradient(145deg, rgba(19, 24, 38, 0.8), rgba(8, 11, 18, 0.8));
                border: 1px solid var(--bg-accent); border-radius: 24px; padding: 30px 20px; text-align: center;
                backdrop-filter: blur(10px);
            }
            .profile-avatar {
                width: 100px; height: 100px; border-radius: 50%; border: 3px solid var(--neon-cyan);
                margin: 0 auto 16px auto; background-size: cover; background-position: center;
                box-shadow: 0 0 25px rgba(45, 122, 254, 0.5);
            }
            .profile-username { font-size: 24px; font-weight: 800; color: #fff; margin-bottom: 4px; }
            .profile-id { font-size: 13px; color: #64748b; margin-bottom: 24px; font-family: monospace; }
            
            .stat-box {
                background: rgba(255,255,255,0.02); border-radius: 16px; padding: 14px;
                display: flex; justify-content: space-between; align-items: center; border: 1px solid rgba(255,255,255,0.03);
            }
            .stat-label { color: #94a3b8; font-size: 14px; font-weight: 500; }
            .stat-value { color: var(--text-gold); font-size: 18px; font-weight: 700; }

            /* ОКНО ПОПОЛНЕНИЯ (СЕТКА ТАРИФОВ) */
            .deposit-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 16px; }
            .deposit-item {
                background: var(--bg-card); border: 1px solid var(--bg-accent); border-radius: 18px;
                padding: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center;
                cursor: pointer; transition: all 0.2s;
            }
            .deposit-item:active { transform: scale(0.96); border-color: var(--neon-cyan); }
            .deposit-stars { font-size: 20px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 4px; }
            .deposit-stars span { color: var(--text-gold); }
            .deposit-action-txt { font-size: 11px; color: #64748b; margin-top: 4px; font-weight: bold; text-transform: uppercase; }
        </style>
    </head>
    <body>

        <!-- СТРАНИЦА КЕЙСОВ (ГЛАВНАЯ) -->
        <div id="cases-page" class="page active">
            <div class="top-bar">
                <div class="logo-area">🎁 BONZANA<span>Gifts</span></div>
                <div class="right-controls">
                    <div class="balance-container" onclick="showPage('deposit-page')">
                        <span class="global-balance">...</span>&nbsp;⭐
                    </div>
                    <div class="avatar-btn global-avatar" onclick="showPage('profile-page')"></div>
                </div>
            </div>

            <div class="promo-banner">
                <div class="promo-info">
                    <div class="promo-emoji">🔮</div>
                    <div>
                        <div class="promo-title">Gifts Pack x100</div>
                        <div class="promo-sub">Лимитированный тираж боевых пропусков</div>
                    </div>
                </div>
            </div>

            <div class="section-title">Испытай удачу</div>

            <div class="roulette-container">
                <div class="pointer-top"></div>
                <div class="line-center"></div>
                <div class="pointer-bottom"></div>
                <div class="tape" id="tape"></div>
            </div>

            <div id="result-alert"></div>
            <button class="btn-action" id="open-btn" onclick="openCase()" disabled>ОТКРЫТЬ ПАК ЗА 500 ⭐</button>
        </div>


        <!-- СТРАНИЦА ПРОФИЛЯ -->
        <div id="profile-page" class="page">
            <button class="btn-back" onclick="showPage('cases-page')">← Назад</button>
            
            <div class="profile-card">
                <div class="profile-avatar global-avatar"></div>
                <div class="profile-username" id="prof-username">@username</div>
                <div class="profile-id" id="prof-id">ID: 00000000</div>
                
                <div class="stat-box">
                    <div class="stat-label">Игровой баланс:</div>
                    <div class="stat-value"><span class="global-balance">0</span> ⭐</div>
                </div>

                <button class="btn-action" style="margin-top: 24px;" onclick="showPage('deposit-page')">ПОПОЛНИТЬ БАЛАНС</button>
            </div>
        </div>


        <!-- СТРАНИЦА ПОПОЛНЕНИЯ (СЕТКА СВЕЗД) -->
        <div id="deposit-page" class="page">
            <button class="btn-back" onclick="showPage('cases-page')">← К кейсам</button>
            
            <div class="section-title">Выберите сумму пополнения Stars</div>
            
            <div class="deposit-grid">
                <div class="deposit-item" onclick="buyStars(1)">
                    <div class="deposit-stars">1 <span>⭐</span></div>
                    <div class="deposit-action-txt">Купить</div>
                </div>
                <div class="deposit-item" onclick="buyStars(25)">
                    <div class="deposit-stars">25 <span>⭐</span></div>
                    <div class="deposit-action-txt">Купить</div>
                </div>
                <div class="deposit-item" onclick="buyStars(50)">
                    <div class="deposit-stars">50 <span>⭐</span></div>
                    <div class="deposit-action-txt">Купить</div>
                </div>
                <div class="deposit-item" onclick="buyStars(100)">
                    <div class="deposit-stars">100 <span>⭐</span></div>
                    <div class="deposit-action-txt">Купить</div>
                </div>
                <div class="deposit-item" onclick="buyStars(250)">
                    <div class="deposit-stars">250 <span>⭐</span></div>
                    <div class="deposit-action-txt">Купить</div>
                </div>
                <div class="deposit-item" onclick="buyStars(500)">
                    <div class="deposit-stars">500 <span>⭐</span></div>
                    <div class="deposit-action-txt">Купить</div>
                </div>
                <div class="deposit-item" onclick="buyStars(1000)">
                    <div class="deposit-stars">1000 <span>⭐</span></div>
                    <div class="deposit-action-txt">Купить</div>
                </div>
                <div class="deposit-item" onclick="buyStars(2500)">
                    <div class="deposit-stars">2500 <span>⭐</span></div>
                    <div class="deposit-action-txt">Купить</div>
                </div>
                <div class="deposit-item" onclick="buyStars(5000)">
                    <div class="deposit-stars">5000 <span>⭐</span></div>
                    <div class="deposit-action-txt">Купить</div>
                </div>
                <div class="deposit-item" onclick="buyStars(10000)">
                    <div class="deposit-stars">10000 <span>⭐</span></div>
                    <div class="deposit-action-txt">Купить</div>
                </div>
            </div>
        </div>

        <script>
            const tg = window.Telegram.WebApp;
            if (tg) { tg.expand(); tg.ready(); }

            const audioSpin = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
            const audioWin = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-84.wav');
            const tape = document.getElementById('tape');

            function showPage(pageId) {
                document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
                document.getElementById(pageId).classList.add('active');
            }

            function buildTape(items) {
                tape.innerHTML = '';
                items.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'item-card ' + item.rarity;
                    card.innerHTML = '<div class="item-emoji">' + item.emoji + '</div>' +
                                     '<div class="item-name">' + item.name + '</div>' +
                                     '<div class="item-price">' + item.price + ' ⭐</div>';
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
                        // Раскидываем баланс во все блоки на страницах
                        document.querySelectorAll('.global-balance').forEach(el => el.innerText = data.balance.toLocaleString());
                        
                        // Ставим аватарку во все кружочки
                        document.querySelectorAll('.global-avatar').forEach(el => {
                            el.style.backgroundImage = "url('" + data.avatar + "')";
                        });

                        // Заполняем текстовые поля профиля
                        document.getElementById('prof-username').innerText = data.username;
                        document.getElementById('prof-id').innerText = "ID: " + data.id;

                        document.getElementById('open-btn').disabled = false;
                        buildTape(Array(45).fill(${JSON.stringify(CASE_ITEMS[0])}));
                    }
                } catch(e) { console.log(e); }
            }
            checkAuth();

            async function openCase() {
                const btn = document.getElementById('open-btn');
                const alertText = document.getElementById('result-alert');
                btn.disabled = true; alertText.innerText = '';
                
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
                        tape.style.transition = 'transform 5s cubic-bezier(0.12, 0.8, 0.12, 1)';
                        const targetShift = -(data.winIndex * 122) + (window.innerWidth / 2) - 61;
                        tape.style.transform = 'translateX(' + targetShift + 'px)';
                    }, 50);

                    setTimeout(() => {
                        audioWin.play();
                        document.querySelectorAll('.global-balance').forEach(el => el.innerText = data.newBalance.toLocaleString());
                        const winItem = data.tape[data.winIndex];
                        alertText.innerHTML = '🎉 Вы выиграли: <span style="color:' + winItem.color + '">' + winItem.name + '</span> (+$' + winItem.price + ')';
                        btn.disabled = false;
                    }, 5050);
                } catch(e) { alert('Ошибка соединения'); btn.disabled = false; }
            }

            async function buyStars(amountStars) {
                try {
                    const res = await fetch('/api/deposit-stars', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ initData: tg.initData, amount: amountStars })
                    });
                    const data = await res.json();
                    if (data.invoiceLink) {
                        tg.openInvoice(data.invoiceLink, function(status) {
                            if (status === 'paid') {
                                checkAuth();
                                showPage('cases-page');
                            }
                        });
                    }
                } catch(e) { alert('Ошибка создания счета'); }
            }
        </script>
    </body>
    </html>
    `);
});

app.listen(PORT, () => console.log(`[BONZANA] Сервер успешно запущен на порту ${PORT}`));
