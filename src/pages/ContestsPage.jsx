import React from 'react';

export default function ContestsPage() {
  return (
    <div className="page-padding">
      <h2 className="section-title">Бесплатные конкурсы</h2>
      
      <div className="contest-card">
        <div className="contest-card-header">
          <span>Gifts x100</span>
          <span style={{color: '#fbc02d'}}>⏱️ 12 дней 17:24:43</span>
        </div>
        
        <div className="contest-card-body">
          <div className="contest-box-emoji">🎁</div>
          <div className="contest-rewards">
            <span style={{color: '#22c55e'}}>💎 0.25</span> / <span style={{color: '#fbc02d'}}>⭐ 25</span>
          </div>
          <div className="contest-participants">Участники: 692</div>
        </div>
        
        <button className="contest-join-btn" onClick={() => alert('Вы приняли участие!')}>
          Участвовать
        </button>
      </div>
    </div>
  );
}
