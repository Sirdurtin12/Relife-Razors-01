/**
 * Utilitaires pour le formatage de données diverses dans l'application
 */

/**
 * Formate une date ISO en format local
 * @param dateString Chaîne de caractères représentant une date ISO
 * @returns Date formatée en format local
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  try {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Erreur lors du formatage de la date:', error);
    return dateString;
  }
};

/**
 * Formate un prix en euros
 * @param price Prix à formater
 * @returns Prix formaté avec le symbole €
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
};

/**
 * Tronque un texte s'il dépasse une longueur maximale
 * @param text Texte à tronquer
 * @param maxLength Longueur maximale
 * @returns Texte tronqué si nécessaire
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
