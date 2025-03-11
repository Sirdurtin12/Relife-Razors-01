-- Script pour corriger les déclencheurs existants
-- Date: 2025-03-04
-- Description: Vérifie l'existence des déclencheurs avant de les créer pour éviter l'erreur "trigger already exists"

-- Pour le trigger after_review_like_insert
DO $$
BEGIN
  -- Supprimer le trigger s'il existe déjà
  DROP TRIGGER IF EXISTS after_review_like_insert ON review_likes;
  
  -- Recréer le trigger
  CREATE TRIGGER after_review_like_insert
  AFTER INSERT ON review_likes
  FOR EACH ROW
  EXECUTE FUNCTION increment_review_likes();
END
$$;

-- Pour le trigger after_review_like_delete
DO $$
BEGIN
  -- Supprimer le trigger s'il existe déjà
  DROP TRIGGER IF EXISTS after_review_like_delete ON review_likes;
  
  -- Recréer le trigger
  CREATE TRIGGER after_review_like_delete
  AFTER DELETE ON review_likes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_review_likes();
END
$$;

-- Pour le trigger set_review_comments_updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_review_comments_updated_at'
  ) THEN
    CREATE TRIGGER set_review_comments_updated_at
    BEFORE UPDATE ON review_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();
  END IF;
END
$$;
