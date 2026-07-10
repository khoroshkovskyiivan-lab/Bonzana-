import React, { useState, useEffect, useRef } from 'react';
import './CasesPage.css';

// Высокодетализированный векторный арт вместо стандартных эмодзи
const ICONS = {
  cup: (
    <svg viewBox="0 0 64 64" width="55" height="55">
      <defs>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE000" />
          <stop offset="100%" stopColor="#799F0C" />
        </linearGradient>
      </defs>
      <path d="M12 10h40v16c0 11-9 20-20 20s-20-9-20-20V10z" fill="url(#gold)" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.4))" />
      <path d="M16 46h32v4H16zM24 50h16v4H24z" fill="#E6B800" />
      <path d="M12 14H6v10c0 5 4 8 8 8h2M52 14h6v10c0 5-4 8-8 8h-2" fill="none" stroke="#FFE000" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  rose: (
    <svg viewBox="0 0 64 64" width="55" height="55">
      <path d="M32 10c-8 0-14 6-12 14 2 8 12 16 12 16s10-8 12-16c2-8-4-14-12-14z" fill="#FF2E93" filter="drop-shadow(0px 3px 5px rgba(255,46,147,0.4))" />
      <path d="M32 20c-3 0-5 2-4 5 1 3 4 5 4 5s3-2 4-5c1-3-1-5-4-5z" fill="#FF85A1" />
      <path d="M32 40v18" fill="none" stroke="#257A2D" strokeWidth="3" />
      <path d="M32 46c-4-1-8-4-8-4s3-2 5 0M32 50c4-1 8-4 8-4s-3-2-5 0" fill="#39B54A" />
    </svg>
  ),
  cake: (
    <svg viewBox="0 0 64 64" width="55" height="55">
      <rect x="10" y="26" width="44" height="24" rx="6" fill="#FFF0F5" filter="drop-shadow(0px 4px 8px rgba(0,0,0,0.3))" />
      <path d="M10 34c4 2 8 2 11 0 4-2 7-2 11 0 4 2 8 2 12 0 4-2 7-2 10 0v10c0 3-3 6-6 6H16c-3 0-6-3-6-6V34z" fill="#FFB6C1" />
      <circle cx="20" cy="26" r="3" fill="#FF2E93" />
      <circle cx="32" cy="26" r="3" fill="#FF2E93" />
      <circle cx="44" cy="26" r="3" fill="#FF2E93" />
      <path d="M20 23v-6M32 23v-8M44 23v-6" stroke="#FFA500" strokeWidth="2" strokeLinecap="round" />
      <path d="M20 15c0-2 1-3 0-4M32 13c0-2 1-3 0-4M44 15c0-2 1-3 0-4" stroke="#FF4500" strokeWidth="2" />
    </svg>
  ),
  bear: (
    <svg viewBox="0 0 64 64" width="55" height="55">
      <circle cx="20" cy="20" r="8" fill="#B37D4E" />
      <circle cx="44" cy="20" r="8" fill="#B37D4E" />
      <circle cx="20" cy="20" r="4" fill="#DEB887" />
      <circle cx="44" cy="20" r="4" fill="#DEB887" />
      <circle cx="32" cy="36" r="18" fill="#B37D4E" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.3))" />
      <circle cx="32" cy="40" r="6" fill="#DEB887" />
      <circle cx="30" cy="32" r="2" fill="#000" />
      <circle cx="34" cy="32" r="2" fill="#000" />
      <ellipse cx="32" cy="38" rx="2.5" ry="1.5" fill="#000" />
    </svg>
  ),
  champagne: (
    <svg viewBox="0 0 64 64" width="55" height="55">
      <path d="M26 48h12l-4-24h-4z" fill="#4E6E52" />
      <path d="M30 24V10h4v14z" fill="#7D9677" />
      <path d="M28 10c0-4 8-4 8 0z" fill="#D4AF37" />
      <path d="M15 12c2-3 8-1 6 4s-4 6-1 9M48 10c-2-3-8-1-6 4s4 6 1 9" fill="none" stroke="#E0F7FA" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="8" r="2" fill="#FFF" />
      <circle cx="40" cy="7" r="3" fill="#FFF" />
    </svg>
  )
};

