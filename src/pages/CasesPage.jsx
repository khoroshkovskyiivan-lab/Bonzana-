import React, { useState, useEffect, useRef } from 'react';
import './CasesPage.css';

const CATEGORIES = [
  { id: 'all', name: 'Все 25', price: 25 },
  { id: 'bears', name: 'Медвежата 33', price: 33 },
  { id: 'romance', name: 'Романтика 42', price: 42 }
];

const PRIZES = [
  { id: 1, name: 'Кубок Лидера', icon: '🏆', value: 100, chance: 0.612 },
  { id: 2, name: 'Роза', icon: '🌹', value: 25, chance: 29.53 },
  { id: 3, name: 'Праздничный торт', icon: '🎂', value: 50, chance: 0.282 },
  { id: 4, name: 'Плюшевый мишка', icon: '🧸', value: 15, chance: 50.0 },
  { id: 5, name: 'Шампанское', icon: '🍾', value: 50, chance: 19.576 }
];

export default function CasesPage({ balance, setBalance }) {
  const [activeTab, setActiveTab] = useState('all');
  const [isDemo, setIsDemo] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [carouselItems, setCarouselItems] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(25);
  
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

  const handleTabChange = (tabId, price) => {
    setActiveTab(tabId);
    setCurrentPrice(price);
  };

  const startSpin = () => {
    if (isSpinning) return;

    // Проверка баланса: если НЕ демо режим, проверяем хватает ли звезд
    if (!isDemo && balance < currentPrice) {
      alert('❌ Недостаточно Telegram Stars для открытия кейса!');
      return;
    }
    
    setIsSpinning(true);
    generateCarousel();

    // Списываем баланс только если режим НЕ демонстрационный
    if (!isDemo) {
      setBalance(prev => prev - currentPrice);
    }

    const winningIndex = 42; // Жестко фиксируем индекс остановки для идеального прицела
    
    // Вычисляем точное смещение с учетом ширины карточки (100px) и отступа gap (10px)
    const cardWidth = 100;
    const gap = 10;
    const itemTotalWidth = cardWidth + gap;
    
    // Смещение контейнера, чтобы 42-й элемент встал ровно по центру маркера
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
      <div className="tabs-container">
        {CATEGORIES.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabChange(tab.id, tab.price)}
          >
            {tab.name} <span>⭐️</span>
          </button>
        ))}
      </div>

      <div className="roulette-wrapper">
        <div className="roulette-marker top"></div>
        <div className="roulette-marker bottom"></div>
        <div className="roulette-viewport">
          <div className="roulette-carousel" ref={carouselRef}>
            {carouselItems.map((item) => (
              <div key={item.uniqueId} className="roulette-card">
                <span className="card-icon">{item.icon}</span>
                <span className="card-value">{item.value} ⭐️</span>
              </div>
            ))}
          </div>
        </div>
      </div>

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

      <button 
        className={`action-btn ${isSpinning ? 'disabled' : ''}`} 
        onClick={startSpin}
        disabled={isSpinning}
      >
        {isSpinning ? 'Удача решает...' : `Мне повезет! ${currentPrice}`} <span>⭐️</span>
      </button>

      <div className="lootbox-info-section">
        <div className="info-header">
          <h3>Вы можете выиграть...</h3>
          <span className="nft-badge">NFT?</span>
        </div>
        
        <div className="prizes-grid">
          {PRIZES.map((prize) => (
            <div key={prize.id} className="prize-info-card">
              <div className="prize-chance">{prize.chance}% 🎲</div>
              <div className="prize-main-icon">{prize.icon}</div>
              <div className="prize-bottom-value">{prize.value} ⭐️</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
