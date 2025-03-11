/**
 * Retourne la description textuelle du niveau de douceur
 * @param value - Valeur numérique de douceur (1-20)
 * @returns Description du niveau de douceur
 */
export const getGentlenessLabel = (value: number): string => {
  if (value >= 1 && value <= 3) return "Très doux";
  if (value >= 4 && value <= 7) return "Doux";
  if (value >= 8 && value <= 12) return "Intermédiaire";
  if (value >= 13 && value <= 17) return "Agressif";
  if (value >= 18 && value <= 20) return "Très agressif";
  return "Non évalué";
};

/**
 * Retourne la couleur associée au niveau de douceur
 * @param value - Valeur numérique de douceur (1-20)
 * @returns Code hexadécimal de la couleur
 */
export const getGentlenessColor = (value: number): string => {
  if (value >= 1 && value <= 3) return "#fff176"; // Jaune pâle
  if (value >= 4 && value <= 7) return "#f9bd59"; // Jaune-orange
  if (value >= 8 && value <= 12) return "#e8863b"; // Orange
  if (value >= 13 && value <= 17) return "#d03c1f"; // Rouge-orange
  if (value >= 18 && value <= 20) return "#7e0404"; // Rouge bordeaux
  return "#808080"; // Gris par défaut
};