const PRIZES = [
  { id: 1, name: 'Кубок Лидера', idName: 'cup', value: 100, chance: 0.612 },
  { id: 2, name: 'Роза', idName: 'rose', value: 25, chance: 29.53 },
  { id: 3, name: 'Праздничный торт', idName: 'cake', value: 50, chance: 0.282 },
  { id: 4, name: 'Плюшевый мишка', idName: 'bear', value: 15, chance: 50.0 },
  { id: 5, name: 'Шампанское', idName: 'champagne', value: 50, chance: 19.576 }
];

export default function CasesPage({ balance, setBalance }) {
  const [isDemo, setIsDemo] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [carouselItems, setCarouselItems] = useState([]);
  const currentPrice = 25; // Фиксированная цена кейса без табов
  
  const carouselRef = useRef(null);

  useEffect(() => {
    generateCarousel();
  }, []);

  const generateCarousel = () => {
    const items = [];
    for (let i = 0; i < 60; i++) {
      const randomPrize = PRIZES[Math.floor(Math.random() * PRIZES.length)];
      items.push({ ...randomPrize, uniqueId: i });
    }
    setCarouselItems(items);
    if (carouselRef.current) {
      carouselRef.current.style.transition = 'none';
      carouselRef.current.style.transform = 'translateX(0px)';
    }
  };

  const startSpin = () => {
    if (isSpinning) return;

    if (!isDemo && balance < currentPrice) {
      alert('❌ Недостаточно Telegram Stars для открытия кейса!');
      return;
    }
    
    setIsSpinning(true);
    generateCarousel();

    if (!isDemo) {
      setBalance(prev => prev - currentPrice);
    }

    const winningIndex = 42; 
    const cardWidth = 100;
    const gap = 10;
    const itemTotalWidth = cardWidth + gap;
    const targetOffset = -(winningIndex * itemTotalWidth - 110); 

    setTimeout(() => {
      if (carouselRef.current) {
        carouselRef.current.style.transition = 'transform 4.5s cubic-bezier(0.1, 0.8, 0.1, 1)';
        carouselRef.current.style.transform = `translateX(${targetOffset}px)`;
      }
    }, 50);

    setTimeout(() => {
      const wonPrize = carouselItems[winningIndex];
      alert(`🎉 Вы выиграли: ${wonPrize.name} (${wonPrize.value} ⭐️)!`);
      setIsSpinning(false);
    }, 4600);
  };

  return (
    <div className="cases-page">
      {/* Рулетка */}
      <div className="roulette-wrapper">
        <div className="roulette-marker top"></div>
        <div className="roulette-marker bottom"></div>
        <div className="roulette-viewport">
          <div className="roulette-carousel" ref={carouselRef}>
            {carouselItems.map((item) => (
              <div key={item.uniqueId} className="roulette-card">
                <div className="card-art-container">{ICONS[item.idName]}</div>
                <span className="card-value">{item.value} ⭐️</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Демо режим */}
      <div className="demo-toggle-container">
        <span className="demo-text">Демо режим</span>
        <label className="switch">
          <input 
            type="checkbox" 
            checked={isDemo} 
            onChange={(e) => setIsDemo(e.target.checked)} 
          />
          <span className="slider round"></span>
        </label>
      </div>

      {/* Кнопка запуска */}
      <button 
        className={`action-btn ${isSpinning ? 'disabled' : ''}`} 
        onClick={startSpin}
        disabled={isSpinning}
      >
        {isSpinning ? 'Удача решает...' : `Мне повезет! ${currentPrice}`} <span>⭐️</span>
      </button>

      {/* Сетка возможных выигрышей */}
      <div className="lootbox-info-section">
        <div className="info-header">
          <h3>Вы можете выиграть...</h3>
          <span className="nft-badge">NFT?</span>
        </div>
        
        <div className="prizes-grid">
          {PRIZES.map((prize) => (
            <div key={prize.id} className="prize-info-card">
              <div className="prize-chance">{prize.chance}% 🎲</div>
              <div className="prize-main-art">{ICONS[prize.idName]}</div>
              <div className="prize-bottom-value">{prize.value} ⭐️</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
