import React, { useState, useEffect, useRef } from 'react';

// Оригинальный список призов. Названия картинок должны совпадать с файлами в папке public/
const PRIZES = [
  { id: 1, name: 'Кубок Лидера', value: 100, chance: 0.612, img: '/cup.png', color: '#ffb300' },
  { id: 2, name: 'Роза', value: 25, chance: 29.53, img: '/rose.png', color: '#ff2d55' },
  { id: 3, name: 'Праздничный торт', value: 50, chance: 0.282, img: '/cake.png', color: '#ff9500' },
  { id: 4, name: 'Плюшевый мишка', value: 15, chance: 50.0, img: '/bear.png', color: '#ac8e68' },
  { id: 5, name: 'Шампанское', value: 50, chance: 19.576, img: '/champagne.png', color: '#4cd964' }
];

export default function CasesPage({ balance, setBalance, openDepositModal, isDemo, setIsDemo }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [carouselItems, setCarouselItems] = useState([]);
  const [winningPrize, setWinningPrize] = useState(null);
  const currentPrice = 25;
  const carouselRef = useRef(null);

  useEffect(() => {
    generateItems();
  }, []);

  const generateItems = () => {
    const items = [];
    // Наполняем ленту (70 элементов для долгой красивой прокрутки)
    for (let i = 0; i < 70; i++) {
      const randomPrize = PRIZES[Math.floor(Math.random() * PRIZES.length)];
      items.push({ ...randomPrize, uniqueId: `${i}-${Date.now()}` });
    }
    setCarouselItems(items);
    
    // Сброс позиции в 0
    if (carouselRef.current) {
      carouselRef.current.style.transition = 'none';
      carouselRef.current.style.transform = 'translateX(0px)';
    }
  };

  const startSpin = () => {
    if (isSpinning) return;

    // Проверка баланса
    if (!isDemo && balance < currentPrice) {
      openDepositModal();
      return;
    }

    setWinningPrize(null);
    setIsSpinning(true);

    // Мгновенный сброс ленты перед новым стартом, чтобы можно было крутить повторно бесконечно
    if (carouselRef.current) {
      carouselRef.current.style.transition = 'none';
      carouselRef.current.style.transform = 'translateX(0px)';
    }

    // Микро-таймаут для сброса анимации в браузере
    setTimeout(() => {
      let winningIndex = 45; // Предмет, который остановится по центру под стрелочками
      let finalWinner;

      if (isDemo) {
        // Подкрученный шанс для демо-режима (выбираем дорогие призы)
        const luckyPrizes = PRIZES.filter(p => p.value >= 50);
        finalWinner = luckyPrizes[Math.floor(Math.random() * luckyPrizes.length)];
      } else {
        // Честный рандом по процентам
        setBalance(prev => prev - currentPrice);
        const rand = Math.random() * 100;
        let cumulative = 0;
        finalWinner = PRIZES[PRIZES.length - 1];

        for (const prize of PRIZES) {
          cumulative += prize.chance;
          if (rand <= cumulative) {
            finalWinner = prize;
            break;
          }
        }
      }

      // Внедряем победителя на 45-ю позицию в карусели
      setCarouselItems(prev => {
        const updated = [...prev];
        updated[winningIndex] = { ...finalWinner, uniqueId: `winner-${Date.now()}` };
        return updated;
      });

      // Расчет точного сдвига (ширина карточки 110px + отступ 12px)
      const cardWidth = 110;
      const gap = 12;
      const itemWidth = cardWidth + gap;
      const offset = -(winningIndex * itemWidth - itemWidth);

      if (carouselRef.current) {
        carouselRef.current.style.transition = 'transform 4s cubic-bezier(0.1, 0.8, 0.1, 1)';
        carouselRef.current.style.transform = `translateX(${offset}px)`;
      }

      // Окончание анимации вращения
      setTimeout(() => {
        if (!isDemo) {
          setBalance(prev => prev + finalWinner.value);
        }
        setWinningPrize(finalWinner);
        setIsSpinning(false);
      }, 4200);
    }, 50);
  };

  return (
    <div className="cases-container">
      {/* ЛЕНТА РУЛЕТКИ */}
      <div className="roulette-box">
        <div className="arrow-marker top-arrow"></div>
        <div className="arrow-marker bottom-arrow"></div>
        <div className="roulette-viewport">
          <div className="roulette-track" ref={carouselRef}>
            {carouselItems.map((item) => (
              <div key={item.uniqueId} className="roulette-card">
                <div className="image-wrapper">
                  <img src={item.img} alt={item.name} className="roulette-prize-img" onError={(e) => e.target.style.display = 'none'} />
                  <span className="fallback-text">{item.name}</span>
                </div>
                <div className="item-badge-value">
                  {item.value} <span className="small-star">★</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ПЕРЕКЛЮЧАТЕЛЬ ДЕМО */}
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

      {/* ГЛАВНАЯ КНОПКА ВО ВЕСЬ ЭКРАН */}
      <div className="btn-wrapper">
        <button 
          className={`tg-main-button ${isSpinning ? 'spinning' : ''}`} 
          onClick={startSpin}
          disabled={isSpinning}
        >
          {isSpinning ? 'Открытие...' : `Мне повезет! ${currentPrice} ★`}
        </button>
      </div>

      {/* СЕТКА ШАНСОВ ПРИЗОВ */}
      <div className="loot-preview-section">
        <div className="preview-title">
          Вы можете выиграть... <span className="nft-link">NFT?</span>
        </div>
        <div className="preview-grid">
          {PRIZES.map((prize) => (
            <div key={prize.id} className="preview-card">
              <div className="preview-chance">{prize.chance}% 🎲</div>
              <div className="grid-image-wrapper">
                <img src={prize.img} alt={prize.name} className="grid-prize-img" onError={(e) => e.target.style.display = 'none'} />
                <span className="fallback-grid-text">{prize.name}</span>
              </div>
              <div className="preview-value">
                {prize.value} <span className="gold-star">★</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ОКНО АНИМАЦИИ И РЕЗУЛЬТАТА ВЫИГРЫША */}
      {winningPrize && (
        <div className="win-overlay" onClick={() => setWinningPrize(null)}>
          <div className="win-popup-card" onClick={(e) => e.stopPropagation()} style={{'--shadow-color': winningPrize.color}}>
            <div className="win-glow-effect"></div>
            <span className="win-title">ПОЗДРАВЛЯЕМ!</span>
            <p className="win-subtitle">Вы выиграли предмет:</p>
            <img src={winningPrize.img} alt={winningPrize.name} className="win-animated-img" onError={(e) => e.target.style.opacity = '0.3'} />
            <h2 className="win-item-name">{winningPrize.name}</h2>
            <div className="win-reward-badge">+{winningPrize.value} ⭐ зачислено</div>
            <button className="win-close-btn" onClick={() => setWinningPrize(null)}>Отлично</button>
          </div>
        </div>
      )}
    </div>
  );
}
