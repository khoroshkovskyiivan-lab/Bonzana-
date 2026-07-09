// server.js
const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;

// Игровая база данных прямо в памяти сервера
let userBalance = 2500; // Стартовый баланс игрока
const CASE_PRICE = 500;

// Предметы для кейса с красивыми иконками (картинками) и ценой
const CASE_ITEMS = [
    { id: 1, name: "Common NFT", rarity: "common", chance: 50.0, price: 50, img: "https://cdn-icons-png.flaticon.com/128/9722/9722019.png" },
    { id: 2, name: "Rare NFT", rarity: "rare", chance: 30.0, price: 150, img: "https://cdn-icons-png.flaticon.com/128/9722/9722075.png" },
    { id: 3, name: "Epic NFT", rarity: "epic", chance: 14.0, price: 600, img: "https://cdn-icons-png.flaticon.com/128/9721/9721949.png" },
    { id: 4, name: "Legendary NFT", rarity: "legendary", chance: 5.5, price: 2500, img: "https://cdn-icons-png.flaticon.com/128/9722/9722037.png" },
    { id: 5, name: "SECRET TON KNIFE", rarity: "secret", chance: 0.5, price: 15000, img: "https://cdn-icons-png.flaticon.com/128/2991/2991404.png" }
];

// 1. API: ОТКРЫТИЕ КЕЙСА
app.post('/api/open-case', (req, res) => {
    if (userBalance < CASE_PRICE) {
        return res.status(400).json({ error: 'Недостаточно фишек!' });
    }
    userBalance -= CASE_PRICE;

    const randomRoll = crypto.randomInt(0, 10000) / 100; 
    let wonItem = null;
    let currentBoundary = 0;

    for (const item of CASE_ITEMS) {
        currentBoundary += item.chance;
        if (randomRoll <= currentBoundary) {
            wonItem = item;
            break;
        }
    }
    if (!wonItem) wonItem = CASE_ITEMS[0];
    
    userBalance += wonItem.price;

    // Генерируем случайную ленту из 30 предметов для анимации во фронтенде,
    // где 25-й предмет будет нашим реальным выигрышем!
    const tapeItems = [];
    for (let i = 0; i < 30; i++) {
        if (i === 25) {
            tapeItems.push(wonItem);
        } else {
            const randomFake = CASE_ITEMS[crypto.randomInt(0, CASE_ITEMS.length)];
            tapeItems.push(randomFake);
        }
    }

    res.json({ success: true, tape: tapeItems, winIndex: 25, newBalance: userBalance });
});

// 2. API: ПОПОЛНЕНИЕ ЧЕРЕЗ TELEGRAM STARS
app.post('/api/deposit-stars', async (req, res) => {
    const { userId } = req.body; // Получаем ID пользователя Telegram
    if (!BOT_TOKEN) return res.status(500).json({ error: 'Бот не настроен (.env пустой)' });

    try {
        const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendInvoice`, {
            chat_id: userId || 123456789, // Твой ID или ID пользователя
            title: "Пополнение Баланса Казино",
            description: "Покупка 2,000 фишек за 50 Telegram Stars",
            payload: `deposit_user_${Date.now()}`,
            provider_token: "", // Для Stars оставляем пустым!
            currency: "XTR",
            prices: [{ label: "2000 фишек", amount: 50 }] // 50 Stars
        });
        res.json({ success: true, invoiceLink: response.data.result.invoice_link });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка генерации счета Stars' });
    }
});

// ВЕБХУК ДЛЯ НАЧИСЛЕНИЯ STARS ПРИ ОПЛАТЕ (Когда бот получит платеж)
app.post('/api/tg-webhook', (req, res) => {
    const { pre_checkout_query, message } = req.body;
    // Авто-ответ на проверку платежа от ТГ
    if (pre_checkout_query) {
        axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/answerPreCheckoutQuery`, {
            pre_checkout_query_id: pre_checkout_query.id,
            ok: true
        });
    }
    // Если платеж прошел успешно — начисляем баланс
    if (message && message.successful_payment) {
        userBalance += 2000; 
    }
    res.sendStatus(200);
});

