import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import SafeImage from '../common/SafeImage';
import { Razor } from '../../lib/supabase';
import { addToComparisonList, removeFromComparisonList, isInComparisonList, getComparisonList } from '../../lib/compareService';
import GentlenessIndicator from './GentlenessIndicator';

interface RazorListItemProps {
  razor: Razor;
  isFavorite?: boolean;
  isAdmin?: boolean;
  position?: number;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
  onRemove?: (id: number) => void;
  collectionType?: 'owned' | 'wishlist' | 'favorite';
  variantMaterial?: string | null;
  variantFinish?: string | null;
  variantCombType?: string | null;
  variantNotes?: string | null;
  isVariant?: boolean | null;
  collection?: any;
  showCollectionStatus?: boolean;
  showFavoriteRank?: boolean;
}

const RazorListItem: React.FC<RazorListItemProps> = ({ 
  razor, 
  isFavorite, 
  isAdmin, 
  position,
  onMoveUp,
  onMoveDown,
  onRemove,
  collectionType,
  variantMaterial,
  variantFinish,
  variantCombType,
  variantNotes,
  isVariant,
  collection,
  showCollectionStatus,
  showFavoriteRank
}) => {
  const router = useRouter();
  const [isInComparison, setIsInComparison] = React.useState(false);
  
  // Vérifier si le rasoir est déjà dans la liste de comparaison
  React.useEffect(() => {
    setIsInComparison(isInComparisonList(razor.id));
  }, [razor.id]);
  
  // Fonction pour ajouter à la comparaison
  const handleComparisonToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Si déjà dans la comparaison, on le retire
    if (isInComparison) {
      removeFromComparisonList(razor.id);
      setIsInComparison(false);
      return;
    }
    
    // Vérifier si on n'a pas déjà 4 rasoirs dans la comparaison
    const currentList = getComparisonList();
    if (currentList.length >= 4) {
      alert('Vous ne pouvez comparer que 4 rasoirs à la fois. Veuillez en retirer un avant d\'en ajouter un autre.');
      return;
    }
    
    // Ajouter à la comparaison
    addToComparisonList(razor.id);
    setIsInComparison(true);
  };
  
  // Fonction pour aller à la page de comparaison
  const goToComparison = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push('/compare');
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center gap-6 p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all border border-gray-100 dark:border-gray-700 mb-6">
      {showFavoriteRank && position !== undefined && (
        <div className="flex-shrink-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg" aria-label={`Position ${position} dans les favoris`}>
          #{position}
        </div>
      )}
      
      <div className="flex-shrink-0 w-24 h-24 relative">
        <Link href={`/razors/${razor.id}`} className="focus-outline block">
          {razor.image_url ? (
            <SafeImage
              src={razor.image_url}
              alt={`${razor.manufacturer} ${razor.model}`}
              width={96}
              height={96}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
              <span className="text-gray-500 dark:text-gray-400 text-lg">N/A</span>
            </div>
          )}
        </Link>
      </div>
      
      <div className="flex-grow">
        <Link 
          href={`/razors/${razor.id}`}
          className="text-xl font-bold hover:text-primary focus-outline text-high-contrast"
        >
          {razor.manufacturer} {razor.model}
          {razor.reference && ` (${razor.reference})`}
        </Link>
        
        <div className="flex flex-wrap items-center mt-3 gap-4">
          <span className="text-sm text-medium-contrast font-medium px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            Type: {razor.blade_type}
          </span>
          
          {razor.avg_gentleness !== undefined && razor.avg_gentleness !== null && (
            <div className="flex items-center">
              <GentlenessIndicator value={razor.avg_gentleness} size="medium" />
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                ({razor.gentleness_votes_count || 0} vote{razor.gentleness_votes_count !== 1 ? 's' : ''})
              </span>
            </div>
          )}
        </div>
        
        {showCollectionStatus && (
          <div className="mt-3">
            {collection?.in_wishlist ? (
              <span className="inline-block px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg">
                Dans votre liste de souhaits
              </span>
            ) : (
              <span className="inline-block px-3 py-1 text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-lg">
                Dans votre collection
              </span>
            )}
            
            {collection?.is_favorite && (
              <span className="inline-block ml-2 px-3 py-1 text-sm font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 rounded-lg">
                Favori
              </span>
            )}
          </div>
        )}
        
        {isVariant && (
          <div className="mt-3 p-2 border-l-4 border-primary bg-gray-50 dark:bg-gray-700 rounded">
            <h4 className="text-sm font-semibold text-primary mb-1">Variante personnalisée</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              {variantMaterial && (
                <div>
                  <span className="font-medium">Matériau:</span> {variantMaterial}
                </div>
              )}
              {variantFinish && (
                <div>
                  <span className="font-medium">Finition:</span> {variantFinish}
                </div>
              )}
              {variantCombType && (
                <div>
                  <span className="font-medium">Type de peigne:</span> {variantCombType}
                </div>
              )}
            </div>
            {variantNotes && (
              <div className="mt-1 text-sm italic">
                <span className="font-medium">Notes:</span> {variantNotes}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="flex-shrink-0 mt-4 md:mt-0 w-full md:w-auto flex flex-col">
        <Link 
          href={`/razors/${razor.id}`}
          className="btn-secondary block text-center w-full md:w-auto mb-2"
        >
          Voir les détails
        </Link>
        
        <button 
          onClick={handleComparisonToggle} 
          className={`text-sm px-3 py-1 border rounded mb-2 transition ${
            isInComparison 
              ? 'bg-green-500 hover:bg-red-500 text-white border-green-600 hover:border-red-600' 
              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {isInComparison ? '✓ Retirer de la comparaison' : '+ Ajouter à la comparaison'}
        </button>
        
        {isInComparison && (
          <button 
            onClick={goToComparison} 
            className="text-sm px-3 py-1 border border-blue-300 dark:border-blue-600 rounded mb-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-blue-600 dark:text-blue-400"
          >
            Voir la comparaison
          </button>
        )}
        
        {showFavoriteRank && position !== undefined && typeof onMoveUp === 'function' && typeof onMoveDown === 'function' && (
          <div className="flex space-x-1">
            <button 
              onClick={() => onMoveUp(position)}
              className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
              disabled={position === 1}
              aria-label="Déplacer vers le haut dans les favoris"
            >
              ↑
            </button>
            <button 
              onClick={() => {
                console.log('Down button clicked with position:', position);
                onMoveDown(position);
              }}
              className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
              aria-label="Déplacer vers le bas dans les favoris"
            >
              ↓
            </button>
            <button 
              onClick={() => onRemove && onRemove(razor.id)}
              className="text-sm px-3 py-1 border border-red-300 rounded hover:bg-red-100 text-red-600"
              aria-label="Retirer des favoris"
            >
              ×
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RazorListItem;
