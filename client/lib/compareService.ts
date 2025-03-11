// Service de gestion de la liste de comparaison
const STORAGE_KEY = 'relife_razor_comparison_list';

// Récupérer la liste des IDs de rasoirs à comparer
export const getComparisonList = (): number[] => {
  if (typeof window === 'undefined') return []; // Vérification pour SSR

  try {
    const storedList = localStorage.getItem(STORAGE_KEY);
    return storedList ? JSON.parse(storedList) : [];
  } catch (error) {
    console.error('Erreur lors de la récupération de la liste de comparaison:', error);
    return [];
  }
};

// Ajouter un rasoir à la liste de comparaison
export const addToComparisonList = (razorId: number): number[] => {
  try {
    const currentList = getComparisonList();
    
    // Ne pas ajouter de doublons
    if (!currentList.includes(razorId)) {
      const newList = [...currentList, razorId];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
      return newList;
    }
    
    return currentList;
  } catch (error) {
    console.error('Erreur lors de l\'ajout à la liste de comparaison:', error);
    return getComparisonList();
  }
};

// Supprimer un rasoir de la liste de comparaison
export const removeFromComparisonList = (razorId: number): number[] => {
  try {
    const currentList = getComparisonList();
    const newList = currentList.filter(id => id !== razorId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    return newList;
  } catch (error) {
    console.error('Erreur lors de la suppression de la liste de comparaison:', error);
    return getComparisonList();
  }
};

// Vérifier si un rasoir est dans la liste de comparaison
export const isInComparisonList = (razorId: number): boolean => {
  const currentList = getComparisonList();
  return currentList.includes(razorId);
};

// Effacer la liste de comparaison
export const clearComparisonList = (): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  } catch (error) {
    console.error('Erreur lors de la suppression de la liste de comparaison:', error);
  }
};