// 3. КРАСИВЫЙ ФРОНТЕНД С АНИМАЦИЕЙ И ЗВУКОМ
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>NFT Cases Supreme</title>
        <script src="https://telegram.org/js/telegram-web-app.js"></script>
        <style>
            body { background: #0f0f15; color: white; font-family: 'Segoe UI', sans-serif; text-align: center; margin: 0; padding: 15px; overflow-x: hidden; }
            .header { font-size: 24px; font-weight: 800; color: #ffaa00; text-shadow: 0 0 15px rgba(255,170,0,0.3); margin-bottom: 5px; }
            .balance-box { font-size: 18px; background: #1a1a26; padding: 10px 20px; border-radius: 50px; display: inline-flex; align-items: center; gap: 8px; border: 1px solid #2d2d3f; margin-bottom: 20px; }
            
            /* РУЛЕТКА ДЛЯ КЕЙСОВ */
            .roulette-wrapper { position: relative; width: 100%; max-width: 500px; margin: 20px auto; overflow: hidden; height: 130px; border: 2px solid #32324d; border-radius: 16px; background: #0b0b0f; box-shadow: inset 0 0 20px rgba(0,0,0,0.8); }
            .roulette-wrapper::before { content: ''; position: absolute; left: 50%; top: 0; bottom: 0; width: 4px; background: #ffaa00; z-index: 10; box-shadow: 0 0 10px #ffaa00; transform: translateX(-50%); }
            .tape { display: flex; position: absolute; left: 0; top: 15px; transition: transform 5s cubic-bezier(0.1, 0.8, 0.1, 1); will-change: transform; }
            
            /* КАРТОЧКА ПРЕДМЕТА */
            .item-card { min-width: 100px; max-width: 100px; height: 100px; background: #161622; margin: 0 5px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; box-sizing: border-box; border-bottom: 4px solid #fff; font-size: 11px; font-weight: bold; padding: 5px; }
            .item-card img { width: 45px; height: 45px; margin-bottom: 5px; }
            
            /* РЕДКОСТИ */
            .common { border-bottom-color: #b0c3d9; background: linear-gradient(to top, rgba(176,195,217,0.1), #161622); }
            .rare { border-bottom-color: #4b69ff; background: linear-gradient(to top, rgba(75,105,255,0.1), #161622); }
            .epic { border-bottom-color: #8847ff; background: linear-gradient(to top, rgba(136,71,255,0.1), #161622); }
            .legendary { border-bottom-color: #d32ce6; background: linear-gradient(to top, rgba(211,44,230,0.1), #161622); }
            .secret { border-bottom-color: #eb4b4b; background: linear-gradient(to top, rgba(235,75,75,0.2), #161622); animation: pulse 1.5s infinite; }
            
            @keyframes pulse { 0% { box-shadow: inset 0 0 5px #eb4b4b; } 50% { box-shadow: inset 0 0 15px #eb4b4b; } 100% { box-shadow: inset 0 0 5px #eb4b4b; } }

            .actions { display: flex; flex-direction: column; gap: 10px; align-items: center; margin-top: 20px; }
            .btn { border: none; font-weight: bold; cursor: pointer; transition: all 0.2s; width: 85%; max-width: 320px; }
            .btn-open { background: linear-gradient(135deg, #ffaa00, #ff5500); color: white; padding: 16px; font-size: 18px; border-radius: 14px; box-shadow: 0 5px 20px rgba(255,85,0,0.3); }
            .btn-open:active { transform: scale(0.98); }
            .btn-deposit { background: #242435; color: #00aff0; padding: 12px; font-size: 14px; border-radius: 50px; border: 1px solid #31314a; }
            
            #win-alert { font-size: 18px; font-weight: bold; margin-top: 15px; height: 25px; }
        </style>
    </head>
    <body>

        <div class="header">NFT CASE STATION</div>
        <div class="balance-box">🪙 Баланс: <span id="balance">${userBalance}</span></div>

        <div class="roulette-wrapper">
            <div class="tape" id="tape"></div>
        </div>

        <div id="win-alert"></div>

        <div class="actions">
            <button class="btn btn-open" id="open-btn" onclick="openCase()">ОТКРЫТЬ ЗА 500 🪙</button>
            <button class="btn btn-deposit" onclick="buyStars()">⚡ Купить +2000 фишек (50 Stars)</button>
        </div>

        <script>
            const tg = window.Telegram.WebApp;
            if (tg) tg.expand();

            // Бесплатные аудио-ассеты звуков клика и победы
            const audioSpin = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-84.wav');
            const audioWin = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-84.wav');

            // Заполняем ленту случайными предметами при старте страницы
            const startItems = ${JSON.stringify(CASE_ITEMS)};
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
            // Генерируем красивый стартовый вид
            buildTape(Array(30).fill(startItems[0]));

            async function openCase() {
                const btn = document.getElementById('open-btn');
                const winAlert = document.getElementById('win-alert');
                btn.disabled = true;
                winAlert.innerText = '';
                
                // Сбрасываем позицию ленты в ноль без анимации
                tape.style.transition = 'none';
                tape.style.transform = 'translateX(0px)';
                
                try {
                    const response = await fetch('/api/open-case', { method: 'POST' });
                    const data = await response.json();

                    if (data.error) {
                        alert(data.error);
                        btn.disabled = false;
                        return;
                    }

                    // Отрисовываем ленту, сгенерированную сервером
                    buildTape(data.tape);
                    audioSpin.play();

                    // Магический просчет анимации: ширина карты 100px + margin 10px = 110px. 
                    // Смещаем ленту так, чтобы 25-й предмет встал ровно по центру (210px — поправка на экран)
                    setTimeout(() => {
                        tape.style.transition = 'transform 5s cubic-bezier(0.1, 0.8, 0.1, 1)';
                        const targetShift = -(25 * 110) + (window.innerWidth / 2) - 55;
                        tape.style.transform = 'translateX(' + targetShift + 'px)';
                    }, 50);

                    // Ждем окончания анимации кручения (5 секунд)
                    setTimeout(() => {
                        audioWin.play();
                        document.getElementById('balance').innerText = data.newBalance;
                        const wonItem = data.tape[data.winIndex];
                        winAlert.innerHTML = '🎉 Выпало: <span class="' + wonItem.rarity + '">' + wonItem.name + '</span> (+$' + wonItem.value + ')';
                        btn.disabled = false;
                    }, 5050);

                } catch (err) {
                    alert('Ошибка сервера');
                    btn.disabled = false;
                }
            }

            // ИНТЕГРАЦИЯ СИСТЕМЫ STARS
            async function buyStars() {
                const userId = tg.initDataUnsafe?.user?.id || 0;
                try {
                    const response = await fetch('/api/deposit-stars', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: userId })
                    });
                    const data = await response.json();
                    
                    if(data.invoiceLink) {
                        // Открываем нативное окно оплаты Telegram Stars прямо в Mini App!
                        tg.openInvoice(data.invoiceLink, function(status) {
                            if(status === 'paid') {
                                alert('Успешно оплачено! Баланс обновится автоматически.');
                            }
                        });
                    }
                } catch(e) {
                    alert('Ошибка выставления счета');
                }
            }
        </script>
    </body>
    </html>
    `);
});

app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`[ГОТОВО] Казино преобразилось! Звуки и анимация на месте.`);
    console.log(`👉 Перейди по адресу: http://localhost:3000`);
    console.log(`==================================================`);
});