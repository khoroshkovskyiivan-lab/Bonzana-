import React, { useState, useEffect } from 'react';
import './index.css';
import CasesPage from './pages/CasesPage';
import ContestsPage from './pages/ContestsPage';
import LeadersPage from './pages/LeadersPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('cases'); // 'upgrade', 'crafts', 'cases', 'contests', 'friends'
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState({
    username: 'Загрузка...',
    id: '7207936626',
    balance: 42,
    tickets: 10,
    avatar: ''
  });

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.expand();
      tg.ready();
      
      if (tg.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        setUser({
          username: u.username || u.first_name || 'ukrop',
          id: u.id || '7207936626',
          balance: 0, 
          tickets: 10,
          avatar: u.photo_url || ''
        });
      }
    }
  }, []);

  return (
    <div className="app-container">
      {/* ХЕДЕР */}
      <header className="main-header">
        <div className="header-left" onClick={() => setIsMenuOpen(true)}>
          <div className="burger-icon"><span></span><span></span><span></span></div>
          <div className="brand-logo"><span>🐸</span> Bonzana</div>
        </div>
        <div className="header-right">
          <div className="stars-pill">
            <span className="star-icon">⭐</span>
            <span className="balance-num">{user.balance}</span>
            <button className="plus-btn">+</button>
          </div>
          <div className="avatar-box">
            {user.avatar ? <img src={user.avatar} alt="avatar" /> : user.username[0].toUpperCase()}
          </div>
        </div>
      </header>

      {/* ШТОРКА МЕНЮ */}
      <div className={`side-drawer ${isMenuOpen ? 'open' : ''}`}>
        <div className="drawer-overlay" onClick={() => setIsMenuOpen(false)}></div>
        <div className="drawer-content">
          <div className="drawer-profile">
            <div className="drawer-avatar">
              {user.avatar ? <img src={user.avatar} alt="avatar" /> : user.username[0].toUpperCase()}
            </div>
            <div>
              <h3>{user.username}</h3>
              <p>ID: {user.id}</p>
            </div>
          </div>
          <div className="drawer-balance-card">
            <p>Мой баланс</p>
            <div className="balances-row">
              <div>⭐ {user.balance}</div>
              <div style={{color: '#8e99b3'}}>🎟️ {user.tickets}</div>
            </div>
            <button className="deposit-btn">Пополнить</button>
          </div>
          <nav className="drawer-nav">
            <button onClick={() => { setActiveTab('leaderboard'); setIsMenuOpen(false); }}>👤 Мой профиль</button>
            <button onClick={() => alert('В разработке')}>🔄 Live-трейды</button>
            <button onClick={() => alert('Пополнение Stars')}>⭐ Купить Stars</button>
            <button onClick={() => { setActiveTab('leaderboard'); setIsMenuOpen(false); }}>🏆 Лидерборд</button>
          </nav>
          <div className="drawer-footer">🎧 Поддержка</div>
        </div>
      </div>

      {/* КОНТЕНТ СТРАНИЦ */}
      <main className="main-content">
        {activeTab === 'cases' && <CasesPage />}
        {activeTab === 'contests' && <ContestsPage />}
        {activeTab === 'leaderboard' && <LeadersPage />}
        {(activeTab === 'upgrade' || activeTab === 'crafts') && (
          <div className="empty-state">
            <h2>Раздел в разработке</h2>
            <p>Синхронизация предметов...</p>
          </div>
        )}
      </main>

      {/* ТАБ-БАР */}
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
          <span className="tab-icon">👥</span><span>Друзья</span>
        </button>
      </nav>
    </div>
  );
}
