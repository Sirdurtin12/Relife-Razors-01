import React from 'react';

interface StarRatingProps {
  rating: number; // De 0 à 5, supporte les demi-étoiles (ex: 3.5)
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

/**
 * Composant d'affichage des étoiles pour les notations
 * Supporte les étoiles pleines et les demi-étoiles
 */
const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  showValue = true
}) => {
  // Constantes pour les tailles
  const sizes = {
    sm: {
      starClass: 'w-4 h-4',
      textClass: 'text-xs'
    },
    md: {
      starClass: 'w-6 h-6',
      textClass: 'text-sm'
    },
    lg: {
      starClass: 'w-8 h-8',
      textClass: 'text-base'
    }
  };
  
  // S'assurer que la note est entre 0 et maxRating
  const safeRating = Math.max(0, Math.min(rating, maxRating));
  
  // Calculer le nombre d'étoiles pleines et de demi-étoiles
  const fullStars = Math.floor(safeRating);
  const hasHalfStar = safeRating % 1 >= 0.25 && safeRating % 1 <= 0.75;
  const remainingStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);
  
  return (
    <div className="flex items-center">
      <div className="flex">
        {/* Étoiles pleines */}
        {[...Array(fullStars)].map((_, i) => (
          <svg 
            key={`full-${i}`} 
            className={`${sizes[size].starClass} text-amber-500`} 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
        
        {/* Demi-étoile */}
        {hasHalfStar && (
          <svg 
            key="half" 
            className={`${sizes[size].starClass} text-amber-500`} 
            viewBox="0 0 24 24"
          >
            <defs>
              <linearGradient id="halfGradient">
                <stop offset="50%" stopColor="#F59E0B" />
                <stop offset="50%" stopColor="#D1D5DB" />
              </linearGradient>
            </defs>
            <path 
              fill="url(#halfGradient)" 
              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" 
            />
          </svg>
        )}
        
        {/* Étoiles vides */}
        {[...Array(remainingStars)].map((_, i) => (
          <svg 
            key={`empty-${i}`} 
            className={`${sizes[size].starClass} text-gray-300 dark:text-gray-600`} 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
      
      {showValue && (
        <span className={`ml-2 ${sizes[size].textClass} font-medium text-gray-700 dark:text-gray-300`}>
          {safeRating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
