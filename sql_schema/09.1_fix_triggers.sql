-- Script pour corriger les triggers existants
-- Date: 2025-03-04
-- Description: Supprime et recrée les triggers pour éviter les erreurs "already exists"

-- Supprimer puis recréer les triggers sur review_likes
DROP TRIGGER IF EXISTS after_review_like_insert ON review_likes;
DROP TRIGGER IF EXISTS after_review_like_delete ON review_likes;

-- Recréer les triggers
CREATE TRIGGER after_review_like_insert
AFTER INSERT ON review_likes
FOR EACH ROW
EXECUTE FUNCTION increment_review_likes();

CREATE TRIGGER after_review_like_delete
AFTER DELETE ON review_likes
FOR EACH ROW
EXECUTE FUNCTION decrement_review_likes();
