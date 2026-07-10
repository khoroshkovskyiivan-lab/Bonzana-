import React, { useState } from 'react';

export default function LeadersPage() {
  const [listType, setListType] = useState('regional'); // 'regional' или 'global'

  const regionalList = [
    { name: "Cuddly Zebra", xp: "164 398 xp", rank: "🥇" },
    { name: "Funny Kitten", xp: "99 873 xp", rank: "🥈" },
    { name: "Hardy Rabbit", xp: "91 175 xp", rank: "🥉" },
    { name: "Fluffy Ibex", xp: "41 475 xp", rank: "#4" }
  ];

  const globalList = [
    { name: "Groovy Python", xp: "310 938 xp", rank: "🥇" },
    { name: "Cuddly Zebra", xp: "164 398 xp", rank: "🥈" },
    { name: "Calm Shrimp", xp: "157 951 xp", rank: "🥉" },
    { name: "@QWX_YT", xp: "155 360 xp", rank: "#4" }
  ];

  const currentData = listType === 'regional' ? regionalList : globalList;

  return (
    <div className="page-padding">
      <h2 className="section-title text-center">Таблица лидеров</h2>
      <p className="section-subtitle">Тут ви можете побачити найактивніших гравців</p>

      <div className="leader-toggle-tabs">
        <button className={`toggle-tab-btn ${listType === 'regional' ? 'active' : ''}`} onClick={() => setListType('regional')}>
          Регіональний
        </button>
        <button className={`toggle-tab-btn ${listType === 'global' ? 'active' : ''}`} onClick={() => setListType('global')}>
          Глобальний
        </button>
      </div>

      <div className="leaderboard-rows-list">
        {currentData.map((player, idx) => (
          <div className="leader-row-item" key={idx}>
            <div className="leader-player-left">
              <div className="leader-avatar-stub">{player.name[0]}</div>
              <div>
                <div className="player-row-name">{player.name}</div>
                <div className="player-row-xp">{player.xp}</div>
              </div>
            </div>
            <div className="player-row-rank">{player.rank}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
