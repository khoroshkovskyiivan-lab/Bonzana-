const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors()); // Чтобы фронтенд мог без проблем отправлять запросы

// Твой токен бота уже внутри безопасности бэкенда
const BOT_TOKEN = '8722270191:AAGT76B9uFwEt0_a26AE3C2A7mfjFKI0b1M'; 

app.post('/api/create-stars-invoice', async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, error: "Не указана сумма звезд" });
    }

    // Запрос к Telegram API для создания нативной ссылки на оплату Stars
    const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
      title: "Пополнение Stars",
      description: `Покупка ${amount} Telegram Stars для профиля в Gifts Battle`,
      payload: `stars_deposit_${userId || 'guest'}_${Date.now()}`,
      provider_token: "", // Для Telegram Stars поле ВСЕГДА остается пустым
      currency: "XTR",    // XTR — это единственно верный код для Telegram Stars
      prices: [
        { label: "Telegram Stars", amount: parseInt(amount) }
      ]
    });

    if (response.data.ok) {
      // Отправляем готовую инвойс-ссылку на фронтенд
      res.json({ success: true, invoiceLink: response.data.result });
    } else {
      res.status(400).json({ success: false, error: response.data.description });
    }
  } catch (error) {
    console.error("Ошибка при создании инвойса:", error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, error: "Внутренняя ошибка сервера платежей" });
  }
});

// Запускаем сервер на 3000 порту (или используй свой привычный порт)
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Бэкенд платежей запущен на порту ${PORT}`));
