const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(express.json());

// Разрешаем фронтенду слать запросы на этот бэкенд
app.use(cors()); 

// Данные твоего сервиса (для внутренней фиксации)
// Service ID: srv-d9813he7r5hc73aoh760
const BOT_TOKEN = '8722270191:AAGT76B9uFwEt0_a26AE3C2A7mfjFKI0b1M'; 

// Главный эндпоинт для генерации чеков Telegram Stars
app.post('/api/create-stars-invoice', async (req, res) => {
  try {
    const { userId, amount } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, error: "Не указано количество Stars" });
    }

    // Делаем официальный запрос к Telegram API
    const response = await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
      title: "Пополнение баланса Stars",
      description: `Зачисление ${amount} Telegram Stars в Gifts Battle`,
      payload: `stars_deposit_${userId || 'guest'}_${Date.now()}`,
      provider_token: "", // Для Stars это поле ВСЕГДА пустое
      currency: "XTR",    // Единственная валюта для Telegram Stars
      prices: [
        { label: "Telegram Stars", amount: parseInt(amount) }
      ]
    });

    if (response.data.ok) {
      // Возвращаем сгенерированную платежную ссылку на фронтенд
      res.json({ success: true, invoiceLink: response.data.result });
    } else {
      res.status(400).json({ success: false, error: response.data.description });
    }
  } catch (error) {
    console.error("Ошибка инвойса:", error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, error: "Ошибка на стороне сервера платежей" });
  }
});

// Добавим простой GET-запрос на корень, чтобы Render видел, что сервис жив
app.get('/', (req, res) => {
  res.send('Бэкенд платежей Telegram Stars успешно работает!');
});

// Render сам передает порт через process.env.PORT, поэтому слушаем его динамически
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Сервер запущен на порту ${PORT}`));
