import React, { useState } from 'react';
import Image, { ImageProps } from 'next/image';

interface SafeImageProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
}

/**
 * Un composant d'image sécurisé qui affiche une image de secours en cas d'erreur
 */
const SafeImage: React.FC<SafeImageProps> = ({
  src,
  alt,
  fallbackSrc = '/images/placeholder.png', // Image de secours par défaut
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  // Gérer les erreurs de chargement d'image
  const handleError = () => {
    if (!hasError) {
      setImgSrc(fallbackSrc);
      setHasError(true);
    }
  };

  return (
    <Image 
      {...props} 
      src={imgSrc} 
      alt={alt} 
      onError={handleError}
    />
  );
};

export default SafeImage;
