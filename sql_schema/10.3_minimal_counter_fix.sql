-- Date: 2025-03-04
-- Script minimal pour résoudre le problème des compteurs sans dépendre de colonnes qui pourraient ne pas exister

-- Politique pour user_collections
DROP POLICY IF EXISTS "Autoriser le comptage des collections" ON user_collections;
CREATE POLICY "Autoriser le comptage des collections" 
ON user_collections
FOR SELECT 
USING (auth.uid() = user_id);

-- Politique pour razor_reviews
DROP POLICY IF EXISTS "Autoriser le comptage des avis" ON razor_reviews;
CREATE POLICY "Autoriser le comptage des avis" 
ON razor_reviews
FOR SELECT 
USING (true);

-- Politique pour review_comments
DROP POLICY IF EXISTS "Autoriser le comptage des commentaires" ON review_comments;
CREATE POLICY "Autoriser le comptage des commentaires" 
ON review_comments
FOR SELECT 
USING (true);

-- Politique pour razors (pour compter les rasoirs créés)
DROP POLICY IF EXISTS "Autoriser le comptage des rasoirs créés" ON razors;
CREATE POLICY "Autoriser le comptage des rasoirs créés" 
ON razors
FOR SELECT 
USING (true);

-- Fonction simplifiée pour obtenir les statistiques d'un utilisateur
CREATE OR REPLACE FUNCTION get_simple_user_stats(user_id_param UUID)
RETURNS TABLE (
  razors_created INTEGER,
  comments_posted INTEGER,
  reviews_posted INTEGER,
  likes_received INTEGER,
  owned_razors INTEGER,
  wishlisted_razors INTEGER,
  favorite_razors INTEGER
) AS $$
DECLARE
  razors_count INTEGER;
  comments_count INTEGER;
  reviews_count INTEGER;
  likes_count INTEGER;
  owned_count INTEGER;
  wishlist_count INTEGER;
  favorites_count INTEGER;
BEGIN
  -- Compter les rasoirs créés
  SELECT COUNT(*) INTO razors_count
  FROM razors
  WHERE created_by = user_id_param;
  
  -- Compter les commentaires
  SELECT COUNT(*) INTO comments_count
  FROM review_comments
  WHERE user_id = user_id_param;
  
  -- Compter les avis
  SELECT COUNT(*) INTO reviews_count
  FROM razor_reviews
  WHERE user_id = user_id_param;
  
  -- Compter les likes reçus
  SELECT COALESCE(SUM(likes_count), 0) INTO likes_count
  FROM razor_reviews
  WHERE user_id = user_id_param;
  
  -- Compter les rasoirs possédés
  SELECT COUNT(*) INTO owned_count
  FROM user_collections
  WHERE user_id = user_id_param AND in_collection = true;
  
  -- Compter les rasoirs en liste de souhaits
  SELECT COUNT(*) INTO wishlist_count
  FROM user_collections
  WHERE user_id = user_id_param AND in_wishlist = true;
  
  -- Compter les rasoirs favoris
  SELECT COUNT(*) INTO favorites_count
  FROM user_collections
  WHERE user_id = user_id_param AND is_favorite = true;
  
  -- Retourner les résultats
  razors_created := razors_count;
  comments_posted := comments_count;
  reviews_posted := reviews_count;
  likes_received := likes_count;
  owned_razors := owned_count;
  wishlisted_razors := wishlist_count;
  favorite_razors := favorites_count;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder des autorisations sur la fonction
GRANT EXECUTE ON FUNCTION get_simple_user_stats(UUID) TO authenticated;
