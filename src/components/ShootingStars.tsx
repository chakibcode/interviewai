import React from 'react';
import './ShootingStars.css';

const ShootingStars = () => {
  const starCount = 50;
  const stars = Array.from({ length: starCount }, (_, i) => <div key={i} className="star"></div>);

  return (
    <div className="stars-container">
      <div className="stars">{stars}</div>
    </div>
  );
};

export default ShootingStars;