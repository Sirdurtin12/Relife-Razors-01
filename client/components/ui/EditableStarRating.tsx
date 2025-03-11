import React from 'react';

interface EditableStarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  label?: string;
  className?: string;
}

/**
 * Composant d'édition des étoiles pour les revues
 */
const EditableStarRating: React.FC<EditableStarRatingProps> = ({ 
  rating, 
  onChange,
  size = 'md', 
  showValue = true,
  label,
  className = '' 
}) => {
  // Gestion de la taille des étoiles
  const starSize = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      {label && (
        <label className={`font-medium ${textSize[size]} text-gray-700 dark:text-gray-300`}>
          {label}
        </label>
      )}
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <svg 
              className={`${starSize[size]} ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} cursor-pointer hover:text-yellow-500`} 
              fill="currentColor" 
              viewBox="0 0 20 20" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
        {showValue && (
          <span className={`ml-2 ${textSize[size]} font-medium text-gray-600 dark:text-gray-400`}>
            {rating}/5
          </span>
        )}
      </div>
    </div>
  );
};

export default EditableStarRating;
