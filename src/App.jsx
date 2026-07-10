import React, { useState } from 'react';
import CasesPage from './pages/CasesPage';
import './index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('cases');
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [balance, setBalance] = useState(0); // Стартуем с нуля, чтобы сразу проверить окно пополнения
  const [isDemo, setIsDemo] = useState(false);

  return (
    <div className="app-shell">
      {/* ХЕДЕР */}
      <header className="tg-header">
        <div className="header-left-brand">
          <div className="burger-btn">
            <span></span><span></span><span></span>
          </div>
          <span className="brand-title">BONZANA</span>
        </div>
        <div className="header-right-wallet">
          <div className="balance-pill" onClick={() => setIsDepositOpen(true)}>
            <span className="pill-star">★</span>
            <span className="pill-amount">{isDemo ? '9999' : balance}</span>
            <span className="pill-plus">+</span>
          </div>
          <div className="profile-sub-avatar">U</div>
        </div>
      </header>

      {/* ОСНОВНОЙ КОНТЕНТ */}
      <main className="content-area">
        {activeTab === 'cases' && (
          <CasesPage 
            balance={balance} 
            setBalance={setBalance} 
            openDepositModal={() => setIsDepositOpen(true)}
            isDemo={isDemo}
            setIsDemo={setIsDemo}
          />
        )}
        {activeTab !== 'cases' && (
          <div className="empty-tab-stub">Раздел в разработке</div>
        )}
      </main>

      {/* НАТИВНЫЙ BOTTOM SHEET (ОКНО ПОПОЛНЕНИЯ ИЗ ФОТО 2) */}
      <div className={`bottom-sheet-overlay ${isDepositOpen ? 'visible' : ''}`} onClick={() => setIsDepositOpen(false)}>
        <div className="bottom-sheet-modal" onClick={(e) => e.stopPropagation()}>
          <div className="sheet-header">
            <h3>Пополнение Telegram Stars</h3>
            <button className="sheet-close-x" onClick={() => setIsDepositOpen(false)}>×</button>
          </div>
          <p className="sheet-subtitle">
            Выберите пакет звёзд для мгновенного зачисления на игровой баланс:
          </p>

          <div className="tiers-list">
            {/* Пакет 1 */}
            <div className="tier-row" onClick={() => { setBalance(b => b + 50); setIsDepositOpen(false); }}>
              <div className="tier-info">
                <span className="tier-star-icon">★</span>
                <span className="tier-quantity">50</span>
              </div>
              <button className="tier-price-btn">0.99$</button>
            </div>

            {/* Пакет 2 (ХИТ) */}
            <div className="tier-row popular-row" onClick={() => { setBalance(b => b + 250); setIsDepositOpen(false); }}>
              <div className="hit-badge">ХИТ</div>
              <div className="tier-info">
                <span className="tier-star-icon">★</span>
                <span className="tier-quantity">250</span>
              </div>
              <button className="tier-price-btn">4.99$</button>
            </div>

            {/* Пакет 3 */}
            <div className="tier-row" onClick={() => { setBalance(b => b + 1000); setIsDepositOpen(false); }}>
              <div className="tier-info">
                <span className="tier-star-icon">★</span>
                <span className="tier-quantity">1000</span>
              </div>
              <button className="tier-price-btn">19.99$</button>
            </div>
          </div>
        </div>
      </div>

      {/* ОРИГИНАЛЬНЫЙ ТАББАР С КРУГЛОЙ ПОДСВЕТКОЙ ДЛЯ КЕЙСОВ */}
      <nav className="tg-navbar">
        <button className={`nav-item ${activeTab === 'upgrade' ? 'active' : ''}`} onClick={() => setActiveTab('upgrade')}>
          <span className="nav-icon">▲</span>
          <span className="nav-text">Апгрейд</span>
        </button>
        <button className={`nav-item ${activeTab === 'crafts' ? 'active' : ''}`} onClick={() => setActiveTab('crafts')}>
          <span className="nav-icon">🎯</span>
          <span className="nav-text">Крафты</span>
        </button>
        
        {/* КЕЙСЫ (АКТИВНЫЙ ЦЕНТР С КРУГОМ) */}
        <button className={`nav-item ${activeTab === 'cases' ? 'active' : ''}`} onClick={() => setActiveTab('cases')}>
          <div className="center-tab-glow">
            <span className="nav-icon center-box">📦</span>
          </div>
          <span className="nav-text">Кейсы</span>
        </button>
        
        <button className={`nav-item ${activeTab === 'contests' ? 'active' : ''}`} onClick={() => setActiveTab('contests')}>
          <span className="nav-icon">🎁</span>
          <span className="nav-text">Конкурсы</span>
        </button>
        <button className={`nav-item ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>
          <span className="nav-icon">👥</span>
          <span className="nav-text">Друзья</span>
        </button>
      </nav>
    </div>
  );
}
