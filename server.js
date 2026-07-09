// server.js
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;

// НАСТОЯЩАЯ БАЗА ДАННЫХ ИГРОКОВ (в памяти сервера)
// Структура: { "TELEGRAM_ID": { balance: 2500, username: "alex" } }
const usersDB = {};

const CASE_PRICE = 500;
const CASE_ITEMS = [
    { id: 1, name: "Common NFT", rarity: "common", chance: 50.0, price: 50, img: "https://cdn-icons-png.flaticon.com/128/9722/9722019.png" },
    { id: 2, name: "Rare NFT", rarity: "rare", chance: 30.0, price: 150, img: "https://cdn-icons-png.flaticon.com/128/9722/9722075.png" },
    { id: 3, name: "Epic NFT", rarity: "epic", chance: 14.0, price: 600, img: "https://cdn-icons-png.flaticon.com/128/9721/9721949.png" },
    { id: 4, name: "Legendary NFT", rarity: "legendary", chance: 5.5, price: 2500, img: "https://cdn-icons-png.flaticon.com/128/9722/9722037.png" },
    { id: 5, name: "SECRET TON KNIFE", rarity: "secret", chance: 0.5, price: 15000, img: "https://cdn-icons-png.flaticon.com/128/2991/2991404.png" }
];

// Функция валидации данных от Telegram (Защита от взлома баланса)
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

// Вспомогательная функция для получения или создания юзера
function getUser(initDataStr) {
    if (!verifyTelegramData(initDataStr)) return null;
    const urlParams = new URLSearchParams(initDataStr);
    const tgUser = JSON.parse(urlParams.get('user'));
    
    if (!usersDB[tgUser.id]) {
        usersDB[tgUser.id] = {
            balance: 2500, // Стартовый баланс для новичков
            username: tgUser.username || "Игрок"
        };
    }
    return { id: tgUser.id, ...usersDB[tgUser.id] };
}

// 1. API: АВТОРИЗАЦИЯ И ПОЛУЧЕНИЕ БАЛАНСА ПРИ ВХОДЕ
app.post('/api/auth', (req, res) => {
    const user = getUser(req.body.initData);
    if (!user) return res.status(401).json({ error: 'Ошибка авторизации Telegram' });
    res.json({ success: true, balance: user.balance });
});

// 2. API: ОТКРЫТИЕ КЕЙСА
app.post('/api/open-case', (req, res) => {
    const user = getUser(req.body.initData);
    if (!user) return res.status(401).json({ error: 'Ошибка авторизации' });

    if (usersDB[user.id].balance < CASE_PRICE) {
        return res.status(400).json({ error: 'Недостаточно фишек!' });
    }
    
    usersDB[user.id].balance -= CASE_PRICE;

    const randomRoll = crypto.randomInt(0, 10000) / 100; 
    let wonItem = null;
    let currentBoundary = 0;

    for (const item of CASE_ITEMS) {
        currentBoundary += item.chance;
        if (randomRoll <= currentBoundary) { wonItem = item; break; }
    }
    if (!wonItem) wonItem = CASE_ITEMS[0];
    
    usersDB[user.id].balance += wonItem.price;

    const tapeItems = [];
    for (let i = 0; i < 30; i++) {
        if (i === 25) { tapeItems.push(wonItem); } 
        else { tapeItems.push(CASE_ITEMS[crypto.randomInt(0, CASE_ITEMS.length)]); }
    }

    res.json({ success: true, tape: tapeItems, winIndex: 25, newBalance: usersDB[user.id].balance });
});

