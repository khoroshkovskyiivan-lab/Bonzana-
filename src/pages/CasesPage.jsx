import React from 'react';

export default function CasesPage() {
  return (
    <div className="page-padding">
      <div className="banner-promo">
        <div className="banner-details">
          <div className="banner-title">Gifts x100</div>
          <div className="banner-sub">💎 0.25</div>
          <div className="banner-timer">⏱️ 12 дней 17:29:13</div>
        </div>
        <div className="banner-emoji">🎁</div>
      </div>

      <h2 className="section-title">Паки с гифтами</h2>
      
      <div className="cases-grid">
        <div className="pack-card" onClick={() => alert('Покупка Стандартного пака')}>
          <div className="pack-image-placeholder normal-hue"></div>
          <div className="pack-name">Стандартный</div>
          <div className="pack-price">⭐ 300</div>
        </div>
        
        <div className="pack-card" onClick={() => alert('Покупка Ценного пака')}>
          <div className="pack-image-placeholder precious-hue"></div>
          <div className="pack-name">Ценный</div>
          <div className="pack-price">⭐ 800</div>
        </div>
      </div>
    </div>
  );
}
