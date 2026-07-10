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

  // Нативная функция оплаты реальными Telegram Stars
  const handleStarsPayment = async (starsCount) => {
    setIsDepositOpen(false);
    
    if (!window.Telegram || !window.Telegram.WebApp) {
      // Резервный тест для браузера ПК вне Телеграма
      alert(`Среда Telegram не найдена. Тестовое начисление: +${starsCount} звёзд`);
      setBalance(prev => prev + starsCount);
      return;
    }

    try {
      // Запрос к твоему бэкенду (server.js) за ссылкой на инвойс Telegram Stars
      const response = await fetch('/api/create-stars-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: window.Telegram.WebApp.initDataUnsafe?.user?.id,
          amount: starsCount 
        })
      });
      
      const data = await response.json();
      
      if (data.invoiceLink) {
        // Вызов официального окна оплаты Telegram Stars внутри приложения
        window.Telegram.WebApp.openInvoice(data.invoiceLink, (status) => {
          if (status === 'paid') {
            setBalance(prev => prev + starsCount);
            window.Telegram.WebApp.showAlert(`Успешно! Ваш баланс пополнен на ${starsCount} ⭐`);
          } else if (status === 'cancelled') {
            console.log('Пользователь закрыл окно оплаты звезд.');
          } else {
            window.Telegram.WebApp.showAlert('Ошибка проведения транзакции Telegram Stars.');
          }
        });
      } else {
        window.Telegram.WebApp.showAlert('Ошибка: Сервер не смог создать инвойс.');
      }
    } catch (err) {
      console.error('Ошибка платежной системы:', err);
    }
  };

  return (
    <div className="app-shell">
      {/* ХЕДЕР ПРИЛОЖЕНИЯ */}
      <header className="tg-header">
        <div className="header-left-brand">
          <div className="burger-btn"><span></span><span></span><span></span></div>
          <span className="brand-title">BONZANA</span>
        </div>
        <div className="header-right-wallet">
          <div className="balance-pill" onClick={() => setIsDepositOpen(true)}>
            <span className="pill-star">★</span>
            <span className="pill-amount">{isDemo ? '9999' : balance}</span>
            <span className="pill-plus">+</span>
          </div>
        </div>
      </header>

      {/* КОНТЕНТНАЯ ЧАСТЬ */}
      <main className="content-area">
        <CasesPage 
          balance={balance} 
          setBalance={setBalance} 
          openDepositModal={() => setIsDepositOpen(true)}
          isDemo={isDemo}
          setIsDemo={setIsDemo}
        />
      </main>

      {/* МОДАЛЬНОЕ ОКНО (BOTTOM SHEET ПОПОЛНЕНИЯ ЗВЕЗД) */}
      <div className={`bottom-sheet-overlay ${isDepositOpen ? 'visible' : ''}`} onClick={() => setIsDepositOpen(false)}>
        <div className="bottom-sheet-modal" onClick={(e) => e.stopPropagation()}>
          <div className="sheet-header">
            <h3>Пополнение Telegram Stars</h3>
            <button className="sheet-close-x" onClick={() => setIsDepositOpen(false)}>×</button>
          </div>
          <p className="sheet-subtitle">Купите звёзды через Telegram для мгновенного зачисления на игровой баланс:</p>

          <div className="tiers-list">
            <div className="tier-row" onClick={() => handleStarsPayment(50)}>
              <div className="tier-info">
                <span className="tier-star-icon">⭐</span>
                <span className="tier-quantity">50 Stars</span>
              </div>
              <button className="tier-price-btn">⭐ 50</button>
            </div>

            <div className="tier-row popular-row" onClick={() => handleStarsPayment(250)}>
              <div className="hit-badge">ХИТ</div>
              <div className="tier-info">
                <span className="tier-star-icon">⭐</span>
                <span className="tier-quantity">250 Stars</span>
              </div>
              <button className="tier-price-btn">⭐ 250</button>
            </div>

            <div className="tier-row" onClick={() => handleStarsPayment(1000)}>
              <div className="tier-info">
                <span className="tier-star-icon">⭐</span>
                <span className="tier-quantity">1000 Stars</span>
              </div>
              <button className="tier-price-btn">⭐ 1000</button>
            </div>
          </div>
        </div>
      </div>

      {/* НИЖНЕЕ МЕНЮ НАВИГАЦИИ */}
      <nav className="tg-navbar">
        <button className="nav-item"><span className="nav-icon">▲</span><span className="nav-text">Апгрейд</span></button>
        <button className="nav-item"><span className="nav-icon">🎯</span><span className="nav-text">Крафты</span></button>
        <button className="nav-item active">
          <div className="center-tab-glow"><span className="nav-icon center-box">📦</span></div>
          <span className="nav-text">Кейсы</span>
        </button>
        <button className="nav-item"><span className="nav-icon">🎁</span><span className="nav-text">Конкурсы</span></button>
        <button className="nav-item"><span className="nav-icon">👥</span><span className="nav-text">Друзья</span></button>
      </nav>
    </div>
  );
}
