import React from 'react'
import Link from 'next/link'
import { Razor } from '../../lib/supabase'
import SafeImage from '../common/SafeImage'

interface RazorCardProps {
  razor: Razor;
  isFavorite?: boolean;
  isAdmin?: boolean;
  isCreator?: boolean;
}

const RazorCard: React.FC<RazorCardProps> = ({ razor, isFavorite, isAdmin, isCreator }) => {
  // Couleur basée sur le niveau de douceur
  const getGentlenessColor = (level: number) => {
    if (level <= 5) return 'bg-gentleness-mild'; // Très doux
    if (level <= 10) return 'bg-gentleness-medium'; // Doux
    if (level <= 15) return 'bg-gentleness-moderate'; // Moyen
    return 'bg-gentleness-aggressive'; // Agressif
  };

  // Texte descriptif de la douceur
  const getGentlenessText = (level: number) => {
    if (level <= 5) return 'Très doux';
    if (level <= 10) return 'Doux';
    if (level <= 15) return 'Moyen';
    return 'Agressif';
  };

  return (
    <div className="card hover:shadow-xl transition-all border-2 border-gray-100 dark:border-gray-700">
      <Link href={`/razors/${razor.id}`} className="focus-outline rounded-lg block">
        <div className="relative h-52 rounded-t overflow-hidden">
          {razor.image_url ? (
            <SafeImage 
              src={razor.image_url} 
              alt={`${razor.manufacturer} ${razor.model}`}
              width={400}
              height={300}
              className="w-full h-full"
              objectFit="cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gray-200 dark:bg-gray-700">
              <span className="text-gray-500 dark:text-gray-400 text-lg">Pas d'image</span>
            </div>
          )}
          
          {isFavorite && (
            <div className="absolute top-3 right-3 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl">
              ❤️
            </div>
          )}
        </div>
        
        <div className="p-5">
          <h3 className="text-xl font-bold mb-2 text-high-contrast">
            {razor.manufacturer} {razor.model}
          </h3>
          
          <p className="text-medium-contrast text-lg mb-3">
            Réf: {razor.reference || 'N/A'}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-lg font-medium text-medium-contrast">{razor.blade_type}</span>
            
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg">
              <div className={`w-5 h-5 rounded-full ${getGentlenessColor(razor.avg_gentleness)}`}></div>
              <span className="font-medium text-lg">
                {razor.avg_gentleness}/20
              </span>
              <span className="sr-only">{getGentlenessText(razor.avg_gentleness)}</span>
            </div>
          </div>
        </div>
      </Link>
      {(isAdmin || isCreator) && (
        <div className="absolute top-3 right-16">
          <Link href={`/razors/edit/${razor.id}`}>
            <button 
              className="bg-orange-100 hover:bg-orange-200 text-orange-600 rounded-full w-10 h-10 flex items-center justify-center text-xl shadow-md focus-outline"
              title="Éditer ce rasoir"
              aria-label="Éditer ce rasoir"
            >
              ✏️
            </button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default RazorCard;
