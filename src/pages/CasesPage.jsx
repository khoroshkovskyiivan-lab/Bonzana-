import React, { useState, useEffect, useRef } from 'react';

// Список призов в точности как на скриншотах
const PRIZES = [
  { id: 1, name: 'Кубок', value: 100, chance: 0.612, emoji: '🏆', color: '#ffb300' },
  { id: 2, name: 'Роза', value: 25, chance: 29.53, emoji: '🌹', color: '#ff2d55' },
  { id: 3, name: 'Торт', value: 50, chance: 0.282, emoji: '🎂', color: '#ff9500' },
  { id: 4, name: 'Мишка', value: 15, chance: 50.0, emoji: '🧸', color: '#ac8e68' },
  { id: 5, name: 'Шампанское', value: 50, chance: 19.576, emoji: '🍾', color: '#4cd964' }
];

export default function CasesPage({ balance, setBalance, openDepositModal, isDemo, setIsDemo }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [carouselItems, setCarouselItems] = useState([]);
  const currentPrice = 25;
  const carouselRef = useRef(null);

  // Генерируем ленту для бесконечного скролла при загрузке
  useEffect(() => {
    generateItems();
  }, []);

  const generateItems = () => {
    const items = [];
    for (let i = 0; i < 70; i++) {
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

    // Если режим РЕАЛЬНЫЙ и баланс равен 0 (или меньше цены), открываем окно оплаты
    if (!isDemo && balance < currentPrice) {
      openDepositModal();
      return;
    }

    setIsSpinning(true);

    let winningIndex = 45; // Индекс выигрышного элемента в ленте
    
    // ЛОГИКА ДЕМО-РЕЖИМА: Подкручиваем дорогой приз (например, Кубок или Торт с шансом 80%)
    if (isDemo) {
      const luckyPrizes = PRIZES.filter(p => p.value >= 50);
      const fakeWinner = luckyPrizes[Math.floor(Math.random() * luckyPrizes.length)];
      carouselItems[winningIndex] = { ...fakeWinner, uniqueId: 'won-demo' };
    } else {
      // Реальный режим: честный рандом на основе весов (chance)
      setBalance(prev => prev - currentPrice);
      const rand = Math.random() * 100;
      let cumulative = 0;
      let realWinner = PRIZES[PRIZES.length - 1];
      
      for (const prize of PRIZES) {
        cumulative += prize.chance;
        if (rand <= cumulative) {
          realWinner = prize;
          break;
        }
      }
      carouselItems[winningIndex] = { ...realWinner, uniqueId: 'won-real' };
    }

    // Расчет смещения: ширина карточки 110px + отступ 12px
    const cardWidth = 110;
    const gap = 12;
    const itemWidth = cardWidth + gap;
    
    // Центрируем выигрышный элемент относительно центра экрана (отнимаем отступы контейнера)
    const offset = -(winningIndex * itemWidth - itemWidth);

    setTimeout(() => {
      if (carouselRef.current) {
        carouselRef.current.style.transition = 'transform 4s cubic-bezier(0.1, 0.8, 0.1, 1)';
        carouselRef.current.style.transform = `translateX(${offset}px)`;
      }
    }, 50);

    setTimeout(() => {
      const finalPrize = carouselItems[winningIndex];
      // На реальном балансе прибавляем выигрыш
      if (!isDemo) {
        setBalance(prev => prev + finalPrize.value);
      }
      setIsSpinning(false);
    }, 4200);
  };

  return (
    <div className="cases-container">
      {/* РУЛЕТКА */}
      <div className="roulette-box">
        <div className="arrow-marker top-arrow"></div>
        <div className="arrow-marker bottom-arrow"></div>
        <div className="roulette-viewport">
          <div className="roulette-track" ref={carouselRef}>
            {carouselItems.map((item) => (
              <div key={item.uniqueId} className="roulette-card">
                <div className="item-emoji" style={{ textShadow: `0 0 20px ${item.color}40` }}>
                  {item.emoji}
                </div>
                <div className="item-badge-value">
                  {item.value} <span className="small-star">★</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ДЕМО РЕЖИМ СВИТЧ */}
      <div className="demo-panel">
        <span className="demo-label">Демо режим</span>
        <label className="tg-switch">
          <input 
            type="checkbox" 
            checked={isDemo} 
            disabled={isSpinning} 
            onChange={(e) => {
              setIsDemo(e.target.checked);
              generateItems();
            }} 
          />
          <span className="tg-slider"></span>
        </label>
      </div>

      {/* КНОПКА ОТКРЫТИЯ */}
      <button 
        className={`tg-main-button ${isSpinning ? 'spinning' : ''}`} 
        onClick={startSpin}
        disabled={isSpinning}
      >
        {isSpinning ? 'Открытие...' : `Мне повезет! ${currentPrice} ★`}
      </button>

      {/* СЕТКА ВЫИГРЫШЕЙ */}
      <div className="loot-preview-section">
        <div className="preview-title">
          Вы можете выиграть... <span className="nft-link">NFT?</span>
        </div>
        <div className="preview-grid">
          {PRIZES.map((prize) => (
            <div key={prize.id} className="preview-card">
              <div className="preview-chance">{prize.chance}% 🎲</div>
              <div className="preview-emoji">{prize.emoji}</div>
              <div className="preview-value">
                {prize.value} <span className="gold-star">★</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