// 3. API: ПОПОЛНЕНИЕ ЧЕРЕЗ TELEGRAM STARS
app.post('/api/deposit-stars', (req, res) => {
    const user = getUser(req.body.initData);
    if (!user) return res.status(401).json({ error: 'Ошибка авторизации' });

    axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`, {
        chat_id: user.id,
        title: "Пополнение Баланса Bonzana",
        description: "Покупка 2,000 фишек за 50 Telegram Stars",
        payload: `deposit_${user.id}_${Date.now()}`,
        provider_token: "", 
        currency: "XTR",
        prices: [{ label: "2000 фишек", amount: 50 }]
    }).then(response => {
        res.json({ success: true, invoiceLink: response.data.result.invoice_link });
    }).catch(() => {
        res.status(500).json({ error: 'Ошибка генерации счета Stars' });
    });
});

// ВЕБХУК ПРИЕМ ПЛАТЕЖЕЙ ОТ TELEGRAM
app.post('/api/tg-webhook', (req, res) => {
    const { pre_checkout_query, message } = req.body;
    
    if (pre_checkout_query) {
        axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
            pre_checkout_query_id: pre_checkout_query.id, ok: true
        });
    }
    
    if (message && message.successful_payment) {
        const payload = message.successful_payment.invoice_payload;
        const tgUserId = payload.split('_')[1]; // Достаем ID игрока из инвойса
        if (usersDB[tgUserId]) {
            usersDB[tgUserId].balance += 2000; // Начисляем фишки за Stars
        }
    }
    res.sendStatus(200);
});

// 4. ИНТЕРФЕЙС ИГРЫ
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bonzana NFT Cases</title>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
        <style>
            body { background: #0f0f15; color: white; font-family: 'Segoe UI', sans-serif; text-align: center; margin: 0; padding: 15px; overflow-x: hidden; }
            .header { font-size: 24px; font-weight: 800; color: #ffaa00; text-shadow: 0 0 15px rgba(255,170,0,0.3); margin-bottom: 5px; }
            .balance-box { font-size: 18px; background: #1a1a26; padding: 10px 20px; border-radius: 50px; display: inline-flex; align-items: center; gap: 8px; border: 1px solid #2d2d3f; margin-bottom: 20px; }
            .roulette-wrapper { position: relative; width: 100%; max-width: 500px; margin: 20px auto; overflow: hidden; height: 130px; border: 2px solid #32324d; border-radius: 16px; background: #0b0b0f; }
            .roulette-wrapper::before { content: ''; position: absolute; left: 50%; top: 0; bottom: 0; width: 4px; background: #ffaa00; z-index: 10; transform: translateX(-50%); }
            .tape { display: flex; position: absolute; left: 0; top: 15px; transition: transform 5s cubic-bezier(0.1, 0.8, 0.1, 1); will-change: transform; }
            .item-card { min-width: 100px; max-width: 100px; height: 100px; background: #161622; margin: 0 5px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box; border-bottom: 4px solid #fff; font-size: 11px; font-weight: bold; padding: 5px; }
            .item-card img { width: 45px; height: 45px; margin-bottom: 5px; }
            .common { border-bottom-color: #b0c3d9; background: linear-gradient(to top, rgba(176,195,217,0.1), #161622); }
            .rare { border-bottom-color: #4b69ff; background: linear-gradient(to top, rgba(75,105,255,0.1), #161622); }
            .epic { border-bottom-color: #8847ff; background: linear-gradient(to top, rgba(136,71,255,0.1), #161622); }
            .legendary { border-bottom-color: #d32ce6; background: linear-gradient(to top, rgba(211,44,230,0.1), #161622); }
            .secret { border-bottom-color: #eb4b4b; background: linear-gradient(to top, rgba(235,75,75,0.2), #161622); }
            .actions { display: flex; flex-direction: column; gap: 10px; align-items: center; margin-top: 20px; }
            .btn { border: none; font-weight: bold; cursor: pointer; transition: all 0.2s; width: 85%; max-width: 320px; }
            .btn-open { background: linear-gradient(135deg, #ffaa00, #ff5500); color: white; padding: 16px; font-size: 18px; border-radius: 14px; }
            .btn-deposit { background: #242435; color: #00aff0; padding: 12px; font-size: 14px; border-radius: 50px; border: 1px solid #31314a; }
            #win-alert { font-size: 18px; font-weight: bold; margin-top: 15px; height: 25px; }
        </style>
    </head>
    <body>
        <div class="header">BONZANA NFT CASES</div>
        <div class="balance-box">🪙 Баланс: <span id="balance">Загрузка...</span></div>
        <div class="roulette-wrapper"><div class="tape" id="tape"></div></div>
        <div id="win-alert"></div>
        <div class="actions">
            <button class="btn btn-open" id="open-btn" onclick="openCase()" disabled>ОТКРЫТЬ ЗА 500 🪙</button>
            <button class="btn btn-deposit" onclick="buyStars()">⚡ Купить +2000 фишек (50 Stars)</button>
        </div>

        <script>
            const tg = window.Telegram.WebApp;
            if (tg) { tg.expand(); tg.ready(); }

            const audioSpin = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
            const audioWin = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-84.wav');
            const tape = document.getElementById('tape');

            function buildTape(itemsList) {
                tape.innerHTML = '';
                itemsList.forEach(item => {
                    const card = document.createElement('div');
                    card.className = 'item-card ' + item.rarity;
                    card.innerHTML = '<img src="' + item.img + '"><div>' + item.name + '</div>';
                    tape.appendChild(card);
                });
            }

            // 1. ЗАПРОС АВТОРИЗАЦИИ ПРИ ЗАПУСКЕ
            async function authUser() {
                try {
                    const response = await fetch('/api/auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ initData: tg.initData })
                    });
                    const data = await response.json();
                    if (data.success) {
                        document.getElementById('balance').innerText = data.balance;
                        document.getElementById('open-btn').disabled = false;
                    } else {
                        document.getElementById('balance').innerText = "Ошибка входа";
                    }
                } catch(e) {
                    document.getElementById('balance').innerText = "Ошибка сети";
                }
            }
            authUser();

            async function openCase() {
                const btn = document.getElementById('open-btn');
                const winAlert = document.getElementById('win-alert');
                btn.disabled = true;
                winAlert.innerText = '';
                tape.style.transition = 'none';
                tape.style.transform = 'translateX(0px)';
                
                try {
                    const response = await fetch('/api/open-case', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ initData: tg.initData })
                    });
                    const data = await response.json();
                    if (data.error) { alert(data.error); btn.disabled = false; return; }

                    buildTape(data.tape);
                    audioSpin.play();

                    setTimeout(() => {
                        tape.style.transition = 'transform 5s cubic-bezier(0.1, 0.8, 0.1, 1)';
                        const targetShift = -(25 * 110) + (window.innerWidth / 2) - 55;
                        tape.style.transform = 'translateX(' + targetShift + 'px)';
                    }, 50);

                    setTimeout(() => {
                        audioWin.play();
                        document.getElementById('balance').innerText = data.newBalance;
                        const wonItem = data.tape[data.winIndex];
                        winAlert.innerHTML = '🎉 Выпало: <span class="' + wonItem.rarity + '">' + wonItem.name + '</span> (+$' + wonItem.value + ')';
                        btn.disabled = false;
                    }, 5050);
                } catch (err) { alert('Ошибка сервера'); btn.disabled = false; }
            }

            async function buyStars() {
                try {
                    const response = await fetch('/api/deposit-stars', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ initData: tg.initData })
                    });
                    const data = await response.json();
                    if(data.invoiceLink) {
                        tg.openInvoice(data.invoiceLink, function(status) {
                            if(status === 'paid') authUser(); // Обновляем баланс
                        });
                    }
                } catch(e) { alert('Ошибка счета'); }
            }
        </script>
    </body>
    </html>
    `);
});

app.listen(PORT, () => {
    console.log(`[OK] Сервер авторизации запущен на порту ${PORT}`);
});
