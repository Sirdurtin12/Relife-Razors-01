import React from 'react';

type GentlenessIndicatorProps = {
  value: number | null | undefined;
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
};

const GentlenessIndicator: React.FC<GentlenessIndicatorProps> = ({ 
  value, 
  showLabel = true, 
  size = 'medium',
  className = ''
}) => {
  // Déterminer la couleur en fonction de la valeur
  const getGentlenessColor = (value: number | null | undefined): string => {
    if (!value && value !== 0) return "#cccccc"; // Gris pour null/undefined
    if (value >= 1 && value <= 3) return "#fff176"; // Jaune pâle
    if (value >= 4 && value <= 7) return "#f9bd59"; // Jaune-orange
    if (value >= 8 && value <= 12) return "#e8863b"; // Orange
    if (value >= 13 && value <= 17) return "#d03c1f"; // Rouge-orange
    if (value >= 18 && value <= 20) return "#7e0404"; // Rouge bordeaux
    return "#cccccc"; // Gris par défaut pour les valeurs invalides
  };

  // Déterminer le libellé en fonction de la valeur
  const getGentlenessLabel = (value: number | null | undefined): string => {
    if (!value && value !== 0) return "Non évalué";
    if (value >= 1 && value <= 3) return "Très doux";
    if (value >= 4 && value <= 7) return "Doux";
    if (value >= 8 && value <= 12) return "Intermédiaire";
    if (value >= 13 && value <= 17) return "Agressif";
    if (value >= 18 && value <= 20) return "Très agressif";
    return "Non évalué";
  };

  // Déterminer la taille en fonction du paramètre
  const getDotSize = (): string => {
    switch (size) {
      case 'small': return 'w-3 h-3';
      case 'large': return 'w-5 h-5';
      default: return 'w-4 h-4';
    }
  };

  // Déterminer la taille du texte
  const getTextSize = (): string => {
    switch (size) {
      case 'small': return 'text-xs';
      case 'large': return 'text-base';
      default: return 'text-sm';
    }
  };

  return (
    <div className={`flex items-center ${className}`}>
      <span 
        className={`inline-block ${getDotSize()} rounded-full mr-2`}
        style={{ backgroundColor: getGentlenessColor(value) }}
        title={value ? `${value}/20 - ${getGentlenessLabel(value)}` : "Non évalué"}
      ></span>
      {showLabel && (
        <span className={`font-medium ${getTextSize()} text-gray-900 dark:text-gray-100`}>
          {value ? `${value}/20 ${size !== 'small' ? `(${getGentlenessLabel(value)})` : ''}` : "Non évalué"}
        </span>
      )}
    </div>
  );
};

export default GentlenessIndicator;
