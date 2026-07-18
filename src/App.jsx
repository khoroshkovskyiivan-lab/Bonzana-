import React, { useState, useEffect } from 'react';
import CasesPage from './pages/CasesPage';
import './index.css';

export default function App() {
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [balance, setBalance] = useState(0); 
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  // Нативный вызов Telegram Stars с интеграцией бэкенда
  const handleStarsPayment = async (starsCount) => {
    setIsDepositOpen(false);
    
    if (!window.Telegram || !window.Telegram.WebApp) {
      alert(`Среда Telegram не найдена. Локальный тест: Начислено +${starsCount} звёзд`);
      setBalance(prev => prev + starsCount);
      return;
    }

    try {
      // Стучимся на наш созданный Node.js бэкенд
      const response = await fetch('http://localhost:3000/api/create-stars-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: window.Telegram.WebApp.initDataUnsafe?.user?.id || 0,
          amount: starsCount 
        })
      });
      
      const data = await response.json();
      
      if (data.success && data.invoiceLink) {
        // Запуск официальной шторки оплаты внутри Telegram
        window.Telegram.WebApp.openInvoice(data.invoiceLink, (status) => {
          if (status === 'paid') {
            setBalance(prev => prev + starsCount);
            window.Telegram.WebApp.showAlert(`Баланс успешно пополнен на ${starsCount} ⭐!`);
          } else if (status === 'cancelled') {
            console.log('Пользователь закрыл инвойс');
          } else {
            window.Telegram.WebApp.showAlert('Ошибка проведения транзакции.');
          }
        });
      } else {
        window.Telegram.WebApp.showAlert('Не удалось сгенерировать чек оплаты.');
      }
    } catch (err) {
      console.error('Ошибка платежной системы:', err);
      window.Telegram.WebApp.showAlert('Ошибка связи с сервером платежей.');
    }
  };

  return (
    <div className="app-shell">
      <header className="tg-header glass-panel">
        <span className="brand-title neon-text-cyan">BONZANA</span>
        <div className="balance-pill" onClick={() => setIsDepositOpen(true)}>
          <span className="pill-star">★</span>
          <span className="pill-amount">{isDemo ? '9999' : balance}</span>
          <span className="pill-plus">+</span>
        </div>
      </header>

      <main className="content-area">
        <CasesPage 
          balance={balance} 
          setBalance={setBalance} 
          openDepositModal={() => setIsDepositOpen(true)}
          isDemo={isDemo}
          setIsDemo={setIsDemo}
        />
      </main>

      {/* Стеклянное модальное окно (Bottom Sheet) пополнения */}
      <div className={`bottom-sheet-overlay ${isDepositOpen ? 'visible' : ''}`} onClick={() => setIsDepositOpen(false)}>
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
