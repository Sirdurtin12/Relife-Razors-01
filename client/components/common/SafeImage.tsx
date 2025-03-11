import React, { useState, useEffect } from 'react';
import Image from 'next/image';

interface SafeImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  objectFit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
}

/**
 * SafeImage component that handles any image URL without domain restrictions
 * Falls back to a regular img tag if the URL is not from a whitelisted domain
 */
const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  alt, 
  width, 
  height, 
  className = '', 
  objectFit = 'cover' 
}) => {
  const [error, setError] = useState(false);
  const [cleanedSrc, setCleanedSrc] = useState(src);
  
  // Nettoyer l'URL si nécessaire
  useEffect(() => {
    try {
      // Vérifier si l'URL est une URL de redirection Google
      if (src.includes('google.com/url')) {
        // Extraire l'URL réelle du paramètre 'url'
        const urlParams = new URLSearchParams(new URL(src).search);
        const actualUrl = urlParams.get('url');
        if (actualUrl) {
          setCleanedSrc(decodeURIComponent(actualUrl));
          return;
        }
      }
      
      // Si ce n'est pas une URL de redirection, utiliser l'URL d'origine
      setCleanedSrc(src);
    } catch (e) {
      console.error('Error processing image URL:', e);
      setCleanedSrc(src);
    }
  }, [src]);

  // Function to check if the URL is from a whitelisted domain
  const isWhitelistedDomain = () => {
    try {
      const url = new URL(cleanedSrc);
      const whitelistedDomains = [
        'atelierdurdan.com',
        'iiflwzoslnekvkbciyht.supabase.co',
        'iiflwzoslnekvkbciyht.supabase.in',
        'lh3.googleusercontent.com',
        'avatars.githubusercontent.com',
        'images.unsplash.com',
        'www.google.com',
        'google.com'
      ];
      
      return whitelistedDomains.some(domain => url.hostname.includes(domain));
    } catch (e) {
      return false;
    }
  };

  // If the URL is not from a whitelisted domain or there was an error loading the image,
  // fall back to a regular img tag
  if (error || !isWhitelistedDomain()) {
    return (
      <img 
        src={cleanedSrc} 
        alt={alt} 
        width={width} 
        height={height} 
        className={className}
        style={{ objectFit }}
        onError={() => setError(true)}
        fetchPriority="auto"
      />
    );
  }

  // Otherwise, use Next.js Image component with properly cased props
  return (
    <Image 
      src={cleanedSrc} 
      alt={alt} 
      width={width} 
      height={height} 
      className={className}
      style={{ objectFit }}
      onError={() => setError(true)}
      fetchPriority="auto"
    />
  );
};

export default SafeImage;
