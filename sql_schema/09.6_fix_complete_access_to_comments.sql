-- Script de correction complet pour la fonctionnalité de commentaires
-- Date: 2025-03-04

-- 1. Vérifier que la table review_comments existe et a la bonne structure
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'review_comments') THEN
        RAISE NOTICE 'La table review_comments n''existe pas, création de la table...';
        
        -- Créer la table si elle n'existe pas
        CREATE TABLE review_comments (
            id BIGSERIAL PRIMARY KEY,
            review_id BIGINT NOT NULL REFERENCES razor_reviews(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            parent_comment_id BIGINT REFERENCES review_comments(id) ON DELETE CASCADE,
            comment_content TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Ajouter le déclencheur pour updated_at
        CREATE TRIGGER set_review_comments_updated_at
        BEFORE UPDATE ON review_comments
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    ELSE
        RAISE NOTICE 'La table review_comments existe déjà';
    END IF;
END $$;

-- 2. Configurer les RLS correctement
-- Activer RLS sur la table review_comments
ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes pour éviter les erreurs
DROP POLICY IF EXISTS "Anyone can read comments" ON review_comments;
DROP POLICY IF EXISTS "Users can create their own comments" ON review_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON review_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON review_comments;

-- Recréer les politiques
CREATE POLICY "Anyone can read comments" 
ON review_comments FOR SELECT USING (TRUE);

CREATE POLICY "Users can create their own comments" 
ON review_comments FOR INSERT TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" 
ON review_comments FOR UPDATE TO authenticated 
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" 
ON review_comments FOR DELETE TO authenticated 
USING (auth.uid() = user_id);

-- 3. Supprimer puis recréer les fonctions avec des autorisations explicites
-- Supprimer la fonction get_review_comments si elle existe
DROP FUNCTION IF EXISTS get_review_comments(BIGINT, UUID);

-- Recréer la fonction get_review_comments avec des corrections
CREATE OR REPLACE FUNCTION get_review_comments(
  review_id_param BIGINT,
  current_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id BIGINT,
  review_id BIGINT,
  user_id UUID,
  parent_comment_id BIGINT,
  comment_content TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  username TEXT,
  full_name TEXT,
  avatar_url TEXT,
  is_review_author BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.review_id,
    c.user_id,
    c.parent_comment_id,
    c.comment_content,
    c.created_at,
    c.updated_at,
    p.username,
    p.full_name,
    p.avatar_url,
    c.user_id = (SELECT user_id FROM razor_reviews WHERE id = c.review_id) AS is_review_author
  FROM
    review_comments c
  LEFT JOIN
    profiles p ON c.user_id = p.id
  WHERE
    c.review_id = review_id_param
  ORDER BY
    CASE WHEN c.parent_comment_id IS NULL THEN 0 ELSE 1 END,
    COALESCE(c.parent_comment_id, c.id),
    c.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Accorder des autorisations explicites
-- Accorder des autorisations pour la table
GRANT SELECT, INSERT, UPDATE, DELETE ON review_comments TO authenticated;
GRANT SELECT ON review_comments TO anon;

-- Accorder des autorisations pour la séquence
GRANT USAGE, SELECT ON SEQUENCE review_comments_id_seq TO authenticated;

-- Accorder des autorisations pour les fonctions
GRANT EXECUTE ON FUNCTION get_review_comments(BIGINT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_review_comments(BIGINT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_reviews_with_profiles_and_likes(BIGINT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_reviews_with_profiles_and_likes(BIGINT, UUID) TO anon;

-- 5. Vérification
-- Afficher un message pour confirmer que tout est configuré correctement
DO $$ 
BEGIN
    RAISE NOTICE 'Configuration des commentaires terminée avec succès. Vérifiez les autorisations:';
    RAISE NOTICE '1. Table review_comments est configurée';
    RAISE NOTICE '2. Les politiques RLS sont configurées';
    RAISE NOTICE '3. La fonction get_review_comments est créée avec SECURITY DEFINER';
    RAISE NOTICE '4. Toutes les autorisations sont accordées';
END $$;
