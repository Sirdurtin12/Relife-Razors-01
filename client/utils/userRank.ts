/**
 * Utilitaires pour le calcul et l'affichage du rang utilisateur
 * Le système utilise une notation sur 5 étoiles avec demi-étoiles possibles.
 * La progression est lente pour valoriser davantage l'expérience et l'activité.
 */

/**
 * Interface définissant les statistiques utilisateur
 */
export interface UserStats {
  razorsCreated: number;
  commentsPosted: number;
  reviewsPosted: number;
  likesReceived: number;
  ownedRazors: number;
  wishlistedRazors: number;
  favoriteRazors: number;
}

/**
 * Interface définissant le rang utilisateur
 */
export interface UserRank {
  stars: number;        // Nombre d'étoiles (0-5, supports demi-étoiles)
  title: string;        // Titre correspondant au rang
  currentPoints: number; // Points actuels
  nextStarPoints: number; // Points requis pour la prochaine étoile ou demi-étoile
  progress: number;     // Progression vers la prochaine étoile (0-100%)
}

// Titres correspondant aux différents rangs
const STAR_TITLES = [
  "Novice du Rasage",       // 0 - 0.5 étoiles
  "Initié du Rasage",       // 1 - 1.5 étoiles  
  "Amateur de Rasage",      // 2 - 2.5 étoiles
  "Passionné du Rasage",    // 3 - 3.5 étoiles
  "Expert du Rasage",       // 4 - 4.5 étoiles
  "Maître Barbier"          // 5 étoiles
];

// Seuils de points pour chaque demi-étoile (progression lente)
// Les valeurs augmentent de façon exponentielle
const STAR_THRESHOLDS = [
  0,      // 0 étoiles
  10,     // 0.5 étoiles
  25,     // 1 étoile
  50,     // 1.5 étoiles
  100,    // 2 étoiles
  160,    // 2.5 étoiles
  230,    // 3 étoiles
  310,    // 3.5 étoiles
  400,    // 4 étoiles
  500,    // 4.5 étoiles
  600     // 5 étoiles
];

/**
 * Calcule les points d'activité d'un utilisateur basés sur ses statistiques
 * La progression est lente pour valoriser l'activité continue.
 */
export function calculateActivityPoints(stats: UserStats): number {
  return Math.floor(
    (stats.ownedRazors * 0.5) +         // 0.5 point par rasoir possédé
    (stats.reviewsPosted * 2) +         // 2 points par avis posté
    (stats.commentsPosted * 0.5) +      // 0.5 point par commentaire
    (stats.likesReceived * 0.25) +      // 0.25 point par like reçu 
    (stats.razorsCreated * 3) +         // 3 points par rasoir ajouté
    (stats.favoriteRazors * 0.25) +     // 0.25 point par rasoir en favoris
    (stats.wishlistedRazors * 0.15)     // 0.15 point par rasoir en wishlist
  );
}

/**
 * Détermine le rang d'un utilisateur en fonction de ses points d'activité
 * Retourne le nombre d'étoiles (avec demi-étoiles) et le titre correspondant
 */
export function getUserRank(stats: UserStats): UserRank {
  const points = calculateActivityPoints(stats);
  
  // Trouver le palier actuel
  let starIndex = STAR_THRESHOLDS.length - 1;
  for (let i = STAR_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= STAR_THRESHOLDS[i]) {
      starIndex = i;
      break;
    }
  }
  
  // Calculer le nombre d'étoiles (0-5, avec demi-étoiles)
  const stars = starIndex / 2;
  
  // Déterminer le titre basé sur le nombre d'étoiles
  const titleIndex = Math.min(Math.floor(stars), STAR_TITLES.length - 1);
  const title = STAR_TITLES[titleIndex];
  
  // Calculer la progression vers la prochaine étoile ou demi-étoile
  let nextStarPoints = Infinity;
  let progress = 100;
  
  if (starIndex < STAR_THRESHOLDS.length - 1) {
    const currentThreshold = STAR_THRESHOLDS[starIndex];
    nextStarPoints = STAR_THRESHOLDS[starIndex + 1];
    const pointsRange = nextStarPoints - currentThreshold;
    const pointsProgress = points - currentThreshold;
    progress = Math.min(Math.floor((pointsProgress / pointsRange) * 100), 99);
  }
  
  return {
    stars,
    title,
    currentPoints: points,
    nextStarPoints,
    progress
  };
}
