import React, { useState, useEffect } from 'react';
import './index.css';
import CasesPage from './pages/CasesPage';
import ContestsPage from './pages/ContestsPage';
import LeadersPage from './pages/LeadersPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('cases');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDepositOpen, setIsDepositOpen] = useState(false); // Окно пополнения
  
  const [balance, setBalance] = useState(500);
  const [tickets, setTickets] = useState(10);
  const [username, setUsername] = useState('ukrop');
  const [avatar, setAvatar] = useState('');

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.expand();
      tg.ready();
      
      if (tg.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        setUsername(u.username || u.first_name || 'ukrop');
        setAvatar(u.photo_url || '');
      }
    }
  }, []);

  return (
    <div className="app-container">
      {/* ХЕДЕР */}
      <header className="main-header">
        <div className="header-left" onClick={() => setIsMenuOpen(true)}>
          <div className="burger-icon"><span></span><span></span><span></span></div>
          {/* Логотип Bonzana вместо жабы */}
          <div className="brand-logo">
            <span className="logo-box-icon">🎁</span> BONZANA
          </div>
        </div>
        <div className="header-right">
          <div className="stars-pill" onClick={() => setIsDepositOpen(true)}>
            <span className="star-icon">⭐</span>
            <span className="balance-num">{balance}</span>
            <button className="plus-btn">+</button>
          </div>
          <div className="avatar-box">
            {avatar ? <img src={avatar} alt="avatar" /> : username[0]?.toUpperCase()}
          </div>
        </div>
      </header>

      {/* ШТОРКА МЕНЮ */}
      <div className={`side-drawer ${isMenuOpen ? 'open' : ''}`}>
        <div className="drawer-overlay" onClick={() => setIsMenuOpen(false)}></div>
        <div className="drawer-content">
          <div className="drawer-profile">
            <div className="drawer-avatar">
              {avatar ? <img src={avatar} alt="avatar" /> : username[0]?.toUpperCase()}
            </div>
            <div>
              <h3>{username}</h3>
              <p>ID: 7207936626</p>
            </div>
          </div>
          <div className="drawer-balance-card">
            <p>Мой баланс</p>
            <div className="balances-row">
              <div>⭐ {balance}</div>
              <div style={{color: '#8e99b3'}}>🎟️ {tickets}</div>
            </div>
            <button className="deposit-btn" onClick={() => { setIsDepositOpen(true); setIsMenuOpen(false); }}>Пополнить</button>
          </div>
          <nav className="drawer-nav">
            <button onClick={() => { setActiveTab('leaderboard'); setIsMenuOpen(false); }}>👤 Мой профиль</button>
            <button onClick={() => alert('В разработке')}>🔄 Live-трейды</button>
            <button onClick={() => { setIsDepositOpen(true); setIsMenuOpen(false); }}>⭐ Купить Stars</button>
            <button onClick={() => { setActiveTab('leaderboard'); setIsMenuOpen(false); }}>🏆 Лидерборд</button>
          </nav>
          <div className="drawer-footer">🎧 Поддержка</div>
        </div>
      </div>

      {/* ОКНО ПОПОЛНЕНИЯ БАЛАНСА */}
      {isDepositOpen && (
        <div className="modal-overlay" onClick={() => setIsDepositOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Пополнение Telegram Stars</h3>
              <button className="close-modal-btn" onClick={() => setIsDepositOpen(false)}>×</button>
            </div>
            <p className="modal-desc">Выберите пакет звёзд для мгновенного зачисления на игровой баланс:</p>
            <div className="deposit-grid">
              <div className="deposit-tier" onClick={() => { setBalance(b => b + 50); setIsDepositOpen(false); }}>
                <span className="tier-stars">⭐ 50</span>
                <button className="tier-buy-btn">0.99$</button>
              </div>
              <div className="deposit-tier popular" onClick={() => { setBalance(b => b + 250); setIsDepositOpen(false); }}>
                <div className="badge">ХИТ</div>
                <span className="tier-stars">⭐ 250</span>
                <button className="tier-buy-btn">4.99$</button>
              </div>
              <div className="deposit-tier" onClick={() => { setBalance(b => b + 1000); setIsDepositOpen(false); }}>
                <span className="tier-stars">⭐ 1000</span>
                <button className="tier-buy-btn">19.99$</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* КОНТЕНТ СТРАНИЦ */}
      <main className="main-content">
        {activeTab === 'cases' && (
          <CasesPage balance={balance} setBalance={setBalance} />
        )}
        {activeTab === 'contests' && <ContestsPage />}
        {activeTab === 'leaderboard' && <LeadersPage />}
        {(activeTab === 'upgrade' || activeTab === 'crafts') && (
          <div className="empty-state">
            <h2>Раздел в разработке</h2>
            <p>Синхронизация предметов...</p>
          </div>
        )}
      </main>

      {/* ТАБ-БАР (Друзья изменены на Топ) */}
      <nav className="bottom-tabbar">
        <button className={`tab-item ${activeTab === 'upgrade' ? 'active' : ''}`} onClick={() => setActiveTab('upgrade')}>
          <span className="tab-icon">▲</span><span>Апгрейд</span>
        </button>
        <button className={`tab-item ${activeTab === 'crafts' ? 'active' : ''}`} onClick={() => setActiveTab('crafts')}>
          <span className="tab-icon">🎯</span><span>Крафты</span>
        </button>
        <button className={`tab-item ${activeTab === 'cases' ? 'active' : ''}`} onClick={() => setActiveTab('cases')}>
          <div className="center-cube-btn">📦</div>
          <span style={{marginTop: '26px'}}>Кейсы</span>
        </button>
        <button className={`tab-item ${activeTab === 'contests' ? 'active' : ''}`} onClick={() => setActiveTab('contests')}>
          <span className="tab-icon">🎁</span><span>Конкурсы</span>
        </button>
        <button className={`tab-item ${activeTab === 'leaderboard' ? 'active' : ''}`} onClick={() => setActiveTab('leaderboard')}>
          <span className="tab-icon">🏆</span><span>Топ</span>
        </button>
      </nav>
    </div>
  );
}
