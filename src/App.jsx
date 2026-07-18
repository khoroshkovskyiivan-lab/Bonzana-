import React, { useState, useEffect } from 'react';
import CasesPage from './pages/CasesPage';
import './index.css';

export default function App() {
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [balance, setBalance] = useState(0); 
  const [isDemo, setIsDemo] = useState(false);

  // Инициализация Telegram Mini App при загрузке приложения
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand(); // Раскрываем приложение на максимум
    }
  }, []);

  // Нативный вызов Telegram Stars с интеграцией твоего Render-бэкенда
  const handleStarsPayment = async (starsCount) => {
    setIsDepositOpen(false); // Закрываем модалку перед вызовом оплаты
    
    // Проверка, что приложение открыто именно внутри Telegram
    if (!window.Telegram || !window.Telegram.WebApp) {
      alert(`Среда Telegram не найдена. Локальный тест: баланс увеличен на +${starsCount} ⭐`);
      setBalance(prev => prev + starsCount);
      return;
    }

    try {
      // Стучимся на твой реальный сервер Render по правильному эндпоинту
      const response = await fetch('https://bonzana.onrender.com/api/create-stars-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: window.Telegram.WebApp.initDataUnsafe?.user?.id || 0,
          amount: starsCount 
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.invoiceLink) {
        // Открываем нативную шторку оплаты Telegram Stars
        window.Telegram.WebApp.openInvoice(data.invoiceLink, (status) => {
          if (status === 'paid') {
            setBalance(prev => prev + starsCount);
            window.Telegram.WebApp.showAlert(`Успешно! Зачислено ${starsCount} ⭐!`);
          } else if (status === 'cancelled') {
            console.log('Пользователь отменил платеж');
          } else {
            window.Telegram.WebApp.showAlert('Не удалось провести платеж.');
          }
        });
      } else {
        window.Telegram.WebApp.showAlert('Ошибка: Сервер не смог выписать чек.');
      }
    } catch (err) {
      console.error('Ошибка платежной системы:', err);
      window.Telegram.WebApp.showAlert('Нет связи с сервером платежей.');
    }
  };

  return (
    <div className="app-shell">
      {/* Стеклянная шапка (Неоновый дизайн) */}
      <header className="tg-header glass-panel">
        <span className="brand-title neon-text-cyan">BONZANA</span>
        <div className="balance-pill" onClick={() => setIsDepositOpen(true)}>
          <span className="pill-star">★</span>
          <span className="pill-amount">{isDemo ? '9999' : balance}</span>
          <span className="pill-plus">+</span>
        </div>
      </header>

      {/* Основная рабочая зона с рулеткой кейсов */}
      <main className="content-area">
        <CasesPage 
          balance={balance} 
          setBalance={setBalance} 
          openDepositModal={() => setIsDepositOpen(true)}
          isDemo={isDemo}
          setIsDemo={setIsDemo}
        />
      </main>

      {/* Стеклянное модальное окно (Bottom Sheet) для выбора тарифа Stars */}
      <div 
        className={`bottom-sheet-overlay ${isDepositOpen ? 'visible' : ''}`} 
        onClick={() => setIsDepositOpen(false)}
      >
        <div className="bottom-sheet-modal glass-panel" onClick={(e) => e.stopPropagation()}>
          <div className="sheet-header">
            <h3 className="neon-text-cyan">Пополнение Telegram Stars</h3>
            <button className="sheet-close-x" onClick={() => setIsDepositOpen(false)}>×</button>
          </div>
          <p className="sheet-subtitle">Официальное зачисление игровой валюты:</p>

          <div className="tiers-list">
            <div className="tier-row glass-element" onClick={() => handleStarsPayment(50)}>
              <span>⭐ 50 Stars</span>
              <button className="tier-price-btn">Купить</button>
            </div>
            
            <div className="tier-row glass-element popular-row" onClick={() => handleStarsPayment(250)}>
              <div className="hit-badge">ХИТ</div>
              <span>⭐ 250 Stars</span>
              <button className="tier-price-btn">Купить</button>
            </div>
            
            <div className="tier-row glass-element" onClick={() => handleStarsPayment(1000)}>
              <span>⭐ 1000 Stars</span>
              <button className="tier-price-btn">Купить</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
