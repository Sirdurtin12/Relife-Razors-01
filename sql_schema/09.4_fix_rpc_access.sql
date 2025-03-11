-- Script pour corriger les permissions RPC
-- Date: 2025-03-04
-- Description: Ajouter les permissions RPC pour la fonction get_review_comments

-- Assurez-vous que toutes les fonctions peuvent être appelées par l'utilisateur authentifié
GRANT EXECUTE ON FUNCTION get_review_comments(BIGINT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_review_comments(BIGINT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_reviews_with_profiles_and_likes(BIGINT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_reviews_with_profiles_and_likes(BIGINT, UUID) TO anon;

-- Assurez-vous que l'utilisateur a le droit de sélectionner les tables
GRANT SELECT ON review_comments TO authenticated;
GRANT SELECT ON review_comments TO anon;
GRANT INSERT ON review_comments TO authenticated;
GRANT DELETE ON review_comments TO authenticated;

-- Assurez-vous que l'utilisateur a le droit d'utiliser la séquence pour les IDs
GRANT USAGE, SELECT ON SEQUENCE review_comments_id_seq TO authenticated;
