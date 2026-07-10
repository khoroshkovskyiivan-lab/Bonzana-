import React, { useState, useEffect, useRef } from 'react';
import './CasesPage.css';

// Данные о доступных кейсах / категориях
const CATEGORIES = [
  { id: 'all', name: 'Все 25', price: 25 },
  { id: 'bears', name: 'Медвежата 33', price: 33 },
  { id: 'romance', name: 'Романтика 42', price: 42 }
];

// Возможные призы внутри кейса (иконка, название, стоимость в Stars, шанс в %)
const PRIZES = [
  { id: 1, name: 'Кубок Лидера', icon: '🏆', value: 100, chance: 0.612 },
  { id: 2, name: 'Роза', icon: '🌹', value: 25, chance: 29.53 },
  { id: 3, name: 'Праздничный торт', icon: '🎂', value: 50, chance: 0.282 },
  { id: 4, name: 'Плюшевый мишка', icon: '🧸', value: 15, chance: 50.0 },
  { id: 5, name: 'Шампанское', icon: '🍾', value: 50, chance: 19.576 }
];

export default function CasesPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [isDemo, setIsDemo] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [carouselItems, setCarouselItems] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(25);
  
  const carouselRef = useRef(null);

  // Генерируем длинную ленту для эффекта бесконечной прокрутки рулетки
  useEffect(() => {
    generateCarousel();
  }, []);

  const generateCarousel = () => {
    // Создаем массив из 50 случайных предметов, чтобы рулетка долго крутилась
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
    
    setIsSpinning(true);
    generateCarousel();

    // Выбираем случайный финальный индекс (ближе к концу ленты, например между 45 и 52)
    const winningIndex = 45 + Math.floor(Math.random() * 7);
    
    // Вычисляем смещение: ширина одной карточки 110px (100px + 10px отступ)
    // Центрируем выигрышную карточку относительно середины экрана рулетки
    const cardWidth = 110;
    const containerWidth = 320; // Примерная ширина видимой зоны
    const targetOffset = -(winningIndex * cardWidth - (containerWidth / 2) + (cardWidth / 2));

    setTimeout(() => {
      if (carouselRef.current) {
        carouselRef.current.style.transition = 'transform 4s cubic-bezier(0.1, 0.8, 0.1, 1)';
        carouselRef.current.style.transform = `translateX(${targetOffset}px)`;
      }
    }, 50);

    // Конец анимации кручения
    setTimeout(() => {
      const wonPrize = carouselItems[winningIndex];
      alert(`🎉 Вы выиграли: ${wonPrize.name} (${wonPrize.value} ⭐️)!`);
      setIsSpinning(false);
    }, 4100);
  };

  return (
    <div className="cases-page">
      {/* Шапка с категориями */}
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

      {/* Окно самой рулетки */}
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

      {/* Переключатель Демо-режима */}
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

      {/* Главная кнопка действия */}
      <button 
        className={`action-btn ${isSpinning ? 'disabled' : ''}`} 
        onClick={startSpin}
        disabled={isSpinning}
      >
        {isSpinning ? 'Удача решает...' : `Мне повезет! ${currentPrice}`} <span>⭐️</span>
      </button>

      {/* Раздел "Вы можете выиграть..." */}
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
