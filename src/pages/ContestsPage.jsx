import React, { useState, useEffect } from 'react';


export default function ContestsPage() {
  // Время в секундах до конца лотереи (например, 2 часа 14 минут 45 секунд)
  const [timeLeft, setTimeLeft] = useState(8085); 

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Функция форматирования секунд в формат ЧЧ:ММ:СС
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="contests-page">
      <div className="contests-hero">
        <span className="hero-icon">🎟️</span>
        <h2>Лотереи</h2>
        <p>Принимайте участие в ежедневных розыгрышах ценных призов!</p>
      </div>

      <div className="contest-card">
        <div className="contest-badge-live">АКТИВНО</div>
        <h3>Лотерея №189</h3>
        <p className="ticket-status">Ваш билет: <strong>№74</strong></p>
        
        {/* Живой таймер */}
        <div className="timer-countdown">
          До итогов: <span className="time-digits">{formatTime(timeLeft)}</span>
        </div>

        <div className="progress-bar-container">
          <div className="progress-fill" style={{ width: '65%' }}></div>
        </div>
        <div className="contest-stats">
          <span>Осталось билетов: 1404</span>
          <span>Всего: 1481</span>
        </div>
        
        <button className="join-contest-btn" onClick={() => alert('Вы уже участвуете!')}>
          Вы берете участие
        </button>
      </div>
    </div>
  );
}
