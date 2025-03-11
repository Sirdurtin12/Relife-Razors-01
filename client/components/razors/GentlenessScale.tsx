import React, { useEffect, useState, useMemo } from 'react'
import { Razor } from '../../lib/supabase'

interface GentlenessScaleProps {
  razors?: Razor[];
  gentleness?: number;
  currentRazorId?: number;
  showLabels?: boolean;
  compact?: boolean;
  razorlabels?: boolean;
  showMarkers?: boolean;
}

const GentlenessScale: React.FC<GentlenessScaleProps> = ({ 
  razors, 
  gentleness, 
  currentRazorId,
  showLabels = true,
  compact = false,
  razorlabels = false,
  showMarkers = true
}) => {
  // Gérer les deux cas d'utilisation: un tableau de rasoirs ou une seule valeur de douceur
  const validRazors = useMemo(() => {
    return razors 
      ? razors.filter(r => r.avg_gentleness >= 1 && r.avg_gentleness <= 20)
      : gentleness ? [{ id: -1, avg_gentleness: gentleness } as Razor] : [];
  }, [razors, gentleness]);

  // Obtenir les couleurs distinctes pour chaque rasoir (jusqu'à 10 couleurs)
  const colors = [
    'rgb(255, 0, 0)', // rouge
    'rgb(255, 165, 0)', // orange
    'rgb(255, 255, 0)', // jaune
    'rgb(0, 128, 0)', // vert
    'rgb(0, 0, 255)', // bleu
    'rgb(75, 0, 130)', // indigo
    'rgb(238, 130, 238)', // violet
    'rgb(255, 192, 203)', // rose
    'rgb(245, 245, 245)', // gris clair
    'rgb(128, 128, 128)', // gris foncé
  ];

  // Fonction pour déterminer le texte de niveau de douceur
  const getGentlenessText = (level: number) => {
    if (level <= 3) return 'Très doux';
    if (level <= 7) return 'Doux';
    if (level <= 12) return 'Intermédiaire';
    if (level <= 17) return 'Agressif';
    return 'Très agressif';
  };

  // Organiser les rasoirs par groupes de douceur pour éviter les chevauchements
  const organizeRazorsByGroups = useMemo(() => {
    // Diviser l'échelle en groupes plus petits pour un meilleur positionnement
    const groups = Array.from({ length: 20 }, (_, i) => ({
      value: i + 1,
      razors: []
    }));

    // Répartir les rasoirs dans les groupes
    validRazors.forEach(razor => {
      const groupIndex = Math.floor(razor.avg_gentleness) - 1;
      if (groupIndex >= 0 && groupIndex < groups.length) {
        groups[groupIndex].razors.push(razor);
      }
    });

    return groups;
  }, [validRazors]);

  const [groups, setGroups] = useState(organizeRazorsByGroups);

  // Pour le rendu, utiliser directement organizeRazorsByGroups au lieu de groups
  useEffect(() => {
    setGroups(organizeRazorsByGroups);
  }, [organizeRazorsByGroups]);

  // Style dynamique pour la hauteur du conteneur en fonction du nombre maximum de rasoirs dans un groupe
  const [containerHeight, setContainerHeight] = useState(compact ? 'h-6' : 'h-12');

  // Dépendances pour useEffect
  useEffect(() => {
    // Ajuster la hauteur de l'échelle en fonction du nombre maximum de rasoirs dans un groupe
    const maxRazorsInGroup = Math.max(...organizeRazorsByGroups.map(g => g.razors.length));
    
    // Définir la hauteur du conteneur en fonction du nombre maximum de rasoirs dans un groupe
    if (compact) {
      setContainerHeight('h-6');
    } else if (maxRazorsInGroup <= 1) {
      setContainerHeight('h-12');
    } else if (maxRazorsInGroup <= 2) {
      setContainerHeight('h-16');
    } else if (maxRazorsInGroup <= 3) {
      setContainerHeight('h-20');
    } else {
      setContainerHeight('h-24');
    }
  }, [organizeRazorsByGroups, compact]);

  return (
    <div className={`${compact ? 'my-1' : 'my-4'}`}>
      <div className={`relative ${containerHeight} bg-gradient-to-r from-gentleness-veryMild via-gentleness-mild via-gentleness-neutral via-gentleness-moderate to-gentleness-aggressive dark:from-yellow-100 dark:via-yellow-500 dark:via-orange-500 dark:via-red-500 dark:to-red-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700`}>
        {/* Marqueurs de rasoirs */}
        {organizeRazorsByGroups.map((group, groupIndex) => {
          if (group.razors.length === 0) return null;
          
          const position = ((group.value - 1) / 19) * 100;
          
          return group.razors.map((razor, index) => {
            // Générer une couleur de marqueur unique pour chaque rasoir
            const razorIndex = validRazors.findIndex(r => r.id === razor.id);
            const markerColors = [
              'bg-red-500 border-red-700 text-white',
              'bg-blue-500 border-blue-700 text-white',
              'bg-green-500 border-green-700 text-white',
              'bg-amber-500 border-amber-700 text-white'
            ];
            
            const markerColor = markerColors[razorIndex % markerColors.length];
            
            // Calculer le décalage vertical pour éviter les chevauchements
            // Chaque marqueur supplémentaire dans le même groupe sera placé légèrement plus bas
            const verticalOffset = index * 15; // Décalage en pourcentage (par rapport à la hauteur du container)
            
            return (
              <div 
                key={razor.id}
                className={`absolute ${compact ? 'w-5 h-5' : 'w-7 h-7'} rounded-full ${markerColor} border-2 transform -translate-x-1/2 z-10 flex items-center justify-center font-bold text-xs sm:text-sm`}
                style={{ 
                  left: `${position}%`, 
                  top: compact ? '50%' : `calc(50% - ${verticalOffset}px)`, 
                  transform: 'translate(-50%, -50%)'
                }}
                title={`${razor.manufacturer} ${razor.model}: ${razor.avg_gentleness}/20`}
              >
                {showLabels && !razorlabels && (
                  <span className={`${compact ? 'text-[8px]' : 'text-xs'}`}>{razor.avg_gentleness}</span>
                )}
                {razorlabels && (
                  <span className={`${compact ? 'text-[8px]' : 'text-xs'}`}>{razorIndex + 1}</span>
                )}
              </div>
            );
          });
        })}
      </div>
      
      {/* Traits de graduation à l'unité */}
      {showMarkers && !compact && (
        <div className="relative h-2 w-full mt-1">
          {Array.from({ length: 20 }, (_, i) => i + 1).map((value) => {
            // Calcul précis de la position pour chaque graduation
            const position = ((value - 1) / 19) * 100;
            const isMainGraduation = value % 5 === 0 || value === 1;
            return (
              <div 
                key={value} 
                className={`absolute transform -translate-x-1/2 bg-gray-500 dark:bg-gray-400 ${isMainGraduation ? 'h-2 w-0.5' : 'h-1 w-0.5'}`}
                style={{ left: `${position}%` }}
              ></div>
            );
          })}
        </div>
      )}
      
      {/* Graduations sous la frise */}
      {showMarkers && (
        <div className="relative w-full mt-3 h-5">
          {/* Positions exactes calculées avec la même formule que les traits */}
          <span className="absolute text-xs text-gray-600 dark:text-gray-300" style={{ left: '0%', transform: 'translateX(-50%)' }}>1</span>
          <span className="absolute text-xs text-gray-600 dark:text-gray-300" style={{ left: '21.05%', transform: 'translateX(-50%)' }}>5</span>
          <span className="absolute text-xs text-gray-600 dark:text-gray-300" style={{ left: '47.37%', transform: 'translateX(-50%)' }}>10</span>
          <span className="absolute text-xs text-gray-600 dark:text-gray-300" style={{ left: '73.68%', transform: 'translateX(-50%)' }}>15</span>
          <span className="absolute text-xs text-gray-600 dark:text-gray-300" style={{ left: '100%', transform: 'translateX(-50%)' }}>20</span>
        </div>
      )}
    </div>
  );
};

export default GentlenessScale;
