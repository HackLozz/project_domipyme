// StarRating.jsx - Componente para mostrar y seleccionar ratings
import React, { useState } from 'react';
import '../styles.css';

const StarRating = ({ 
  rating = 0, 
  interactive = false, 
  onChange = null, 
  size = 'medium',
  showLabel = false,
  maxStars = 5 
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(rating);

  const sizes = {
    small: '16px',
    medium: '24px',
    large: '32px',
    xlarge: '48px'
  };

  const handleClick = (star) => {
    if (!interactive) return;
    setSelectedRating(star);
    if (onChange) {
      onChange(star);
    }
  };

  const handleMouseEnter = (star) => {
    if (!interactive) return;
    setHoverRating(star);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setHoverRating(0);
  };

  const displayRating = interactive ? (hoverRating || selectedRating) : rating;
  const fullStars = Math.floor(displayRating);
  const hasHalfStar = displayRating % 1 >= 0.5;

  return (
    <div className="star-rating-container">
      <div 
        className={`star-rating ${interactive ? 'interactive' : ''}`}
        style={{ fontSize: sizes[size] || sizes.medium }}
      >
        {[...Array(maxStars)].map((_, index) => {
          const starNumber = index + 1;
          let starClass = 'star';
          
          if (starNumber <= fullStars) {
            starClass += ' filled';
          } else if (starNumber === fullStars + 1 && hasHalfStar && !interactive) {
            starClass += ' half';
          } else {
            starClass += ' empty';
          }

          return (
            <span
              key={starNumber}
              className={starClass}
              onClick={() => handleClick(starNumber)}
              onMouseEnter={() => handleMouseEnter(starNumber)}
              onMouseLeave={handleMouseLeave}
              style={{ cursor: interactive ? 'pointer' : 'default' }}
            >
              {starNumber <= fullStars || (starNumber === fullStars + 1 && hasHalfStar && !interactive) ? '★' : '☆'}
            </span>
          );
        })}
      </div>
      {showLabel && (
        <span className="rating-label">
          {displayRating.toFixed(1)} / {maxStars}
        </span>
      )}
    </div>
  );
};

export default StarRating;
