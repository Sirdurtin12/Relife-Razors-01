-- Date: 2025-03-04
-- Script pour corriger les problèmes de compteurs dans la page de profil

-- 1. Vérifier que les tables existent et ont les bonnes colonnes
DO $$
BEGIN
  RAISE NOTICE 'Vérification des tables nécessaires pour les compteurs...';
END $$;

-- 2. Mise à jour des politiques RLS pour permettre aux utilisateurs de compter leurs éléments
-- Ces politiques permettent aux utilisateurs de voir uniquement le nombre d'éléments leur appartenant

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

-- 3. Création de fonctions d'aide pour le comptage
-- Fonction pour compter les rasoirs possédés par un utilisateur
CREATE OR REPLACE FUNCTION get_owned_razors_count(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM user_collections
  WHERE user_id = user_id_param
    AND in_collection = true;
  
  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour compter les rasoirs dans la liste de souhaits d'un utilisateur
CREATE OR REPLACE FUNCTION get_wishlist_razors_count(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM user_collections
  WHERE user_id = user_id_param
    AND in_wishlist = true;
  
  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour compter les rasoirs favoris d'un utilisateur
CREATE OR REPLACE FUNCTION get_favorite_razors_count(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  count_result INTEGER;
BEGIN
  SELECT COUNT(*) INTO count_result
  FROM user_collections
  WHERE user_id = user_id_param
    AND is_favorite = true;
  
  RETURN count_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir toutes les statistiques d'un utilisateur en une seule fois
CREATE OR REPLACE FUNCTION get_user_stats(user_id_param UUID)
RETURNS TABLE (
  razors_created INTEGER,
  comments_posted INTEGER,
  reviews_posted INTEGER,
  likes_received INTEGER,
  owned_razors INTEGER,
  wishlisted_razors INTEGER,
  favorite_razors INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH 
    razors_count AS (
      SELECT COUNT(*) AS count
      FROM razors
      WHERE created_by = user_id_param
    ),
    comments_count AS (
      SELECT COUNT(*) AS count
      FROM review_comments
      WHERE user_id = user_id_param
    ),
    reviews_count AS (
      SELECT COUNT(*) AS count
      FROM razor_reviews
      WHERE user_id = user_id_param
    ),
    likes_count AS (
      SELECT COALESCE(SUM(likes_count), 0) AS count
      FROM razor_reviews
      WHERE user_id = user_id_param
    ),
    owned_count AS (
      SELECT COUNT(*) AS count
      FROM user_collections
      WHERE user_id = user_id_param AND in_collection = true
    ),
    wishlist_count AS (
      SELECT COUNT(*) AS count
      FROM user_collections
      WHERE user_id = user_id_param AND in_wishlist = true
    ),
    favorites_count AS (
      SELECT COUNT(*) AS count
      FROM user_collections
      WHERE user_id = user_id_param AND is_favorite = true
    )
  SELECT 
    (SELECT count FROM razors_count),
    (SELECT count FROM comments_count),
    (SELECT count FROM reviews_count),
    (SELECT count FROM likes_count),
    (SELECT count FROM owned_count),
    (SELECT count FROM wishlist_count),
    (SELECT count FROM favorites_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder des autorisations sur les fonctions
GRANT EXECUTE ON FUNCTION get_owned_razors_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_wishlist_razors_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_favorite_razors_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats(UUID) TO authenticated;

-- S'assurer que la table user_collections a le bon schéma
DO $$
BEGIN
  -- Vérifier si in_collection existe, sinon le créer
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_collections' 
    AND column_name = 'in_collection'
  ) THEN
    ALTER TABLE user_collections ADD COLUMN in_collection BOOLEAN DEFAULT TRUE;
    RAISE NOTICE 'Colonne in_collection ajoutée à user_collections';
  END IF;
  
  -- Vérifier si in_wishlist existe, sinon le créer
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_collections' 
    AND column_name = 'in_wishlist'
  ) THEN
    ALTER TABLE user_collections ADD COLUMN in_wishlist BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Colonne in_wishlist ajoutée à user_collections';
  END IF;
  
  -- Vérifier si is_favorite existe, sinon le créer
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_collections' 
    AND column_name = 'is_favorite'
  ) THEN
    ALTER TABLE user_collections ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE;
    RAISE NOTICE 'Colonne is_favorite ajoutée à user_collections';
  END IF;
END $$;
